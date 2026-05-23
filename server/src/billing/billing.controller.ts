import {Body, Controller, Get, Post} from '@nestjs/common';
import {UserRole} from '@realreels/shared';
import {BillingService} from './billing.service';
import {ChangePlanDto, CreateBoostDto} from './dto/billing.dto';
import {CurrentUser} from '../common/decorators/current-user.decorator';
import {Roles} from '../common/decorators/roles.decorator';
import {Public} from '../common/decorators/public.decorator';

@Controller('billing')
export class BillingController {
  constructor(private billing: BillingService) {}

  @Public()
  @Get('plans')
  plans() {
    return this.billing.plans();
  }

  @Roles(UserRole.AGENT, UserRole.ADMIN)
  @Post('boosts')
  createBoost(@CurrentUser('id') agentId: string, @Body() dto: CreateBoostDto) {
    return this.billing.createBoost(agentId, dto);
  }

  @Roles(UserRole.AGENT, UserRole.ADMIN)
  @Get('boosts')
  myBoosts(@CurrentUser('id') agentId: string) {
    return this.billing.listBoosts(agentId);
  }

  @Roles(UserRole.AGENT, UserRole.ADMIN)
  @Get('subscription')
  myPlan(@CurrentUser('id') agentId: string) {
    return this.billing.getMyPlan(agentId);
  }

  @Roles(UserRole.AGENT, UserRole.ADMIN)
  @Post('subscription')
  changePlan(@CurrentUser('id') agentId: string, @Body() dto: ChangePlanDto) {
    return this.billing.changePlan(agentId, dto);
  }
}
