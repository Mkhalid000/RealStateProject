import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {Prisma} from '@prisma/client';
import {SubscriptionPlan} from '@realreels/shared';
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

  async create(agentId: string, dto: CreatePropertyDto) {
    await this.enforcePlanLimit(agentId);
    const property = await this.prisma.property.create({
      data: {
        agentId,
        title: dto.title,
        description: dto.description,
        price: new Prisma.Decimal(dto.price),
        currency: dto.currency ?? 'USD',
        locationText: dto.locationText,
        latitude: dto.latitude,
        longitude: dto.longitude,
        type: dto.type as any,
        bedrooms: dto.bedrooms,
        bathrooms: dto.bathrooms,
        areaSqft: dto.areaSqft,
        amenities: dto.amenities ?? [],
        imageUrls: dto.imageUrls ?? [],
        status: (dto.status as any) ?? 'active',
      },
      include: {agent: true},
    });
    return toProperty(property);
  }

  async list(query: QueryPropertiesDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);
    const where: Prisma.PropertyWhereInput = {status: 'active'};

    if (query.type) {
      where.type = query.type as any;
    }
    if (query.agentId) {
      where.agentId = query.agentId;
    }
    if (query.minPrice != null || query.maxPrice != null) {
      where.price = {};
      if (query.minPrice != null) {
        (where.price as Prisma.DecimalFilter).gte = query.minPrice;
      }
      if (query.maxPrice != null) {
        (where.price as Prisma.DecimalFilter).lte = query.maxPrice;
      }
    }
    if (query.q) {
      where.OR = [
        {title: {contains: query.q, mode: 'insensitive'}},
        {locationText: {contains: query.q, mode: 'insensitive'}},
        {description: {contains: query.q, mode: 'insensitive'}},
      ];
    }

    const [rows, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        include: {agent: true},
        orderBy: {createdAt: 'desc'},
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

  async getOne(id: string) {
    const property = await this.prisma.property.findUnique({
      where: {id},
      include: {agent: true},
    });
    if (!property) {
      throw new NotFoundException('Property not found');
    }
    return toProperty(property);
  }

  async update(agentId: string, id: string, dto: UpdatePropertyDto) {
    await this.assertOwner(agentId, id);
    const property = await this.prisma.property.update({
      where: {id},
      data: {
        title: dto.title,
        description: dto.description,
        price: dto.price != null ? new Prisma.Decimal(dto.price) : undefined,
        currency: dto.currency,
        locationText: dto.locationText,
        latitude: dto.latitude,
        longitude: dto.longitude,
        type: dto.type as any,
        bedrooms: dto.bedrooms,
        bathrooms: dto.bathrooms,
        areaSqft: dto.areaSqft,
        amenities: dto.amenities,
        imageUrls: dto.imageUrls,
        status: dto.status as any,
      },
      include: {agent: true},
    });
    return toProperty(property);
  }

  async remove(agentId: string, id: string) {
    await this.assertOwner(agentId, id);
    await this.prisma.property.delete({where: {id}});
    return {success: true};
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
  private async assertOwner(agentId: string, id: string) {
    const property = await this.prisma.property.findUnique({where: {id}});
    if (!property) {
      throw new NotFoundException('Property not found');
    }
    if (property.agentId !== agentId) {
      throw new ForbiddenException('Not your property');
    }
  }

  private async enforcePlanLimit(agentId: string) {
    const sub = await this.prisma.subscription.findUnique({where: {agentId}});
    const plan = (sub?.plan as unknown as SubscriptionPlan) ?? SubscriptionPlan.FREE;
    if (plan !== SubscriptionPlan.FREE) {
      return; // pro / premium = unlimited
    }
    const count = await this.prisma.property.count({where: {agentId}});
    if (count >= FREE_PLAN_PROPERTY_LIMIT) {
      throw new ForbiddenException(
        `Free plan limit reached (${FREE_PLAN_PROPERTY_LIMIT} listings). Upgrade to add more.`,
      );
    }
  }
}
