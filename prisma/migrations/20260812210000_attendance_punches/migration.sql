-- Multiple punches per work day.
--
-- Additive only: no column is dropped, no existing value rewritten. The
-- day record stays exactly as it was, because payroll counts DAYS PRESENT
-- from it and must not change shape. This table carries the in/out pairs
-- inside a day, so a lunch break stops being counted as worked time.

CREATE TABLE "attendance_punches" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "recordId" UUID NOT NULL,
    "sequence" INTEGER NOT NULL,

    "checkInAt" TIMESTAMP(3) NOT NULL,
    "checkInClientAt" TIMESTAMP(3),
    "checkInLat" DOUBLE PRECISION,
    "checkInLng" DOUBLE PRECISION,
    "checkInAccuracyM" DOUBLE PRECISION,
    "checkInDistanceM" DOUBLE PRECISION,
    "checkInOutcome" "LocationOutcome",
    "checkInReason" TEXT,
    "offlineCaptured" BOOLEAN NOT NULL DEFAULT false,

    "checkOutAt" TIMESTAMP(3),
    "checkOutClientAt" TIMESTAMP(3),
    "checkOutLat" DOUBLE PRECISION,
    "checkOutLng" DOUBLE PRECISION,
    "checkOutOutcome" "LocationOutcome",

    "branchId" UUID,

    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_punches_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "attendance_punches_recordId_sequence_key"
    ON "attendance_punches"("recordId", "sequence");
CREATE INDEX "attendance_punches_tenantId_checkInAt_idx"
    ON "attendance_punches"("tenantId", "checkInAt");

ALTER TABLE "attendance_punches" ADD CONSTRAINT "attendance_punches_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "attendance_punches" ADD CONSTRAINT "attendance_punches_recordId_fkey"
    FOREIGN KEY ("recordId") REFERENCES "attendance_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attendance_punches" ADD CONSTRAINT "attendance_punches_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: every day already recorded becomes its first punch, carrying
-- the times and location it already held. Without this, history would
-- read as "no punches" and hours worked would come out as zero for every
-- past day.
INSERT INTO "attendance_punches" (
    "id", "tenantId", "recordId", "sequence",
    "checkInAt", "checkInClientAt", "checkInLat", "checkInLng",
    "checkInAccuracyM", "checkInDistanceM", "checkInOutcome", "checkInReason",
    "offlineCaptured",
    "checkOutAt", "checkOutClientAt", "checkOutLat", "checkOutLng", "checkOutOutcome",
    "branchId", "createdAt", "updatedAt"
)
SELECT
    gen_random_uuid(), r."tenantId", r."id", 1,
    r."checkInAt", r."checkInClientAt", r."checkInLat", r."checkInLng",
    r."checkInAccuracyM", r."checkInDistanceM", r."checkInOutcome", r."checkInReason",
    r."offlineCaptured",
    r."checkOutAt", r."checkOutClientAt", r."checkOutLat", r."checkOutLng", r."checkOutOutcome",
    r."branchId", r."createdAt", r."updatedAt"
FROM "attendance_records" r
WHERE r."checkInAt" IS NOT NULL;

-- Row Level Security is deliberately NOT set here. It is applied by
-- scripts/setup-rls.ts, which owns the list of tenant tables and uses
-- ENABLE without FORCE — the app connects as the table owner and relies on
-- the owner's exemption. FORCE would remove exactly that exemption and
-- lock the application out of its own table. Run the script after this
-- migration; it is idempotent.
