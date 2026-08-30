import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {Prisma} from '@prisma/client';
import {BlogStatus, UserRole, VerificationStatus} from '../shared';
import {PrismaService} from '../prisma/prisma.service';
import {
  CreateBlogCategoryDto,
  CreateBlogCommentDto,
  CreateBlogPostDto,
  QueryBlogCommentsDto,
  QueryBlogPostsDto,
  UpdateBlogCategoryDto,
  UpdateBlogPostDto,
} from './dto/blog.dto';
import {POST_INCLUDE, toBlogCategory, toBlogComment, toBlogPost} from './blog.mapper';

/** Words a minute — the number every reading-time estimate uses. */
const WPM = 200;

/** Midnight UTC, the key BlogDailyStat rows are bucketed by. */
function utcDay(at = new Date()): Date {
  return new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()));
}

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 80) || 'post'
  );
}

@Injectable()
export class BlogService {
  constructor(private prisma: PrismaService) {}

  // ==========================================================
  // Categories
  // ==========================================================

  async listCategories() {
    const rows = await this.prisma.blogCategory.findMany({
      orderBy: [{position: 'asc'}, {name: 'asc'}],
      include: {
        _count: {
          select: {
            // only count what a visitor can actually open
            posts: {where: {status: BlogStatus.PUBLISHED as any, isVerified: true}},
          },
        },
      },
    });
    return {items: rows.map(toBlogCategory)};
  }

  async createCategory(dto: CreateBlogCategoryDto) {
    const slug = await this.uniqueCategorySlug(dto.slug || dto.name);
    const row = await this.prisma.blogCategory.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description ?? null,
        coverImageUrl: dto.coverImageUrl ?? null,
        position: dto.position ?? 0,
      },
    });
    return toBlogCategory(row);
  }

  async updateCategory(id: string, dto: UpdateBlogCategoryDto) {
    const existing = await this.prisma.blogCategory.findUnique({where: {id}});
    if (!existing) throw new NotFoundException('Category not found');

    const data: Prisma.BlogCategoryUpdateInput = {
      name: dto.name ?? existing.name,
      description: dto.description ?? existing.description,
      coverImageUrl: dto.coverImageUrl ?? existing.coverImageUrl,
      position: dto.position ?? existing.position,
    };
    if (dto.slug && dto.slug !== existing.slug) {
      data.slug = await this.uniqueCategorySlug(dto.slug);
    }
    const row = await this.prisma.blogCategory.update({where: {id}, data});
    return toBlogCategory(row);
  }

  async removeCategory(id: string) {
    // posts keep existing; their categoryId is nulled by the schema
    await this.prisma.blogCategory.delete({where: {id}}).catch(() => {
      throw new NotFoundException('Category not found');
    });
    return {success: true};
  }

  // ==========================================================
  // Posts — public
  // ==========================================================

  /** Published, verified, and past its publish date. */
  private publicWhere(): Prisma.BlogPostWhereInput {
    return {
      status: BlogStatus.PUBLISHED as any,
      isVerified: true,
      OR: [{publishedAt: null}, {publishedAt: {lte: new Date()}}],
    };
  }

  async list(query: QueryBlogPostsDto) {
    const where: Prisma.BlogPostWhereInput = {
      ...this.publicWhere(),
      ...(await this.filters(query)),
    };
    return this.paginate(where, query, this.orderBy(query.sort, true));
  }

  /** Admin listing — every post, whatever its state. */
  async adminList(query: QueryBlogPostsDto) {
    const where: Prisma.BlogPostWhereInput = {...(await this.filters(query))};
    if (query.status && query.status !== 'all') {
      where.status = query.status as any;
    }
    if (query.verification && query.verification !== 'all') {
      where.verificationStatus = query.verification as any;
    }
    return this.paginate(where, query, this.orderBy(query.sort, false));
  }

  /** An author's own posts, in any state. */
  async listMine(userId: string, query: QueryBlogPostsDto) {
    const where: Prisma.BlogPostWhereInput = {
      ...(await this.filters(query)),
      authorId: userId,
    };
    if (query.status && query.status !== 'all') where.status = query.status as any;
    return this.paginate(where, query, this.orderBy(query.sort, false));
  }

  async getOne(idOrSlug: string, viewerId?: string, isStaff = false) {
    const post = await this.prisma.blogPost.findFirst({
      where: {OR: [{id: idOrSlug}, {slug: idOrSlug}]},
      include: {
        ...POST_INCLUDE,
        likes: viewerId ? {where: {userId: viewerId}, select: {userId: true}} : false,
      },
    });
    if (!post) throw new NotFoundException('Post not found');

    const live =
      post.status === (BlogStatus.PUBLISHED as any) &&
      post.isVerified &&
      (!post.publishedAt || post.publishedAt <= new Date());
    // Drafts stay invisible unless you're staff or the person who wrote it.
    if (!live && !isStaff && post.authorId !== viewerId) {
      throw new NotFoundException('Post not found');
    }
    return toBlogPost(post as any, viewerId);
  }

  /** Same category first, then anything recent. Never includes the post itself. */
  async related(idOrSlug: string, limit = 3) {
    const post = await this.prisma.blogPost.findFirst({
      where: {OR: [{id: idOrSlug}, {slug: idOrSlug}]},
      select: {id: true, categoryId: true, tags: true, city: true},
    });
    if (!post) throw new NotFoundException('Post not found');

    const base = {...this.publicWhere(), id: {not: post.id}};
    const sameCategory = post.categoryId
      ? await this.prisma.blogPost.findMany({
          where: {...base, categoryId: post.categoryId},
          include: POST_INCLUDE,
          orderBy: {publishedAt: 'desc'},
          take: limit,
        })
      : [];

    if (sameCategory.length >= limit) {
      return {items: sameCategory.map(p => toBlogPost(p as any))};
    }
    const filler = await this.prisma.blogPost.findMany({
      where: {...base, id: {notIn: [post.id, ...sameCategory.map(p => p.id)]}},
      include: POST_INCLUDE,
      orderBy: {publishedAt: 'desc'},
      take: limit - sameCategory.length,
    });
    return {items: [...sameCategory, ...filler].map(p => toBlogPost(p as any))};
  }

  /** Fire-and-forget from the article page; also feeds the daily chart. */
  async recordView(idOrSlug: string, read = false) {
    const post = await this.prisma.blogPost.findFirst({
      where: {OR: [{id: idOrSlug}, {slug: idOrSlug}]},
      select: {id: true},
    });
    if (!post) return {success: false};

    const date = utcDay();
    await this.prisma
      .$transaction([
        this.prisma.blogPost.update({
          where: {id: post.id},
          data: {viewCount: {increment: 1}},
        }),
        this.prisma.blogDailyStat.upsert({
          where: {postId_date: {postId: post.id, date}},
          create: {postId: post.id, date, views: 1, reads: read ? 1 : 0},
          update: {views: {increment: 1}, ...(read ? {reads: {increment: 1}} : {})},
        }),
      ])
      .catch(() => null);
    return {success: true};
  }

  async recordShare(id: string) {
    const date = utcDay();
    await this.prisma
      .$transaction([
        this.prisma.blogPost.update({where: {id}, data: {shareCount: {increment: 1}}}),
        this.prisma.blogDailyStat.upsert({
          where: {postId_date: {postId: id, date}},
          create: {postId: id, date, shares: 1},
          update: {shares: {increment: 1}},
        }),
      ])
      .catch(() => null);
    return {success: true};
  }

  // ==========================================================
  // Posts — authoring
  // ==========================================================

  async create(userId: string, role: string, dto: CreateBlogPostDto) {
    const isAdmin = role === UserRole.ADMIN;
    const slug = await this.uniquePostSlug(dto.slug || dto.title);
    const {relatedPropertyIds, ...rest} = dto;

    const post = await this.prisma.blogPost.create({
      data: {
        ...(this.mapData(rest) as Prisma.BlogPostUncheckedCreateInput),
        authorId: userId,
        slug,
        // Admins publish straight away; everyone else waits for review.
        isVerified: isAdmin,
        verificationStatus: (isAdmin
          ? VerificationStatus.VERIFIED
          : VerificationStatus.PENDING) as any,
      },
      include: POST_INCLUDE,
    });

    if (relatedPropertyIds?.length) {
      await this.setRelatedProperties(post.id, relatedPropertyIds);
    }
    return this.getOne(post.id, userId, isAdmin);
  }

  async update(userId: string, role: string, id: string, dto: UpdateBlogPostDto) {
    const existing = await this.assertCanManage(userId, role, id);
    const {relatedPropertyIds, ...rest} = dto;

    const data = this.mapData(rest) as Prisma.BlogPostUncheckedUpdateInput;
    if (dto.slug && dto.slug !== existing.slug) {
      data.slug = await this.uniquePostSlug(dto.slug);
    }
    // An edited post by a non-admin goes back into the review queue.
    if (role !== UserRole.ADMIN) {
      data.isVerified = false;
      data.verificationStatus = VerificationStatus.PENDING as any;
    }

    await this.prisma.blogPost.update({where: {id}, data});
    if (relatedPropertyIds) {
      await this.setRelatedProperties(id, relatedPropertyIds);
    }
    return this.getOne(id, userId, role === UserRole.ADMIN);
  }

  async remove(userId: string, role: string, id: string) {
    await this.assertCanManage(userId, role, id);
    await this.prisma.blogPost.delete({where: {id}});
    return {success: true};
  }

  /** Admin review — approving also publishes, which is what admins expect. */
  async verify(id: string, status: VerificationStatus) {
    const post = await this.prisma.blogPost.findUnique({where: {id}});
    if (!post) throw new NotFoundException('Post not found');

    const verified = status === VerificationStatus.VERIFIED;
    await this.prisma.blogPost.update({
      where: {id},
      data: {
        verificationStatus: status as any,
        isVerified: verified,
        ...(verified && !post.publishedAt && post.status === (BlogStatus.PUBLISHED as any)
          ? {publishedAt: new Date()}
          : {}),
      },
    });
    return this.getOne(id, undefined, true);
  }

  async setStatus(userId: string, role: string, id: string, status: BlogStatus) {
    const post = await this.assertCanManage(userId, role, id);
    const data: Prisma.BlogPostUpdateInput = {status: status as any};
    if (status === BlogStatus.PUBLISHED && !post.publishedAt) {
      data.publishedAt = new Date();
    }
    await this.prisma.blogPost.update({where: {id}, data});
    return this.getOne(id, userId, role === UserRole.ADMIN);
  }

  // ==========================================================
  // Likes
  // ==========================================================

  async like(userId: string, postId: string) {
    const post = await this.prisma.blogPost.findUnique({where: {id: postId}});
    if (!post) throw new NotFoundException('Post not found');

    await this.prisma.blogLike.create({data: {userId, postId}}).catch(() => null);
    await this.recountLikes(postId);

    const date = utcDay();
    await this.prisma.blogDailyStat
      .upsert({
        where: {postId_date: {postId, date}},
        create: {postId, date, likes: 1},
        update: {likes: {increment: 1}},
      })
      .catch(() => null);
    return {liked: true};
  }

  async unlike(userId: string, postId: string) {
    await this.prisma.blogLike
      .delete({where: {postId_userId: {postId, userId}}})
      .catch(() => null);
    await this.recountLikes(postId);
    return {liked: false};
  }

  // ==========================================================
  // Comments
  // ==========================================================

  /** Public thread — approved comments only, replies nested one level. */
  async listComments(idOrSlug: string) {
    const post = await this.prisma.blogPost.findFirst({
      where: {OR: [{id: idOrSlug}, {slug: idOrSlug}]},
      select: {id: true},
    });
    if (!post) throw new NotFoundException('Post not found');

    const rows = await this.prisma.blogComment.findMany({
      where: {postId: post.id, parentId: null, isApproved: true},
      include: {
        user: true,
        replies: {
          where: {isApproved: true},
          include: {user: true},
          orderBy: {createdAt: 'asc'},
        },
      },
      orderBy: {createdAt: 'desc'},
    });
    return {items: rows.map(toBlogComment)};
  }

  async addComment(userId: string, role: string, idOrSlug: string, dto: CreateBlogCommentDto) {
    const post = await this.prisma.blogPost.findFirst({
      where: {OR: [{id: idOrSlug}, {slug: idOrSlug}]},
      select: {id: true, allowComments: true},
    });
    if (!post) throw new NotFoundException('Post not found');
    if (!post.allowComments) {
      throw new BadRequestException('Comments are closed on this article');
    }
    if (dto.parentId) {
      const parent = await this.prisma.blogComment.findUnique({
        where: {id: dto.parentId},
        select: {postId: true, parentId: true},
      });
      // one level deep: a reply to a reply attaches to its thread root
      if (!parent || parent.postId !== post.id) {
        throw new BadRequestException('Invalid parent comment');
      }
    }

    // Staff comments appear immediately; everyone else waits for moderation.
    const isApproved = role === UserRole.ADMIN;
    const comment = await this.prisma.blogComment.create({
      data: {
        postId: post.id,
        userId,
        text: dto.text,
        parentId: dto.parentId ?? null,
        isApproved,
      },
      include: {user: true},
    });
    if (isApproved) await this.recountComments(post.id);

    return {...toBlogComment(comment), pending: !isApproved};
  }

  /** Moderation queue. */
  async adminListComments(query: QueryBlogCommentsDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);
    const where: Prisma.BlogCommentWhereInput = {};
    if (query.postId) where.postId = query.postId;
    if (query.state === 'pending') where.isApproved = false;
    else if (query.state === 'approved') where.isApproved = true;

    const [rows, total] = await Promise.all([
      this.prisma.blogComment.findMany({
        where,
        include: {user: true, post: {select: {id: true, title: true, slug: true}}},
        orderBy: {createdAt: 'desc'},
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.blogComment.count({where}),
    ]);

    return {
      items: rows.map(c => ({...toBlogComment(c), post: (c as any).post})),
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };
  }

  async approveComment(id: string) {
    const comment = await this.prisma.blogComment.update({
      where: {id},
      data: {isApproved: true},
      include: {user: true},
    });
    await this.recountComments(comment.postId);
    return toBlogComment(comment);
  }

  async removeComment(userId: string, role: string, id: string) {
    const comment = await this.prisma.blogComment.findUnique({where: {id}});
    if (!comment) throw new NotFoundException('Comment not found');
    if (role !== UserRole.ADMIN && comment.userId !== userId) {
      throw new ForbiddenException('Not your comment');
    }
    await this.prisma.blogComment.delete({where: {id}});
    await this.recountComments(comment.postId);
    return {success: true};
  }

  // ==========================================================
  // Analytics
  // ==========================================================

  async stats(id: string, days = 30) {
    const post = await this.prisma.blogPost.findUnique({
      where: {id},
      select: {id: true, title: true, viewCount: true, likeCount: true, shareCount: true},
    });
    if (!post) throw new NotFoundException('Post not found');

    const since = utcDay();
    since.setUTCDate(since.getUTCDate() - (days - 1));
    const rows = await this.prisma.blogDailyStat.findMany({
      where: {postId: id, date: {gte: since}},
      orderBy: {date: 'asc'},
    });

    return {
      post,
      days: rows.map(r => ({
        date: r.date.toISOString().slice(0, 10),
        views: r.views,
        reads: r.reads,
        likes: r.likes,
        shares: r.shares,
      })),
    };
  }

  /** Totals across the blog, for the admin overview. */
  async overview(days = 30) {
    const since = utcDay();
    since.setUTCDate(since.getUTCDate() - (days - 1));

    const [total, published, drafts, pendingComments, agg] = await Promise.all([
      this.prisma.blogPost.count(),
      this.prisma.blogPost.count({where: {status: BlogStatus.PUBLISHED as any}}),
      this.prisma.blogPost.count({where: {status: BlogStatus.DRAFT as any}}),
      this.prisma.blogComment.count({where: {isApproved: false}}),
      this.prisma.blogDailyStat.aggregate({
        where: {date: {gte: since}},
        _sum: {views: true, reads: true, likes: true, shares: true},
      }),
    ]);

    return {
      posts: {total, published, drafts},
      pendingComments,
      window: {
        days,
        views: agg._sum.views ?? 0,
        reads: agg._sum.reads ?? 0,
        likes: agg._sum.likes ?? 0,
        shares: agg._sum.shares ?? 0,
      },
    };
  }

  // ==========================================================
  // Internals
  // ==========================================================

  private async paginate(
    where: Prisma.BlogPostWhereInput,
    query: QueryBlogPostsDto,
    orderBy: Prisma.BlogPostOrderByWithRelationInput[],
  ) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 12, 50);
    const [rows, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        where,
        include: POST_INCLUDE,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.blogPost.count({where}),
    ]);
    return {
      items: rows.map(p => toBlogPost(p as any)),
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };
  }

  private async filters(query: QueryBlogPostsDto): Promise<Prisma.BlogPostWhereInput> {
    const where: Prisma.BlogPostWhereInput = {};
    const and: Prisma.BlogPostWhereInput[] = [];

    if (query.q) {
      and.push({
        OR: [
          {title: {contains: query.q, mode: 'insensitive'}},
          {excerpt: {contains: query.q, mode: 'insensitive'}},
          {content: {contains: query.q, mode: 'insensitive'}},
          {tags: {has: query.q}},
        ],
      });
    }

    if (query.category) {
      // accept either the slug (public URLs) or the id (admin filters)
      const category = await this.prisma.blogCategory.findFirst({
        where: {OR: [{id: query.category}, {slug: query.category}]},
        select: {id: true},
      });
      where.categoryId = category?.id ?? '__none__';
    }

    const tags = (query.tags ?? '')
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
    if (tags.length) where.tags = {hasSome: tags};

    if (query.city) where.city = {contains: query.city, mode: 'insensitive'};
    if (query.state) where.state = {contains: query.state, mode: 'insensitive'};
    if (query.authorId) where.authorId = query.authorId;
    if (query.featured === 'true') where.featured = true;
    if (query.sponsored === 'true') where.isSponsored = true;
    if (query.excludeId) where.id = {not: query.excludeId};

    if (and.length) where.AND = and;
    return where;
  }

  /**
   * Public listings lead with pinned and paid placements; admin listings stay
   * in plain chronological order so the newest edit is easy to find.
   */
  private orderBy(sort?: string, publicView = true): Prisma.BlogPostOrderByWithRelationInput[] {
    const lead: Prisma.BlogPostOrderByWithRelationInput[] = publicView
      ? [{pinned: 'desc'}, {isPromoted: 'desc'}]
      : [];
    switch (sort) {
      case 'oldest':
        return [...lead, {publishedAt: 'asc'}, {createdAt: 'asc'}];
      case 'popular':
        return [...lead, {viewCount: 'desc'}];
      case 'title_asc':
        return [...lead, {title: 'asc'}];
      default:
        return [...lead, {publishedAt: 'desc'}, {createdAt: 'desc'}];
    }
  }

  /**
   * DTO → columns. Undefined keys are dropped so a partial update leaves the
   * rest of the row alone; callers cast to the create/update shape they need.
   */
  private mapData(dto: Partial<CreateBlogPostDto>): Record<string, unknown> {
    const data: Record<string, unknown> = {
      title: dto.title,
      excerpt: dto.excerpt,
      content: dto.content,
      coverImageUrl: dto.coverImageUrl,
      imageUrls: dto.imageUrls,
      videoUrl: dto.videoUrl,
      categoryId: dto.categoryId,
      tags: dto.tags,
      guestAuthorName: dto.guestAuthorName,
      guestAuthorAvatar: dto.guestAuthorAvatar,
      status: dto.status,
      featured: dto.featured,
      pinned: dto.pinned,
      metaTitle: dto.metaTitle,
      metaDescription: dto.metaDescription,
      ogImageUrl: dto.ogImageUrl,
      canonicalUrl: dto.canonicalUrl,
      noIndex: dto.noIndex,
      country: dto.country,
      state: dto.state,
      city: dto.city,
      locality: dto.locality,
      propertyTypes: dto.propertyTypes,
      isSponsored: dto.isSponsored,
      sponsorName: dto.sponsorName,
      sponsorLogoUrl: dto.sponsorLogoUrl,
      sponsorUrl: dto.sponsorUrl,
      sponsorDisclosure: dto.sponsorDisclosure,
      adsEnabled: dto.adsEnabled,
      inlineAdAfterParagraph: dto.inlineAdAfterParagraph,
      maxInlineAds: dto.maxInlineAds,
      ctaLabel: dto.ctaLabel,
      ctaUrl: dto.ctaUrl,
      isPromoted: dto.isPromoted,
      allowComments: dto.allowComments,
    };
    if (dto.publishedAt !== undefined) data.publishedAt = new Date(dto.publishedAt);
    if (dto.scheduledFor !== undefined) data.scheduledFor = new Date(dto.scheduledFor);
    if (dto.promotedUntil !== undefined) data.promotedUntil = new Date(dto.promotedUntil);
    // Publishing without a date set means "now".
    if (dto.status === BlogStatus.PUBLISHED && dto.publishedAt === undefined) {
      data.publishedAt = new Date();
    }
    if (dto.content !== undefined) {
      data.readingMinutes = Math.max(1, Math.round(dto.content.split(/\s+/).length / WPM));
    }

    Object.keys(data).forEach(k => data[k] === undefined && delete data[k]);
    return data;
  }

  private async setRelatedProperties(postId: string, propertyIds: string[]) {
    await this.prisma.blogPostProperty.deleteMany({where: {postId}});
    if (!propertyIds.length) return;
    await this.prisma.blogPostProperty.createMany({
      data: propertyIds.map((propertyId, position) => ({postId, propertyId, position})),
      skipDuplicates: true,
    });
  }

  private async assertCanManage(userId: string, role: string, id: string) {
    const post = await this.prisma.blogPost.findUnique({where: {id}});
    if (!post) throw new NotFoundException('Post not found');
    if (role !== UserRole.ADMIN && post.authorId !== userId) {
      throw new ForbiddenException('Not your post');
    }
    return post;
  }

  private async recountLikes(postId: string) {
    const likeCount = await this.prisma.blogLike.count({where: {postId}});
    await this.prisma.blogPost.update({where: {id: postId}, data: {likeCount}});
  }

  private async recountComments(postId: string) {
    const commentCount = await this.prisma.blogComment.count({
      where: {postId, isApproved: true},
    });
    await this.prisma.blogPost.update({where: {id: postId}, data: {commentCount}});
  }

  private async uniquePostSlug(input: string) {
    const base = slugify(input);
    let slug = base;
    for (let i = 2; await this.prisma.blogPost.findUnique({where: {slug}}); i++) {
      slug = `${base}-${i}`;
    }
    return slug;
  }

  private async uniqueCategorySlug(input: string) {
    const base = slugify(input);
    let slug = base;
    for (let i = 2; await this.prisma.blogCategory.findUnique({where: {slug}}); i++) {
      slug = `${base}-${i}`;
    }
    return slug;
  }
}
