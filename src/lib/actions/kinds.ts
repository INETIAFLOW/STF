/**
 * The kinds of decision that can raise an action tile.
 *
 * A deliberate boundary: **this queue routes and chases decisions that
 * already exist.** Every kind here maps to an approval surface STF already
 * had — attendance exceptions, leave, task proof. Nothing in this file
 * invents a new gate that work has to pass through.
 *
 * Which is why an ordinary check-in is absent. Thirty people checking in on
 * time raises nothing; the one who checked in from outside the permitted
 * area raises a tile, because that is the one a human has to rule on. A
 * product that pops a modal for the other twenty-nine gets its
 * notifications switched off in a week, and then the exception is missed
 * too (MODULES.md → Notifications; edge-cases.md → "alert fatigue").
 */

export const ACTION_KINDS = [
  "ATTENDANCE_EXCEPTION",
  "LEAVE_REQUEST",
  "TASK_PROOF",
  "EMPLOYEE_INVITE",
] as const;

export type ActionKind = (typeof ACTION_KINDS)[number];

/**
 * Can this be approved straight from the tile?
 *
 * Only where approving needs no further input. Leave is the instructive
 * exception: approving it requires choosing paid or unpaid, which changes
 * what someone is paid — so a one-tap Approve would be a decision made
 * without its consequence on screen, which is the one thing STF does not
 * do (integrity pattern 1). Those open the full approval card instead.
 *
 * Rejecting is never inline: a rejection always needs a reason, and the
 * employee reads that reason word for word (Constitution §4).
 */
export const APPROVE_INLINE: Record<
  ActionKind,
  { allowed: boolean; because?: string }
> = {
  ATTENDANCE_EXCEPTION: { allowed: true },
  LEAVE_REQUEST: {
    allowed: false,
    because: "Approving leave means choosing paid or unpaid.",
  },
  TASK_PROOF: { allowed: true },
  // An invitation is not approved or rejected — it is chased. The tile
  // links to the person so an admin can resend or correct the address.
  EMPLOYEE_INVITE: { allowed: false, because: "Nothing to approve — chase or correct it." },
};

/** What the button that leaves the tile should say. */
export function openLabel(kind: ActionKind): string {
  switch (kind) {
    case "ATTENDANCE_EXCEPTION":
      return "Review";
    case "LEAVE_REQUEST":
      return "Review leave";
    case "TASK_PROOF":
      return "Review proof";
    case "EMPLOYEE_INVITE":
      return "Open profile";
  }
}

export function isActionKind(value: string): value is ActionKind {
  return (ACTION_KINDS as readonly string[]).includes(value);
}
