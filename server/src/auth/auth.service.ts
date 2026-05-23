import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {JwtService} from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import {AuthResponse, AuthTokens, PublicProfile, UserRole} from '@realreels/shared';
import {PrismaService} from '../prisma/prisma.service';
import {LoginDto, RegisterDto} from './dto/auth.dto';
import {toPublicProfile} from '../profiles/profile.mapper';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await this.prisma.user.findUnique({where: {email: dto.email}});
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const role = dto.role === UserRole.AGENT ? UserRole.AGENT : UserRole.USER;
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        role: role as any,
      },
    });
    // Every agent starts on the free plan.
    if (role === UserRole.AGENT) {
      await this.prisma.subscription.create({data: {agentId: user.id}});
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

  async me(userId: string): Promise<PublicProfile> {
    const user = await this.prisma.user.findUniqueOrThrow({where: {id: userId}});
    return toPublicProfile(user);
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
    return {user: profile, tokens};
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
