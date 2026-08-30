import {
  BlogCategory,
  BlogComment,
  BlogPost,
  Prisma,
  Property,
  User,
} from '@prisma/client';
import {
  BlogCategory as SharedCategory,
  BlogComment as SharedComment,
  BlogPost as SharedPost,
} from '../shared';
import {toPublicProfile} from '../profiles/profile.mapper';
import {toProperty} from '../properties/property.mapper';

type PostWithRelations = BlogPost & {
  author?: User;
  category?: BlogCategory | null;
  relatedProperties?: {property: Property & {agent?: User}}[];
  likes?: {userId: string}[];
};

type CategoryWithCount = BlogCategory & {
  _count?: {posts: number};
};

type CommentWithUser = BlogComment & {
  user?: User;
  replies?: (BlogComment & {user?: User})[];
};

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

export function toBlogCategory(c: CategoryWithCount): SharedCategory {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    coverImageUrl: c.coverImageUrl,
    position: c.position,
    postCount: c._count?.posts,
  };
}

export function toBlogPost(p: PostWithRelations, viewerId?: string): SharedPost {
  return {
    id: p.id,
    authorId: p.authorId,
    author: p.author ? toPublicProfile(p.author) : undefined,

    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    content: p.content,
    coverImageUrl: p.coverImageUrl,
    imageUrls: p.imageUrls,
    videoUrl: p.videoUrl,
    readingMinutes: p.readingMinutes,

    categoryId: p.categoryId,
    category: p.category ? toBlogCategory(p.category) : null,
    tags: p.tags,
    guestAuthorName: p.guestAuthorName,
    guestAuthorAvatar: p.guestAuthorAvatar,

    status: p.status as SharedPost['status'],
    publishedAt: iso(p.publishedAt),
    scheduledFor: iso(p.scheduledFor),
    featured: p.featured,
    pinned: p.pinned,
    isVerified: p.isVerified,
    verificationStatus: p.verificationStatus as SharedPost['verificationStatus'],

    metaTitle: p.metaTitle,
    metaDescription: p.metaDescription,
    ogImageUrl: p.ogImageUrl,
    canonicalUrl: p.canonicalUrl,
    noIndex: p.noIndex,

    country: p.country,
    state: p.state,
    city: p.city,
    locality: p.locality,
    propertyTypes: p.propertyTypes,

    isSponsored: p.isSponsored,
    sponsorName: p.sponsorName,
    sponsorLogoUrl: p.sponsorLogoUrl,
    sponsorUrl: p.sponsorUrl,
    sponsorDisclosure: p.sponsorDisclosure,
    adsEnabled: p.adsEnabled,
    inlineAdAfterParagraph: p.inlineAdAfterParagraph,
    maxInlineAds: p.maxInlineAds,
    ctaLabel: p.ctaLabel,
    ctaUrl: p.ctaUrl,
    // A promotion that has run out is no promotion at all.
    isPromoted: p.isPromoted && (!p.promotedUntil || p.promotedUntil > new Date()),
    promotedUntil: iso(p.promotedUntil),

    allowComments: p.allowComments,
    viewCount: p.viewCount,
    likeCount: p.likeCount,
    commentCount: p.commentCount,
    shareCount: p.shareCount,
    likedByMe: viewerId ? Boolean(p.likes?.length) : undefined,

    relatedProperties: p.relatedProperties?.map(r => toProperty(r.property)),

    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export function toBlogComment(c: CommentWithUser): SharedComment {
  return {
    id: c.id,
    postId: c.postId,
    userId: c.userId,
    user: c.user ? toPublicProfile(c.user) : undefined,
    text: c.text,
    parentId: c.parentId,
    isApproved: c.isApproved,
    replies: c.replies?.map(r => toBlogComment(r)),
    createdAt: c.createdAt.toISOString(),
  };
}

/** Everything a public post response needs, in one place. */
export const POST_INCLUDE = {
  author: true,
  category: true,
  relatedProperties: {
    orderBy: {position: 'asc'},
    include: {property: {include: {agent: true}}},
  },
} satisfies Prisma.BlogPostInclude;
