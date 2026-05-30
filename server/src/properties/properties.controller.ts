import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {UserRole} from '../shared';
import {PropertiesService} from './properties.service';
import {
  CreatePropertyDto,
  QueryPropertiesDto,
  UpdatePropertyDto,
  VerifyPropertyDto,
} from './dto/property.dto';
import {AuthUser, CurrentUser} from '../common/decorators/current-user.decorator';
import {Roles} from '../common/decorators/roles.decorator';
import {Public} from '../common/decorators/public.decorator';

@Controller('properties')
export class PropertiesController {
  constructor(private properties: PropertiesService) {}

  @Public()
  @Get()
  list(@Query() query: QueryPropertiesDto) {
    return this.properties.list(query);
  }

  // Admin: list everything (incl. pending) — declared before ':idOrSlug'
  @Roles(UserRole.ADMIN)
  @Get('admin')
  adminList(@Query() query: QueryPropertiesDto) {
    return this.properties.adminList(query);
  }

  // Owner's own listings (incl. pending) — users, agents and admins.
  // Declared before ':idOrSlug'.
  @Roles(UserRole.USER, UserRole.AGENT, UserRole.ADMIN)
  @Get('mine')
  listMine(@CurrentUser('id') userId: string, @Query() query: QueryPropertiesDto) {
    return this.properties.listMine(userId, query);
  }

  @Get('saved/mine')
  listSaved(@CurrentUser('id') userId: string) {
    return this.properties.listSaved(userId);
  }

  @Public()
  @Get(':idOrSlug')
  getOne(@Param('idOrSlug') idOrSlug: string) {
    return this.properties.getOne(idOrSlug);
  }

  // Anyone signed in can post a property for free; non-admins start as pending.
  @Roles(UserRole.USER, UserRole.AGENT, UserRole.ADMIN)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePropertyDto) {
    return this.properties.create(user.id, user.role, dto);
  }

  @Roles(UserRole.USER, UserRole.AGENT, UserRole.ADMIN)
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdatePropertyDto,
  ) {
    return this.properties.update(user.id, user.role, id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/verify')
  verify(@Param('id') id: string, @Body() dto: VerifyPropertyDto) {
    return this.properties.setVerification(id, dto.verificationStatus);
  }

  @Roles(UserRole.USER, UserRole.AGENT, UserRole.ADMIN)
  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.properties.remove(user.id, user.role, id);
  }

  @Post(':id/save')
  save(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.properties.save(userId, id);
  }

  @Delete(':id/save')
  unsave(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.properties.unsave(userId, id);
  }
}
