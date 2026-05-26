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
import {AdminService} from './admin.service';
import {BillingService} from '../billing/billing.service';
import {Roles} from '../common/decorators/roles.decorator';

// Entire controller is admin-only.
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(
    private admin: AdminService,
    private billing: BillingService,
  ) {}

  @Get('stats')
  stats() {
    return this.admin.stats();
  }

  @Get('users')
  users(@Query('role') role?: UserRole, @Query('q') q?: string) {
    return this.admin.listUsers(role, q);
  }

  @Patch('users/:id/verify')
  verify(@Param('id') id: string, @Body() body: {isVerified: boolean}) {
    return this.admin.setVerified(id, body.isVerified);
  }

  @Patch('users/:id/role')
  role(@Param('id') id: string, @Body() body: {role: UserRole}) {
    return this.admin.setRole(id, body.role);
  }

  @Delete('reels/:id')
  deleteReel(@Param('id') id: string) {
    return this.admin.deleteReel(id);
  }

  @Delete('properties/:id')
  deleteProperty(@Param('id') id: string) {
    return this.admin.deleteProperty(id);
  }

  @Get('boosts')
  boosts() {
    return this.admin.listBoosts();
  }

  @Post('boosts/expire')
  expireBoosts() {
    return this.billing.expireBoosts();
  }
}
