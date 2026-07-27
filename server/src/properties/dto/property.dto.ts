import {Type} from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import {
  Facing,
  Furnishing,
  ListingType,
  PropertyStatus,
  PropertyType,
  VerificationStatus,
} from '../../shared';

export class CreatePropertyDto {
  // ---- Step 1: basic ----
  @IsString()
  @MaxLength(160)
  title: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsEnum(PropertyType)
  type: PropertyType;

  @IsOptional()
  @IsEnum(ListingType)
  listingType?: ListingType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsBoolean()
  priceNegotiable?: boolean;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  // ---- Step 2: location ----
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() locality?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() landmark?: string;
  @IsOptional() @IsString() pincode?: string;
  @IsOptional() @IsNumber() latitude?: number;
  @IsOptional() @IsNumber() longitude?: number;
  @IsOptional() @IsString() locationText?: string;

  // ---- Step 3: specifications ----
  @IsOptional() @IsInt() bhk?: number;
  @IsOptional() @IsInt() bathrooms?: number;
  @IsOptional() @IsInt() balconies?: number;
  @IsOptional() @IsNumber() superBuiltUpArea?: number;
  @IsOptional() @IsNumber() carpetArea?: number;
  @IsOptional() @IsNumber() plotArea?: number;
  @IsOptional() @IsInt() floorNumber?: number;
  @IsOptional() @IsInt() totalFloors?: number;
  @IsOptional() @IsString() propertyAge?: string;
  @IsOptional() @IsEnum(Furnishing) furnishing?: Furnishing;
  @IsOptional() @IsEnum(Facing) facing?: Facing;

  // ---- Step 4: amenities ----
  @IsOptional()
  @IsArray()
  @IsString({each: true})
  amenities?: string[];

  // ---- Step 5: media ----
  @IsOptional()
  @IsArray()
  @IsString({each: true})
  imageUrls?: string[];

  @IsOptional() @IsString() videoUrl?: string;
  @IsOptional() @IsString() virtualTourUrl?: string;
  @IsOptional() @IsString() modelUrl?: string;
  @IsOptional() @IsString() brochureUrl?: string;

  // ---- Step 6: owner / agent ----
  @IsOptional() @IsString() ownerName?: string;
  @IsOptional() @IsString() ownerPhone?: string;
  @IsOptional() @IsString() ownerWhatsapp?: string;
  @IsOptional() @IsString() ownerEmail?: string;
  @IsOptional() @IsString() agencyName?: string;

  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus;
}

export class UpdatePropertyDto extends CreatePropertyDto {}

export class VerifyPropertyDto {
  @IsEnum(VerificationStatus)
  verificationStatus: VerificationStatus;
}

export class QueryPropertiesDto {
  @IsOptional() @IsString() q?: string;

  /** One or more PropertyType values, comma-separated (e.g. `villa,apartment`). */
  @IsOptional() @IsString() type?: string;

  @IsOptional()
  @IsEnum(ListingType)
  listingType?: ListingType;

  // ---- location ----
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() locality?: string;
  @IsOptional() @IsString() pincode?: string;

  // ---- price ----
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  /** Only listings whose price is marked negotiable. */
  @IsOptional() @IsString() negotiable?: string;

  // ---- configuration ----
  /** One or more BHK counts, comma-separated (e.g. `2,3,4`). `5` means 5+. */
  @IsOptional() @IsString() bhk?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  minBathrooms?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  minBalconies?: number;

  /** Comma-separated Furnishing values. */
  @IsOptional() @IsString() furnishing?: string;

  /** Comma-separated Facing values. */
  @IsOptional() @IsString() facing?: string;

  /** Comma-separated propertyAge labels. */
  @IsOptional() @IsString() propertyAge?: string;

  // ---- area (matches carpet / super built-up / plot area) ----
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minArea?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxArea?: number;

  // ---- amenities: comma-separated; a listing must have all of them ----
  @IsOptional() @IsString() amenities?: string;

  // ---- misc ----
  @IsOptional() @IsString() featured?: string;

  @IsOptional() @IsString() agentId?: string;

  // free-text search on the listing agent's name or email
  @IsOptional() @IsString() agent?: string;

  // admin-only filter (see service): pending | verified | rejected | all
  @IsOptional() @IsString() verification?: string;

  // newest | oldest | price_asc | price_desc | title_asc
  @IsOptional() @IsString() sort?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
