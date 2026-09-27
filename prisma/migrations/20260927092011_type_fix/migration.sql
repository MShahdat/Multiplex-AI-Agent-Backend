/*
  Warnings:

  - The values [CREADENTIAL] on the enum `AuthProvider` will be removed. If these variants are still used in the database, this will fail.
  - The values [HEALF_YEARLY] on the enum `SubscriptionType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `transectionId` on the `payments` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[transactionId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AuthProvider_new" AS ENUM ('CREDENTIAL', 'GOOGLE', 'GITHUB', 'FACEBOOK');
ALTER TABLE "public"."users" ALTER COLUMN "authProvider" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "authProvider" TYPE "AuthProvider_new" USING ("authProvider"::text::"AuthProvider_new");
ALTER TYPE "AuthProvider" RENAME TO "AuthProvider_old";
ALTER TYPE "AuthProvider_new" RENAME TO "AuthProvider";
DROP TYPE "public"."AuthProvider_old";
ALTER TABLE "users" ALTER COLUMN "authProvider" SET DEFAULT 'CREDENTIAL';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "SubscriptionType_new" AS ENUM ('MONTHLY', 'HALF_YEARLY', 'YEARLY');
ALTER TABLE "subscriptions" ALTER COLUMN "type" TYPE "SubscriptionType_new" USING ("type"::text::"SubscriptionType_new");
ALTER TYPE "SubscriptionType" RENAME TO "SubscriptionType_old";
ALTER TYPE "SubscriptionType_new" RENAME TO "SubscriptionType";
DROP TYPE "public"."SubscriptionType_old";
COMMIT;

-- DropIndex
DROP INDEX "ai_providers_type_isDefault_key";

-- DropIndex
DROP INDEX "payments_transectionId_key";

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "transectionId",
ADD COLUMN     "transactionId" TEXT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "authProvider" SET DEFAULT 'CREDENTIAL';

-- CreateIndex
CREATE UNIQUE INDEX "payments_transactionId_key" ON "payments"("transactionId");
