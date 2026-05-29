import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {Prisma} from '@prisma/client';
import {SubscriptionPlan, UserRole, VerificationStatus} from '../shared';
import {PrismaService} from '../prisma/prisma.service';
import {
  CreatePropertyDto,
  QueryPropertiesDto,
  UpdatePropertyDto,
} from './dto/property.dto';
import {toProperty} from './property.mapper';

const FREE_PLAN_PROPERTY_LIMIT = 5;

@Injectable()
export class PropertiesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, role: string, dto: CreatePropertyDto) {
    if (role !== UserRole.ADMIN) {
      await this.enforcePlanLimit(userId);
    }
    // Admin-created listings are auto-verified and go live immediately.
    // Everyone else (agent/vendor/user) starts as pending for admin review.
    const isAdmin = role === UserRole.ADMIN;
    const slug = await this.uniqueSlug(dto.slug || dto.title);

    const property = await this.prisma.property.create({
      data: {
        ...this.mapData(dto),
        agentId: userId,
        slug,
        isVerified: isAdmin,
        verificationStatus: (isAdmin
          ? VerificationStatus.VERIFIED
          : VerificationStatus.PENDING) as any,
      },
      include: {agent: true},
    });
    return toProperty(property);
  }

  /** Public listing — only verified + active properties. */
  async list(query: QueryPropertiesDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);
    const where: Prisma.PropertyWhereInput = {
      isVerified: true,
      status: 'active',
      ...this.filters(query),
    };
    return this.paginate(where, page, limit, this.orderByFromSort(query.sort));
  }

  /** Admin listing — everything, optionally filtered by verification state. */
  async adminList(query: QueryPropertiesDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);
    const where: Prisma.PropertyWhereInput = {...this.filters(query)};
    if (query.verification && query.verification !== 'all') {
      where.verificationStatus = query.verification as any;
    }
    return this.paginate(where, page, limit, this.orderByFromSort(query.sort));
  }

  /** Agent listing — only the caller's own properties (any verification state). */
  async listMine(userId: string, query: QueryPropertiesDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);
    const where: Prisma.PropertyWhereInput = {
      ...this.filters(query),
      agentId: userId,
    };
    if (query.verification && query.verification !== 'all') {
      where.verificationStatus = query.verification as any;
    }
    return this.paginate(where, page, limit, this.orderByFromSort(query.sort));
  }

  async getOne(idOrSlug: string) {
    const property = await this.prisma.property.findFirst({
      where: {OR: [{id: idOrSlug}, {slug: idOrSlug}]},
      include: {agent: true},
    });
    if (!property) {
      throw new NotFoundException('Property not found');
    }
    return toProperty(property);
  }

  async update(userId: string, role: string, id: string, dto: UpdatePropertyDto) {
    const existing = await this.assertCanManage(userId, role, id);
    const data: Prisma.PropertyUpdateInput = this.mapData(dto);
    if (dto.slug && dto.slug !== existing.slug) {
      data.slug = await this.uniqueSlug(dto.slug);
    }
    const property = await this.prisma.property.update({
      where: {id},
      data,
      include: {agent: true},
    });
    return toProperty(property);
  }

  async remove(userId: string, role: string, id: string) {
    await this.assertCanManage(userId, role, id);
    await this.prisma.property.delete({where: {id}});
    return {success: true};
  }

  /** Admin: approve / reject a property. */
  async setVerification(id: string, status: VerificationStatus) {
    const property = await this.prisma.property.update({
      where: {id},
      data: {
        verificationStatus: status as any,
        isVerified: status === VerificationStatus.VERIFIED,
      },
      include: {agent: true},
    });
    return toProperty(property);
  }

  // ---------- saved ----------
  async save(userId: string, propertyId: string) {
    await this.prisma.savedProperty.upsert({
      where: {userId_propertyId: {userId, propertyId}},
      create: {userId, propertyId},
      update: {},
    });
    return {saved: true};
  }

  async unsave(userId: string, propertyId: string) {
    await this.prisma.savedProperty
      .delete({where: {userId_propertyId: {userId, propertyId}}})
      .catch(() => null);
    return {saved: false};
  }

  async listSaved(userId: string) {
    const rows = await this.prisma.savedProperty.findMany({
      where: {userId},
      include: {property: {include: {agent: true}}},
      orderBy: {createdAt: 'desc'},
    });
    return rows.map(r => toProperty(r.property));
  }

  // ---------- helpers ----------
  private filters(query: QueryPropertiesDto): Prisma.PropertyWhereInput {
    const where: Prisma.PropertyWhereInput = {};
    if (query.type) where.type = query.type as any;
    if (query.listingType) where.listingType = query.listingType as any;
    if (query.city) where.city = {contains: query.city, mode: 'insensitive'};
    if (query.agentId) where.agentId = query.agentId;
    if (query.agent) {
      where.agent = {
        OR: [
          {fullName: {contains: query.agent, mode: 'insensitive'}},
          {email: {contains: query.agent, mode: 'insensitive'}},
        ],
      };
    }
    if (query.bhk != null) where.bhk = query.bhk;
    if (query.minPrice != null || query.maxPrice != null) {
      where.price = {};
      if (query.minPrice != null) (where.price as Prisma.DecimalFilter).gte = query.minPrice;
      if (query.maxPrice != null) (where.price as Prisma.DecimalFilter).lte = query.maxPrice;
    }
    if (query.q) {
      where.OR = [
        {title: {contains: query.q, mode: 'insensitive'}},
        {locality: {contains: query.q, mode: 'insensitive'}},
        {city: {contains: query.q, mode: 'insensitive'}},
        {address: {contains: query.q, mode: 'insensitive'}},
        {locationText: {contains: query.q, mode: 'insensitive'}},
      ];
    }
    return where;
  }

  private orderByFromSort(
    sort?: string,
  ): Prisma.PropertyOrderByWithRelationInput[] {
    switch (sort) {
      case 'oldest':
        return [{createdAt: 'asc'}];
      case 'price_asc':
        return [{price: 'asc'}];
      case 'price_desc':
        return [{price: 'desc'}];
      case 'title_asc':
        return [{title: 'asc'}];
      case 'newest':
      default:
        return [{featured: 'desc'}, {createdAt: 'desc'}];
    }
  }

  private async paginate(
    where: Prisma.PropertyWhereInput,
    page: number,
    limit: number,
    orderBy: Prisma.PropertyOrderByWithRelationInput[] = [
      {featured: 'desc'},
      {createdAt: 'desc'},
    ],
  ) {
    const [rows, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        include: {agent: true},
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.property.count({where}),
    ]);
    return {
      items: rows.map(toProperty),
      page,
      limit,
      total,
      hasMore: page * limit < total,
    };
  }

  private mapData(dto: CreatePropertyDto): any {
    return {
      title: dto.title,
      type: dto.type as any,
      listingType: (dto.listingType ?? undefined) as any,
      description: dto.description,
      price: dto.price != null ? new Prisma.Decimal(dto.price) : undefined,
      currency: dto.currency,
      priceNegotiable: dto.priceNegotiable,
      featured: dto.featured,
      country: dto.country,
      state: dto.state,
      city: dto.city,
      locality: dto.locality,
      address: dto.address,
      landmark: dto.landmark,
      pincode: dto.pincode,
      latitude: dto.latitude,
      longitude: dto.longitude,
      locationText: dto.locationText,
      bhk: dto.bhk,
      bathrooms: dto.bathrooms,
      balconies: dto.balconies,
      superBuiltUpArea: dto.superBuiltUpArea,
      carpetArea: dto.carpetArea,
      plotArea: dto.plotArea,
      floorNumber: dto.floorNumber,
      totalFloors: dto.totalFloors,
      propertyAge: dto.propertyAge,
      furnishing: (dto.furnishing ?? undefined) as any,
      facing: (dto.facing ?? undefined) as any,
      amenities: dto.amenities,
      imageUrls: dto.imageUrls,
      videoUrl: dto.videoUrl,
      virtualTourUrl: dto.virtualTourUrl,
      modelUrl: dto.modelUrl,
      ownerName: dto.ownerName,
      ownerPhone: dto.ownerPhone,
      ownerWhatsapp: dto.ownerWhatsapp,
      ownerEmail: dto.ownerEmail,
      agencyName: dto.agencyName,
      status: (dto.status ?? undefined) as any,
    };
  }

  private async assertCanManage(userId: string, role: string, id: string) {
    const property = await this.prisma.property.findUnique({where: {id}});
    if (!property) {
      throw new NotFoundException('Property not found');
    }
    if (role !== UserRole.ADMIN && property.agentId !== userId) {
      throw new ForbiddenException('Not your property');
    }
    return property;
  }

  private async enforcePlanLimit(agentId: string) {
    const sub = await this.prisma.subscription.findUnique({where: {agentId}});
    const plan = (sub?.plan as unknown as SubscriptionPlan) ?? SubscriptionPlan.FREE;
    if (plan !== SubscriptionPlan.FREE) return;
    const count = await this.prisma.property.count({where: {agentId}});
    if (count >= FREE_PLAN_PROPERTY_LIMIT) {
      throw new ForbiddenException(
        `Free plan limit reached (${FREE_PLAN_PROPERTY_LIMIT} listings). Upgrade to add more.`,
      );
    }
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 70);
  }

  private async uniqueSlug(base: string): Promise<string> {
    const root = this.slugify(base) || 'property';
    let slug = root;
    let n = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const exists = await this.prisma.property.findUnique({where: {slug}});
      if (!exists) return slug;
      n += 1;
      slug = `${root}-${n}`;
      if (n > 50) return `${root}-${Date.now().toString(36)}`;
    }
  }
}
