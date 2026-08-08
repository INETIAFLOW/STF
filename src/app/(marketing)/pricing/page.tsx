import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Pricing is being finalised. Talk to us for a quote.",
};

/**
 * Pricing placeholder (screen M5, decision D-018).
 * All prices render as `₹ —`. No numbers until pricing is set and
 * approved for publication.
 */
const tiers = [
  {
    name: "Starter",
    for: "A single shop or counter team",
    includes: ["Attendance", "Tasks", "Leave", "Daily summary"],
  },
  {
    name: "Operations",
    for: "Warehouse, dispatch and delivery teams",
    includes: [
      "Everything in Starter",
      "Payroll inputs and payslips",
      "Reports and export",
      "Module controls",
    ],
  },
  {
    name: "Multi-branch",
    for: "Several branches under one owner",
    includes: [
      "Everything in Operations",
      "Branch-level review",
      "Role and permission controls",
      "Activity log",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-[1200px] px-5 py-16 lg:px-8">
      <h1 className="font-heading text-h1 text-text-primary">
        Pricing is being finalised
      </h1>
      <p className="mt-3 max-w-[72ch] text-body-lg text-text-secondary">
        We are working with our first businesses to set pricing that makes
        sense for a 15-person shop and a 300-person warehouse alike. Talk to
        us and we will quote for your team size and modules.
      </p>

      <ul className="mt-10 grid gap-4 lg:grid-cols-3">
        {tiers.map((tier) => (
          <li key={tier.name}>
            <Card className="flex h-full flex-col">
              <h2 className="font-heading text-h2 text-text-primary">
                {tier.name}
              </h2>
              <p className="mt-1 text-secondary text-text-secondary">
                {tier.for}
              </p>
              <p className="mt-4 font-mono text-data-lg font-semibold text-text-primary tabular-nums">
                ₹ —
              </p>
              <p className="text-caption text-text-tertiary">
                Quoted for your team
              </p>
              <ul className="mt-4 flex flex-1 flex-col gap-1.5 text-body text-text-secondary">
                {tier.includes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <Link
                href="/demo"
                className="mt-5 inline-flex h-11 items-center justify-center rounded-button border-[1.5px] border-border-strong bg-surface-default px-5 font-heading text-label text-text-primary hover:bg-surface-sunken"
              >
                Get a quote
              </Link>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
