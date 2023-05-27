-- AlterTable
ALTER TABLE "Repository" ADD COLUMN     "createdInRegistry" BIGINT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "updatedInRegistry" BIGINT;

-- AlterTable
ALTER TABLE "Revision" ADD COLUMN     "createdInRegistry" BIGINT,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "updatedInRegistry" BIGINT;
