-- CreateEnum
CREATE TYPE "ListingType" AS ENUM ('buy', 'rent');

-- CreateEnum
CREATE TYPE "Furnishing" AS ENUM ('unfurnished', 'semi_furnished', 'furnished');

-- CreateEnum
CREATE TYPE "Facing" AS ENUM ('north', 'south', 'east', 'west', 'north_east', 'north_west', 'south_east', 'south_west');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('pending', 'verified', 'rejected');

-- CreateEnum
CREATE TYPE "BlogStatus" AS ENUM ('draft', 'scheduled', 'published', 'archived');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'property_status';
ALTER TYPE "NotificationType" ADD VALUE 'new_property';

-- AlterEnum
BEGIN;
CREATE TYPE "PropertyType_new" AS ENUM ('apartment', 'villa', 'plot', 'commercial', 'office', 'shop');
ALTER TABLE "Property" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "Property" ALTER COLUMN "type" TYPE "PropertyType_new" USING ("type"::text::"PropertyType_new");
ALTER TYPE "PropertyType" RENAME TO "PropertyType_old";
ALTER TYPE "PropertyType_new" RENAME TO "PropertyType";
DROP TYPE "PropertyType_old";
ALTER TABLE "Property" ALTER COLUMN "type" SET DEFAULT 'apartment';
COMMIT;

-- AlterTable
ALTER TABLE "AdCampaign" ADD COLUMN     "targetBlogCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "targetTags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "agentReadAt" TIMESTAMP(3),
ADD COLUMN     "userReadAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Property" DROP COLUMN "areaSqft",
DROP COLUMN "bedrooms",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "agencyName" TEXT,
ADD COLUMN     "balconies" INTEGER,
ADD COLUMN     "bhk" INTEGER,
ADD COLUMN     "carpetArea" DOUBLE PRECISION,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "facing" "Facing",
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "floorNumber" INTEGER,
ADD COLUMN     "furnishing" "Furnishing",
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "landmark" TEXT,
ADD COLUMN     "listingType" "ListingType" NOT NULL DEFAULT 'buy',
ADD COLUMN     "locality" TEXT,
ADD COLUMN     "modelUrl" TEXT,
ADD COLUMN     "ownerEmail" TEXT,
ADD COLUMN     "ownerName" TEXT,
ADD COLUMN     "ownerPhone" TEXT,
ADD COLUMN     "ownerWhatsapp" TEXT,
ADD COLUMN     "pincode" TEXT,
ADD COLUMN     "plotArea" DOUBLE PRECISION,
ADD COLUMN     "priceNegotiable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "propertyAge" TEXT,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "superBuiltUpArea" DOUBLE PRECISION,
ADD COLUMN     "totalFloors" INTEGER,
ADD COLUMN     "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'pending',
ADD COLUMN     "videoUrl" TEXT,
ADD COLUMN     "virtualTourUrl" TEXT,
ALTER COLUMN "type" SET DEFAULT 'apartment';

-- AlterTable
ALTER TABLE "Reel" ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'pending';

-- CreateTable
CREATE TABLE "DeviceToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'android',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "message" TEXT,
    "source" TEXT NOT NULL DEFAULT 'website',
    "status" TEXT NOT NULL DEFAULT 'new',
    "propertyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "coverImageUrl" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL DEFAULT '',
    "coverImageUrl" TEXT,
    "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "videoUrl" TEXT,
    "readingMinutes" INTEGER NOT NULL DEFAULT 1,
    "categoryId" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "guestAuthorName" TEXT,
    "guestAuthorAvatar" TEXT,
    "status" "BlogStatus" NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "scheduledFor" TIMESTAMP(3),
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'pending',
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "ogImageUrl" TEXT,
    "canonicalUrl" TEXT,
    "noIndex" BOOLEAN NOT NULL DEFAULT false,
    "country" TEXT,
    "state" TEXT,
    "city" TEXT,
    "locality" TEXT,
    "propertyTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isSponsored" BOOLEAN NOT NULL DEFAULT false,
    "sponsorName" TEXT,
    "sponsorLogoUrl" TEXT,
    "sponsorUrl" TEXT,
    "sponsorDisclosure" TEXT,
    "adsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "inlineAdAfterParagraph" INTEGER NOT NULL DEFAULT 4,
    "maxInlineAds" INTEGER NOT NULL DEFAULT 2,
    "ctaLabel" TEXT,
    "ctaUrl" TEXT,
    "isPromoted" BOOLEAN NOT NULL DEFAULT false,
    "promotedUntil" TIMESTAMP(3),
    "allowComments" BOOLEAN NOT NULL DEFAULT true,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPostProperty" (
    "postId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BlogPostProperty_pkey" PRIMARY KEY ("postId","propertyId")
);

-- CreateTable
CREATE TABLE "BlogComment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "parentId" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogLike" (
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogLike_pkey" PRIMARY KEY ("postId","userId")
);

-- CreateTable
CREATE TABLE "BlogDailyStat" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "reads" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BlogDailyStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeviceToken_token_key" ON "DeviceToken"("token");

-- CreateIndex
CREATE INDEX "DeviceToken_userId_idx" ON "DeviceToken"("userId");

-- CreateIndex
CREATE INDEX "Lead_source_createdAt_idx" ON "Lead"("source", "createdAt");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE UNIQUE INDEX "BlogCategory_slug_key" ON "BlogCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");

-- CreateIndex
CREATE INDEX "BlogPost_status_publishedAt_idx" ON "BlogPost"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "BlogPost_categoryId_idx" ON "BlogPost"("categoryId");

-- CreateIndex
CREATE INDEX "BlogPost_authorId_idx" ON "BlogPost"("authorId");

-- CreateIndex
CREATE INDEX "BlogPost_city_idx" ON "BlogPost"("city");

-- CreateIndex
CREATE INDEX "BlogPostProperty_propertyId_idx" ON "BlogPostProperty"("propertyId");

-- CreateIndex
CREATE INDEX "BlogComment_postId_createdAt_idx" ON "BlogComment"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "BlogComment_isApproved_idx" ON "BlogComment"("isApproved");

-- CreateIndex
CREATE INDEX "BlogDailyStat_date_idx" ON "BlogDailyStat"("date");

-- CreateIndex
CREATE UNIQUE INDEX "BlogDailyStat_postId_date_key" ON "BlogDailyStat"("postId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Property_slug_key" ON "Property"("slug");

-- CreateIndex
CREATE INDEX "Property_isVerified_idx" ON "Property"("isVerified");

-- AddForeignKey
ALTER TABLE "DeviceToken" ADD CONSTRAINT "DeviceToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BlogCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPostProperty" ADD CONSTRAINT "BlogPostProperty_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPostProperty" ADD CONSTRAINT "BlogPostProperty_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogComment" ADD CONSTRAINT "BlogComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogComment" ADD CONSTRAINT "BlogComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogComment" ADD CONSTRAINT "BlogComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "BlogComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogLike" ADD CONSTRAINT "BlogLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogLike" ADD CONSTRAINT "BlogLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogDailyStat" ADD CONSTRAINT "BlogDailyStat_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

