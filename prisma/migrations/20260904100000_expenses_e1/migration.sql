-- Expenses E1 (EXPENSES-MODULE.md §9): claims, receipts, the claim's own
-- transition history, settlement records, and the per-tenant claim counter.
--
-- Additive: new tables, two new enums, one new ActionRequestKind value, and
-- a backfill of the two new permissions into existing tenants' system roles
-- (MODULES.md Amendment 3). Nothing existing is altered. RLS is applied by
-- scripts/setup-rls.ts, which owns the tenant-table list.

ALTER TYPE "ActionRequestKind" ADD VALUE 'EXPENSE_CLAIM';

CREATE TYPE "ExpenseClaimStatus" AS ENUM (
    'DRAFT', 'SUBMITTED', 'APPROVED', 'PARTIALLY_APPROVED', 'REJECTED', 'WITHDRAWN', 'SETTLED'
);
CREATE TYPE "ExpenseSettlementRoute" AS ENUM ('PAYROLL', 'OUTSIDE');

CREATE TABLE "expense_claims" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "membershipId" UUID NOT NULL,
    "claimNumber" INTEGER NOT NULL,
    "status" "ExpenseClaimStatus" NOT NULL DEFAULT 'DRAFT',
    "categoryKey" TEXT NOT NULL,
    "categoryName" TEXT NOT NULL,
    "receiptRequiredAtSubmission" BOOLEAN NOT NULL,
    "maxClaimAmountAtSubmission" DECIMAL(12,2),
    "claimedAmount" DECIMAL(12,2) NOT NULL,
    "approvedAmount" DECIMAL(12,2),
    "expenseDate" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "isLate" BOOLEAN NOT NULL DEFAULT false,
    "isOverCap" BOOLEAN NOT NULL DEFAULT false,
    "isPossibleDuplicate" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3),
    "policyVersion" INTEGER,
    "decidedById" UUID,
    "decidedAt" TIMESTAMP(3),
    "decisionReason" TEXT,
    "settledAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "withdrawalReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expense_claims_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "expense_claims_tenantId_claimNumber_key"
    ON "expense_claims"("tenantId", "claimNumber");
CREATE INDEX "expense_claims_tenantId_membershipId_status_idx"
    ON "expense_claims"("tenantId", "membershipId", "status");
CREATE INDEX "expense_claims_tenantId_status_submittedAt_idx"
    ON "expense_claims"("tenantId", "status", "submittedAt");
CREATE INDEX "expense_claims_tenantId_expenseDate_idx"
    ON "expense_claims"("tenantId", "expenseDate");

ALTER TABLE "expense_claims"
    ADD CONSTRAINT "expense_claims_tenantId_fkey" FOREIGN KEY ("tenantId")
        REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "expense_claims_membershipId_fkey" FOREIGN KEY ("membershipId")
        REFERENCES "tenant_memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "expense_receipts" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "claimId" UUID NOT NULL,
    "path" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "uploadedById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_receipts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "expense_receipts_tenantId_claimId_idx"
    ON "expense_receipts"("tenantId", "claimId");

ALTER TABLE "expense_receipts"
    ADD CONSTRAINT "expense_receipts_claimId_fkey" FOREIGN KEY ("claimId")
        REFERENCES "expense_claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "expense_claim_transitions" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "claimId" UUID NOT NULL,
    "fromStatus" "ExpenseClaimStatus",
    "toStatus" "ExpenseClaimStatus" NOT NULL,
    "actorUserId" UUID,
    "actorType" "AuditActorType" NOT NULL DEFAULT 'USER',
    "reason" TEXT,
    "approvedAmount" DECIMAL(12,2),
    "selfApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_claim_transitions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "expense_claim_transitions_tenantId_claimId_createdAt_idx"
    ON "expense_claim_transitions"("tenantId", "claimId", "createdAt");

ALTER TABLE "expense_claim_transitions"
    ADD CONSTRAINT "expense_claim_transitions_claimId_fkey" FOREIGN KEY ("claimId")
        REFERENCES "expense_claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "expense_settlements" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "claimId" UUID NOT NULL,
    "route" "ExpenseSettlementRoute" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reference" TEXT,
    "payrollAdjustmentId" UUID,
    "settledById" UUID NOT NULL,
    "settledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_settlements_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "expense_settlements_claimId_key"
    ON "expense_settlements"("claimId");
CREATE UNIQUE INDEX "expense_settlements_payrollAdjustmentId_key"
    ON "expense_settlements"("payrollAdjustmentId");
CREATE INDEX "expense_settlements_tenantId_settledAt_idx"
    ON "expense_settlements"("tenantId", "settledAt");

ALTER TABLE "expense_settlements"
    ADD CONSTRAINT "expense_settlements_claimId_fkey" FOREIGN KEY ("claimId")
        REFERENCES "expense_claims"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "expense_counters" (
    "tenantId" UUID NOT NULL,
    "next" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "expense_counters_pkey" PRIMARY KEY ("tenantId")
);

-- Amendment 3: the two permissions, and their default grants for every
-- tenant that already exists. New tenants get them from the catalog at
-- provisioning (src/lib/platform/provision.ts).
INSERT INTO "permissions" ("id", "key", "name", "isSensitive")
VALUES
    (gen_random_uuid(), 'expenses.approve', 'Approve and settle expense claims', false),
    (gen_random_uuid(), 'expenses.view', 'View expense claims', false)
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "role_permissions" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "roles" r
JOIN "permissions" p ON (
    (p."key" = 'expenses.approve' AND r."key" IN ('OWNER', 'SUPER_ADMIN', 'ADMIN', 'HR'))
    OR (p."key" = 'expenses.view' AND r."key" IN ('OWNER', 'SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER'))
)
WHERE r."isSystem" = true
ON CONFLICT DO NOTHING;
