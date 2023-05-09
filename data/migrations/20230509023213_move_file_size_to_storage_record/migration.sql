/*
  Warnings:

  - You are about to drop the column `size` on the `FileRecord` table. All the data in the column will be lost.
  - Added the required column `size` to the `FileStorageRecord` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FileRecord" DROP COLUMN "size";

-- AlterTable
ALTER TABLE "FileStorageRecord" ADD COLUMN     "size" BIGINT NOT NULL;
