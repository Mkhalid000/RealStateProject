-- AlterTable
ALTER TABLE "AdCampaign" ADD COLUMN     "accent" TEXT,
ADD COLUMN     "dismissible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "frequency" TEXT NOT NULL DEFAULT 'session',
ADD COLUMN     "showCountdown" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "trigger" TEXT NOT NULL DEFAULT 'delay',
ADD COLUMN     "triggerValue" INTEGER NOT NULL DEFAULT 8;

