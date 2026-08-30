import {ForbiddenException, Injectable, NotFoundException} from '@nestjs/common';
import {Property} from '@prisma/client';
import {NotificationType} from '../shared';
import {PrismaService} from '../prisma/prisma.service';
import {NotificationsService} from '../notifications/notifications.service';
import {CreateSavedSearchDto, UpdateSavedSearchDto} from './dto/search.dto';

/** Cap per user — saved searches drive alerts, so this doubles as a spam limit. */
const MAX_PER_USER = 20;

const norm = (v?: string | null) => (v ?? '').trim().toLowerCase();
const csv = (v?: string | null) =>
  (v ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

@Injectable()
export class SearchesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async list(userId: string) {
    const items = await this.prisma.savedSearch.findMany({
      where: {userId},
      orderBy: {createdAt: 'desc'},
    });
    return {items: items.map(s => ({...s, summary: describe(s.query)}))};
  }

  async create(userId: string, dto: CreateSavedSearchDto) {
    const query = cleanQuery(dto.query);

    // Re-saving the same filters updates the existing row instead of piling up.
    const existing = await this.prisma.savedSearch.findFirst({where: {userId, query}});
    if (existing) {
      const updated = await this.prisma.savedSearch.update({
        where: {id: existing.id},
        data: {name: dto.name, alertsEnabled: dto.alertsEnabled ?? existing.alertsEnabled},
      });
      return {...updated, summary: describe(updated.query)};
    }

    const count = await this.prisma.savedSearch.count({where: {userId}});
    if (count >= MAX_PER_USER) {
      throw new ForbiddenException(
        `You can keep up to ${MAX_PER_USER} saved searches — delete one to add another.`,
      );
    }

    const saved = await this.prisma.savedSearch.create({
      data: {userId, name: dto.name, query, alertsEnabled: dto.alertsEnabled ?? true},
    });
    return {...saved, summary: describe(saved.query)};
  }

  async update(userId: string, id: string, dto: UpdateSavedSearchDto) {
    await this.assertOwner(userId, id);
    const saved = await this.prisma.savedSearch.update({
      where: {id},
      data: {
        ...(dto.name !== undefined ? {name: dto.name} : {}),
        ...(dto.query !== undefined ? {query: cleanQuery(dto.query)} : {}),
        ...(dto.alertsEnabled !== undefined ? {alertsEnabled: dto.alertsEnabled} : {}),
      },
    });
    return {...saved, summary: describe(saved.query)};
  }

  async remove(userId: string, id: string) {
    await this.assertOwner(userId, id);
    await this.prisma.savedSearch.delete({where: {id}});
    return {success: true};
  }

  /**
   * Called when a listing goes live. Every alerting saved search is matched in
   * memory — the set is small, and re-running each one as SQL would mean one
   * query per search for a single new listing.
   */
  async notifyMatches(property: Property) {
    const searches = await this.prisma.savedSearch.findMany({
      where: {alertsEnabled: true, userId: {not: property.agentId}},
    });
    if (!searches.length) return;

    const hits = searches.filter(s => matches(new URLSearchParams(s.query), property));
    if (!hits.length) return;

    await this.prisma.savedSearch.updateMany({
      where: {id: {in: hits.map(h => h.id)}},
      data: {lastAlertAt: new Date(), matchCount: {increment: 1}},
    });

    await Promise.all(
      hits.map(h =>
        this.notifications
          .notify(h.userId, NotificationType.SAVED_SEARCH_MATCH, {
            propertyId: property.id,
            title: property.title,
            searchId: h.id,
            searchName: h.name,
          })
          .catch(() => null),
      ),
    );
  }

  private async assertOwner(userId: string, id: string) {
    const saved = await this.prisma.savedSearch.findUnique({where: {id}});
    if (!saved) throw new NotFoundException('Saved search not found');
    if (saved.userId !== userId) throw new ForbiddenException('Not your saved search');
    return saved;
  }
}

/** Drop paging/view keys and sort, so two identical filter sets compare equal. */
function cleanQuery(query: string): string {
  const sp = new URLSearchParams(query.replace(/^\?/, ''));
  ['page', 'limit', 'view', 'sort'].forEach(k => sp.delete(k));
  const entries = [...sp.entries()].filter(([, v]) => v.trim() !== '');
  entries.sort(([a], [b]) => a.localeCompare(b));
  return new URLSearchParams(entries).toString();
}

/**
 * Does this listing satisfy the saved filters? Mirrors the subset of
 * PropertiesService.filters() that a new-listing alert can meaningfully use,
 * and accepts both the API's names (maxPrice) and the URL's (max).
 */
function matches(sp: URLSearchParams, p: Property): boolean {
  const val = (...keys: string[]) => {
    for (const k of keys) {
      const v = sp.get(k);
      if (v !== null && v.trim() !== '') return v;
    }
    return null;
  };

  const city = val('city');
  if (city && !norm(p.city).includes(norm(city))) return false;
  const state = val('state');
  if (state && !norm(p.state).includes(norm(state))) return false;
  const locality = val('locality');
  if (locality && !norm(p.locality).includes(norm(locality))) return false;
  const pincode = val('pincode');
  if (pincode && !norm(p.pincode).includes(norm(pincode))) return false;

  const types = csv(val('type'));
  if (types.length && !types.some(t => norm(t) === norm(p.type))) return false;

  const listing = val('listingType', 'listing');
  if (listing && norm(listing) !== norm(p.listingType)) return false;

  const price = Number(p.price);
  const min = Number(val('minPrice', 'min'));
  const max = Number(val('maxPrice', 'max'));
  if (val('minPrice', 'min') && Number.isFinite(min) && price < min) return false;
  if (val('maxPrice', 'max') && Number.isFinite(max) && price > max) return false;

  const bhks = csv(val('bhk')).map(Number).filter(n => Number.isFinite(n));
  if (bhks.length) {
    if (p.bhk == null) return false;
    // 5 means "5 or more", exactly as the listings page treats it
    const ok = bhks.some(n => (n >= 5 ? (p.bhk as number) >= 5 : p.bhk === n));
    if (!ok) return false;
  }

  const baths = Number(val('minBathrooms', 'baths'));
  if (Number.isFinite(baths) && baths > 0 && (p.bathrooms ?? 0) < baths) return false;

  const area = p.carpetArea ?? p.superBuiltUpArea ?? p.plotArea ?? null;
  const minArea = Number(val('minArea'));
  const maxArea = Number(val('maxArea'));
  if (Number.isFinite(minArea) && minArea > 0 && (area ?? 0) < minArea) return false;
  if (Number.isFinite(maxArea) && maxArea > 0 && area != null && area > maxArea) return false;

  const furnishing = csv(val('furnishing'));
  if (furnishing.length && !furnishing.some(f => norm(f) === norm(p.furnishing))) return false;

  const amenities = csv(val('amenities'));
  if (amenities.length) {
    const have = p.amenities.map(norm);
    if (!amenities.every(a => have.includes(norm(a)))) return false;
  }

  if (sp.get('featured') === 'true' && !p.featured) return false;
  if (sp.get('negotiable') === 'true' && !p.priceNegotiable) return false;

  // A free-text term still has to appear somewhere sensible.
  const q = norm(val('q'));
  if (q) {
    const haystack = [p.title, p.city, p.locality, p.address, p.locationText]
      .map(norm)
      .join(' ');
    if (!haystack.includes(q)) return false;
  }

  return true;
}

/** Short human summary shown on the saved-search card. */
function describe(query: string): string {
  const sp = new URLSearchParams(query);
  const bits: string[] = [];

  const bhk = sp.get('bhk');
  if (bhk) bits.push(`${bhk.split(',').join('/')} BHK`);

  const type = sp.get('type');
  if (type) bits.push(type.split(',').join(' / '));

  const listing = sp.get('listing') || sp.get('listingType');
  if (listing) bits.push(listing === 'rent' ? 'for rent' : 'for sale');

  const where = sp.get('locality') || sp.get('city');
  if (where) bits.push(`in ${where}`);

  const max = sp.get('max') || sp.get('maxPrice');
  const min = sp.get('min') || sp.get('minPrice');
  if (max) bits.push(`under ${compact(Number(max))}`);
  else if (min) bits.push(`over ${compact(Number(min))}`);

  const q = sp.get('q');
  if (q) bits.push(`"${q}"`);

  return bits.length ? bits.join(' · ') : 'All properties';
}

function compact(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '';
  if (n >= 10000000) return `${(n / 10000000).toFixed(n % 10000000 ? 1 : 0)}Cr`;
  if (n >= 100000) return `${(n / 100000).toFixed(n % 100000 ? 1 : 0)}L`;
  if (n >= 1000) return `${Math.round(n / 1000)}K`;
  return String(n);
}
