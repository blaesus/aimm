-- CreateEnum
CREATE TYPE "BenchmarkType" AS ENUM ('txt2img');

-- CreateTable
CREATE TABLE "Benchmark" (
    "id" UUID NOT NULL,
    "type" "BenchmarkType" NOT NULL,
    "subtype" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parameters" JSONB NOT NULL,
    "created" BIGINT NOT NULL,

    CONSTRAINT "Benchmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BenchmarkResult" (
    "id" UUID NOT NULL,
    "benchmarkId" UUID NOT NULL,
    "targetFileId" UUID NOT NULL,
    "resultFileId" UUID NOT NULL,

    CONSTRAINT "BenchmarkResult_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BenchmarkResult" ADD CONSTRAINT "BenchmarkResult_benchmarkId_fkey" FOREIGN KEY ("benchmarkId") REFERENCES "Benchmark"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BenchmarkResult" ADD CONSTRAINT "BenchmarkResult_targetFileId_fkey" FOREIGN KEY ("targetFileId") REFERENCES "FileRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BenchmarkResult" ADD CONSTRAINT "BenchmarkResult_resultFileId_fkey" FOREIGN KEY ("resultFileId") REFERENCES "FileRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
