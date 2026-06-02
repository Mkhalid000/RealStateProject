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
}

export enum SubscriptionPlan {
  FREE = 'free',
  PRO = 'pro',
  PREMIUM = 'premium',
}
