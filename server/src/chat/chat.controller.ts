import {Body, Controller, Get, Param, Post} from '@nestjs/common';
import {ChatService} from './chat.service';
import {SendMessageDto, StartConversationDto} from './dto/chat.dto';
import {CurrentUser} from '../common/decorators/current-user.decorator';

@Controller('chat')
export class ChatController {
  constructor(private chat: ChatService) {}

  @Get('conversations')
  list(@CurrentUser('id') userId: string) {
    return this.chat.listConversations(userId);
  }

  @Post('conversations')
  start(@CurrentUser('id') userId: string, @Body() dto: StartConversationDto) {
    return this.chat.startConversation(userId, dto.agentId);
  }

  @Get('conversations/:id/messages')
  messages(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.chat.listMessages(userId, id);
  }

  @Post('conversations/:id/messages')
  send(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chat.sendMessage(userId, id, dto);
  }
}
