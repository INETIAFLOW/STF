-- Enquiries from the marketing site.
--
-- Additive: a new table and a new enum. Nothing existing is touched.
--
-- Not tenant-scoped, because a prospect has no company here yet. RLS is
-- applied by scripts/setup-rls.ts, which owns that list — it holds the
-- personal details of people who are not customers, so it belongs there
-- even though it is not tenant-owned.

CREATE TYPE "DemoRequestStatus" AS ENUM ('NEW', 'CONTACTED', 'CONVERTED', 'CLOSED');

CREATE TABLE "demo_requests" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "teamSize" TEXT,
    "notes" TEXT,
    "status" "DemoRequestStatus" NOT NULL DEFAULT 'NEW',
    "handledById" UUID,
    "handledAt" TIMESTAMP(3),
    "handledNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demo_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "demo_requests_status_createdAt_idx"
    ON "demo_requests"("status", "createdAt");

ALTER TABLE "demo_requests" ADD CONSTRAINT "demo_requests_handledById_fkey"
    FOREIGN KEY ("handledById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
