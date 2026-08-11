"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { isActiveNav, type NavItem } from "@/lib/shell/nav";
import { NAV_ICONS } from "./nav-icons";
import { cn } from "@/lib/cn";

/**
 * Left navigation (component-specifications.md §16).
 * - Light surface, 1px right border — not a dark rail.
 * - 240px at lg+, 72px icon rail at md, hidden below md where `MobileNav`
 *   takes over.
 * - Active item: primarySubtle bg + primary text + 3px left indicator, so
 *   state is never colour alone.
 *
 * Takes its items as props rather than computing them, because BOTH
 * surfaces use it: admin, and — since employees previously had no
 * navigation at all above md — the employee shell too.
 */
export interface SidebarProps {
  items: NavItem[];
  /** Second group under a "Configuration" heading. Empty for employees. */
  configItems?: NavItem[];
  userName: string;
  roleName: string;
  /** Names the landmark, e.g. "Modules" or "Your STF". */
  label?: string;
}

export function Sidebar({
  items,
  configItems = [],
  userName,
  roleName,
  label = "Modules",
}: SidebarProps) {
  const pathname = usePathname();

  function NavLink({ href, label: itemLabel, icon }: NavItem) {
    const active = isActiveNav(href, pathname);
    const Icon = NAV_ICONS[icon];
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        title={itemLabel}
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
        <span className="truncate md:hidden lg:inline">{itemLabel}</span>
      </Link>
    );
  }

  return (
    <nav
      aria-label={label}
      className={cn(
        "hidden h-dvh shrink-0 flex-col border-r border-border-default bg-surface-default",
        "md:sticky md:top-0 md:flex md:w-[var(--stf-layout-sidebar-width-collapsed)]",
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
          {items.map((item) => (
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
