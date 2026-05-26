import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {UserRole} from '../shared';
import {ReelsService} from './reels.service';
import {CreateCommentDto, CreateReelDto, FeedQueryDto} from './dto/reel.dto';
import {CurrentUser} from '../common/decorators/current-user.decorator';
import {Roles} from '../common/decorators/roles.decorator';

@Controller('reels')
export class ReelsController {
  constructor(private reels: ReelsService) {}

  @Get('feed')
  feed(@Query() query: FeedQueryDto, @CurrentUser('id') viewerId: string) {
    return this.reels.feed(query, viewerId);
  }

  @Get(':id')
  getOne(@Param('id') id: string, @CurrentUser('id') viewerId: string) {
    return this.reels.getOne(id, viewerId);
  }

  @Roles(UserRole.AGENT, UserRole.ADMIN)
  @Post()
  create(@CurrentUser('id') agentId: string, @Body() dto: CreateReelDto) {
    return this.reels.create(agentId, dto);
  }

  @Roles(UserRole.AGENT, UserRole.ADMIN)
  @Delete(':id')
  remove(@CurrentUser('id') agentId: string, @Param('id') id: string) {
    return this.reels.remove(agentId, id);
  }

  @Post(':id/like')
  like(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.reels.like(userId, id);
  }

  @Delete(':id/like')
  unlike(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.reels.unlike(userId, id);
  }

  @Get(':id/comments')
  listComments(@Param('id') id: string) {
    return this.reels.listComments(id);
  }

  @Post(':id/comments')
  addComment(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.reels.addComment(userId, id, dto);
  }

  @Delete('comments/:commentId')
  deleteComment(
    @CurrentUser('id') userId: string,
    @Param('commentId') commentId: string,
  ) {
    return this.reels.deleteComment(userId, commentId);
  }
}
