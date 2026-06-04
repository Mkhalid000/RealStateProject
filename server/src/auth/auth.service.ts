import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {JwtService} from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import {AuthResponse, AuthTokens, PublicProfile, UserRole, VerificationStatus} from '../shared';
import {PrismaService} from '../prisma/prisma.service';
import {LoginDto, RegisterDto} from './dto/auth.dto';
import {toPublicProfile} from '../profiles/profile.mapper';

export interface PendingVerification {
  pendingVerification: true;
  message: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse | PendingVerification> {
    const existing = await this.prisma.user.findUnique({where: {email: dto.email}});
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const role = dto.role === UserRole.AGENT ? UserRole.AGENT : UserRole.USER;
    const isAgent = role === UserRole.AGENT;
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        role: role as any,
        phone: dto.phone ?? null,
        // Agents need admin approval; buyers are usable immediately.
        isVerified: !isAgent,
        verificationStatus: (isAgent
          ? VerificationStatus.PENDING
          : VerificationStatus.VERIFIED) as any,
        socialLinks: dto.agencyName ? {agency: dto.agencyName} : undefined,
      },
    });
    // Every agent starts on the free plan.
    if (isAgent) {
      await this.prisma.subscription.create({data: {agentId: user.id}});
      // Self-registered agents are NOT logged in — they must be verified first.
      return {
        pendingVerification: true,
        message:
          'Your agent account has been created and is pending admin verification. You will be able to sign in once an administrator approves it.',
      };
    }
    return this.buildAuthResponse(user.id, user.email, user.role, toPublicProfile(user));
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({where: {email: dto.email}});
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }
    // Block deactivated accounts
    if (user.isActive === false) {
      throw new ForbiddenException('Your account has been deactivated. Please contact support.');
    }
    // Agents must be verified by an admin before they can sign in.
    if (user.role === UserRole.AGENT && !user.isVerified) {
      if (user.verificationStatus === (VerificationStatus.REJECTED as any)) {
        throw new ForbiddenException(
          'Your agent application was not approved. Please contact support for more information.',
        );
      }
      throw new ForbiddenException(
        'Your agent account is pending admin verification. You will be able to sign in once an administrator approves it.',
      );
    }
    return this.buildAuthResponse(user.id, user.email, user.role, toPublicProfile(user));
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: {sub: string; email: string; role: string};
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Validate the token is still stored (not revoked) and rotate it.
    const stored = await this.prisma.refreshToken.findMany({where: {userId: payload.sub}});
    const match = await this.findMatching(stored, refreshToken);
    if (!match) {
      throw new UnauthorizedException('Refresh token revoked');
    }
    await this.prisma.refreshToken.delete({where: {id: match.id}});
    return this.issueTokens(payload.sub, payload.email, payload.role);
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      const stored = await this.prisma.refreshToken.findMany({where: {userId}});
      const match = await this.findMatching(stored, refreshToken);
      if (match) {
        await this.prisma.refreshToken.delete({where: {id: match.id}});
      }
    } else {
      await this.prisma.refreshToken.deleteMany({where: {userId}});
    }
  }

  async me(userId: string): Promise<PublicProfile & {email: string}> {
    const user = await this.prisma.user.findUniqueOrThrow({where: {id: userId}});
    return {...toPublicProfile(user), email: user.email};
  }

  // ---------- helpers ----------
  private async findMatching(
    stored: {id: string; tokenHash: string}[],
    token: string,
  ) {
    for (const row of stored) {
      if (await bcrypt.compare(token, row.tokenHash)) {
        return row;
      }
    }
    return null;
  }

  private async buildAuthResponse(
    id: string,
    email: string,
    role: string,
    profile: PublicProfile,
  ): Promise<AuthResponse> {
    const tokens = await this.issueTokens(id, email, role);
    return {user: {...profile, email}, tokens};
  }

  private async issueTokens(
    sub: string,
    email: string,
    role: string,
  ): Promise<AuthTokens> {
    const payload = {sub, email, role};
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_TTL') ?? '15m',
    });
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get<string>('JWT_REFRESH_TTL') ?? '30d',
    });

    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await this.prisma.refreshToken.create({data: {userId: sub, tokenHash, expiresAt}});

    return {accessToken, refreshToken};
  }
}
