import {PublicProfile, UserRole} from '../shared';
import {User} from '@prisma/client';

export function toPublicProfile(
  user: User,
  extra?: {followerCount?: number},
): PublicProfile {
  return {
    id: user.id,
    role: user.role as unknown as UserRole,
    fullName: user.fullName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    phone: user.phone,
    socialLinks: (user.socialLinks as Record<string, string> | null) ?? null,
    isVerified: user.isVerified,
    followerCount: extra?.followerCount,
    createdAt: user.createdAt.toISOString(),
  };
}
