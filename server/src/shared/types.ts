import {
  BlogStatus,
  Facing,
  Furnishing,
  ListingType,
  NotificationType,
  PropertyStatus,
  PropertyType,
  SubscriptionPlan,
  UserRole,
  VerificationStatus,
} from './enums';

export interface PublicProfile {
  id: string;
  role: UserRole;
  fullName: string | null;
  email?: string | null;
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

  // basic
  title: string;
  slug: string;
  type: PropertyType;
  listingType: ListingType;
  description: string | null;
  price: number;
  currency: string;
  priceNegotiable: boolean;
  featured: boolean;

  // location
  country: string | null;
  state: string | null;
  city: string | null;
  locality: string | null;
  address: string | null;
  landmark: string | null;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  locationText: string | null;

  // specifications
  bhk: number | null;
  bathrooms: number | null;
  balconies: number | null;
  superBuiltUpArea: number | null;
  carpetArea: number | null;
  plotArea: number | null;
  floorNumber: number | null;
  totalFloors: number | null;
  propertyAge: string | null;
  furnishing: Furnishing | null;
  facing: Facing | null;

  amenities: string[];

  // media
  imageUrls: string[];
  videoUrl: string | null;
  virtualTourUrl: string | null;
  modelUrl: string | null;
  brochureUrl: string | null;

  // owner / agent
  ownerName: string | null;
  ownerPhone: string | null;
  ownerWhatsapp: string | null;
  ownerEmail: string | null;
  agencyName: string | null;

  // meta
  status: PropertyStatus;
  isVerified: boolean;
  verificationStatus: VerificationStatus;
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
  viewCount: number;
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
  user: PublicProfile & {email: string};
  tokens: AuthTokens;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  position: number;
  postCount?: number;
}

export interface BlogPost {
  id: string;
  authorId: string;
  author?: PublicProfile;

  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImageUrl: string | null;
  imageUrls: string[];
  videoUrl: string | null;
  readingMinutes: number;

  categoryId: string | null;
  category?: BlogCategory | null;
  tags: string[];
  guestAuthorName: string | null;
  guestAuthorAvatar: string | null;

  status: BlogStatus;
  publishedAt: string | null;
  scheduledFor: string | null;
  featured: boolean;
  pinned: boolean;
  isVerified: boolean;
  verificationStatus: VerificationStatus;

  metaTitle: string | null;
  metaDescription: string | null;
  ogImageUrl: string | null;
  canonicalUrl: string | null;
  noIndex: boolean;

  country: string | null;
  state: string | null;
  city: string | null;
  locality: string | null;
  propertyTypes: string[];

  isSponsored: boolean;
  sponsorName: string | null;
  sponsorLogoUrl: string | null;
  sponsorUrl: string | null;
  sponsorDisclosure: string | null;
  adsEnabled: boolean;
  inlineAdAfterParagraph: number;
  maxInlineAds: number;
  ctaLabel: string | null;
  ctaUrl: string | null;
  isPromoted: boolean;
  promotedUntil: string | null;

  allowComments: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  likedByMe?: boolean;

  relatedProperties?: Property[];

  createdAt: string;
  updatedAt: string;
}

export interface BlogComment {
  id: string;
  postId: string;
  userId: string;
  user?: PublicProfile;
  text: string;
  parentId: string | null;
  isApproved: boolean;
  replies?: BlogComment[];
  createdAt: string;
}

export interface BlogDailyStat {
  date: string;
  views: number;
  reads: number;
  likes: number;
  shares: number;
}
