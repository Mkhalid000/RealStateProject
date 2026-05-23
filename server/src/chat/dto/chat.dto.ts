import {IsString, MaxLength} from 'class-validator';

export class StartConversationDto {
  @IsString()
  agentId: string;
}

export class SendMessageDto {
  @IsString()
  @MaxLength(2000)
  text: string;
}
