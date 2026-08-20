"use client";

import Image from "next/image";
import { useRef, useState } from "react";

/**
 * "Who runs on STF" — a snap-scrolling rail of five settings.
 *
 * PHOTOGRAPHY: each card wants a real photograph, and the design bundle
 * fakes them with droppable placeholders. Until real images exist, every
 * card draws a geometric scene in the brand palette instead — deliberately
 * illustrative rather than a grey box, so the section reads as finished
 * and nobody ships an empty frame by accident.
 *
 * To use real photographs, drop files into public/marketing/use-cases/ and
 * set `photo` below. Nothing else changes: the frame, the ratio and the
 * hover scale already behave the same either way. Aim for 640×340 or
 * larger, and describe each in `alt` — these are content images, not
 * decoration, so an empty alt would be wrong.
 */

interface UseCase {
  key: string;
  title: string;
  desc: string;
  chip: string;
  /** Path under /public once a real photograph exists. */
  photo: string | null;
  alt: string;
  Art: () => React.ReactElement;
}

const CARD_W = 320;
const GAP = 18;

export function UseCases() {
  const rail = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const onScroll = () => {
    const el = rail.current;
    if (!el) return;
    const step = (el.firstElementChild as HTMLElement | null)?.offsetWidth ?? CARD_W;
    const i = Math.round(el.scrollLeft / (step + GAP));
    setIndex(Math.max(0, Math.min(CASES.length - 1, i)));
  };

  return (
    <>
      <div ref={rail} onScroll={onScroll} className="m-uc-rail">
        {CASES.map((uc) => (
          <article key={uc.key} className="m-uc-card">
            <div className="relative h-[170px] overflow-hidden">
              <div className="m-uc-media absolute inset-0">
                {uc.photo ? (
                  <Image
                    src={uc.photo}
                    alt={uc.alt}
                    fill
                    sizes="(max-width: 767px) 82vw, 320px"
                    className="object-cover"
                  />
                ) : (
                  <uc.Art />
                )}
              </div>
              <span className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-[rgba(16,37,63,.85)] px-[11px] py-1.5 text-[11.5px] font-bold text-[color:var(--m-cream)] backdrop-blur-[4px]">
                {uc.chip}
              </span>
            </div>
            <div className="px-5 pb-5 pt-[18px]">
              <h3 className="mb-1.5 font-[family-name:var(--m-font-head)] text-[18px] font-bold">
                {uc.title}
              </h3>
              <p className="text-[13.5px] leading-[1.5] text-[color:var(--m-muted)]">{uc.desc}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-4 flex justify-center gap-[7px] md:hidden">
        {CASES.map((uc, i) => (
          <span
            key={uc.key}
            aria-hidden="true"
            className="inline-block h-[7px] rounded-full transition-[width,background] duration-[250ms]"
            style={{
              width: i === index ? 22 : 7,
              background: i === index ? "var(--m-red)" : "var(--m-border-strong)",
            }}
          />
        ))}
      </div>
      <p className="sr-only" role="status">
        Card {index + 1} of {CASES.length}
      </p>
    </>
  );
}

/* --------------------------------------------------------------- art */

/** Shared frame so every scene sits on the same cream grid. */
function Scene({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 320 170"
      className="m-mapgrid-tight size-full"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const NAVY = "#10253F";
const RED = "#F04E30";
const AMBER = "#F5B940";
const GREEN = "#2F9E6F";
const LINE = "#DCD3C2";

function WarehouseArt() {
  return (
    <Scene>
      {/* racking */}
      {[0, 1, 2].map((r) => (
        <g key={r}>
          <rect x={28 + r * 92} y={64} width="70" height="66" rx="4" fill="none" stroke={LINE} strokeWidth="2" />
          <rect x={34 + r * 92} y={72} width="26" height="22" rx="3" fill={NAVY} opacity={0.85} />
          <rect x={66 + r * 92} y={72} width="26" height="22" rx="3" fill={NAVY} opacity={0.45} />
          <rect x={34 + r * 92} y={100} width="26" height="22" rx="3" fill={NAVY} opacity={0.45} />
          <rect x={66 + r * 92} y={100} width="26" height="22" rx="3" fill={r === 0 ? RED : NAVY} opacity={r === 0 ? 1 : 0.85} />
        </g>
      ))}
      {/* gate line */}
      <line x1="0" y1="142" x2="320" y2="142" stroke={LINE} strokeWidth="2" strokeDasharray="6 6" />
      <circle cx="52" cy="142" r="7" fill={GREEN} stroke="#fff" strokeWidth="2.5" />
    </Scene>
  );
}

function FieldArt() {
  return (
    <Scene>
      <path
        d="M18 132 C 70 132, 74 78, 124 78 S 190 116, 236 96 S 292 52, 304 46"
        fill="none"
        stroke={LINE}
        strokeWidth="2.5"
        strokeDasharray="7 7"
      />
      <circle cx="18" cy="132" r="7" fill={NAVY} stroke="#fff" strokeWidth="2.5" />
      <circle cx="124" cy="78" r="7" fill={GREEN} stroke="#fff" strokeWidth="2.5" />
      <circle cx="236" cy="96" r="7" fill={GREEN} stroke="#fff" strokeWidth="2.5" />
      <g transform="translate(304,46)">
        <circle r="11" fill={RED} stroke="#fff" strokeWidth="3" />
        <circle r="24" fill="none" stroke={RED} strokeWidth="1.5" opacity="0.35" />
      </g>
    </Scene>
  );
}

function RetailArt() {
  return (
    <Scene>
      {/* shutter + awning */}
      <rect x="52" y="34" width="216" height="26" rx="4" fill={NAVY} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={58 + i * 36} y="38" width="18" height="18" rx="2" fill={i % 2 ? AMBER : "#FBF8F2"} opacity="0.9" />
      ))}
      <rect x="52" y="60" width="216" height="52" rx="3" fill="none" stroke={LINE} strokeWidth="2" />
      {/* counter */}
      <rect x="72" y="112" width="176" height="16" rx="4" fill={NAVY} opacity="0.85" />
      <circle cx="160" cy="86" r="9" fill={RED} stroke="#fff" strokeWidth="2.5" />
      <line x1="52" y1="142" x2="268" y2="142" stroke={LINE} strokeWidth="2" strokeDasharray="6 6" />
    </Scene>
  );
}

function DispatchArt() {
  return (
    <Scene>
      {/* van */}
      <rect x="40" y="66" width="96" height="46" rx="6" fill={NAVY} />
      <path d="M136 78 h34 l24 22 v12 h-58 z" fill={NAVY} opacity="0.75" />
      <rect x="146" y="84" width="26" height="16" rx="3" fill="#FBF8F2" opacity="0.85" />
      <circle cx="72" cy="120" r="12" fill="#0B1B2F" />
      <circle cx="72" cy="120" r="4.5" fill={LINE} />
      <circle cx="172" cy="120" r="12" fill="#0B1B2F" />
      <circle cx="172" cy="120" r="4.5" fill={LINE} />
      {/* route + drop */}
      <line x1="206" y1="120" x2="300" y2="120" stroke={LINE} strokeWidth="2.5" strokeDasharray="7 7" />
      <g transform="translate(288,86)">
        <circle r="11" fill={GREEN} stroke="#fff" strokeWidth="3" />
        <path d="M-4.5 0 l3.2 3.4 l6-6.6" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </Scene>
  );
}

function BranchArt() {
  return (
    <Scene>
      <g stroke={LINE} strokeWidth="2" strokeDasharray="6 6">
        <line x1="160" y1="85" x2="62" y2="48" />
        <line x1="160" y1="85" x2="258" y2="48" />
        <line x1="160" y1="85" x2="62" y2="128" />
        <line x1="160" y1="85" x2="258" y2="128" />
      </g>
      {[
        [62, 48, GREEN],
        [258, 48, GREEN],
        [62, 128, AMBER],
        [258, 128, GREEN],
      ].map(([x, y, c]) => (
        <g key={`${x}-${y}`} transform={`translate(${x},${y})`}>
          <rect x="-22" y="-16" width="44" height="32" rx="5" fill="#fff" stroke={LINE} strokeWidth="2" />
          <rect x="-14" y="-8" width="12" height="9" rx="2" fill={NAVY} opacity="0.7" />
          <rect x="2" y="-8" width="12" height="9" rx="2" fill={NAVY} opacity="0.4" />
          <circle cx="0" cy="10" r="4" fill={c as string} />
        </g>
      ))}
      <circle cx="160" cy="85" r="16" fill={NAVY} />
      <circle cx="160" cy="85" r="5.5" fill={AMBER} />
    </Scene>
  );
}

const CASES: UseCase[] = [
  {
    key: "warehouse",
    title: "Warehouse",
    desc: "Shift check-ins at the gate, task boards per bay, stock-count jobs with photo proof.",
    chip: "✓ Gate check-in · 08:40",
    photo: null,
    alt: "Workers checking in at a warehouse gate",
    Art: WarehouseArt,
  },
  {
    key: "field",
    title: "Field sales",
    desc: "Day plans, visit check-ins and expense notes—synced before the rep is back on the bike.",
    chip: "📍 Visit logged · Malviya Nagar",
    photo: null,
    alt: "A field sales representative logging a customer visit",
    Art: FieldArt,
  },
  {
    key: "retail",
    title: "Retail / trading",
    desc: "Counter rosters, store-open checklists, and advances recorded at the desk, not remembered later.",
    chip: "Store opened · 09:00",
    photo: null,
    alt: "A retail counter at store opening",
    Art: RetailArt,
  },
  {
    key: "dispatch",
    title: "Dispatch & delivery",
    desc: "Trip assignments with proof of completion, so every drop has a name and a timestamp.",
    chip: "Trip closed · POD attached",
    photo: null,
    alt: "A delivery van being loaded for a route",
    Art: DispatchArt,
  },
  {
    key: "branch",
    title: "Multi-branch ops",
    desc: "One owner view across branches, with per-branch cut-offs and comparable day summaries.",
    chip: "4 branches · one view",
    photo: null,
    alt: "An owner reviewing several branches at once",
    Art: BranchArt,
  },
];
