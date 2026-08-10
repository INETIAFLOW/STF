import "server-only";

import { getDb } from "@/lib/db";
import { devFixtureOffline } from "@/lib/auth/fixture";
import type { AppSession } from "@/lib/auth/types";
import { isTileVisible } from "./snooze";
import { resolveAudience, DECIDING_PERMISSION, type AudienceCandidate } from "./audience";
import type { ActionKind } from "./kinds";

/**
 * The action queue — durable "somebody must decide this" records.
 *
 * Raised alongside the existing notification, never instead of it: the bell
 * is the record that something happened, the tile is the request for a
 * decision. Suppressing one to make room for the other would lose history.
 *
 * Raising a tile NEVER fails the thing that caused it. If a leave request
 * saves but its tile cannot be written, the leave request still stands and
 * the failure is logged — an approval queue is a convenience layered on
 * top of records that are already correct.
 */

export interface RaiseInput {
  tenantId: string;
  kind: ActionKind;
  /** The row being decided about, e.g. "attendance_record". */
  subjectType: string;
  subjectId: string;
  /** Whose work it is — used to find their department head. */
  aboutMembershipId?: string | null;
  title: string;
  body?: string;
  href: string;
  /** Who caused it; never asked to decide their own request. */
  actorUserId?: string | null;
}

/**
 * Everyone who could decide this, with the department head marked.
 *
 * One query, filtered by tenant. The permission join is the same one the
 * notification fan-out uses, so the tile and the bell agree on who counts.
 */
async function loadCandidates(
  tenantId: string,
  kind: ActionKind,
  aboutMembershipId?: string | null,
): Promise<{ candidates: AudienceCandidate[]; departmentName: string | null; aboutUserId: string | null }> {
  const db = getDb();
  const permission = DECIDING_PERMISSION[kind];

  const about = aboutMembershipId
    ? await db.tenantMembership.findFirst({
        where: { id: aboutMembershipId, tenantId },
        select: {
          userId: true,
          department: { select: { id: true, name: true, headId: true, isActive: true } },
        },
      })
    : null;

  const department = about?.department?.isActive ? about.department : null;

  const able = await db.tenantMembership.findMany({
    where: {
      tenantId,
      status: "ACTIVE",
      role: { permissions: { some: { permission: { key: permission } } } },
    },
    select: {
      id: true,
      userId: true,
      user: { select: { displayName: true } },
    },
  });

  return {
    candidates: able.map((m) => ({
      userId: m.userId,
      membershipId: m.id,
      displayName: m.user.displayName,
      canDecide: true,
      isDepartmentHead: Boolean(department?.headId && department.headId === m.id),
    })),
    departmentName: department?.name ?? null,
    aboutUserId: about?.userId ?? null,
  };
}

/** Raise (or refresh) a decision request. Idempotent per subject. */
export async function raiseActionRequest(input: RaiseInput): Promise<void> {
  if (devFixtureOffline()) return;

  try {
    const db = getDb();
    const { candidates, departmentName, aboutUserId } = await loadCandidates(
      input.tenantId,
      input.kind,
      input.aboutMembershipId,
    );

    const recipients = resolveAudience({
      candidates,
      actorUserId: input.actorUserId,
      aboutUserId,
      departmentName,
    });
    if (recipients.length === 0) return; // nobody can act; the bell still fired

    const request = await db.actionRequest.upsert({
      where: {
        tenantId_subjectType_subjectId: {
          tenantId: input.tenantId,
          subjectType: input.subjectType,
          subjectId: input.subjectId,
        },
      },
      create: {
        tenantId: input.tenantId,
        kind: input.kind,
        subjectType: input.subjectType,
        subjectId: input.subjectId,
        aboutMembershipId: input.aboutMembershipId ?? null,
        title: input.title,
        body: input.body,
        href: input.href,
      },
      // Re-raising a resolved subject (proof resubmitted after rejection)
      // reopens the same row rather than accumulating duplicates.
      update: {
        status: "PENDING",
        title: input.title,
        body: input.body,
        href: input.href,
        resolvedAt: null,
        resolvedByUserId: null,
        resolution: null,
      },
    });

    await db.actionRequestRecipient.deleteMany({
      where: { actionRequestId: request.id },
    });
    await db.actionRequestRecipient.createMany({
      data: recipients.map((r) => ({
        actionRequestId: request.id,
        tenantId: input.tenantId,
        userId: r.userId,
        reason: r.reason,
      })),
    });
  } catch (error) {
    // Never let the queue break the thing it is about.
    console.error("[action-request:raise-failed]", input.subjectType, input.subjectId, error);
  }
}

/** Mark a decision made, so the tile clears for everyone at once. */
export async function resolveActionRequest(input: {
  tenantId: string;
  subjectType: string;
  subjectId: string;
  resolvedByUserId: string;
  resolution: string;
}): Promise<void> {
  if (devFixtureOffline()) return;
  try {
    await getDb().actionRequest.updateMany({
      where: {
        tenantId: input.tenantId,
        subjectType: input.subjectType,
        subjectId: input.subjectId,
        status: { in: ["PENDING", "SNOOZED"] },
      },
      data: {
        status: "RESOLVED",
        resolvedAt: new Date(),
        resolvedByUserId: input.resolvedByUserId,
        resolution: input.resolution,
      },
    });
  } catch (error) {
    console.error("[action-request:resolve-failed]", input.subjectId, error);
  }
}

export interface ActionTile {
  id: string;
  kind: ActionKind;
  title: string;
  body: string | null;
  href: string;
  reason: string;
  snoozeCount: number;
  raisedAt: string;
}

/**
 * What this person is being asked to decide right now.
 *
 * Snoozed rows are filtered in the query AND re-checked in memory: the
 * database comparison uses the server clock, and the in-memory pass is what
 * the pure tests exercise.
 */
export async function loadActionTiles(
  session: AppSession,
  now: Date = new Date(),
  limit = 20,
): Promise<ActionTile[]> {
  if (devFixtureOffline()) return [];

  const rows = await getDb().actionRequestRecipient.findMany({
    where: {
      tenantId: session.tenant.id,
      userId: session.user.id,
      OR: [{ snoozedUntil: null }, { snoozedUntil: { lte: now } }],
      actionRequest: { status: { in: ["PENDING", "SNOOZED"] } },
    },
    include: { actionRequest: true },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  return rows
    .filter((r) => isTileVisible(r, now))
    .map((r) => ({
      id: r.actionRequest.id,
      kind: r.actionRequest.kind as ActionKind,
      title: r.actionRequest.title,
      body: r.actionRequest.body,
      href: r.actionRequest.href,
      reason: r.reason,
      snoozeCount: r.snoozeCount,
      raisedAt: r.actionRequest.createdAt.toISOString(),
    }));
}

/** Count only — for the bell badge, without shipping every tile. */
export async function countActionTiles(
  tenantId: string,
  userId: string,
  now: Date = new Date(),
): Promise<number> {
  if (devFixtureOffline()) return 0;
  return getDb().actionRequestRecipient.count({
    where: {
      tenantId,
      userId,
      OR: [{ snoozedUntil: null }, { snoozedUntil: { lte: now } }],
      actionRequest: { status: { in: ["PENDING", "SNOOZED"] } },
    },
  });
}
