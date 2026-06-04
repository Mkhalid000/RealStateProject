import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {NotificationType} from '../shared';
import {PrismaService} from '../prisma/prisma.service';
import {RealtimeService} from '../realtime/realtime.service';
import {NotificationsService} from '../notifications/notifications.service';
import {SendMessageDto} from './dto/chat.dto';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeService,
    private notifications: NotificationsService,
  ) {}

  /** Get-or-create a 1:1 conversation between the current user and an agent. */
  async startConversation(currentUserId: string, agentId: string) {
    if (currentUserId === agentId) {
      throw new ForbiddenException('Cannot message yourself');
    }
    const other = await this.prisma.user.findUnique({where: {id: agentId}});
    if (!other) throw new NotFoundException('User not found');

    const userId = currentUserId;
    const existing = await this.prisma.conversation.findFirst({
      where: {OR: [{userId, agentId}, {userId: agentId, agentId: userId}]},
      include: {user: true, agent: true},
    });
    if (existing) return this.attachUnread(existing, currentUserId);

    const created = await this.prisma.conversation.create({
      data: {userId, agentId},
      include: {user: true, agent: true},
    });
    return this.attachUnread(created, currentUserId);
  }

  async listConversations(currentUserId: string) {
    const convs = await this.prisma.conversation.findMany({
      where: {OR: [{userId: currentUserId}, {agentId: currentUserId}]},
      include: {
        user: true,
        agent: true,
        messages: {orderBy: {createdAt: 'desc'}, take: 1},
      },
      orderBy: [{lastMessageAt: 'desc'}, {createdAt: 'desc'}],
    });
    return convs.map(c => this.attachUnread(c, currentUserId));
  }

  /** Total unread count across all conversations — for the topbar badge. */
  async totalUnread(currentUserId: string) {
    const convs = await this.prisma.conversation.findMany({
      where: {OR: [{userId: currentUserId}, {agentId: currentUserId}]},
      select: {id: true, userId: true, agentId: true, userReadAt: true, agentReadAt: true},
    });

    let total = 0;
    for (const conv of convs) {
      const isUser = conv.userId === currentUserId;
      const readAt = isUser ? conv.userReadAt : conv.agentReadAt;
      const count = await this.prisma.message.count({
        where: {
          conversationId: conv.id,
          senderId: {not: currentUserId},
          ...(readAt ? {createdAt: {gt: readAt}} : {}),
        },
      });
      total += count;
    }
    return {count: total};
  }

  async listMessages(currentUserId: string, conversationId: string) {
    const conv = await this.assertParticipant(currentUserId, conversationId);

    // Mark as read — update the correct participant's readAt
    const isUser = conv.userId === currentUserId;
    await this.prisma.conversation.update({
      where: {id: conversationId},
      data: isUser ? {userReadAt: new Date()} : {agentReadAt: new Date()},
    });

    return this.prisma.message.findMany({
      where: {conversationId},
      orderBy: {createdAt: 'asc'},
      take: 200,
    });
  }

  async sendMessage(
    currentUserId: string,
    conversationId: string,
    dto: SendMessageDto,
  ) {
    const conv = await this.assertParticipant(currentUserId, conversationId);
    const message = await this.prisma.message.create({
      data: {conversationId, senderId: currentUserId, text: dto.text},
    });

    // Update lastMessage and mark sender as read (they just sent it)
    const isUser = conv.userId === currentUserId;
    await this.prisma.conversation.update({
      where: {id: conversationId},
      data: {
        lastMessage: dto.text,
        lastMessageAt: message.createdAt,
        ...(isUser ? {userReadAt: message.createdAt} : {agentReadAt: message.createdAt}),
      },
    });

    this.realtime.emitToConversation(conversationId, 'message', message);
    const recipientId = conv.userId === currentUserId ? conv.agentId : conv.userId;
    await this.notifications.notify(recipientId, NotificationType.MESSAGE, {
      conversationId,
      actorId: currentUserId,
      text: dto.text,
    });

    return message;
  }

  private async assertParticipant(userId: string, conversationId: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: {id: conversationId},
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    if (conv.userId !== userId && conv.agentId !== userId) {
      throw new ForbiddenException('Not a participant');
    }
    return conv;
  }

  /** Attach computed unreadCount to a conversation object. */
  private attachUnread(conv: any, currentUserId: string) {
    const isUser = conv.userId === currentUserId;
    const readAt: Date | null = isUser ? conv.userReadAt : conv.agentReadAt;

    // Count unread from the messages array if included (avoids extra DB call)
    // For list endpoints we pass {messages: last 1} — for full unread we need a count query.
    // We'll use a simple heuristic: if lastMessageAt > readAt and lastMessage was not by us → 1+ unread
    const hasUnread =
      conv.lastMessageAt &&
      (!readAt || conv.lastMessageAt > readAt);

    const {userReadAt, agentReadAt, messages, ...rest} = conv;
    return {
      ...rest,
      unreadCount: hasUnread ? 1 : 0, // simplified; full count via totalUnread
    };
  }
}
