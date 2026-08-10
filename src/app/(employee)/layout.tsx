import { requireSession } from "@/lib/authz/guard";
import { loadEntitlements } from "@/lib/authz/entitlements";
import { BottomNav } from "@/components/shell/BottomNav";
import { EmployeeTopBar } from "@/components/shell/TopBar";
import { ToastProvider } from "@/components/ui/Toast";
import { OfflineProvider } from "@/lib/offline/OfflineProvider";
import { OfflineBar } from "@/components/offline/OfflineBar";
import { unreadNotificationCount } from "@/lib/notifications";
import { ActionQueueProvider } from "@/lib/actions/ActionQueueProvider";
import { ActionTiles } from "@/components/actions/ActionTiles";

/**
 * Employee mobile shell: warm surface, top bar, bottom navigation.
 * Nav items exist only for enabled modules — the bar re-balances when a
 * module is off (Constitution §5; the server guards stay authoritative).
 */
export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const entitlements = await loadEntitlements(
    session.tenant.id,
    session.user.id,
  );
  const unread = await unreadNotificationCount(
    session.tenant.id,
    session.user.id,
  );

  return (
    <div data-surface="employee" className="min-h-dvh">
      <ToastProvider>
        <OfflineProvider>
        <ActionQueueProvider enabled={session.source === "supabase"}>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-surface-default focus:px-3 focus:py-2"
          >
            Skip to content
          </a>
          <EmployeeTopBar
            title={session.tenant.name}
            notificationCount={unread}
          />
          {/* Persistent while offline, and not dismissible. */}
          <OfflineBar />
          <main
            id="main"
            className="mx-auto w-full max-w-[640px] px-5 pt-4 pb-[calc(var(--stf-layout-bottom-nav-height)+env(safe-area-inset-bottom)+var(--stf-space-6))]"
          >
            {children}
          </main>
          <BottomNav
            showTasks={entitlements.modules.TASKS === true}
            showAttendance={entitlements.modules.ATTENDANCE === true}
          />
          {/* Leave lives under Profile — the bottom bar is capped at four
              items with permanent labels (decision D-015). */}
          <ActionTiles />
        </ActionQueueProvider>
        </OfflineProvider>
      </ToastProvider>
    </div>
  );
}
