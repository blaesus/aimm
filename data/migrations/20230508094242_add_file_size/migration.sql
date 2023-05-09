/*
  Warnings:

  - The values [Amm] on the enum `Registry` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Registry_new" AS ENUM ('AimmHub', 'Civitai', 'Huggingface', 'GitHub', 'GitLab');
ALTER TABLE "Repository" ALTER COLUMN "registry" DROP DEFAULT;
ALTER TABLE "Repository" ALTER COLUMN "registry" TYPE "Registry_new" USING ("registry"::text::"Registry_new");
ALTER TYPE "Registry" RENAME TO "Registry_old";
ALTER TYPE "Registry_new" RENAME TO "Registry";
DROP TYPE "Registry_old";
ALTER TABLE "Repository" ALTER COLUMN "registry" SET DEFAULT 'AimmHub';
COMMIT;

-- AlterTable
ALTER TABLE "FileRecord" ADD COLUMN     "size" BIGINT;

-- AlterTable
ALTER TABLE "Repository" ALTER COLUMN "registry" SET DEFAULT 'AimmHub';
