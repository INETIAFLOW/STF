import Image from "next/image";
import { cn } from "@/lib/cn";
import { NotificationBell } from "@/components/actions/NotificationBell";

/**
 * Top bars (component-specifications.md §17).
 * Admin: page context + THE TENANT COMPANY NAME ALWAYS VISIBLE
 * (multi-tenant safety) + notifications + skip link handled in layout.
 * Employee mobile: logo symbol, screen title, one action.
 */

export function AdminTopBar({
  tenantName,
  notificationCount = 0,
}: {
  tenantName: string;
  notificationCount?: number;
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-[var(--stf-layout-top-bar-height-desktop)] items-center justify-between gap-4",
        "border-b border-border-default bg-surface-default px-5 lg:px-8",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="truncate text-label text-text-secondary">
          {tenantName}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <NotificationBell initialUnread={notificationCount} />
      </div>
    </header>
  );
}

export function EmployeeTopBar({
  title,
  notificationCount = 0,
}: {
  title: string;
  notificationCount?: number;
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-[var(--stf-layout-top-bar-height-mobile)] items-center gap-3",
        "border-b border-border-default bg-surface-default px-5",
      )}
    >
      <Image
        src="/brand/STF-favicon.svg"
        alt=""
        width={24}
        height={24}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1 truncate text-label text-text-primary">
        {title}
      </span>
      {/* A team leader approves work from the same phone they check in on,
          so the bell belongs here too, not only in the admin shell. */}
      <NotificationBell initialUnread={notificationCount} />
    </header>
  );
}
