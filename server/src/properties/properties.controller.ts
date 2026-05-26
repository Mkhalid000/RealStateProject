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
} from './dto/property.dto';
import {CurrentUser} from '../common/decorators/current-user.decorator';
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

  @Get('saved/mine')
  listSaved(@CurrentUser('id') userId: string) {
    return this.properties.listSaved(userId);
  }

  @Public()
  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.properties.getOne(id);
  }

  @Roles(UserRole.AGENT, UserRole.ADMIN)
  @Post()
  create(@CurrentUser('id') agentId: string, @Body() dto: CreatePropertyDto) {
    return this.properties.create(agentId, dto);
  }

  @Roles(UserRole.AGENT, UserRole.ADMIN)
  @Patch(':id')
  update(
    @CurrentUser('id') agentId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePropertyDto,
  ) {
    return this.properties.update(agentId, id, dto);
  }

  @Roles(UserRole.AGENT, UserRole.ADMIN)
  @Delete(':id')
  remove(@CurrentUser('id') agentId: string, @Param('id') id: string) {
    return this.properties.remove(agentId, id);
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
