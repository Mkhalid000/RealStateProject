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
import {UserRole, VerificationStatus} from '../shared';
import {AdminService} from './admin.service';
import {BillingService} from '../billing/billing.service';
import {Roles} from '../common/decorators/roles.decorator';
import {CreateAgentDto} from '../auth/dto/auth.dto';

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
  users(
    @Query('role') role?: UserRole,
    @Query('q') q?: string,
    @Query('verified') verified?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.admin.listUsers({
      role,
      q,
      verified,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Post('agents')
  createAgent(@Body() dto: CreateAgentDto) {
    return this.admin.createAgent(dto);
  }

  @Patch('users/:id/verify')
  verify(@Param('id') id: string, @Body() body: {verificationStatus: VerificationStatus}) {
    return this.admin.setVerification(id, body.verificationStatus);
  }

  @Patch('users/:id/role')
  role(@Param('id') id: string, @Body() body: {role: UserRole}) {
    return this.admin.setRole(id, body.role);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.admin.deleteUser(id);
  }

  @Patch('users/:id/active')
  toggleActive(@Param('id') id: string, @Body() body: {isActive: boolean}) {
    return this.admin.toggleUserActive(id, body.isActive);
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
