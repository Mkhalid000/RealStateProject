import {ConflictException, Injectable} from '@nestjs/common';
import {Prisma} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import {UserRole, VerificationStatus} from '../shared';
import {PrismaService} from '../prisma/prisma.service';
import {CreateAgentDto} from '../auth/dto/auth.dto';

const USER_SELECT = {
  id: true,
  email: true,
  role: true,
  fullName: true,
  phone: true,
  avatarUrl: true,
  isVerified: true,
  verificationStatus: true,
  isActive: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

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

  async listUsers(opts: {
    role?: UserRole;
    q?: string;
    verified?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(Number(opts.page) || 1, 1);
    const limit = Math.min(Math.max(Number(opts.limit) || 10, 1), 100);
    const where: Prisma.UserWhereInput = {};
    if (opts.role) {
      where.role = opts.role as any;
    }
    if (opts.verified === 'true' || opts.verified === 'verified') {
      where.isVerified = true;
    } else if (opts.verified === 'false' || opts.verified === 'unverified') {
      where.isVerified = false;
    }
    if (opts.q) {
      where.OR = [
        {email: {contains: opts.q, mode: 'insensitive'}},
        {fullName: {contains: opts.q, mode: 'insensitive'}},
      ];
    }
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: {createdAt: 'desc'},
        skip: (page - 1) * limit,
        take: limit,
        select: USER_SELECT,
      }),
      this.prisma.user.count({where}),
    ]);
    return {items, total, page, limit, hasMore: page * limit < total};
  }

  async createAgent(dto: CreateAgentDto) {
    const existing = await this.prisma.user.findUnique({where: {email: dto.email}});
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        role: UserRole.AGENT as any,
        phone: dto.phone ?? null,
        bio: dto.bio ?? null,
        // Admin-created agents are trusted and verified immediately.
        isVerified: true,
        verificationStatus: VerificationStatus.VERIFIED as any,
        socialLinks: dto.agencyName ? {agency: dto.agencyName} : undefined,
      },
      select: USER_SELECT,
    });
    await this.prisma.subscription.create({data: {agentId: user.id}});
    return user;
  }

  // Admin approve / reject an agent (or reset to pending).
  setVerification(userId: string, status: VerificationStatus) {
    return this.prisma.user.update({
      where: {id: userId},
      data: {
        verificationStatus: status as any,
        isVerified: status === VerificationStatus.VERIFIED,
      },
      select: USER_SELECT,
    });
  }

  setRole(userId: string, role: UserRole) {
    return this.prisma.user.update({
      where: {id: userId},
      data: {role: role as any},
      select: {id: true, role: true},
    });
  }

  async deleteUser(id: string) {
    await this.prisma.user.delete({where: {id}}).catch(() => null);
    return {success: true};
  }

  async toggleUserActive(id: string, isActive: boolean) {
    return this.prisma.user.update({
      where: {id},
      data: {isActive},
      select: USER_SELECT,
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
