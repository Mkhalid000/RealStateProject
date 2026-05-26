import {
  NotificationType,
  PropertyStatus,
  PropertyType,
  SubscriptionPlan,
  UserRole,
} from './enums';

export interface PublicProfile {
  id: string;
  role: UserRole;
  fullName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  phone: string | null;
  socialLinks: Record<string, string> | null;
  isVerified: boolean;
  followerCount?: number;
  createdAt: string;
}

export interface Property {
  id: string;
  agentId: string;
  agent?: PublicProfile;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  locationText: string | null;
  latitude: number | null;
  longitude: number | null;
  type: PropertyType;
  bedrooms: number | null;
  bathrooms: number | null;
  areaSqft: number | null;
  amenities: string[];
  imageUrls: string[];
  status: PropertyStatus;
  createdAt: string;
}

export interface Reel {
  id: string;
  agentId: string;
  agent?: PublicProfile;
  videoUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
  propertyId: string | null;
  property?: Property | null;
  isBoosted: boolean;
  boostExpiresAt: string | null;
  likeCount: number;
  commentCount: number;
  likedByMe?: boolean;
  createdAt: string;
}

export interface Comment {
  id: string;
  reelId: string;
  userId: string;
  user?: PublicProfile;
  text: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  agentId: string;
  user?: PublicProfile;
  agent?: PublicProfile;
  lastMessage: string | null;
  lastMessageAt: string | null;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

export interface Boost {
  id: string;
  reelId: string;
  agentId: string;
  amount: number;
  days: number;
  status: 'pending' | 'active' | 'expired';
  startsAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface Subscription {
  id: string;
  agentId: string;
  plan: SubscriptionPlan;
  status: 'active' | 'cancelled' | 'expired';
  currentPeriodEnd: string | null;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: PublicProfile;
  tokens: AuthTokens;
}
