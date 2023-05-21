/*
  Warnings:

  - Added the required column `time` to the `BenchmarkResult` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BenchmarkResult" ADD COLUMN     "time" BIGINT NOT NULL;
