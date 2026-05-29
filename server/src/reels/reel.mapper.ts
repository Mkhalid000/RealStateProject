import {Reel as SharedReel} from '../shared';
import {Reel, User, Property} from '@prisma/client';
import {toPublicProfile} from '../profiles/profile.mapper';
import {toProperty} from '../properties/property.mapper';

type ReelWithRelations = Reel & {
  agent?: User;
  property?: (Property & {agent?: User}) | null;
  likes?: {userId: string}[];
};

export function toReel(r: ReelWithRelations, viewerId?: string): SharedReel {
  return {
    id: r.id,
    agentId: r.agentId,
    agent: r.agent ? toPublicProfile(r.agent) : undefined,
    videoUrl: r.videoUrl,
    thumbnailUrl: r.thumbnailUrl,
    caption: r.caption,
    propertyId: r.propertyId,
    property: r.property ? toProperty(r.property) : null,
    isBoosted: r.isBoosted,
    boostExpiresAt: r.boostExpiresAt ? r.boostExpiresAt.toISOString() : null,
    viewCount: r.viewCount,
    likeCount: r.likeCount,
    commentCount: r.commentCount,
    likedByMe: viewerId ? !!r.likes?.some(l => l.userId === viewerId) : undefined,
    createdAt: r.createdAt.toISOString(),
  };
}
