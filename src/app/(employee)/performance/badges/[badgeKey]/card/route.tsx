import { ImageResponse } from "next/og";
import { getAppSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { BADGES } from "@/lib/performance/badges";

export const dynamic = "force-dynamic";

/**
 * A shareable achievement card (PERFORMANCE-MODULE.md §F) — a PNG the
 * person downloads and forwards themselves, on WhatsApp or wherever.
 *
 * Two rules keep it honest:
 * - Only YOUR OWN earned badges render. The gate is the badge row, so a
 *   guessed URL for something unearned is a plain 404 — a share card for
 *   a badge you don't have would be the product helping someone lie.
 * - It carries the first name, the badge, and the company — nothing else.
 *   No points, no rank: the card is a brag the person chose to make, not
 *   a leak of their standing.
 *
 * Drawn with the same next/og machinery as the app icons: no new
 * dependency, no binary assets, brand colours inline.
 */

const NAVY = "#10253F";
const CREAM = "#FBF8F2";
const VERMILION = "#F04E30";
const AMBER = "#F5B940";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ badgeKey: string }> },
) {
  const session = await getAppSession();
  if (!session) return new Response("Not found", { status: 404 });

  const { badgeKey } = await params;
  const badge = BADGES.find((b) => b.key === badgeKey);
  if (!badge) return new Response("Not found", { status: 404 });

  const earned = await getDb().employeeBadge.findFirst({
    where: {
      tenantId: session.tenant.id,
      membershipId: session.membership.id,
      badgeKey,
    },
  });
  if (!earned) return new Response("Not found", { status: 404 });

  const firstName = session.user.displayName.split(/\s+/)[0];
  const when = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: session.tenant.timezone,
  }).format(earned.earnedAt);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: NAVY,
          color: CREAM,
          fontFamily: "sans-serif",
        }}
      >
        {/* the chakra, as rings satori understands */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 120,
            height: 120,
            borderRadius: 60,
            border: `7px solid ${CREAM}`,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              border: `7px solid ${VERMILION}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: AMBER,
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 26, marginTop: 36, opacity: 0.75 }}>
          Badge earned
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 64,
            fontWeight: 700,
            marginTop: 8,
            textAlign: "center",
          }}
        >
          {badge.name}
        </div>
        <div style={{ display: "flex", fontSize: 28, marginTop: 14, color: AMBER }}>
          {firstName} · {session.tenant.name}
        </div>
        <div style={{ display: "flex", fontSize: 22, marginTop: 8, opacity: 0.6 }}>
          {badge.earnedLine} · {when}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 20,
            marginTop: 40,
            opacity: 0.5,
            letterSpacing: 2,
          }}
        >
          STF · Sudarshan Task Force
        </div>
      </div>
    ),
    { width: 1080, height: 566 },
  );
}
