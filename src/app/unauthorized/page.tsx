import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "No access" };

/**
 * No-access state (component-specifications.md §22 / §24).
 * Explains who to ask; never a dead end; never reveals whether a record
 * exists.
 */
export default function UnauthorizedPage() {
  return (
    <main
      data-surface="employee"
      className="flex min-h-dvh items-center justify-center px-5"
    >
      <EmptyState
        title="You don't have access to this."
        body="Ask your company owner if you need it."
        action={
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-button bg-brand-primary px-5 font-heading text-label text-text-on-primary hover:bg-brand-primary-hover"
          >
            Go to Home
          </Link>
        }
      />
    </main>
  );
}
