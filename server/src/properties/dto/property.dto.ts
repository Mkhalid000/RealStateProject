import {Type} from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import {PropertyStatus, PropertyType} from '../../shared';

export class CreatePropertyDto {
  @IsString()
  @MaxLength(140)
  title: string;

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
  @IsString()
  locationText?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsEnum(PropertyType)
  type: PropertyType;

  @IsOptional()
  @IsInt()
  bedrooms?: number;

  @IsOptional()
  @IsInt()
  bathrooms?: number;

  @IsOptional()
  @IsNumber()
  areaSqft?: number;

  @IsOptional()
  @IsArray()
  @IsString({each: true})
  amenities?: string[];

  @IsOptional()
  @IsArray()
  @IsString({each: true})
  imageUrls?: string[];

  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus;
}

export class UpdatePropertyDto extends CreatePropertyDto {}

export class QueryPropertiesDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsEnum(PropertyType)
  type?: PropertyType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @IsOptional()
  @IsString()
  agentId?: string;

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
