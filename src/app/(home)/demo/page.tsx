import type { Metadata } from "next";
import Link from "next/link";
import { DemoForm } from "./DemoForm";

export const metadata: Metadata = {
  title: "Request a demo",
  description:
    "A 30-minute walkthrough using your shifts and branches, with sample data.",
};

/**
 * Request a demo (screen M6), in the marketing design language.
 *
 * It moved into the (home) group with the redesign for one reason: every
 * call to action on the landing page points here. Leaving it under the old
 * shell meant each of those buttons handed the visitor from one design to
 * another mid-sentence, which reads as two different products.
 *
 * The right column answers the two questions this page actually receives —
 * "I already have an account" and "I can't get in" — because both look
 * like a demo request to someone who cannot find the door.
 */
export default function DemoPage() {
  return (
    <div className="m-shell grid gap-10 pb-24 pt-[130px] lg:grid-cols-[1.15fr_1fr]">
      <div>
        <p className="m-eyebrow mb-3.5">REQUEST A DEMO</p>
        <h1 className="m-h2 mb-3.5">See your own team&apos;s day in one place.</h1>
        <p className="m-section-lede mb-9 max-w-[52ch]">
          Thirty minutes, using your shifts and branches. We will show attendance, tasks and a
          payroll preview with sample data — no setup needed on your side.
        </p>

        <DemoForm />
      </div>

      <aside className="flex flex-col gap-4 lg:pt-[76px]">
        <div className="m-card p-6">
          <h2 className="m-h3 mb-2">Already have an account?</h2>
          <p className="text-[14px] leading-[1.55] text-[color:var(--m-muted)]">
            STF accounts are created by your company, never by us.
          </p>
          <Link href="/sign-in" className="m-btn-primary mt-4 px-6 py-3 text-[15px]">
            Sign in
          </Link>
        </div>

        <div className="m-card p-6">
          <h2 className="m-h3 mb-2">Can&apos;t sign in?</h2>
          <p className="text-[14px] leading-[1.55] text-[color:var(--m-muted)]">
            Ask your company&apos;s admin or owner to check your details and role. STF support
            cannot open your company&apos;s data without a logged, time-bound request from your
            owner.
          </p>
        </div>

        <div className="rounded-2xl bg-[color:var(--m-navy)] p-6 text-[color:var(--m-cream)]">
          <h2 className="m-h3 mb-3 text-[color:var(--m-cream)]">What the 30 minutes covers</h2>
          <ul className="flex flex-col gap-2.5 text-[14px]">
            {[
              "Check-in on a phone, at a branch you name",
              "A task assigned, done, and closed with proof",
              "A leave request reaching the right manager",
              "A payroll preview built from that day's records",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2.5">
                <span
                  className="mt-[3px] size-2 flex-none rounded-full bg-[color:var(--m-green-on-dark)]"
                  aria-hidden="true"
                />
                <span className="text-[color:var(--m-on-navy-2)]">{line}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[12.5px] text-[color:var(--m-on-navy)]">
            No card. No setup fee for the pilot branch.
          </p>
        </div>
      </aside>
    </div>
  );
}
