-- Multi-location support.
--
-- Rollback: dropping "canCheckInAtAnyBranch" is safe. Restoring NOT NULL on
-- "branches"."radiusM" requires backfilling NULLs from the tenant policy
-- first, e.g. UPDATE "branches" SET "radiusM" = 300 WHERE "radiusM" IS NULL.

-- Roaming capability: any ACTIVE company location counts as a permitted area.
ALTER TABLE "tenant_memberships"
  ADD COLUMN "canCheckInAtAnyBranch" BOOLEAN NOT NULL DEFAULT false;

-- Per-location radius override. NULL now means "inherit the tenant policy".
ALTER TABLE "branches" ALTER COLUMN "radiusM" DROP NOT NULL;
ALTER TABLE "branches" ALTER COLUMN "radiusM" DROP DEFAULT;

-- Every existing branch carries the tenant-wide value that the old blanket
-- updateMany wrote. NULL those rows so they follow the tenant default and
-- behave exactly as they do today; anything that already differs is kept as
-- a deliberate override.
UPDATE "branches" b SET "radiusM" = NULL
WHERE b."radiusM" = COALESCE((
  SELECT (p."value"->>'radiusM')::int
  FROM "tenant_policies" p
  WHERE p."tenantId" = b."tenantId"
    AND p."key" = 'attendance'
    AND p."isCurrent" = true
  ORDER BY p."version" DESC
  LIMIT 1
), 300);

-- Filtering attendance and people by location.
CREATE INDEX "attendance_records_tenantId_branchId_workDate_idx"
  ON "attendance_records"("tenantId", "branchId", "workDate");
CREATE INDEX "tenant_memberships_tenantId_branchId_idx"
  ON "tenant_memberships"("tenantId", "branchId");
