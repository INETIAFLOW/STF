import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { checkAccess } from "@/lib/authz/guard";
import { devFixtureOffline } from "@/lib/auth/fixture";
import { getDb } from "@/lib/db";
import { getPolicy, getPolicyVersion } from "@/lib/policies";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  RULE_KEYS,
  RULE_LABELS,
  normalizeScoring,
  weekKey,
  type ScoringPolicy,
} from "@/lib/performance/scoring";
import { workDateInTimezone } from "@/lib/attendance/policy";

export const metadata: Metadata = { title: "Performance" };

function formatDay(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(date);
}

/**
 * My Performance (P1: points, ledger and the published rules — the full
 * game surface with rings, streaks and badges arrives in P2).
 *
 * Every number here traces to a ledger line, and every ledger line names
 * its rule and carries the scoring version that produced it.
 */
export default async function PerformancePage() {
  const { session, decision } = await checkAccess({ module: "PERFORMANCE" });
  if (!decision.allowed) redirect("/unauthorized");

  if (devFixtureOffline()) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="font-heading text-h1 text-text-primary">Performance</h1>
        <Card flush>
          <EmptyState
            warm
            title="No points yet."
            body="Connect a database to see performance."
          />
        </Card>
      </div>
    );
  }

  const db = getDb();
  const published = await getPolicy<ScoringPolicy>(session.tenant.id, "performance");
  const version = published
    ? await getPolicyVersion(session.tenant.id, "performance")
    : 0;
  const policy = published ? normalizeScoring(published) : null;

  const today = workDateInTimezone(new Date(), session.tenant.timezone);
  const thisWeek = weekKey(today);

  const events = await db.performanceEvent.findMany({
    where: { tenantId: session.tenant.id, membershipId: session.membership.id },
    orderBy: [{ workDate: "desc" }, { createdAt: "desc" }],
    take: 500,
  });

  const total = events.reduce((sum, e) => sum + e.points, 0);
  const todayPoints = events
    .filter((e) => e.workDate.getTime() === today.getTime())
    .reduce((sum, e) => sum + e.points, 0);
  const weekPoints = events
    .filter((e) => weekKey(e.workDate) === thisWeek)
    .reduce((sum, e) => sum + e.points, 0);
  const recent = events.slice(0, 20);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-heading text-h1 text-text-primary">Performance</h1>

      {!policy && (
        <Card>
          <CardHeader title="Points aren't counting yet" />
          <p className="text-body text-text-secondary">
            Your company hasn&apos;t published its scoring rules yet. Once it
            does, every on-time day and completed task starts earning points
            — and they&apos;ll show here.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Total points", value: total },
          { label: "This week", value: weekPoints },
          { label: "Today", value: todayPoints },
        ].map((stat) => (
          <Card key={stat.label}>
            <p className="text-caption text-text-secondary">{stat.label}</p>
            <p className="font-mono text-data-xl font-semibold text-text-primary tabular-nums">
              {stat.value.toLocaleString("en-IN")}
            </p>
          </Card>
        ))}
      </div>

      <section aria-labelledby="recent">
        <h2 id="recent" className="mb-3 font-heading text-h2 text-text-primary">
          Recent points
        </h2>
        {recent.length === 0 ? (
          <Card flush>
            <EmptyState
              warm
              title="Nothing earned yet."
              body="Check in on time or finish a task — that's where points come from."
            />
          </Card>
        ) : (
          <Card>
            <ul className="flex flex-col divide-y divide-border-subtle">
              {recent.map((event) => (
                <li
                  key={event.id}
                  className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-body text-text-primary">
                      {event.note}
                    </p>
                    <p className="text-caption text-text-secondary">
                      {formatDay(event.workDate)}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-data font-semibold text-brand-primary tabular-nums">
                    +{event.points}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>

      {policy && (
        <section aria-labelledby="how">
          <h2 id="how" className="mb-3 font-heading text-h2 text-text-primary">
            How points work
          </h2>
          <Card>
            <p className="text-caption text-text-secondary">
              Published rules, version {version}. Points come only from your
              attendance and your tasks — nothing else, and nobody edits
              them by hand.
            </p>
            <ul className="mt-3 flex flex-col divide-y divide-border-subtle">
              {RULE_KEYS.filter((k) => policy.rules[k].enabled).map((key) => (
                <li
                  key={key}
                  className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
                >
                  <span className="text-body text-text-primary">
                    {RULE_LABELS[key]}
                  </span>
                  <span className="shrink-0 font-mono text-data text-text-secondary tabular-nums">
                    +{policy.rules[key].points}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-border-subtle pt-3 text-caption text-text-secondary">
              Your streak counts every worked day you arrived on time. Days
              you didn&apos;t work — leave, weekly off — don&apos;t break
              it; arriving late does. Task points stop at{" "}
              {policy.dailyTaskCap > 0
                ? `${policy.dailyTaskCap} per day`
                : "no daily limit"}
              .
            </p>
          </Card>
        </section>
      )}
    </div>
  );
}
