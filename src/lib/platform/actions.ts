"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/authz/guard";
import { sendMail, emailConfigured } from "@/lib/email/send";
import { provisionTenant } from "./provision";
import {
  MAX_REQUESTS_PER_HOUR,
  normalisePhone,
  validateDemoRequest,
  type DemoRequestInput,
  type DemoRequestStatusKey,
} from "./demo-requests";

type Result =
  | { ok: true; message: string; detail?: string; inviteLink?: string }
  | { ok: false; error: string; field?: string };

/**
 * Submit an enquiry from the marketing site.
 *
 * UNAUTHENTICATED — the only action in STF that is. It therefore assumes
 * nothing: it validates server-side (the client checks are a courtesy),
 * stores only the fields the form asks for, and refuses once the site has
 * taken more enquiries in an hour than a real business ever would.
 */
export async function submitDemoRequestAction(
  input: DemoRequestInput,
): Promise<Result> {
  const problems = validateDemoRequest(input);
  if (problems.length > 0) {
    const first = problems[0];
    return {
      ok: false,
      error: first.message,
      field: first.field === "form" ? undefined : first.field,
    };
  }

  const db = getDb();

  const anHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recent = await db.demoRequest.count({
    where: { createdAt: { gte: anHourAgo } },
  });
  if (recent >= MAX_REQUESTS_PER_HOUR) {
    // Honest about what happened. "Something went wrong" would be a lie,
    // and this person may be a real customer.
    return {
      ok: false,
      error:
        "We're getting an unusual number of enquiries right now and this one wasn't saved. Please call or WhatsApp us instead — we'd rather not lose it.",
    };
  }

  const phone = normalisePhone(input.phone)!;
  const request = await db.demoRequest.create({
    data: {
      name: input.name.trim(),
      company: input.company.trim(),
      phone,
      teamSize: input.teamSize?.trim() || null,
      notes: input.notes?.trim() || null,
    },
  });

  // Stored first, emailed second, and deliberately in that order: an email
  // that fails must not lose the enquiry. The inbox is a convenience; the
  // record is the thing.
  if (emailConfigured()) {
    const to = process.env.SMTP_USER;
    if (to) {
      const lines = [
        `Name:    ${request.name}`,
        `Company: ${request.company}`,
        `Phone:   ${request.phone}`,
        request.teamSize ? `Team:    ${request.teamSize}` : null,
        request.notes ? `\n${request.notes}` : null,
      ].filter(Boolean);
      await sendMail({
        to,
        subject: `STF enquiry — ${request.company}`,
        text: lines.join("\n"),
        html: `<pre style="font:14px ui-monospace,monospace">${lines
          .join("\n")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")}</pre>`,
      });
    }
  }

  return {
    ok: true,
    message: "Thanks — we have your details.",
    detail: "Someone will call you on the number you gave, usually the same working day.",
  };
}

/** Create a customer company from the platform area. */
export async function createTenantAction(input: {
  name: string;
  ownerName: string;
  ownerEmail: string;
  slug?: string;
  timezone?: string;
  fromDemoRequestId?: string;
}): Promise<Result> {
  const session = await requirePlatformAdmin();
  const db = getDb();

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://stf.inetiaflow.com";

  const result = await provisionTenant(db, {
    name: input.name,
    ownerName: input.ownerName,
    ownerEmail: input.ownerEmail,
    slug: input.slug,
    timezone: input.timezone,
    origin,
    actor: { type: "USER", userId: session.user.id, via: "platform area" },
  });

  if (!result.ok) return { ok: false, error: result.error };

  // Close the loop when this came from an enquiry, so the inbox reflects
  // reality without anyone having to remember.
  if (input.fromDemoRequestId) {
    await db.demoRequest.updateMany({
      where: { id: input.fromDemoRequestId, status: { not: "CONVERTED" } },
      data: {
        status: "CONVERTED",
        handledById: session.user.id,
        handledAt: new Date(),
      },
    });
  }

  revalidatePath("/platform");
  revalidatePath("/platform/enquiries");

  return {
    ok: true,
    message: `${input.name.trim()} is set up.`,
    detail: result.alsoOwns.length
      ? `Note: this email already belongs to ${result.alsoOwns.join(", ")}. They now have both.`
      : "Send the owner the link below. It works once, for 7 days.",
    inviteLink: result.inviteLink,
  };
}

/**
 * Suspend or restore a company.
 *
 * Suspending stops everyone in it signing in, because getAppSession()
 * resolves no membership when the tenant is not ACTIVE. Nothing is deleted
 * — attendance, payroll and documents stay exactly as recorded — and
 * restoring puts it all back. That is the difference between "they stopped
 * paying" and "they left", and the two must not be the same button.
 */
export async function setTenantStatusAction(input: {
  tenantId: string;
  status: "ACTIVE" | "SUSPENDED";
  reason: string;
}): Promise<Result> {
  const session = await requirePlatformAdmin();
  const reason = input.reason.trim();
  if (!reason) {
    return { ok: false, error: "Say why. It goes on the record." };
  }

  const db = getDb();
  const tenant = await db.tenant.findUnique({ where: { id: input.tenantId } });
  if (!tenant) return { ok: false, error: "That company no longer exists." };
  if (tenant.status === input.status) {
    return { ok: true, message: `${tenant.name} is already ${input.status.toLowerCase()}.` };
  }

  await db.tenant.update({
    where: { id: tenant.id },
    data: { status: input.status },
  });

  await db.auditEvent.create({
    data: {
      tenantId: tenant.id,
      actorUserId: session.user.id,
      actorType: "USER",
      action: input.status === "SUSPENDED" ? "tenant.suspended" : "tenant.restored",
      entityType: "tenant",
      entityId: tenant.id,
      reason,
      before: { status: tenant.status },
      after: { status: input.status },
    },
  });

  revalidatePath("/platform");

  return {
    ok: true,
    message:
      input.status === "SUSPENDED"
        ? `${tenant.name} is suspended. Nobody there can sign in.`
        : `${tenant.name} is active again.`,
    detail:
      input.status === "SUSPENDED"
        ? "Their data is untouched and comes back when you restore them."
        : undefined,
  };
}

/** Move an enquiry along, with a note about what happened. */
export async function updateDemoRequestAction(input: {
  id: string;
  status: DemoRequestStatusKey;
  note?: string;
}): Promise<Result> {
  const session = await requirePlatformAdmin();
  const db = getDb();

  const existing = await db.demoRequest.findUnique({ where: { id: input.id } });
  if (!existing) return { ok: false, error: "That enquiry no longer exists." };

  await db.demoRequest.update({
    where: { id: input.id },
    data: {
      status: input.status,
      handledById: session.user.id,
      handledAt: new Date(),
      handledNote: input.note?.trim() || existing.handledNote,
    },
  });

  await db.auditEvent.create({
    data: {
      // Platform-level: this enquiry belongs to no company.
      tenantId: null,
      actorUserId: session.user.id,
      actorType: "USER",
      action: "demo_request.updated",
      entityType: "demo_request",
      entityId: input.id,
      before: { status: existing.status },
      after: { status: input.status },
    },
  });

  revalidatePath("/platform/enquiries");
  return { ok: true, message: "Updated." };
}
