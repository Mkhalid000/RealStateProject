import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {BlogStatus, UserRole, VerificationStatus} from '../shared';
import {BlogService} from './blog.service';
import {
  CreateBlogCategoryDto,
  CreateBlogCommentDto,
  CreateBlogPostDto,
  QueryBlogCommentsDto,
  QueryBlogPostsDto,
  UpdateBlogCategoryDto,
  UpdateBlogPostDto,
  VerifyBlogPostDto,
} from './dto/blog.dto';
import {AuthUser, CurrentUser} from '../common/decorators/current-user.decorator';
import {Roles} from '../common/decorators/roles.decorator';
import {Public} from '../common/decorators/public.decorator';

@Controller('blog')
export class BlogController {
  constructor(private blog: BlogService) {}

  // ---------- categories (static paths first) ----------

  @Public()
  @Get('categories')
  listCategories() {
    return this.blog.listCategories();
  }

  @Roles(UserRole.ADMIN)
  @Post('categories')
  createCategory(@Body() dto: CreateBlogCategoryDto) {
    return this.blog.createCategory(dto);
  }

  @Roles(UserRole.ADMIN)
  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateBlogCategoryDto) {
    return this.blog.updateCategory(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Delete('categories/:id')
  removeCategory(@Param('id') id: string) {
    return this.blog.removeCategory(id);
  }

  // ---------- admin / author listings ----------

  @Roles(UserRole.ADMIN)
  @Get('admin')
  adminList(@Query() query: QueryBlogPostsDto) {
    return this.blog.adminList(query);
  }

  @Roles(UserRole.ADMIN)
  @Get('admin/overview')
  overview(@Query('days') days?: string) {
    return this.blog.overview(Number(days) || 30);
  }

  @Roles(UserRole.ADMIN)
  @Get('admin/comments')
  adminComments(@Query() query: QueryBlogCommentsDto) {
    return this.blog.adminListComments(query);
  }

  @Roles(UserRole.AGENT, UserRole.ADMIN)
  @Get('mine')
  listMine(@CurrentUser('id') userId: string, @Query() query: QueryBlogPostsDto) {
    return this.blog.listMine(userId, query);
  }

  // ---------- public reading ----------

  @Public()
  @Get()
  list(@Query() query: QueryBlogPostsDto) {
    return this.blog.list(query);
  }

  @Public()
  @Get(':idOrSlug')
  getOne(@Param('idOrSlug') idOrSlug: string, @CurrentUser() user?: AuthUser) {
    return this.blog.getOne(idOrSlug, user?.id, user?.role === UserRole.ADMIN);
  }

  @Public()
  @Get(':idOrSlug/related')
  related(@Param('idOrSlug') idOrSlug: string, @Query('limit') limit?: string) {
    return this.blog.related(idOrSlug, Number(limit) || 3);
  }

  @Public()
  @HttpCode(204)
  @Post(':idOrSlug/view')
  view(@Param('idOrSlug') idOrSlug: string, @Query('read') read?: string) {
    return this.blog.recordView(idOrSlug, read === 'true');
  }

  @Public()
  @HttpCode(204)
  @Post(':id/share')
  share(@Param('id') id: string) {
    return this.blog.recordShare(id);
  }

  // ---------- authoring ----------

  @Roles(UserRole.AGENT, UserRole.ADMIN)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateBlogPostDto) {
    return this.blog.create(user.id, user.role, dto);
  }

  @Roles(UserRole.AGENT, UserRole.ADMIN)
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateBlogPostDto,
  ) {
    return this.blog.update(user.id, user.role, id, dto);
  }

  @Roles(UserRole.AGENT, UserRole.ADMIN)
  @Patch(':id/status')
  setStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body('status') status: BlogStatus,
  ) {
    return this.blog.setStatus(user.id, user.role, id, status);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/verify')
  verify(@Param('id') id: string, @Body() dto: VerifyBlogPostDto) {
    return this.blog.verify(id, dto.verificationStatus as VerificationStatus);
  }

  @Roles(UserRole.ADMIN)
  @Get(':id/stats')
  stats(@Param('id') id: string, @Query('days') days?: string) {
    return this.blog.stats(id, Number(days) || 30);
  }

  @Roles(UserRole.AGENT, UserRole.ADMIN)
  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.blog.remove(user.id, user.role, id);
  }

  // ---------- engagement ----------

  @Post(':id/like')
  like(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.blog.like(userId, id);
  }

  @Delete(':id/like')
  unlike(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.blog.unlike(userId, id);
  }

  @Public()
  @Get(':idOrSlug/comments')
  listComments(@Param('idOrSlug') idOrSlug: string) {
    return this.blog.listComments(idOrSlug);
  }

  @Post(':idOrSlug/comments')
  addComment(
    @CurrentUser() user: AuthUser,
    @Param('idOrSlug') idOrSlug: string,
    @Body() dto: CreateBlogCommentDto,
  ) {
    return this.blog.addComment(user.id, user.role, idOrSlug, dto);
  }

  @Roles(UserRole.ADMIN)
  @Patch('comments/:id/approve')
  approveComment(@Param('id') id: string) {
    return this.blog.approveComment(id);
  }

  @Delete('comments/:id')
  removeComment(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.blog.removeComment(user.id, user.role, id);
  }
}
