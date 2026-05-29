import {Type} from 'class-transformer';
import {IsInt, IsOptional, IsString, MaxLength, Min} from 'class-validator';

export class CreateReelDto {
  @IsString()
  videoUrl: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2200)
  caption?: string;

  @IsOptional()
  @IsString()
  propertyId?: string;
}

export class CreateCommentDto {
  @IsString()
  @MaxLength(1000)
  text: string;
}

export class FeedQueryDto {
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

  // optional filters (used by the admin moderation page)
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsString() boosted?: string; // 'true' | 'false'
  @IsOptional() @IsString() agentId?: string;
}
