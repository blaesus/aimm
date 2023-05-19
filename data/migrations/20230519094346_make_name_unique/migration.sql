/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Benchmark` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Benchmark_name_key" ON "Benchmark"("name");
