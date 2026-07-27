-- CreateEnum
CREATE TYPE "AdKind" AS ENUM ('house', 'sponsored');

-- CreateEnum
CREATE TYPE "AdStatus" AS ENUM ('draft', 'active', 'paused');

-- CreateTable
CREATE TABLE "AdCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "AdKind" NOT NULL DEFAULT 'house',
    "status" "AdStatus" NOT NULL DEFAULT 'draft',
    "headline" TEXT,
    "body" TEXT,
    "imageUrl" TEXT,
    "ctaLabel" TEXT,
    "ctaUrl" TEXT,
    "propertyId" TEXT,
    "slots" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "priority" INTEGER NOT NULL DEFAULT 0,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "maxImpressions" INTEGER,
    "dailyCap" INTEGER,
    "targetCities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "targetTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "targetListingType" TEXT,
    "targetDevice" TEXT,
    "targetAudience" TEXT,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdDailyStat" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "slot" TEXT NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AdDailyStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdCampaign_status_idx" ON "AdCampaign"("status");

-- CreateIndex
CREATE INDEX "AdCampaign_propertyId_idx" ON "AdCampaign"("propertyId");

-- CreateIndex
CREATE INDEX "AdDailyStat_date_idx" ON "AdDailyStat"("date");

-- CreateIndex
CREATE UNIQUE INDEX "AdDailyStat_campaignId_date_slot_key" ON "AdDailyStat"("campaignId", "date", "slot");

-- AddForeignKey
ALTER TABLE "AdCampaign" ADD CONSTRAINT "AdCampaign_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdDailyStat" ADD CONSTRAINT "AdDailyStat_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AdCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

