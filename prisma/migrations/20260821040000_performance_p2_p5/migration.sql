-- Performance phases P2–P5 (PERFORMANCE-MODULE.md): badges and level
-- celebrations, double-points windows, the rewards store, and kudos.
--
-- Additive: new tables and one new enum value; nothing existing touched.
-- RLS is applied by scripts/setup-rls.ts (ENABLE without FORCE), which
-- owns the tenant-table list.

ALTER TYPE "ActionRequestKind" ADD VALUE 'REWARD_REDEMPTION';

CREATE TYPE "RedemptionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

CREATE TABLE "employee_badges" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "membershipId" UUID NOT NULL,
    "badgeKey" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "celebratedAt" TIMESTAMP(3),

    CONSTRAINT "employee_badges_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "employee_badges_tenantId_membershipId_badgeKey_key"
    ON "employee_badges"("tenantId", "membershipId", "badgeKey");
CREATE INDEX "employee_badges_tenantId_membershipId_celebratedAt_idx"
    ON "employee_badges"("tenantId", "membershipId", "celebratedAt");

ALTER TABLE "employee_badges"
    ADD CONSTRAINT "employee_badges_tenantId_fkey" FOREIGN KEY ("tenantId")
        REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "employee_badges_membershipId_fkey" FOREIGN KEY ("membershipId")
        REFERENCES "tenant_memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "performance_boosts" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "multiplier" INTEGER NOT NULL DEFAULT 2,
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "performance_boosts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "performance_boosts_tenantId_startDate_endDate_idx"
    ON "performance_boosts"("tenantId", "startDate", "endDate");

ALTER TABLE "performance_boosts"
    ADD CONSTRAINT "performance_boosts_tenantId_fkey" FOREIGN KEY ("tenantId")
        REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "rewards" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pointCost" INTEGER NOT NULL,
    "stock" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rewards_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "rewards_tenantId_isActive_idx" ON "rewards"("tenantId", "isActive");

ALTER TABLE "rewards"
    ADD CONSTRAINT "rewards_tenantId_fkey" FOREIGN KEY ("tenantId")
        REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "reward_redemptions" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "rewardId" UUID NOT NULL,
    "membershipId" UUID NOT NULL,
    "points" INTEGER NOT NULL,
    "rewardName" TEXT NOT NULL,
    "status" "RedemptionStatus" NOT NULL DEFAULT 'PENDING',
    "decidedById" UUID,
    "decidedAt" TIMESTAMP(3),
    "decisionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reward_redemptions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "reward_redemptions_tenantId_membershipId_status_idx"
    ON "reward_redemptions"("tenantId", "membershipId", "status");
CREATE INDEX "reward_redemptions_tenantId_status_idx"
    ON "reward_redemptions"("tenantId", "status");

ALTER TABLE "reward_redemptions"
    ADD CONSTRAINT "reward_redemptions_tenantId_fkey" FOREIGN KEY ("tenantId")
        REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "reward_redemptions_rewardId_fkey" FOREIGN KEY ("rewardId")
        REFERENCES "rewards"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "reward_redemptions_membershipId_fkey" FOREIGN KEY ("membershipId")
        REFERENCES "tenant_memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "kudos" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "fromMembershipId" UUID NOT NULL,
    "toMembershipId" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kudos_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "kudos_tenantId_toMembershipId_createdAt_idx"
    ON "kudos"("tenantId", "toMembershipId", "createdAt");
CREATE INDEX "kudos_tenantId_fromMembershipId_createdAt_idx"
    ON "kudos"("tenantId", "fromMembershipId", "createdAt");

ALTER TABLE "kudos"
    ADD CONSTRAINT "kudos_tenantId_fkey" FOREIGN KEY ("tenantId")
        REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "kudos_fromMembershipId_fkey" FOREIGN KEY ("fromMembershipId")
        REFERENCES "tenant_memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "kudos_toMembershipId_fkey" FOREIGN KEY ("toMembershipId")
        REFERENCES "tenant_memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
