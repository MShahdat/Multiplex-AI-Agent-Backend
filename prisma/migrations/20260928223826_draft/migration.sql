-- AlterEnum
ALTER TYPE "SubscriptionStatus" ADD VALUE 'DRAFT';

-- AlterTable
ALTER TABLE "subscriptions" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
