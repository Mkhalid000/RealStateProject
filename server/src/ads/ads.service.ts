import {BadRequestException, Injectable, NotFoundException} from '@nestjs/common';
import {Prisma} from '@prisma/client';
import {
  AD_SLOTS,
  AdFrequency,
  AdKind,
  AdStatus,
  AdTrigger,
  INTERRUPTING_SLOTS,
} from '../shared';
import {PrismaService} from '../prisma/prisma.service';
import {toProperty} from '../properties/property.mapper';
import {
  CreateAdCampaignDto,
  QueryAdCampaignsDto,
  ServeAdDto,
  UpdateAdCampaignDto,
} from './dto/ad.dto';

type CampaignWithProperty = Prisma.AdCampaignGetPayload<{
  include: {property: {include: {agent: true}}};
}>;

/** Midnight UTC for the given moment — the key used by AdDailyStat.date. */
function utcDay(at = new Date()): Date {
  return new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()));
}

const eq = (a?: string | null, b?: string | null) =>
  (a ?? '').trim().toLowerCase() === (b ?? '').trim().toLowerCase();

@Injectable()
export class AdsService {
  constructor(private prisma: PrismaService) {}

  // ==========================================================
  // Public — serving
  // ==========================================================

  /**
   * Pick the ad(s) for one slot. Everything except the slot/schedule lookup is
   * filtered in memory on purpose: the active campaign set is small (tens), and
   * case-insensitive array targeting is far clearer here than in SQL.
   */
  async serve(dto: ServeAdDto, audience: string) {
    const now = new Date();
    const campaigns = await this.prisma.adCampaign.findMany({
      where: {
        status: AdStatus.ACTIVE as any,
        slots: {has: dto.slot},
        AND: [
          {OR: [{startsAt: null}, {startsAt: {lte: now}}]},
          {OR: [{endsAt: null}, {endsAt: {gte: now}}]},
        ],
      },
      include: {property: {include: {agent: true}}},
    });
    if (!campaigns.length) return {items: []};

    // lifetime cap + a renderable creative
    let pool = campaigns.filter(
      c =>
        (c.maxImpressions == null || c.impressions < c.maxImpressions) &&
        this.isRenderable(c) &&
        this.matchesTargeting(c, dto, audience),
    );

    pool = await this.applyDailyCaps(pool);
    if (!pool.length) return {items: []};

    const chosen = this.pick(pool, dto.limit ?? 1);
    return {items: chosen.map(c => this.toAd(c, dto.slot))};
  }

  /** Record an impression or a click. Fire-and-forget from the browser. */
  async track(id: string, slot: string, kind: 'impression' | 'click') {
    const field = kind === 'click' ? 'clicks' : 'impressions';
    const date = utcDay();
    try {
      await this.prisma.$transaction([
        this.prisma.adCampaign.update({
          where: {id},
          data: {[field]: {increment: 1}},
        }),
        this.prisma.adDailyStat.upsert({
          where: {campaignId_date_slot: {campaignId: id, date, slot}},
          create: {campaignId: id, date, slot, [field]: 1},
          update: {[field]: {increment: 1}},
        }),
      ]);
      return {ok: true};
    } catch {
      // A deleted campaign shouldn't turn a beacon into a client-side error.
      return {ok: false};
    }
  }

  // ==========================================================
  // Admin — CRUD
  // ==========================================================

  async list(query: QueryAdCampaignsDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);
    const where: Prisma.AdCampaignWhereInput = {};
    if (query.kind) where.kind = query.kind as any;
    if (query.status) where.status = query.status as any;
    if (query.slot) where.slots = {has: query.slot};
    if (query.q) {
      where.OR = [
        {name: {contains: query.q, mode: 'insensitive'}},
        {headline: {contains: query.q, mode: 'insensitive'}},
      ];
    }

    const [rows, total] = await Promise.all([
      this.prisma.adCampaign.findMany({
        where,
        include: {property: {include: {agent: true}}},
        orderBy: [{status: 'asc'}, {createdAt: 'desc'}],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.adCampaign.count({where}),
    ]);

    return {
      items: rows.map(r => this.toAdmin(r)),
      page,
      limit,
      total,
      hasMore: page * limit < total,
    };
  }

  async getOne(id: string) {
    const row = await this.prisma.adCampaign.findUnique({
      where: {id},
      include: {property: {include: {agent: true}}},
    });
    if (!row) throw new NotFoundException('Campaign not found');
    return this.toAdmin(row);
  }

  async create(dto: CreateAdCampaignDto) {
    const data = await this.mapData(dto, dto.kind ?? AdKind.HOUSE);
    const row = await this.prisma.adCampaign.create({
      data,
      include: {property: {include: {agent: true}}},
    });
    return this.toAdmin(row);
  }

  async update(id: string, dto: UpdateAdCampaignDto) {
    const existing = await this.prisma.adCampaign.findUnique({where: {id}});
    if (!existing) throw new NotFoundException('Campaign not found');
    const data = await this.mapData(dto, (dto.kind ?? existing.kind) as AdKind);
    const row = await this.prisma.adCampaign.update({
      where: {id},
      data,
      include: {property: {include: {agent: true}}},
    });
    return this.toAdmin(row);
  }

  async setStatus(id: string, status: AdStatus) {
    if (!Object.values(AdStatus).includes(status)) {
      throw new BadRequestException(`Unknown status "${status}"`);
    }
    const row = await this.prisma.adCampaign
      .update({
        where: {id},
        data: {status: status as any},
        include: {property: {include: {agent: true}}},
      })
      .catch(() => null);
    if (!row) throw new NotFoundException('Campaign not found');
    return this.toAdmin(row);
  }

  async remove(id: string) {
    await this.prisma.adCampaign.delete({where: {id}}).catch(() => {
      throw new NotFoundException('Campaign not found');
    });
    return {success: true};
  }

  /** Daily impressions/clicks for the last `days` days. */
  async stats(id: string, days = 30) {
    const since = utcDay(new Date(Date.now() - (days - 1) * 86400000));
    const rows = await this.prisma.adDailyStat.findMany({
      where: {campaignId: id, date: {gte: since}},
      orderBy: {date: 'asc'},
    });

    // collapse per-slot rows into one entry per day
    const byDate = new Map<string, {date: string; impressions: number; clicks: number}>();
    for (const r of rows) {
      const key = r.date.toISOString().slice(0, 10);
      const entry = byDate.get(key) ?? {date: key, impressions: 0, clicks: 0};
      entry.impressions += r.impressions;
      entry.clicks += r.clicks;
      byDate.set(key, entry);
    }

    const bySlot = new Map<string, {slot: string; impressions: number; clicks: number}>();
    for (const r of rows) {
      const entry = bySlot.get(r.slot) ?? {slot: r.slot, impressions: 0, clicks: 0};
      entry.impressions += r.impressions;
      entry.clicks += r.clicks;
      bySlot.set(r.slot, entry);
    }

    return {daily: [...byDate.values()], bySlot: [...bySlot.values()]};
  }

  /** Slot keys the admin UI offers. */
  slots() {
    return AD_SLOTS.map(key => ({
      key,
      label: SLOT_LABELS[key] ?? key,
      group: SLOT_GROUPS[key] ?? 'In-page',
      interrupting: INTERRUPTING_SLOTS.includes(key),
    }));
  }

  // ==========================================================
  // helpers
  // ==========================================================

  private async mapData(dto: CreateAdCampaignDto, kind: AdKind) {
    const slots = (dto.slots ?? []).filter(s => (AD_SLOTS as readonly string[]).includes(s));
    if (!slots.length) {
      throw new BadRequestException('Pick at least one valid slot');
    }
    if (dto.startsAt && dto.endsAt && new Date(dto.endsAt) < new Date(dto.startsAt)) {
      throw new BadRequestException('End date cannot be before the start date');
    }

    if (kind === AdKind.SPONSORED) {
      if (!dto.propertyId) {
        throw new BadRequestException('A sponsored listing needs a property');
      }
      const property = await this.prisma.property.findUnique({
        where: {id: dto.propertyId},
      });
      if (!property) throw new BadRequestException('Property not found');
    } else if (!dto.headline && !dto.imageUrl) {
      throw new BadRequestException('A house ad needs a headline or an image');
    }

    return {
      name: dto.name,
      kind: kind as any,
      status: (dto.status ?? AdStatus.DRAFT) as any,

      headline: kind === AdKind.HOUSE ? dto.headline ?? null : null,
      body: kind === AdKind.HOUSE ? dto.body ?? null : null,
      imageUrl: kind === AdKind.HOUSE ? dto.imageUrl ?? null : null,
      ctaLabel: dto.ctaLabel ?? null,
      ctaUrl: kind === AdKind.HOUSE ? dto.ctaUrl ?? null : null,
      propertyId: kind === AdKind.SPONSORED ? dto.propertyId ?? null : null,

      slots,
      priority: dto.priority ?? 0,
      weight: dto.weight ?? 1,

      startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
      endsAt: dto.endsAt ? new Date(dto.endsAt) : null,

      accent: dto.accent || null,
      showCountdown: dto.showCountdown ?? false,
      dismissible: dto.dismissible ?? true,

      trigger: dto.trigger ?? AdTrigger.DELAY,
      triggerValue: dto.triggerValue ?? 8,
      frequency: dto.frequency ?? AdFrequency.SESSION,

      maxImpressions: dto.maxImpressions ?? null,
      dailyCap: dto.dailyCap ?? null,

      targetCities: dto.targetCities ?? [],
      targetTypes: dto.targetTypes ?? [],
      targetBlogCategories: dto.targetBlogCategories ?? [],
      targetTags: dto.targetTags ?? [],
      targetListingType: dto.targetListingType || null,
      targetDevice: dto.targetDevice || null,
      targetAudience: dto.targetAudience || null,
    };
  }

  /** A campaign can only serve if it actually has something to show. */
  private isRenderable(c: CampaignWithProperty): boolean {
    if (c.kind === AdKind.SPONSORED) {
      // the listing may have been unpublished or rejected since booking
      return Boolean(c.property && c.property.isVerified && c.property.status === 'active');
    }
    return Boolean(c.headline || c.imageUrl);
  }

  private matchesTargeting(
    c: CampaignWithProperty,
    dto: ServeAdDto,
    audience: string,
  ): boolean {
    if (c.targetCities.length && !c.targetCities.some(city => eq(city, dto.city))) {
      return false;
    }
    if (c.targetTypes.length && !c.targetTypes.some(t => eq(t, dto.type))) {
      return false;
    }
    if (c.targetListingType && !eq(c.targetListingType, dto.listingType)) return false;
    // Blog placements target the article's category and tags.
    if (
      c.targetBlogCategories.length &&
      !c.targetBlogCategories.some(cat => eq(cat, dto.blogCategory))
    ) {
      return false;
    }
    if (c.targetTags.length) {
      const tags = (dto.tags ?? '').split(',').map(t => t.trim()).filter(Boolean);
      if (!c.targetTags.some(t => tags.some(v => eq(t, v)))) return false;
    }
    if (c.targetDevice && c.targetDevice !== 'all' && !eq(c.targetDevice, dto.device)) {
      return false;
    }
    if (c.targetAudience && c.targetAudience !== 'all' && !eq(c.targetAudience, audience)) {
      return false;
    }
    return true;
  }

  /** Drop campaigns that already hit today's impression cap. */
  private async applyDailyCaps(pool: CampaignWithProperty[]) {
    const capped = pool.filter(c => c.dailyCap != null);
    if (!capped.length) return pool;

    const rows = await this.prisma.adDailyStat.groupBy({
      by: ['campaignId'],
      where: {campaignId: {in: capped.map(c => c.id)}, date: utcDay()},
      _sum: {impressions: true},
    });
    const today = new Map(rows.map(r => [r.campaignId, r._sum.impressions ?? 0]));

    return pool.filter(c => c.dailyCap == null || (today.get(c.id) ?? 0) < c.dailyCap);
  }

  /**
   * Highest priority tier wins; inside a tier, campaigns are drawn by weighted
   * random so a heavier campaign shows more often without starving the rest.
   */
  private pick(pool: CampaignWithProperty[], limit: number): CampaignWithProperty[] {
    const tiers = new Map<number, CampaignWithProperty[]>();
    for (const c of pool) {
      const tier = tiers.get(c.priority) ?? [];
      tier.push(c);
      tiers.set(c.priority, tier);
    }

    const chosen: CampaignWithProperty[] = [];
    for (const priority of [...tiers.keys()].sort((a, b) => b - a)) {
      const bucket = [...(tiers.get(priority) ?? [])];
      while (bucket.length && chosen.length < limit) {
        const total = bucket.reduce((sum, c) => sum + Math.max(1, c.weight), 0);
        let roll = Math.random() * total;
        let index = bucket.length - 1;
        for (let i = 0; i < bucket.length; i++) {
          roll -= Math.max(1, bucket[i].weight);
          if (roll <= 0) {
            index = i;
            break;
          }
        }
        chosen.push(bucket.splice(index, 1)[0]);
      }
      if (chosen.length >= limit) break;
    }
    return chosen;
  }

  /** Lean payload for the public slot. */
  private toAd(c: CampaignWithProperty, slot: string) {
    return {
      id: c.id,
      kind: c.kind,
      slot,
      headline: c.headline,
      body: c.body,
      imageUrl: c.imageUrl,
      ctaLabel: c.ctaLabel,
      ctaUrl: c.ctaUrl,
      property: c.property ? toProperty(c.property) : null,

      accent: c.accent,
      dismissible: c.dismissible,
      // only send a deadline the client can actually count down to
      countdownTo: c.showCountdown && c.endsAt ? c.endsAt.toISOString() : null,

      trigger: c.trigger,
      triggerValue: c.triggerValue,
      frequency: c.frequency,
    };
  }

  /** Full record for the admin table/form, plus a derived lifecycle label. */
  private toAdmin(c: CampaignWithProperty) {
    return {
      id: c.id,
      name: c.name,
      kind: c.kind,
      status: c.status,
      state: this.derivedState(c),

      headline: c.headline,
      body: c.body,
      imageUrl: c.imageUrl,
      ctaLabel: c.ctaLabel,
      ctaUrl: c.ctaUrl,

      propertyId: c.propertyId,
      property: c.property ? toProperty(c.property) : null,

      slots: c.slots,
      priority: c.priority,
      weight: c.weight,

      startsAt: c.startsAt?.toISOString() ?? null,
      endsAt: c.endsAt?.toISOString() ?? null,

      accent: c.accent,
      showCountdown: c.showCountdown,
      dismissible: c.dismissible,
      trigger: c.trigger,
      triggerValue: c.triggerValue,
      frequency: c.frequency,

      maxImpressions: c.maxImpressions,
      dailyCap: c.dailyCap,

      targetCities: c.targetCities,
      targetTypes: c.targetTypes,
      targetBlogCategories: c.targetBlogCategories,
      targetTags: c.targetTags,
      targetListingType: c.targetListingType,
      targetDevice: c.targetDevice,
      targetAudience: c.targetAudience,

      impressions: c.impressions,
      clicks: c.clicks,
      ctr: c.impressions > 0 ? c.clicks / c.impressions : 0,

      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    };
  }

  /** What the admin actually sees: draft | paused | scheduled | expired | live | capped */
  private derivedState(c: CampaignWithProperty): string {
    if (c.status === AdStatus.DRAFT) return 'draft';
    if (c.status === AdStatus.PAUSED) return 'paused';
    const now = Date.now();
    if (c.startsAt && c.startsAt.getTime() > now) return 'scheduled';
    if (c.endsAt && c.endsAt.getTime() < now) return 'expired';
    if (c.maxImpressions != null && c.impressions >= c.maxImpressions) return 'capped';
    return 'live';
  }
}

const SLOT_LABELS: Record<string, string> = {
  home_after_featured: 'Home — below Featured Residences',
  properties_infeed: 'Properties — in the results grid',
  properties_bottom_strip: 'Properties — below the results',
  detail_sidebar: 'Property detail — below enquiry card',
  detail_inline: 'Property detail — after the amenities',
  blog_list_top: 'Blog — above the article grid',
  blog_list_infeed: 'Blog — inside the article grid',
  blog_list_sidebar: 'Blog — index sidebar',
  blog_post_inline: 'Article — between paragraphs',
  blog_post_sidebar: 'Article — sticky sidebar',
  blog_post_bottom: 'Article — below the story',
  global_floating: 'Every page — floating corner card',
  global_modal: 'Every page — centre modal',
};

/** Grouping for the admin picker, so interrupting slots read as a set. */
const SLOT_GROUPS: Record<string, string> = {
  home_after_featured: 'In-page',
  properties_infeed: 'In-page',
  properties_bottom_strip: 'In-page',
  detail_sidebar: 'In-page',
  detail_inline: 'In-page',
  blog_list_top: 'Blog',
  blog_list_infeed: 'Blog',
  blog_list_sidebar: 'Blog',
  blog_post_inline: 'Blog',
  blog_post_sidebar: 'Blog',
  blog_post_bottom: 'Blog',
  global_floating: 'Attention-grabbing',
  global_modal: 'Attention-grabbing',
};
