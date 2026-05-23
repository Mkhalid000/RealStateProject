import {Injectable} from '@nestjs/common';
import {Server} from 'socket.io';

@Injectable()
export class RealtimeService {
  private server: Server | null = null;

  setServer(server: Server) {
    this.server = server;
  }

  userRoom(userId: string) {
    return `user:${userId}`;
  }

  conversationRoom(conversationId: string) {
    return `conversation:${conversationId}`;
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.server?.to(this.userRoom(userId)).emit(event, payload);
  }

  emitToConversation(conversationId: string, event: string, payload: unknown) {
    this.server?.to(this.conversationRoom(conversationId)).emit(event, payload);
  }
}
