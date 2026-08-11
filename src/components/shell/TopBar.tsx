import Image from "next/image";
import { cn } from "@/lib/cn";
import { NotificationBell } from "@/components/actions/NotificationBell";
import { MobileNav } from "./MobileNav";
import type { NavItem } from "@/lib/shell/nav";

/**
 * Top bars (component-specifications.md §17).
 * Admin: page context + THE TENANT COMPANY NAME ALWAYS VISIBLE
 * (multi-tenant safety) + notifications.
 * Employee mobile: logo symbol, screen title, one action.
 *
 * Both carry the menu button below `md`, because the sidebar is hidden
 * there and it is otherwise the only way to reach the rest of the app.
 */

interface NavProps {
  items: NavItem[];
  configItems?: NavItem[];
  userName: string;
  roleName: string;
}

export function AdminTopBar({
  tenantName,
  notificationCount = 0,
  nav,
}: {
  tenantName: string;
  notificationCount?: number;
  nav: NavProps;
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-[var(--stf-layout-top-bar-height-desktop)] items-center justify-between gap-4",
        "border-b border-border-default bg-surface-default px-5 lg:px-8",
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <MobileNav {...nav} />
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
  nav,
}: {
  title: string;
  notificationCount?: number;
  nav: NavProps;
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-[var(--stf-layout-top-bar-height-mobile)] items-center gap-2",
        "border-b border-border-default bg-surface-default px-5",
      )}
    >
      <MobileNav {...nav} />
      <Image
        src="/brand/STF-favicon.svg"
        alt=""
        width={24}
        height={24}
        aria-hidden="true"
        className="md:hidden"
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
