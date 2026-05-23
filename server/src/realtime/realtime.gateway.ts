import {Logger} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {JwtService} from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import {Server, Socket} from 'socket.io';
import {RealtimeService} from './realtime.service';

@WebSocketGateway({cors: {origin: true}})
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer() server: Server;
  private logger = new Logger('RealtimeGateway');

  constructor(
    private realtime: RealtimeService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  afterInit(server: Server) {
    this.realtime.setServer(server);
  }

  async handleConnection(client: Socket) {
    // Token passed via handshake: io(url, { auth: { token } })
    const token =
      (client.handshake.auth?.token as string) ||
      (client.handshake.headers.authorization || '').replace('Bearer ', '');
    try {
      const payload = await this.jwt.verifyAsync(token, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      });
      client.data.userId = payload.sub;
      client.join(this.realtime.userRoom(payload.sub));
    } catch {
      this.logger.warn('Socket rejected: bad token');
      client.disconnect();
    }
  }

  /** Client subscribes to a conversation room to receive live messages. */
  @SubscribeMessage('conversation:join')
  joinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: {conversationId: string},
  ) {
    client.join(this.realtime.conversationRoom(body.conversationId));
    return {ok: true};
  }

  @SubscribeMessage('conversation:leave')
  leaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: {conversationId: string},
  ) {
    client.leave(this.realtime.conversationRoom(body.conversationId));
    return {ok: true};
  }
}
