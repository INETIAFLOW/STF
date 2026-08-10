"use client";

import Link from "next/link";
import { Bell, Volume2, VolumeX } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { useActionQueue } from "@/lib/actions/ActionQueueProvider";
import { soundSupported } from "@/lib/actions/chime";

/**
 * The bell, and the control for the sound.
 *
 * The badge counts **decisions waiting** first and unread notices second,
 * because they are different things: one is work, the other is news. When
 * both exist the badge shows the decisions and the accessible name says
 * both, so a screen-reader user is not given the smaller truth.
 *
 * The sound toggle lives here rather than in Settings on purpose — the
 * moment someone wants to turn a sound off is the moment it just went off,
 * and making them hunt through Settings for it is how a product earns
 * having its notifications disabled at the OS level instead.
 */
export function NotificationBell({
  initialUnread = 0,
}: {
  initialUnread?: number;
}) {
  const { tiles, unread, soundOn, toggleSound } = useActionQueue();

  const decisions = tiles.length;
  // Before the first poll returns, the server-rendered count is the truth.
  const notices = unread || initialUnread;
  const badge = decisions > 0 ? decisions : notices;

  const label =
    decisions > 0 && notices > 0
      ? `Notifications: ${decisions} waiting for a decision, ${notices} unread`
      : decisions > 0
        ? `Notifications: ${decisions} waiting for a decision`
        : notices > 0
          ? `Notifications, ${notices} unread`
          : "Notifications";

  return (
    <div className="flex items-center gap-1">
      {soundSupported() && (
        <IconButton
          label={
            soundOn
              ? "Notification sound is on. Turn it off"
              : "Notification sound is off. Turn it on"
          }
          onClick={toggleSound}
        >
          {soundOn ? <Volume2 /> : <VolumeX />}
        </IconButton>
      )}

      <Link
        href="/notifications"
        aria-label={label}
        className="relative inline-flex size-11 items-center justify-center rounded-button text-text-secondary hover:bg-surface-sunken focus-visible:outline-none focus-visible:[box-shadow:var(--stf-shadow-focus-ring)]"
      >
        <Bell aria-hidden="true" />
        {badge > 0 && (
          <span
            aria-hidden="true"
            className={
              decisions > 0
                ? "absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-pill bg-status-warning-fg px-1 font-mono text-[10px] font-semibold text-white"
                : "absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-pill bg-brand-primary px-1 font-mono text-[10px] font-semibold text-text-on-primary"
            }
          >
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </Link>
    </div>
  );
}
