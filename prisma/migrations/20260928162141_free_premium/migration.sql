/*
  Warnings:

  - You are about to drop the column `status` on the `plan_templates` table. All the data in the column will be lost.
  - You are about to drop the column `tokensUserPerMin` on the `plans` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[subscriptionId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[type,billingCycle]` on the table `plan_templates` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `plan_templates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `planTemplateId` to the `subscriptions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'PENDING';

-- DropIndex
DROP INDEX "plan_templates_type_key";

-- DropIndex
DROP INDEX "subscriptions_status_idx";

-- DropIndex
DROP INDEX "subscriptions_userId_key";

-- AlterTable
ALTER TABLE "ai_providers" ADD COLUMN     "isPremium" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "plan_templates" DROP COLUMN "status",
ADD COLUMN     "billingCycle" "SubscriptionType",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "plans" DROP COLUMN "tokensUserPerMin",
ADD COLUMN     "tokensUsedPerMin" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "currentPeriodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "planTemplateId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "payments_subscriptionId_key" ON "payments"("subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "plan_templates_type_billingCycle_key" ON "plan_templates"("type", "billingCycle");

-- CreateIndex
CREATE INDEX "subscriptions_status_userId_idx" ON "subscriptions"("status", "userId");

-- CreateIndex
CREATE INDEX "subscriptions_currentPeriodEnd_idx" ON "subscriptions"("currentPeriodEnd");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_planTemplateId_fkey" FOREIGN KEY ("planTemplateId") REFERENCES "plan_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
