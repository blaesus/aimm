-- CreateEnum
CREATE TYPE "Registry" AS ENUM ('Amm', 'Civitai', 'Huggingface');

-- CreateEnum
CREATE TYPE "StorageService" AS ENUM ('AWS_S3', 'CloudFlare_R2', 'BackBlaze_B2', 'Local');

-- CreateTable
CREATE TABLE "Repository" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "subtype" TEXT,
    "registry" "Registry" NOT NULL DEFAULT 'Amm',
    "idInRegistry" TEXT NOT NULL,
    "updated" BIGINT NOT NULL,
    "raw" JSONB,
    "favour" BIGINT NOT NULL,

    CONSTRAINT "Repository_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Revision" (
    "id" UUID NOT NULL,
    "repoId" UUID NOT NULL,
    "idInRegistry" TEXT NOT NULL,
    "hashA" TEXT NOT NULL,
    "updated" BIGINT NOT NULL,
    "raw" JSONB,

    CONSTRAINT "Revision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileRecord" (
    "id" UUID NOT NULL,
    "revisionId" UUID NOT NULL,
    "filename" TEXT NOT NULL,
    "hashA" TEXT NOT NULL,
    "downloadUrl" TEXT NOT NULL,
    "updated" BIGINT NOT NULL,
    "raw" JSONB,

    CONSTRAINT "FileRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileStorageRecord" (
    "id" UUID NOT NULL,
    "hashA" TEXT NOT NULL,
    "service" "StorageService" NOT NULL,
    "idInService" TEXT NOT NULL,
    "created" BIGINT NOT NULL,
    "raw" JSONB,

    CONSTRAINT "FileStorageRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileStorageRecordOnFileRecord" (
    "fileStorageRecordId" UUID NOT NULL,
    "fileRecordId" UUID NOT NULL,
    "assignmentTime" BIGINT NOT NULL,

    CONSTRAINT "FileStorageRecordOnFileRecord_pkey" PRIMARY KEY ("fileStorageRecordId","fileRecordId")
);

-- CreateTable
CREATE TABLE "FetchRecord" (
    "id" UUID NOT NULL,
    "category" TEXT,
    "fetcher" TEXT,
    "remotePath" TEXT NOT NULL,
    "time" BIGINT NOT NULL,
    "successful" BOOLEAN NOT NULL,
    "status" INTEGER,
    "headers" TEXT,
    "data" TEXT NOT NULL,

    CONSTRAINT "FetchRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeyValueCache" (
    "id" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated" BIGINT NOT NULL,

    CONSTRAINT "KeyValueCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Repository_name_idx" ON "Repository"("name");

-- CreateIndex
CREATE INDEX "Repository_favour_idx" ON "Repository"("favour" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Repository_registry_idInRegistry_key" ON "Repository"("registry", "idInRegistry");

-- CreateIndex
CREATE INDEX "Revision_repoId_idx" ON "Revision"("repoId");

-- CreateIndex
CREATE UNIQUE INDEX "Revision_repoId_idInRegistry_key" ON "Revision"("repoId", "idInRegistry");

-- CreateIndex
CREATE INDEX "FileRecord_filename_idx" ON "FileRecord"("filename");

-- CreateIndex
CREATE INDEX "FileRecord_revisionId_hashA_idx" ON "FileRecord"("revisionId", "hashA");

-- CreateIndex
CREATE UNIQUE INDEX "FileRecord_revisionId_hashA_key" ON "FileRecord"("revisionId", "hashA");

-- CreateIndex
CREATE INDEX "FileStorageRecord_idInService_idx" ON "FileStorageRecord"("idInService");

-- CreateIndex
CREATE INDEX "FileStorageRecord_hashA_idx" ON "FileStorageRecord"("hashA");

-- CreateIndex
CREATE INDEX "FetchRecord_remotePath_idx" ON "FetchRecord"("remotePath");

-- CreateIndex
CREATE INDEX "KeyValueCache_category_key_idx" ON "KeyValueCache"("category", "key");

-- AddForeignKey
ALTER TABLE "Revision" ADD CONSTRAINT "Revision_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileRecord" ADD CONSTRAINT "FileRecord_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "Revision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileStorageRecordOnFileRecord" ADD CONSTRAINT "FileStorageRecordOnFileRecord_fileStorageRecordId_fkey" FOREIGN KEY ("fileStorageRecordId") REFERENCES "FileStorageRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileStorageRecordOnFileRecord" ADD CONSTRAINT "FileStorageRecordOnFileRecord_fileRecordId_fkey" FOREIGN KEY ("fileRecordId") REFERENCES "FileRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
