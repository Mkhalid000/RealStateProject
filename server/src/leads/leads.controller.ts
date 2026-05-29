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
import {UserRole} from '../shared';
import {LeadsService} from './leads.service';
import {CreateLeadDto} from './dto/lead.dto';
import {Public} from '../common/decorators/public.decorator';
import {Roles} from '../common/decorators/roles.decorator';

@Controller('leads')
export class LeadsController {
  constructor(private leads: LeadsService) {}

  // Public: created from the website enquiry form (or mobile app).
  @Public()
  @HttpCode(201)
  @Post()
  create(@Body() dto: CreateLeadDto) {
    return this.leads.create(dto);
  }

  @Roles(UserRole.ADMIN)
  @Get()
  list(
    @Query('source') source?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.leads.list({
      source,
      status,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Roles(UserRole.ADMIN)
  @Get('counts')
  counts() {
    return this.leads.counts();
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/status')
  setStatus(@Param('id') id: string, @Body() body: {status: string}) {
    return this.leads.setStatus(id, body.status);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.leads.remove(id);
  }
}
