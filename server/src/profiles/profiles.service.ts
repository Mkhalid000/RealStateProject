import {Injectable, NotFoundException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {UpdateProfileDto} from './dto/update-profile.dto';
import {toPublicProfile} from './profile.mapper';

@Injectable()
export class ProfilesService {
  constructor(private prisma: PrismaService) {}

  async getById(id: string, viewerId?: string) {
    const user = await this.prisma.user.findUnique({where: {id}});
    if (!user) {
      throw new NotFoundException('Profile not found');
    }
    const followerCount = await this.prisma.follow.count({where: {agentId: id}});
    const profile = toPublicProfile(user, {followerCount});

    let isFollowing = false;
    if (viewerId) {
      const f = await this.prisma.follow.findUnique({
        where: {followerId_agentId: {followerId: viewerId, agentId: id}},
      });
      isFollowing = !!f;
    }
    return {...profile, isFollowing};
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({where: {id: userId}});
    return {...toPublicProfile(user), email: user.email};
  }

  async updateMe(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: {id: userId},
      data: {
        fullName: dto.fullName,
        bio: dto.bio,
        avatarUrl: dto.avatarUrl,
        phone: dto.phone,
        socialLinks: dto.socialLinks,
      },
    });
    return toPublicProfile(user);
  }
}
