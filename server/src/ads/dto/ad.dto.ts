import {Type} from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import {AdFrequency, AdKind, AdStatus, AdTrigger} from '../../shared';

export class CreateAdCampaignDto {
  @IsString()
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsEnum(AdKind)
  kind?: AdKind;

  @IsOptional()
  @IsEnum(AdStatus)
  status?: AdStatus;

  // ---- creative (house ads) ----
  @IsOptional() @IsString() @MaxLength(120) headline?: string;
  @IsOptional() @IsString() @MaxLength(300) body?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsString() @MaxLength(40) ctaLabel?: string;
  @IsOptional() @IsString() ctaUrl?: string;

  // ---- sponsored listing ----
  @IsOptional() @IsString() propertyId?: string;

  // ---- placement ----
  @IsArray()
  @ArrayNotEmpty()
  @IsString({each: true})
  slots: string[];

  @IsOptional() @Type(() => Number) @IsInt() priority?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) weight?: number;

  // ---- schedule ----
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() endsAt?: string;

  // ---- presentation ----
  @IsOptional() @IsString() @MaxLength(9) accent?: string;
  @IsOptional() @IsBoolean() showCountdown?: boolean;
  @IsOptional() @IsBoolean() dismissible?: boolean;

  // ---- trigger rules (modal / floating) ----
  @IsOptional() @IsEnum(AdTrigger) trigger?: AdTrigger;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) triggerValue?: number;
  @IsOptional() @IsEnum(AdFrequency) frequency?: AdFrequency;

  // ---- caps ----
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) maxImpressions?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) dailyCap?: number;

  // ---- targeting ----
  @IsOptional() @IsArray() @IsString({each: true}) targetCities?: string[];
  @IsOptional() @IsArray() @IsString({each: true}) targetTypes?: string[];
  @IsOptional() @IsArray() @IsString({each: true}) targetBlogCategories?: string[];
  @IsOptional() @IsArray() @IsString({each: true}) targetTags?: string[];
  @IsOptional() @IsString() targetListingType?: string;
  @IsOptional() @IsString() targetDevice?: string;
  @IsOptional() @IsString() targetAudience?: string;
}

export class UpdateAdCampaignDto extends CreateAdCampaignDto {
  @IsOptional()
  @IsArray()
  @IsString({each: true})
  slots: string[];
}

/** Public: what the page asks for when it wants an ad. */
export class ServeAdDto {
  @IsString() slot: string;

  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() listingType?: string;
  /** Blog category slug, when the slot sits on the blog. */
  @IsOptional() @IsString() blogCategory?: string;
  /** Comma-separated article tags. */
  @IsOptional() @IsString() tags?: string;
  /** mobile | desktop */
  @IsOptional() @IsString() device?: string;

  /** How many distinct ads the slot wants (in-feed asks for several). */
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number;
}

export class TrackAdDto {
  @IsString() slot: string;
}

export class QueryAdCampaignsDto {
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsEnum(AdKind) kind?: AdKind;
  @IsOptional() @IsEnum(AdStatus) status?: AdStatus;
  @IsOptional() @IsString() slot?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number;
}
