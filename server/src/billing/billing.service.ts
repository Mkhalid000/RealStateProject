import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {Prisma} from '@prisma/client';
import {SubscriptionPlan} from '@realreels/shared';
import {PrismaService} from '../prisma/prisma.service';
import {ChangePlanDto, CreateBoostDto} from './dto/billing.dto';

// Revenue model (from the product spec)
const BOOST_PRICE_PER_7_DAYS = 10; // USD
const PLAN_PRICES: Record<SubscriptionPlan, number> = {
  [SubscriptionPlan.FREE]: 0,
  [SubscriptionPlan.PRO]: 20,
  [SubscriptionPlan.PREMIUM]: 50,
};

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  // ---------- boosts ----------
  /**
   * Creates a boost for one of the agent's own reels. Payment is STUBBED:
   * the boost activates immediately. Swap in Stripe/RevenueCat later.
   */
  async createBoost(agentId: string, dto: CreateBoostDto) {
    const reel = await this.prisma.reel.findUnique({where: {id: dto.reelId}});
    if (!reel) {
      throw new NotFoundException('Reel not found');
    }
    if (reel.agentId !== agentId) {
      throw new ForbiddenException('Not your reel');
    }

    const amount = (dto.days / 7) * BOOST_PRICE_PER_7_DAYS;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + dto.days * 24 * 60 * 60 * 1000);

    const [boost] = await this.prisma.$transaction([
      this.prisma.boost.create({
        data: {
          reelId: dto.reelId,
          agentId,
          amount: new Prisma.Decimal(amount),
          days: dto.days,
          status: 'active',
          startsAt: now,
          expiresAt,
        },
      }),
      this.prisma.reel.update({
        where: {id: dto.reelId},
        data: {isBoosted: true, boostExpiresAt: expiresAt},
      }),
    ]);
    return boost;
  }

  listBoosts(agentId: string) {
    return this.prisma.boost.findMany({
      where: {agentId},
      orderBy: {createdAt: 'desc'},
      include: {reel: true},
    });
  }

  /** Sweep expired boosts back to normal. Call from a cron/admin trigger. */
  async expireBoosts() {
    const now = new Date();
    await this.prisma.boost.updateMany({
      where: {status: 'active', expiresAt: {lt: now}},
      data: {status: 'expired'},
    });
    const {count} = await this.prisma.reel.updateMany({
      where: {isBoosted: true, boostExpiresAt: {lt: now}},
      data: {isBoosted: false},
    });
    return {expired: count};
  }

  // ---------- subscriptions ----------
  async getMyPlan(agentId: string) {
    const sub = await this.prisma.subscription.findUnique({where: {agentId}});
    if (sub) {
      return sub;
    }
    return this.prisma.subscription.create({data: {agentId}});
  }

  /** Change plan. Payment STUBBED — applies immediately. */
  async changePlan(agentId: string, dto: ChangePlanDto) {
    const periodEnd =
      dto.plan === SubscriptionPlan.FREE
        ? null
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    return this.prisma.subscription.upsert({
      where: {agentId},
      create: {agentId, plan: dto.plan as any, currentPeriodEnd: periodEnd},
      update: {plan: dto.plan as any, status: 'active', currentPeriodEnd: periodEnd},
    });
  }

  plans() {
    return Object.entries(PLAN_PRICES).map(([plan, price]) => ({plan, price}));
  }
}
