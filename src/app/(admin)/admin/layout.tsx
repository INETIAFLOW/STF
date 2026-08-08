import { requireAdminArea } from "@/lib/authz/guard";
import { loadEntitlements } from "@/lib/authz/entitlements";
import { enabledModuleKeys } from "@/lib/authz/flags";
import { unreadNotificationCount } from "@/lib/notifications";
import { Sidebar } from "@/components/shell/Sidebar";
import { AdminTopBar } from "@/components/shell/TopBar";
import { ToastProvider } from "@/components/ui/Toast";
import { OfflineProvider } from "@/lib/offline/OfflineProvider";
import { AdminOfflineBar } from "@/components/offline/OfflineBar";

/**
 * Admin shell: cool surface, 240px sidebar (lg+) / 72px rail (md),
 * top bar with the tenant name always visible (multi-tenant safety).
 * Entry requires the admin.access permission; each screen adds its own
 * module/permission guard — navigation only reflects those decisions.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdminArea();
  const entitlements = await loadEntitlements(
    session.tenant.id,
    session.user.id,
  );
  const unread = await unreadNotificationCount(
    session.tenant.id,
    session.user.id,
  );

  return (
    <div data-surface="admin" className="flex min-h-dvh">
      <ToastProvider>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-surface-default focus:px-3 focus:py-2"
        >
          Skip to content
        </a>
        <Sidebar
          enabledModules={enabledModuleKeys(entitlements)}
          can={{
            modules: session.permissions.has("modules.manage"),
            roles: session.permissions.has("roles.manage"),
            settings: session.permissions.has("settings.manage"),
            audit: session.permissions.has("audit.view"),
          }}
          userName={session.user.displayName}
          roleName={session.membership.roleName}
        />
        <OfflineProvider>
          <div className="flex min-w-0 flex-1 flex-col">
            <AdminTopBar
              tenantName={session.tenant.name}
              notificationCount={unread}
            />
            {/* Admin work is never queued — the bar says so plainly. */}
            <AdminOfflineBar />
            <main
              id="main"
              className="mx-auto w-full max-w-[var(--stf-layout-content-max-width)] flex-1 px-5 py-5 lg:px-8"
            >
              {children}
            </main>
          </div>
        </OfflineProvider>
      </ToastProvider>
    </div>
  );
}
