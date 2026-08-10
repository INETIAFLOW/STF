-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'TEMPORARY', 'APPRENTICE');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "InviteChannel" AS ENUM ('EMAIL', 'LINK');

-- CreateEnum
CREATE TYPE "ActionRequestKind" AS ENUM ('ATTENDANCE_EXCEPTION', 'LEAVE_REQUEST', 'TASK_PROOF', 'EMPLOYEE_INVITE');

-- CreateEnum
CREATE TYPE "ActionRequestStatus" AS ENUM ('PENDING', 'SNOOZED', 'RESOLVED', 'CANCELLED');

-- AlterTable
ALTER TABLE "tenant_memberships" ADD COLUMN     "departmentId" UUID,
ADD COLUMN     "employmentType" "EmploymentType" NOT NULL DEFAULT 'FULL_TIME';

-- CreateTable
CREATE TABLE "departments" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "headId" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_invites" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "membershipId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "channel" "InviteChannel" NOT NULL DEFAULT 'EMAIL',
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "sentToEmail" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "resendCount" INTEGER NOT NULL DEFAULT 0,
    "lastResendAt" TIMESTAMP(3),
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_requests" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "kind" "ActionRequestKind" NOT NULL,
    "status" "ActionRequestStatus" NOT NULL DEFAULT 'PENDING',
    "subjectType" TEXT NOT NULL,
    "subjectId" UUID NOT NULL,
    "aboutMembershipId" UUID,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "href" TEXT NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "resolvedByUserId" UUID,
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "action_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_request_recipients" (
    "id" UUID NOT NULL,
    "actionRequestId" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "snoozedUntil" TIMESTAMP(3),
    "snoozeCount" INTEGER NOT NULL DEFAULT 0,
    "seenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "action_request_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "departments_tenantId_isActive_idx" ON "departments"("tenantId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "departments_tenantId_name_key" ON "departments"("tenantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "employee_invites_tokenHash_key" ON "employee_invites"("tokenHash");

-- CreateIndex
CREATE INDEX "employee_invites_tenantId_status_idx" ON "employee_invites"("tenantId", "status");

-- CreateIndex
CREATE INDEX "employee_invites_membershipId_idx" ON "employee_invites"("membershipId");

-- CreateIndex
CREATE INDEX "action_requests_tenantId_status_idx" ON "action_requests"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "action_requests_tenantId_subjectType_subjectId_key" ON "action_requests"("tenantId", "subjectType", "subjectId");

-- CreateIndex
CREATE INDEX "action_request_recipients_tenantId_userId_snoozedUntil_idx" ON "action_request_recipients"("tenantId", "userId", "snoozedUntil");

-- CreateIndex
CREATE UNIQUE INDEX "action_request_recipients_actionRequestId_userId_key" ON "action_request_recipients"("actionRequestId", "userId");

-- CreateIndex
CREATE INDEX "tenant_memberships_tenantId_departmentId_idx" ON "tenant_memberships"("tenantId", "departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_memberships_tenantId_employeeCode_key" ON "tenant_memberships"("tenantId", "employeeCode");

-- AddForeignKey
ALTER TABLE "tenant_memberships" ADD CONSTRAINT "tenant_memberships_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_headId_fkey" FOREIGN KEY ("headId") REFERENCES "tenant_memberships"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_invites" ADD CONSTRAINT "employee_invites_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_invites" ADD CONSTRAINT "employee_invites_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "tenant_memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_requests" ADD CONSTRAINT "action_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_requests" ADD CONSTRAINT "action_requests_aboutMembershipId_fkey" FOREIGN KEY ("aboutMembershipId") REFERENCES "tenant_memberships"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_request_recipients" ADD CONSTRAINT "action_request_recipients_actionRequestId_fkey" FOREIGN KEY ("actionRequestId") REFERENCES "action_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
