/*
  Warnings:

  - You are about to drop the column `maxTokensPerRequest` on the `ai_providers` table. All the data in the column will be lost.
  - You are about to drop the column `tier` on the `ai_providers` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `plans` table. All the data in the column will be lost.
  - You are about to drop the column `requestsLimitMonth` on the `plans` table. All the data in the column will be lost.
  - You are about to drop the column `requestsLimitToday` on the `plans` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `plans` table. All the data in the column will be lost.
  - You are about to drop the column `tokenLimitMonth` on the `plans` table. All the data in the column will be lost.
  - You are about to drop the column `tokenLimitToday` on the `plans` table. All the data in the column will be lost.
  - You are about to drop the column `tpye` on the `plans` table. All the data in the column will be lost.
  - Added the required column `planTemplateId` to the `plans` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ai_providers" DROP COLUMN "maxTokensPerRequest",
DROP COLUMN "tier";

-- AlterTable
ALTER TABLE "plans" DROP COLUMN "price",
DROP COLUMN "requestsLimitMonth",
DROP COLUMN "requestsLimitToday",
DROP COLUMN "status",
DROP COLUMN "tokenLimitMonth",
DROP COLUMN "tokenLimitToday",
DROP COLUMN "tpye",
ADD COLUMN     "planTemplateId" TEXT NOT NULL,
ADD COLUMN     "requestsUsedPerDay" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "requestsUsedPerMin" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tokensUsedPerDay" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tokensUserPerMin" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "plan_provider_limits" (
    "id" TEXT NOT NULL,
    "maxTokensPerRequest" INTEGER,
    "requestPerMinute" INTEGER NOT NULL,
    "requestPerDay" INTEGER NOT NULL,
    "tokenPerMinute" INTEGER NOT NULL,
    "tokenPerDay" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "planTemplateId" TEXT NOT NULL,
    "aiProviderId" TEXT NOT NULL,

    CONSTRAINT "plan_provider_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_templates" (
    "id" TEXT NOT NULL,
    "type" "PlanType" NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plan_provider_limits_planTemplateId_aiProviderId_key" ON "plan_provider_limits"("planTemplateId", "aiProviderId");

-- CreateIndex
CREATE UNIQUE INDEX "plan_templates_type_key" ON "plan_templates"("type");

-- AddForeignKey
ALTER TABLE "plans" ADD CONSTRAINT "plans_planTemplateId_fkey" FOREIGN KEY ("planTemplateId") REFERENCES "plan_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_provider_limits" ADD CONSTRAINT "plan_provider_limits_planTemplateId_fkey" FOREIGN KEY ("planTemplateId") REFERENCES "plan_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_provider_limits" ADD CONSTRAINT "plan_provider_limits_aiProviderId_fkey" FOREIGN KEY ("aiProviderId") REFERENCES "ai_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
