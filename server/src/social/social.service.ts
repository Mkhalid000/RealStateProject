import {BadRequestException, Injectable} from '@nestjs/common';
import {NotificationType} from '../shared';
import {PrismaService} from '../prisma/prisma.service';
import {NotificationsService} from '../notifications/notifications.service';
import {toPublicProfile} from '../profiles/profile.mapper';

@Injectable()
export class SocialService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async follow(followerId: string, agentId: string) {
    if (followerId === agentId) {
      throw new BadRequestException('Cannot follow yourself');
    }
    await this.prisma.follow
      .create({data: {followerId, agentId}})
      .catch(() => null); // ignore duplicate
    await this.notifications.notify(agentId, NotificationType.FOLLOW, {
      actorId: followerId,
    });
    return {following: true};
  }

  async unfollow(followerId: string, agentId: string) {
    await this.prisma.follow
      .delete({where: {followerId_agentId: {followerId, agentId}}})
      .catch(() => null);
    return {following: false};
  }

  async following(followerId: string) {
    const rows = await this.prisma.follow.findMany({
      where: {followerId},
      include: {agent: true},
      orderBy: {createdAt: 'desc'},
    });
    return rows.map(r => toPublicProfile(r.agent));
  }

  async followers(agentId: string) {
    const rows = await this.prisma.follow.findMany({
      where: {agentId},
      include: {follower: true},
      orderBy: {createdAt: 'desc'},
    });
    return rows.map(r => toPublicProfile(r.follower));
  }
}
