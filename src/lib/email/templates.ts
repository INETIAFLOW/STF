/**
 * Email bodies. Pure functions so the wording is unit-tested rather than
 * discovered in someone's inbox.
 *
 * Written to voice-and-microcopy.md: plain, specific, no marketing, no
 * urgency theatre. The recipient is a warehouse supervisor or a delivery
 * driver, and this may be the first they have heard of STF — so the first
 * line says who it is from and why, and the deadline is a date rather than
 * "act now".
 *
 * Plain text is composed first and the HTML mirrors it exactly. Many
 * workers read mail in clients that strip HTML entirely, and the two must
 * not say different things.
 */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatInviteDate(at: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone,
  }).format(at);
}

export interface InviteEmailInput {
  employeeName: string;
  companyName: string;
  invitedByName: string;
  url: string;
  expiresAt: Date;
  timeZone: string;
  /** True when this is a repeat send, so the recipient is not confused. */
  isResend?: boolean;
}

export function inviteEmail(input: InviteEmailInput): {
  subject: string;
  text: string;
  html: string;
} {
  const expiry = formatInviteDate(input.expiresAt, input.timeZone);
  const firstName = input.employeeName.trim().split(/\s+/)[0] || "there";

  const subject = input.isResend
    ? `Your ${input.companyName} sign-in link (sent again)`
    : `${input.companyName} has set up your STF account`;

  const opening = input.isResend
    ? `Here is your sign-in link again, in case the first one didn't reach you.`
    : `${input.invitedByName} has set up an account for you on Sudarshan Task Force, which ${input.companyName} uses for attendance, leave and daily work.`;

  const lines = [
    `Hello ${firstName},`,
    "",
    opening,
    "",
    "Set your password here:",
    input.url,
    "",
    `This link works until ${expiry}. After that, ask ${input.invitedByName} to send a new one.`,
    "",
    "Don't share this link — anyone who opens it can set the password on your account.",
    "",
    `If you weren't expecting this, you can ignore it and nothing will happen. You can also tell ${input.invitedByName}.`,
  ];
  const text = lines.join("\n");

  const html = `<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;font-size:16px;line-height:1.6;color:#1A1A1A;max-width:520px">
<p>Hello ${escapeHtml(firstName)},</p>
<p>${escapeHtml(opening)}</p>
<p style="margin:28px 0">
  <a href="${escapeHtml(input.url)}" style="display:inline-block;background:#1F5FA9;color:#FFFFFF;text-decoration:none;padding:14px 24px;border-radius:12px;font-weight:600">Set your password</a>
</p>
<p style="font-size:14px;color:#5A5A5A">Or paste this into your browser:<br><span style="word-break:break-all">${escapeHtml(input.url)}</span></p>
<p>This link works until <strong>${escapeHtml(expiry)}</strong>. After that, ask ${escapeHtml(input.invitedByName)} to send a new one.</p>
<p><strong>Don't share this link</strong> — anyone who opens it can set the password on your account.</p>
<p style="font-size:14px;color:#5A5A5A">If you weren't expecting this, you can ignore it and nothing will happen. You can also tell ${escapeHtml(input.invitedByName)}.</p>
</div>`;

  return { subject, text, html };
}
