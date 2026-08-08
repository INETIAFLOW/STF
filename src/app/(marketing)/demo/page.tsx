import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { DemoForm } from "./DemoForm";

export const metadata: Metadata = {
  title: "Request a demo",
  description:
    "A 30-minute walkthrough using your shifts and branches, with sample data.",
};

/** Request demo + sign-in explainer (screen M6). */
export default function DemoPage() {
  return (
    <div className="mx-auto grid max-w-[1200px] gap-8 px-5 py-16 lg:grid-cols-2 lg:px-8">
      <div>
        <h1 className="font-heading text-h1 text-text-primary">
          Request a demo
        </h1>
        <p className="mt-3 max-w-[60ch] text-body-lg text-text-secondary">
          30 minutes, using your shifts and branches. We will show
          attendance, tasks and a payroll preview with sample data.
        </p>

        <div className="mt-8">
          <DemoForm />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader title="Already have an account?" />
          <p className="text-body text-text-secondary">
            STF accounts are created by your company.
          </p>
          <Link
            href="/sign-in"
            className="mt-4 inline-flex h-11 items-center rounded-button bg-brand-primary px-5 font-heading text-label text-text-on-primary hover:bg-brand-primary-hover"
          >
            Sign in
          </Link>
        </Card>

        <Card>
          <CardHeader title="Can't sign in?" />
          <p className="text-body text-text-secondary">
            Ask your company&apos;s admin or owner to check your number and
            role. STF support cannot open your company&apos;s data without a
            logged, time-bound request from your owner.
          </p>
        </Card>
      </div>
    </div>
  );
}
