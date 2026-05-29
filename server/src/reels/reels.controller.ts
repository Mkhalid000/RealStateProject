import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {UserRole} from '../shared';
import {ReelsService} from './reels.service';
import {CreateCommentDto, CreateReelDto, FeedQueryDto} from './dto/reel.dto';
import {CurrentUser} from '../common/decorators/current-user.decorator';
import {Roles} from '../common/decorators/roles.decorator';
import {Public} from '../common/decorators/public.decorator';

@Controller('reels')
export class ReelsController {
  constructor(private reels: ReelsService) {}

  @Public()
  @Get('feed')
  feed(@Query() query: FeedQueryDto, @CurrentUser('id') viewerId?: string) {
    return this.reels.feed(query, viewerId);
  }

  // Agent: only my own reels — declared before ':id'
  @Roles(UserRole.AGENT, UserRole.ADMIN)
  @Get('mine')
  listMine(@CurrentUser('id') agentId: string, @Query() query: FeedQueryDto) {
    return this.reels.listMine(agentId, query);
  }

  @Public()
  @Get(':id')
  getOne(@Param('id') id: string, @CurrentUser('id') viewerId?: string) {
    return this.reels.getOne(id, viewerId);
  }

  @Public()
  @HttpCode(204)
  @Post(':id/view')
  view(@Param('id') id: string) {
    return this.reels.recordView(id);
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

  @Public()
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
