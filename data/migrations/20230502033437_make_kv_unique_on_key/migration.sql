/*
  Warnings:

  - A unique constraint covering the columns `[category,key]` on the table `KeyValueCache` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "KeyValueCache_category_key_idx";

-- CreateIndex
CREATE UNIQUE INDEX "KeyValueCache_category_key_key" ON "KeyValueCache"("category", "key");
