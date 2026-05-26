import {Injectable} from '@nestjs/common';
import {Prisma} from '@prisma/client';
import {UserRole} from '../shared';
import {PrismaService} from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async stats() {
    const [users, agents, properties, reels, activeBoosts, boostAgg] =
      await Promise.all([
        this.prisma.user.count({where: {role: 'user'}}),
        this.prisma.user.count({where: {role: 'agent'}}),
        this.prisma.property.count(),
        this.prisma.reel.count(),
        this.prisma.boost.count({where: {status: 'active'}}),
        this.prisma.boost.aggregate({_sum: {amount: true}}),
      ]);
    return {
      users,
      agents,
      properties,
      reels,
      activeBoosts,
      boostRevenue: Number(boostAgg._sum.amount ?? 0),
    };
  }

  listUsers(role?: UserRole, q?: string) {
    const where: Prisma.UserWhereInput = {};
    if (role) {
      where.role = role as any;
    }
    if (q) {
      where.OR = [
        {email: {contains: q, mode: 'insensitive'}},
        {fullName: {contains: q, mode: 'insensitive'}},
      ];
    }
    return this.prisma.user.findMany({
      where,
      orderBy: {createdAt: 'desc'},
      take: 100,
      select: {
        id: true,
        email: true,
        role: true,
        fullName: true,
        isVerified: true,
        createdAt: true,
      },
    });
  }

  setVerified(userId: string, isVerified: boolean) {
    return this.prisma.user.update({
      where: {id: userId},
      data: {isVerified},
      select: {id: true, isVerified: true},
    });
  }

  setRole(userId: string, role: UserRole) {
    return this.prisma.user.update({
      where: {id: userId},
      data: {role: role as any},
      select: {id: true, role: true},
    });
  }

  async deleteReel(id: string) {
    await this.prisma.reel.delete({where: {id}}).catch(() => null);
    return {success: true};
  }

  async deleteProperty(id: string) {
    await this.prisma.property.delete({where: {id}}).catch(() => null);
    return {success: true};
  }

  listBoosts() {
    return this.prisma.boost.findMany({
      orderBy: {createdAt: 'desc'},
      take: 200,
      include: {agent: {select: {email: true, fullName: true}}},
    });
  }
}
