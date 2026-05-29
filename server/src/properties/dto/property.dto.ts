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

  @IsOptional()
  @IsEnum(PropertyType)
  type?: PropertyType;

  @IsOptional()
  @IsEnum(ListingType)
  listingType?: ListingType;

  @IsOptional() @IsString() city?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  bhk?: number;

  @IsOptional() @IsString() agentId?: string;

  // admin-only filter (see service): pending | verified | rejected | all
  @IsOptional() @IsString() verification?: string;

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
