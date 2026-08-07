"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarDays,
  ChartNoAxesColumn,
  Clock,
  FileClock,
  History,
  LayoutDashboard,
  ListChecks,
  LogOut,
  ReceiptIndianRupee,
  ShieldCheck,
  ToggleRight,
  Users,
} from "lucide-react";
import type { ModuleKey } from "@/lib/catalog";
import { cn } from "@/lib/cn";

/**
 * Admin desktop sidebar (component-specifications.md §16).
 * - Light surface, 1px right border — not a dark rail.
 * - Only ENABLED modules appear; a module the role cannot access is
 *   absent, not greyed. Server-side guards remain the enforcement.
 * - 240px at lg+, 72px icon rail at md, drawer below (via [data-rail]).
 * - Active item: primarySubtle bg + primary text + 3px left indicator.
 */
export interface SidebarProps {
  enabledModules: ModuleKey[];
  /** Permission keys of the current session (already resolved server-side). */
  can: {
    modules: boolean;
    roles: boolean;
    settings: boolean;
    audit: boolean;
  };
  userName: string;
  roleName: string;
}

const MODULE_NAV: Array<{
  module: ModuleKey | null;
  href: string;
  label: string;
  icon: typeof Clock;
}> = [
  { module: null, href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { module: "ATTENDANCE", href: "/admin/attendance", label: "Attendance", icon: Clock },
  { module: "EMPLOYEES", href: "/admin/employees", label: "Employees", icon: Users },
  { module: "LEAVE", href: "/admin/leave", label: "Leave", icon: CalendarDays },
  { module: "TASKS", href: "/admin/tasks", label: "Tasks", icon: ListChecks },
  { module: "PAYROLL", href: "/admin/payroll", label: "Payroll", icon: ReceiptIndianRupee },
  { module: "DAILY_REPORTING", href: "/admin/daily-report", label: "Daily report", icon: FileClock },
  { module: null, href: "/admin/reports", label: "Reports", icon: ChartNoAxesColumn },
];

export function Sidebar({ enabledModules, can, userName, roleName }: SidebarProps) {
  const pathname = usePathname();

  const configItems = [
    can.modules && {
      href: "/admin/modules",
      label: "Module Management",
      icon: ToggleRight,
    },
    can.roles && {
      href: "/admin/roles",
      label: "Roles & permissions",
      icon: ShieldCheck,
    },
    can.settings && {
      href: "/admin/settings",
      label: "Company settings",
      icon: Building2,
    },
    can.audit && {
      href: "/admin/activity",
      label: "Activity log",
      icon: History,
    },
  ].filter(Boolean) as Array<{ href: string; label: string; icon: typeof Clock }>;

  const navItems = MODULE_NAV.filter(
    (item) => item.module === null || enabledModules.includes(item.module),
  );

  function NavLink({
    href,
    label,
    icon: Icon,
  }: {
    href: string;
    label: string;
    icon: typeof Clock;
  }) {
    const active =
      href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        title={label}
        className={cn(
          "relative flex h-10 items-center gap-3 rounded-md px-3 text-secondary",
          "md:justify-center lg:justify-start",
          active
            ? "bg-brand-primary-subtle font-semibold text-brand-primary"
            : "text-text-secondary hover:bg-surface-sunken hover:text-text-primary",
        )}
      >
        {active && (
          <span
            aria-hidden="true"
            className="absolute left-0 h-5 w-[3px] rounded-r-xs bg-brand-primary"
          />
        )}
        <Icon aria-hidden="true" className="size-5 shrink-0" />
        <span className="truncate md:hidden lg:inline">{label}</span>
      </Link>
    );
  }

  return (
    <nav
      aria-label="Modules"
      className={cn(
        "hidden h-dvh shrink-0 flex-col border-r border-border-default bg-surface-default",
        "md:flex md:w-[var(--stf-layout-sidebar-width-collapsed)]",
        "lg:w-[var(--stf-layout-sidebar-width)]",
      )}
    >
      <div className="flex h-16 items-center gap-2.5 px-4">
        <Image
          src="/brand/STF-favicon.svg"
          alt=""
          width={26}
          height={26}
          aria-hidden="true"
        />
        <span className="font-heading text-h3 text-text-primary md:hidden lg:inline">
          STF
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-3 py-2">
        <ul className="flex flex-col gap-0.5">
          {navItems.map((item) => (
            <li key={item.href}>
              <NavLink {...item} />
            </li>
          ))}
        </ul>

        {configItems.length > 0 && (
          <div>
            <p className="micro-label mb-1.5 px-3 text-text-tertiary md:hidden lg:block">
              Configuration
            </p>
            <ul className="flex flex-col gap-0.5">
              {configItems.map((item) => (
                <li key={item.href}>
                  <NavLink {...item} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="border-t border-border-default p-3">
        <div className="flex items-center gap-3 px-1">
          <span
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-md bg-brand-primary-subtle font-heading text-label text-brand-primary"
          >
            {userName
              .split(/\s+/)
              .slice(0, 2)
              .map((part) => part[0] ?? "")
              .join("")
              .toUpperCase()}
          </span>
          <span className="min-w-0 md:hidden lg:block">
            <span className="block truncate text-secondary font-medium text-text-primary">
              {userName}
            </span>
            <span className="block truncate text-caption text-text-secondary">
              {roleName}
            </span>
          </span>
        </div>
        <form action="/auth/sign-out" method="post" className="mt-2">
          <button
            type="submit"
            className="flex h-10 w-full items-center gap-3 rounded-md px-3 text-secondary text-text-secondary hover:bg-surface-sunken hover:text-text-primary md:justify-center lg:justify-start"
          >
            <LogOut aria-hidden="true" className="size-5 shrink-0" />
            <span className="md:hidden lg:inline">Sign out</span>
          </button>
        </form>
      </div>
    </nav>
  );
}
