/*
  Warnings:

  - A unique constraint covering the columns `[batchId,externalId]` on the table `PayoutItem` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."PayoutItem_externalId_key";

-- CreateIndex
CREATE UNIQUE INDEX "PayoutItem_batchId_externalId_key" ON "PayoutItem"("batchId", "externalId");
