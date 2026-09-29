-- DropForeignKey
ALTER TABLE "requestsLog" DROP CONSTRAINT "requestsLog_userId_fkey";

-- AlterTable
ALTER TABLE "requestsLog" ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "requestsLog_apiEndpoint_method_idx" ON "requestsLog"("apiEndpoint", "method");

-- AddForeignKey
ALTER TABLE "requestsLog" ADD CONSTRAINT "requestsLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
