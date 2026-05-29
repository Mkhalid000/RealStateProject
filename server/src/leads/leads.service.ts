import {Injectable} from '@nestjs/common';
import {Prisma} from '@prisma/client';
import {PrismaService} from '../prisma/prisma.service';
import {CreateLeadDto} from './dto/lead.dto';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateLeadDto) {
    return this.prisma.lead.create({
      data: {
        name: dto.name,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        message: dto.message ?? null,
        source: dto.source === 'mobile' ? 'mobile' : 'website',
        propertyId: dto.propertyId || null,
      },
    });
  }

  async list(opts: {source?: string; status?: string; page?: number; limit?: number}) {
    const page = Math.max(Number(opts.page) || 1, 1);
    const limit = Math.min(Math.max(Number(opts.limit) || 10, 1), 100);
    const where: Prisma.LeadWhereInput = {};
    if (opts.source) where.source = opts.source;
    if (opts.status && opts.status !== 'all') where.status = opts.status;

    const [items, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        orderBy: {createdAt: 'desc'},
        skip: (page - 1) * limit,
        take: limit,
        include: {property: {select: {id: true, title: true, city: true, imageUrls: true}}},
      }),
      this.prisma.lead.count({where}),
    ]);
    return {items, total, page, limit, hasMore: page * limit < total};
  }

  async counts() {
    const [website, mobile] = await Promise.all([
      this.prisma.lead.count({where: {source: 'website'}}),
      this.prisma.lead.count({where: {source: 'mobile'}}),
    ]);
    return {website, mobile};
  }

  setStatus(id: string, status: string) {
    return this.prisma.lead.update({where: {id}, data: {status}});
  }

  async remove(id: string) {
    await this.prisma.lead.delete({where: {id}}).catch(() => null);
    return {success: true};
  }
}
