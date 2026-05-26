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
    // Normalise: the buyer is `userId`, the agent is `agentId`. If the current
    // user is the agent, the other party is the user.
    const other = await this.prisma.user.findUnique({where: {id: agentId}});
    if (!other) {
      throw new NotFoundException('User not found');
    }

    const userId = currentUserId;
    const existing = await this.prisma.conversation.findFirst({
      where: {
        OR: [
          {userId, agentId},
          {userId: agentId, agentId: userId},
        ],
      },
      include: {user: true, agent: true},
    });
    if (existing) {
      return existing;
    }
    return this.prisma.conversation.create({
      data: {userId, agentId},
      include: {user: true, agent: true},
    });
  }

  async listConversations(currentUserId: string) {
    return this.prisma.conversation.findMany({
      where: {OR: [{userId: currentUserId}, {agentId: currentUserId}]},
      include: {user: true, agent: true},
      orderBy: [{lastMessageAt: 'desc'}, {createdAt: 'desc'}],
    });
  }

  async listMessages(currentUserId: string, conversationId: string) {
    await this.assertParticipant(currentUserId, conversationId);
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
    await this.prisma.conversation.update({
      where: {id: conversationId},
      data: {lastMessage: dto.text, lastMessageAt: message.createdAt},
    });

    // Realtime to the conversation room + notify the other participant.
    this.realtime.emitToConversation(conversationId, 'message', message);
    const recipientId =
      conv.userId === currentUserId ? conv.agentId : conv.userId;
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
    if (!conv) {
      throw new NotFoundException('Conversation not found');
    }
    if (conv.userId !== userId && conv.agentId !== userId) {
      throw new ForbiddenException('Not a participant');
    }
    return conv;
  }
}
