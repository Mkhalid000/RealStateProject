import {Controller, Delete, Get, Param, Post} from '@nestjs/common';
import {SocialService} from './social.service';
import {CurrentUser} from '../common/decorators/current-user.decorator';

@Controller('social')
export class SocialController {
  constructor(private social: SocialService) {}

  @Get('following')
  following(@CurrentUser('id') userId: string) {
    return this.social.following(userId);
  }

  @Get(':agentId/followers')
  followers(@Param('agentId') agentId: string) {
    return this.social.followers(agentId);
  }

  @Post('follow/:agentId')
  follow(@CurrentUser('id') userId: string, @Param('agentId') agentId: string) {
    return this.social.follow(userId, agentId);
  }

  @Delete('follow/:agentId')
  unfollow(@CurrentUser('id') userId: string, @Param('agentId') agentId: string) {
    return this.social.unfollow(userId, agentId);
  }
}
