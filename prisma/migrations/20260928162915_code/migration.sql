/*
  Warnings:

  - You are about to drop the column `name` on the `plan_templates` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[code]` on the table `plan_templates` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `plan_templates` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "plan_templates" DROP COLUMN "name",
ADD COLUMN     "code" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "plan_templates_code_key" ON "plan_templates"("code");
