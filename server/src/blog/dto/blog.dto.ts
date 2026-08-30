import {Type} from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {BlogStatus, VerificationStatus} from '../../shared';

export class CreateBlogPostDto {
  // ---- content ----
  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional() @IsString() slug?: string;
  @IsOptional() @IsString() @MaxLength(400) excerpt?: string;
  @IsOptional() @IsString() content?: string;
  @IsOptional() @IsString() coverImageUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({each: true})
  imageUrls?: string[];

  @IsOptional() @IsString() videoUrl?: string;

  // ---- taxonomy ----
  @IsOptional() @IsString() categoryId?: string;

  @IsOptional()
  @IsArray()
  @IsString({each: true})
  tags?: string[];

  @IsOptional() @IsString() guestAuthorName?: string;
  @IsOptional() @IsString() guestAuthorAvatar?: string;

  // ---- publishing ----
  @IsOptional() @IsEnum(BlogStatus) status?: BlogStatus;
  @IsOptional() @IsDateString() publishedAt?: string;
  @IsOptional() @IsDateString() scheduledFor?: string;
  @IsOptional() @IsBoolean() featured?: boolean;
  @IsOptional() @IsBoolean() pinned?: boolean;

  // ---- SEO ----
  @IsOptional() @IsString() @MaxLength(200) metaTitle?: string;
  @IsOptional() @IsString() @MaxLength(400) metaDescription?: string;
  @IsOptional() @IsString() ogImageUrl?: string;
  @IsOptional() @IsString() canonicalUrl?: string;
  @IsOptional() @IsBoolean() noIndex?: boolean;

  // ---- real-estate context ----
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() locality?: string;

  @IsOptional()
  @IsArray()
  @IsString({each: true})
  propertyTypes?: string[];

  /** Listing ids shown as "properties in this story", in order. */
  @IsOptional()
  @IsArray()
  @IsString({each: true})
  relatedPropertyIds?: string[];

  // ---- advertising ----
  @IsOptional() @IsBoolean() isSponsored?: boolean;
  @IsOptional() @IsString() sponsorName?: string;
  @IsOptional() @IsString() sponsorLogoUrl?: string;
  @IsOptional() @IsString() sponsorUrl?: string;
  @IsOptional() @IsString() sponsorDisclosure?: string;
  @IsOptional() @IsBoolean() adsEnabled?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  inlineAdAfterParagraph?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  maxInlineAds?: number;

  @IsOptional() @IsString() ctaLabel?: string;
  @IsOptional() @IsString() ctaUrl?: string;
  @IsOptional() @IsBoolean() isPromoted?: boolean;
  @IsOptional() @IsDateString() promotedUntil?: string;

  // ---- engagement ----
  @IsOptional() @IsBoolean() allowComments?: boolean;
}

export class UpdateBlogPostDto extends CreateBlogPostDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  declare title: string;
}

export class VerifyBlogPostDto {
  @IsEnum(VerificationStatus)
  verificationStatus: VerificationStatus;
}

export class QueryBlogPostsDto {
  @IsOptional() @IsString() q?: string;

  /** Category slug or id. */
  @IsOptional() @IsString() category?: string;

  /** Comma-separated; a post matches if it carries any of them. */
  @IsOptional() @IsString() tags?: string;

  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() authorId?: string;

  @IsOptional() @IsString() featured?: string;
  @IsOptional() @IsString() sponsored?: string;

  /** Admin only — draft | scheduled | published | archived | all. */
  @IsOptional() @IsString() status?: string;

  /** Admin only — pending | verified | rejected | all. */
  @IsOptional() @IsString() verification?: string;

  /** newest | oldest | popular | title_asc */
  @IsOptional() @IsString() sort?: string;

  /** Exclude one post (used by "related reading"). */
  @IsOptional() @IsString() excludeId?: string;

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

export class CreateBlogCategoryDto {
  @IsString() @MaxLength(80) name: string;
  @IsOptional() @IsString() slug?: string;
  @IsOptional() @IsString() @MaxLength(300) description?: string;
  @IsOptional() @IsString() coverImageUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  position?: number;
}

export class UpdateBlogCategoryDto extends CreateBlogCategoryDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  declare name: string;
}

export class CreateBlogCommentDto {
  @IsString()
  @MaxLength(2000)
  text: string;

  /** Replying inside an existing thread. */
  @IsOptional() @IsString() parentId?: string;
}

export class QueryBlogCommentsDto {
  /** Admin only — pending | approved | all. */
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() postId?: string;

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
