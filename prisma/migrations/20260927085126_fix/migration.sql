/*
  Warnings:

  - You are about to drop the column `name` on the `plans` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[type,isDefault]` on the table `ai_providers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tpye]` on the table `plans` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tpye` to the `plans` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "plans_name_key";

-- AlterTable
ALTER TABLE "messages" ALTER COLUMN "content" DROP NOT NULL;

-- AlterTable
ALTER TABLE "plans" DROP COLUMN "name",
ADD COLUMN     "tpye" "PlanType" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ai_providers_type_isDefault_key" ON "ai_providers"("type", "isDefault");

-- CreateIndex
CREATE INDEX "messages_providerId_idx" ON "messages"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "plans_tpye_key" ON "plans"("tpye");

-- CreateIndex
CREATE INDEX "request_logs_providerId_idx" ON "request_logs"("providerId");
