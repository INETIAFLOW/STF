-- Performance points ledger (PERFORMANCE-MODULE.md, phase P1).
--
-- Additive: one new table, nothing existing touched. Append-only by
-- application rule; the unique key makes double-awarding structurally
-- impossible (one award per source event, one aggregate per period).
--
-- RLS is applied by scripts/setup-rls.ts (ENABLE without FORCE — the app
-- connects as the table owner), which owns the tenant-table list.

CREATE TABLE "performance_events" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "membershipId" UUID NOT NULL,
    "workDate" DATE NOT NULL,
    "kind" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" UUID,
    "dedupeKey" TEXT NOT NULL,
    "policyVersion" INTEGER NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "performance_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "performance_events_tenantId_membershipId_kind_dedupeKey_key"
    ON "performance_events"("tenantId", "membershipId", "kind", "dedupeKey");
CREATE INDEX "performance_events_tenantId_membershipId_workDate_idx"
    ON "performance_events"("tenantId", "membershipId", "workDate");
CREATE INDEX "performance_events_tenantId_workDate_idx"
    ON "performance_events"("tenantId", "workDate");

ALTER TABLE "performance_events" ADD CONSTRAINT "performance_events_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "performance_events" ADD CONSTRAINT "performance_events_membershipId_fkey"
    FOREIGN KEY ("membershipId") REFERENCES "tenant_memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
