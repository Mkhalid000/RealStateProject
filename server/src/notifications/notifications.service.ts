import {Injectable} from '@nestjs/common';
import {NotificationType} from '../shared';
import {PrismaService} from '../prisma/prisma.service';
import {RealtimeService} from '../realtime/realtime.service';
import {PushService} from './push.service';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeService,
    private push: PushService,
  ) {}

  /**
   * Create a notification, push it live to the recipient over the socket if
   * connected, and fire an FCM tray notification to their devices.
   */
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

    const {title, body} = buildMessage(type, payload);
    this.push
      .sendToUser(
        userId,
        {title, body},
        buildNavData(type, payload, n.id),
      )
      .catch(() => {});
    return n;
  }

  /**
   * Broadcast a notification to every user except the actor (e.g. "a new
   * property/reel was added"). Fine for the current scale; revisit with a
   * fan-out queue if the user base grows large.
   */
  async notifyAllExcept(
    exceptUserId: string,
    type: NotificationType,
    payload: Record<string, unknown>,
  ) {
    const users = await this.prisma.user.findMany({
      where: {id: {not: exceptUserId}},
      select: {id: true},
    });
    // Per-user catch so one bad recipient never breaks the whole broadcast.
    await Promise.all(
      users.map(u => this.notify(u.id, type, payload).catch(() => null)),
    );
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

  // ---------- device tokens (FCM) ----------
  async registerDevice(userId: string, token: string, platform = 'android') {
    if (!token) {
      return {success: false};
    }
    await this.prisma.deviceToken.upsert({
      where: {token},
      create: {userId, token, platform},
      update: {userId, platform},
    });
    return {success: true};
  }

  async removeDevice(token: string) {
    if (token) {
      await this.prisma.deviceToken.deleteMany({where: {token}});
    }
    return {success: true};
  }
}

/**
 * Build the FCM data payload that drives mobile navigation.
 * All values must be strings (FCM requirement).
 */
function buildNavData(
  type: NotificationType,
  payload: Record<string, unknown>,
  notificationId: string,
): Record<string, string> {
  const base: Record<string, string> = {
    notificationId,
    type: String(type),
  };
  switch (type) {
    case NotificationType.PROPERTY_STATUS:
    case NotificationType.NEW_PROPERTY:
    case NotificationType.SAVED_SEARCH_MATCH:
      if (payload.propertyId) {
        base.screen = 'PropertyDetail';
        base.id = String(payload.propertyId);
      } else {
        base.screen = 'Notifications';
      }
      break;
    case NotificationType.NEW_REEL:
      base.screen = 'Notifications'; // Reels don't have a stand-alone detail screen yet
      if (payload.reelId) {
        base.reelId = String(payload.reelId);
      }
      break;
    default:
      base.screen = 'Notifications';
  }
  return base;
}

/** Human-friendly title/body for the FCM tray + in-app display. */
function buildMessage(
  type: NotificationType,
  p: Record<string, unknown>,
): {title: string; body: string} {
  const title = (p.title as string) || 'Property';
  switch (type) {
    case NotificationType.PROPERTY_STATUS: {
      const status = String(p.status || '');
      if (status === 'verified') {
        return {title: 'Listing approved', body: `“${title}” is now live.`};
      }
      if (status === 'rejected') {
        return {
          title: 'Listing rejected',
          body: `“${title}” wasn’t approved. Please review and resubmit.`,
        };
      }
      return {
        title: 'Listing submitted',
        body: `“${title}” is pending admin verification.`,
      };
    }
    case NotificationType.NEW_PROPERTY:
      return {
        title: 'New property listed',
        body: `${(p.actorName as string) || 'An agent'} just listed “${title}”.`,
      };
    case NotificationType.SAVED_SEARCH_MATCH:
      return {
        title: `New match: ${(p.searchName as string) || 'your saved search'}`,
        body: `“${title}” matches a search you asked us to watch.`,
      };
    case NotificationType.NEW_REEL:
      if (p.self) {
        return {title: 'Reel posted', body: 'Your reel is now live.'};
      }
      return {
        title: 'New reel posted',
        body: `${(p.actorName as string) || 'An agent'} shared a new reel.`,
      };
    case NotificationType.LIKE:
      return {title: 'New like', body: 'Someone liked your reel.'};
    case NotificationType.COMMENT:
      return {title: 'New comment', body: 'Someone commented on your reel.'};
    case NotificationType.FOLLOW:
      return {title: 'New follower', body: 'You have a new follower.'};
    case NotificationType.MESSAGE:
      return {title: 'New message', body: 'You have a new message.'};
    default:
      return {title: 'AUREVIA', body: 'You have a new notification.'};
  }
}
