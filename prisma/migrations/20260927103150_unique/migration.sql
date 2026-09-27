/*
  Warnings:

  - A unique constraint covering the columns `[model]` on the table `ai_providers` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ai_providers_model_key" ON "ai_providers"("model");
