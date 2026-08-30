export enum UserRole {
  USER = 'user',
  AGENT = 'agent',
  ADMIN = 'admin',
}

export enum PropertyType {
  APARTMENT = 'apartment',
  VILLA = 'villa',
  PLOT = 'plot',
  COMMERCIAL = 'commercial',
  OFFICE = 'office',
  SHOP = 'shop',
}

export enum ListingType {
  BUY = 'buy',
  RENT = 'rent',
}

export enum Furnishing {
  UNFURNISHED = 'unfurnished',
  SEMI_FURNISHED = 'semi_furnished',
  FURNISHED = 'furnished',
}

export enum Facing {
  NORTH = 'north',
  SOUTH = 'south',
  EAST = 'east',
  WEST = 'west',
  NORTH_EAST = 'north_east',
  NORTH_WEST = 'north_west',
  SOUTH_EAST = 'south_east',
  SOUTH_WEST = 'south_west',
}

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

export enum PropertyStatus {
  ACTIVE = 'active',
  SOLD = 'sold',
  RENTED = 'rented',
  DRAFT = 'draft',
}

export enum NotificationType {
  LIKE = 'like',
  COMMENT = 'comment',
  MESSAGE = 'message',
  FOLLOW = 'follow',
  NEW_REEL = 'new_reel',
  PROPERTY_STATUS = 'property_status',
  NEW_PROPERTY = 'new_property',
  SAVED_SEARCH_MATCH = 'saved_search_match',
}

export enum AdKind {
  HOUSE = 'house',
  SPONSORED = 'sponsored',
}

export enum AdStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
}

export enum BlogStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

/** Every placement an ad can be booked into. Keys are stored on the campaign. */
export const AD_SLOTS = [
  'home_after_featured',
  'properties_infeed',
  'properties_bottom_strip',
  'detail_sidebar',
  'detail_inline',
  'blog_list_top',
  'blog_list_infeed',
  'blog_list_sidebar',
  'blog_post_inline',
  'blog_post_sidebar',
  'blog_post_bottom',
  'global_floating',
  'global_modal',
] as const;

export type AdSlotKey = (typeof AD_SLOTS)[number];

/** Slots that interrupt the viewer, so they obey trigger + frequency rules. */
export const INTERRUPTING_SLOTS: readonly string[] = ['global_modal', 'global_floating'];

export enum AdTrigger {
  IMMEDIATE = 'immediate',
  DELAY = 'delay',
  SCROLL = 'scroll',
  EXIT_INTENT = 'exit_intent',
}

export enum AdFrequency {
  ALWAYS = 'always',
  SESSION = 'session',
  DAILY = 'daily',
}

export enum SubscriptionPlan {
  FREE = 'free',
  PRO = 'pro',
  PREMIUM = 'premium',
}
