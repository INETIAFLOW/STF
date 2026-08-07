"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleUser, Clock, House, ListChecks } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Employee bottom navigation (component-specifications.md §15).
 * - Max 4 items, labels ALWAYS visible, no centre FAB.
 * - Active = colour + 3px top indicator (never colour alone).
 * - Items for disabled modules are absent — the bar re-balances.
 * - Hidden at md and above.
 */
export interface BottomNavProps {
  /** Enabled module keys for the tenant — drives which items exist. */
  showTasks: boolean;
  showAttendance: boolean;
}

export function BottomNav({ showTasks, showAttendance }: BottomNavProps) {
  const pathname = usePathname();

  const items = [
    { href: "/home", label: "Home", icon: House, show: true },
    { href: "/tasks", label: "Tasks", icon: ListChecks, show: showTasks },
    {
      href: "/attendance",
      label: "Attendance",
      icon: Clock,
      show: showAttendance,
    },
    { href: "/profile", label: "Profile", icon: CircleUser, show: true },
  ].filter((item) => item.show);

  return (
    <nav
      aria-label="Main"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border-default bg-surface-default",
        "pb-[env(safe-area-inset-bottom)] md:hidden",
      )}
    >
      <ul
        className="grid h-[var(--stf-layout-bottom-nav-height)]"
        style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}
      >
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <li key={item.href} className="relative">
              {/* 3px top indicator: state is never colour alone. */}
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute top-0 left-1/2 h-[3px] w-10 -translate-x-1/2 rounded-b-xs bg-brand-primary"
                />
              )}
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-full min-h-12 flex-col items-center justify-center gap-0.5",
                  active ? "text-brand-primary" : "text-text-tertiary",
                )}
              >
                <Icon aria-hidden="true" className="size-6" />
                <span className="text-caption font-semibold">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
