-- CreateEnum
CREATE TYPE "ComponentKind" AS ENUM ('EARNING', 'DEDUCTION');

-- CreateEnum
CREATE TYPE "ComponentCalculation" AS ENUM ('FIXED', 'PERCENT_OF_BASE', 'PER_DAY');

-- CreateEnum
CREATE TYPE "PayrollRunStatus" AS ENUM ('DRAFT', 'APPROVED');

-- CreateEnum
CREATE TYPE "PayrollLineStatus" AS ENUM ('READY', 'NO_SALARY_STRUCTURE', 'BLOCKED');

-- CreateTable
CREATE TABLE "tenant_policies" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "value" JSONB NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "updatedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_components" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "ComponentKind" NOT NULL,
    "calculation" "ComponentCalculation" NOT NULL DEFAULT 'FIXED',
    "isStatutory" BOOLEAN NOT NULL DEFAULT false,
    "prorated" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salary_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_structures" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "membershipId" UUID NOT NULL,
    "effectiveFrom" DATE NOT NULL,
    "baseAmount" DECIMAL(12,2) NOT NULL,
    "note" TEXT,
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salary_structures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_structure_lines" (
    "id" UUID NOT NULL,
    "structureId" UUID NOT NULL,
    "componentId" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "percent" DECIMAL(6,3) NOT NULL DEFAULT 0,

    CONSTRAINT "salary_structure_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_runs" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "periodMonth" DATE NOT NULL,
    "status" "PayrollRunStatus" NOT NULL DEFAULT 'DRAFT',
    "inputsSnapshot" JSONB,
    "calculatedAt" TIMESTAMP(3),
    "approvedById" UUID,
    "approvedAt" TIMESTAMP(3),
    "approvalReason" TEXT,
    "accountantAcknowledged" BOOLEAN NOT NULL DEFAULT false,
    "grossTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "deductionTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "netTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_lines" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "runId" UUID NOT NULL,
    "membershipId" UUID NOT NULL,
    "status" "PayrollLineStatus" NOT NULL DEFAULT 'READY',
    "statusReason" TEXT,
    "calendarDays" INTEGER NOT NULL DEFAULT 0,
    "presentDays" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "paidLeaveDays" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "unpaidDays" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "payableDays" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "lateMinutes" INTEGER NOT NULL DEFAULT 0,
    "lateDeductionDays" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "earnings" JSONB,
    "deductions" JSONB,
    "gross" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "deductionTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "adjustmentTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "net" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_adjustments" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "lineId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payroll_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tenant_policies_tenantId_key_isCurrent_idx" ON "tenant_policies"("tenantId", "key", "isCurrent");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_policies_tenantId_key_version_key" ON "tenant_policies"("tenantId", "key", "version");

-- CreateIndex
CREATE UNIQUE INDEX "salary_components_tenantId_key_key" ON "salary_components"("tenantId", "key");

-- CreateIndex
CREATE INDEX "salary_structures_tenantId_membershipId_idx" ON "salary_structures"("tenantId", "membershipId");

-- CreateIndex
CREATE UNIQUE INDEX "salary_structures_tenantId_membershipId_effectiveFrom_key" ON "salary_structures"("tenantId", "membershipId", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "salary_structure_lines_structureId_componentId_key" ON "salary_structure_lines"("structureId", "componentId");

-- CreateIndex
CREATE INDEX "payroll_runs_tenantId_status_idx" ON "payroll_runs"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_runs_tenantId_periodMonth_key" ON "payroll_runs"("tenantId", "periodMonth");

-- CreateIndex
CREATE INDEX "payroll_lines_tenantId_runId_idx" ON "payroll_lines"("tenantId", "runId");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_lines_runId_membershipId_key" ON "payroll_lines"("runId", "membershipId");

-- CreateIndex
CREATE INDEX "payroll_adjustments_tenantId_lineId_idx" ON "payroll_adjustments"("tenantId", "lineId");

-- AddForeignKey
ALTER TABLE "tenant_policies" ADD CONSTRAINT "tenant_policies_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_components" ADD CONSTRAINT "salary_components_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_structures" ADD CONSTRAINT "salary_structures_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_structures" ADD CONSTRAINT "salary_structures_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "tenant_memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_structure_lines" ADD CONSTRAINT "salary_structure_lines_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "salary_structures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_structure_lines" ADD CONSTRAINT "salary_structure_lines_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "salary_components"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_lines" ADD CONSTRAINT "payroll_lines_runId_fkey" FOREIGN KEY ("runId") REFERENCES "payroll_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_lines" ADD CONSTRAINT "payroll_lines_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "tenant_memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_adjustments" ADD CONSTRAINT "payroll_adjustments_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "payroll_lines"("id") ON DELETE CASCADE ON UPDATE CASCADE;
