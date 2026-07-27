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
import {AdStatus, UserRole} from '../shared';
import {AdsService} from './ads.service';
import {
  CreateAdCampaignDto,
  QueryAdCampaignsDto,
  ServeAdDto,
  TrackAdDto,
  UpdateAdCampaignDto,
} from './dto/ad.dto';
import {AuthUser, CurrentUser} from '../common/decorators/current-user.decorator';
import {Roles} from '../common/decorators/roles.decorator';
import {Public} from '../common/decorators/public.decorator';

@Controller('ads')
export class AdsController {
  constructor(private ads: AdsService) {}

  // ---------- public: serving + tracking ----------

  /**
   * Signed-out visitors are still served ads, so this is @Public() and reads
   * the viewer's role only when a token happens to be present.
   */
  @Public()
  @Get('serve')
  serve(@Query() query: ServeAdDto, @CurrentUser() user?: AuthUser) {
    const audience = user ? (user.role === UserRole.AGENT ? 'agent' : 'user') : 'guest';
    return this.ads.serve(query, audience);
  }

  @Public()
  @Post(':id/impression')
  impression(@Param('id') id: string, @Body() dto: TrackAdDto) {
    return this.ads.track(id, dto.slot, 'impression');
  }

  @Public()
  @Post(':id/click')
  click(@Param('id') id: string, @Body() dto: TrackAdDto) {
    return this.ads.track(id, dto.slot, 'click');
  }

  // ---------- admin ----------

  @Roles(UserRole.ADMIN)
  @Get('slots')
  slots() {
    return this.ads.slots();
  }

  @Roles(UserRole.ADMIN)
  @Get()
  list(@Query() query: QueryAdCampaignsDto) {
    return this.ads.list(query);
  }

  @Roles(UserRole.ADMIN)
  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.ads.getOne(id);
  }

  @Roles(UserRole.ADMIN)
  @Get(':id/stats')
  stats(@Param('id') id: string, @Query('days') days?: string) {
    return this.ads.stats(id, Number(days) || 30);
  }

  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateAdCampaignDto) {
    return this.ads.create(dto);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAdCampaignDto) {
    return this.ads.update(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/status')
  setStatus(@Param('id') id: string, @Body('status') status: AdStatus) {
    return this.ads.setStatus(id, status);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ads.remove(id);
  }
}
