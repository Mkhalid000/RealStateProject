import {Injectable} from '@nestjs/common';
import {NotificationType} from '../shared';
import {PrismaService} from '../prisma/prisma.service';
import {RealtimeService} from '../realtime/realtime.service';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeService,
  ) {}

  /** Create a notification and push it live to the recipient if connected. */
  async notify(
    userId: string,
    type: NotificationType,
    payload: Record<string, unknown>,
  ) {
    // Never notify yourself (e.g. liking your own reel).
    if (payload.actorId && payload.actorId === userId) {
      return;
    }
    const n = await this.prisma.notification.create({
      data: {userId, type: type as any, payload: payload as any},
    });
    this.realtime.emitToUser(userId, 'notification', n);
    return n;
  }

  list(userId: string) {
    return this.prisma.notification.findMany({
      where: {userId},
      orderBy: {createdAt: 'desc'},
      take: 50,
    });
  }

  unreadCount(userId: string) {
    return this.prisma.notification
      .count({where: {userId, readAt: null}})
      .then(count => ({count}));
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: {userId, readAt: null},
      data: {readAt: new Date()},
    });
    return {success: true};
  }
}
