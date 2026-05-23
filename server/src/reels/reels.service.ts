import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {NotificationType} from '@realreels/shared';
import {PrismaService} from '../prisma/prisma.service';
import {NotificationsService} from '../notifications/notifications.service';
import {CreateCommentDto, CreateReelDto, FeedQueryDto} from './dto/reel.dto';
import {toReel} from './reel.mapper';

@Injectable()
export class ReelsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  /**
   * Feed: active boosted reels first (newest), then the rest by recency.
   * Boost is "active" when isBoosted and boostExpiresAt is in the future.
   */
  async feed(query: FeedQueryDto, viewerId?: string) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 10, 30);
    const skip = (page - 1) * limit;
    const now = new Date();

    const include = {
      agent: true,
      property: {include: {agent: true}},
      likes: viewerId ? {where: {userId: viewerId}, select: {userId: true}} : false,
    } as const;

    const rows = await this.prisma.reel.findMany({
      include,
      orderBy: [{isBoosted: 'desc'}, {createdAt: 'desc'}],
      skip,
      take: limit,
    });

    // Demote boosts whose window has expired (lazy correction).
    const items = rows.map(r => {
      const boostActive =
        r.isBoosted && r.boostExpiresAt != null && r.boostExpiresAt > now;
      return toReel({...r, isBoosted: boostActive}, viewerId);
    });

    return {items, page, limit, hasMore: rows.length === limit};
  }

  async getOne(id: string, viewerId?: string) {
    const reel = await this.prisma.reel.findUnique({
      where: {id},
      include: {
        agent: true,
        property: {include: {agent: true}},
        likes: viewerId ? {where: {userId: viewerId}, select: {userId: true}} : false,
      },
    });
    if (!reel) {
      throw new NotFoundException('Reel not found');
    }
    return toReel(reel, viewerId);
  }

  async create(agentId: string, dto: CreateReelDto) {
    const reel = await this.prisma.reel.create({
      data: {
        agentId,
        videoUrl: dto.videoUrl,
        thumbnailUrl: dto.thumbnailUrl,
        caption: dto.caption,
        propertyId: dto.propertyId,
      },
      include: {agent: true, property: {include: {agent: true}}},
    });

    // Fan out a "new reel" notification to followers.
    const followers = await this.prisma.follow.findMany({
      where: {agentId},
      select: {followerId: true},
    });
    await Promise.all(
      followers.map(f =>
        this.notifications.notify(f.followerId, NotificationType.NEW_REEL, {
          reelId: reel.id,
          actorId: agentId,
        }),
      ),
    );

    return toReel(reel);
  }

  async remove(agentId: string, id: string) {
    const reel = await this.prisma.reel.findUnique({where: {id}});
    if (!reel) {
      throw new NotFoundException('Reel not found');
    }
    if (reel.agentId !== agentId) {
      throw new ForbiddenException('Not your reel');
    }
    await this.prisma.reel.delete({where: {id}});
    return {success: true};
  }

  // ---------- likes ----------
  async like(userId: string, reelId: string) {
    const reel = await this.prisma.reel.findUnique({where: {id: reelId}});
    if (!reel) {
      throw new NotFoundException('Reel not found');
    }
    await this.prisma.like
      .create({data: {userId, reelId}})
      .catch(() => null); // ignore duplicate
    await this.recountLikes(reelId);
    await this.notifications.notify(reel.agentId, NotificationType.LIKE, {
      reelId,
      actorId: userId,
    });
    return {liked: true};
  }

  async unlike(userId: string, reelId: string) {
    await this.prisma.like
      .delete({where: {reelId_userId: {reelId, userId}}})
      .catch(() => null);
    await this.recountLikes(reelId);
    return {liked: false};
  }

  // ---------- comments ----------
  async addComment(userId: string, reelId: string, dto: CreateCommentDto) {
    const reel = await this.prisma.reel.findUnique({where: {id: reelId}});
    if (!reel) {
      throw new NotFoundException('Reel not found');
    }
    const comment = await this.prisma.comment.create({
      data: {userId, reelId, text: dto.text},
      include: {user: true},
    });
    await this.prisma.reel.update({
      where: {id: reelId},
      data: {commentCount: {increment: 1}},
    });
    await this.notifications.notify(reel.agentId, NotificationType.COMMENT, {
      reelId,
      actorId: userId,
      text: dto.text,
    });
    return comment;
  }

  async listComments(reelId: string) {
    return this.prisma.comment.findMany({
      where: {reelId},
      include: {user: true},
      orderBy: {createdAt: 'desc'},
      take: 100,
    });
  }

  async deleteComment(userId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({where: {id: commentId}});
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    if (comment.userId !== userId) {
      throw new ForbiddenException('Not your comment');
    }
    await this.prisma.comment.delete({where: {id: commentId}});
    await this.prisma.reel.update({
      where: {id: comment.reelId},
      data: {commentCount: {decrement: 1}},
    });
    return {success: true};
  }

  private async recountLikes(reelId: string) {
    const likeCount = await this.prisma.like.count({where: {reelId}});
    await this.prisma.reel.update({where: {id: reelId}, data: {likeCount}});
  }
}
