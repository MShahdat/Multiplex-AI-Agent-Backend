/*
  Warnings:

  - The values [OPENAI,CLAUDE] on the enum `ProviderType` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `requestsLimitMonth` to the `plans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requestsLimitToday` to the `plans` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ProviderType_new" AS ENUM ('GROQ', 'ANTHROPIC');
ALTER TABLE "ai_providers" ALTER COLUMN "type" TYPE "ProviderType_new" USING ("type"::text::"ProviderType_new");
ALTER TYPE "ProviderType" RENAME TO "ProviderType_old";
ALTER TYPE "ProviderType_new" RENAME TO "ProviderType";
DROP TYPE "public"."ProviderType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_providerId_fkey";

-- DropIndex
DROP INDEX "payments_subscriptionId_key";

-- AlterTable
ALTER TABLE "ai_providers" ADD COLUMN     "tier" "PlanType" NOT NULL DEFAULT 'FREE';

-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "providerId" TEXT;

-- AlterTable
ALTER TABLE "messages" ALTER COLUMN "providerId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "requestsLimitMonth" INTEGER NOT NULL,
ADD COLUMN     "requestsLimitToday" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "request_logs" ADD COLUMN     "completionTokens" INTEGER,
ADD COLUMN     "promptTokens" INTEGER,
ADD COLUMN     "providerId" TEXT;

-- CreateIndex
CREATE INDEX "payments_subscriptionId_paidAt_idx" ON "payments"("subscriptionId", "paidAt");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ai_providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ai_providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_logs" ADD CONSTRAINT "request_logs_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ai_providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
