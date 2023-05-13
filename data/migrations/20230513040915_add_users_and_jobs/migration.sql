-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('Repository', 'Revision', 'FileRecord', 'FileStorageRecord', 'FetchRecord', 'KeyValueCache', 'Account', 'Role', 'RoleAssignment', 'Privilege', 'Other');

-- CreateEnum
CREATE TYPE "Action" AS ENUM ('Create', 'Read', 'Update', 'Delete');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('Running', 'Success', 'Failure', 'Scheduled', 'Cancelled', 'Interrupted');

-- CreateTable
CREATE TABLE "Account" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "disabled" BIGINT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Credential" (
    "id" SERIAL NOT NULL,
    "accountId" UUID NOT NULL,
    "hash" TEXT NOT NULL,
    "salt" TEXT NOT NULL,
    "updated" BIGINT NOT NULL,

    CONSTRAINT "Credential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "secret" TEXT NOT NULL,
    "created" BIGINT NOT NULL,
    "forceInvalidated" BOOLEAN NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "accountId" UUID,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleAssignment" (
    "id" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "created" BIGINT NOT NULL,

    CONSTRAINT "RoleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Privilege" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL,
    "target" UUID,
    "action" "Action" NOT NULL,
    "data" JSONB,
    "created" BIGINT NOT NULL,

    CONSTRAINT "Privilege_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivilegePermission" (
    "id" UUID NOT NULL,
    "privilegeId" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "created" BIGINT NOT NULL,

    CONSTRAINT "PrivilegePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" UUID NOT NULL,
    "status" "JobStatus" NOT NULL,
    "label" TEXT NOT NULL,
    "created" BIGINT NOT NULL,
    "stopped" BIGINT NOT NULL,
    "total" INTEGER,
    "processed" INTEGER,
    "data" JSONB,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_name_key" ON "Account"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Credential_accountId_key" ON "Credential"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_accountId_key" ON "Session"("accountId");

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleAssignment" ADD CONSTRAINT "RoleAssignment_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleAssignment" ADD CONSTRAINT "RoleAssignment_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivilegePermission" ADD CONSTRAINT "PrivilegePermission_privilegeId_fkey" FOREIGN KEY ("privilegeId") REFERENCES "Privilege"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivilegePermission" ADD CONSTRAINT "PrivilegePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
