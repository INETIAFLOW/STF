/**
 * The Chakra mark — STF's brand mark.
 *
 * A circle with eight inner spokes (the Sudarshan chakra) and a centre dot.
 * Geometry is fixed by the brand spec and must not be re-derived per use:
 * viewBox 0 0 88 88 centred at (44,44); outer circle r=40; eight spokes
 * from r=30 to r=14 at 45° steps, round caps; centre dot r=7.
 *
 * Inline SVG rather than an <Image>, because the mark sits inside text
 * lockups and has to take its colour from the surface it is on — a file
 * would need one variant per background and would still flash in late on
 * a slow connection, in the header, where it is most noticeable.
 *
 * Stroke width thins from 6 to 5 above 48px: at display sizes the spokes
 * close up the negative space and the mark reads as a blob.
 */

/** Spoke endpoints at 45° steps, r=30 → r=14. Listed, not computed, so
 *  the numbers match the brand spec exactly at any rounding. */
const SPOKES: ReadonlyArray<readonly [number, number, number, number]> = [
  [0, -30, 0, -14],
  [21, -21, 10, -10],
  [30, 0, 14, 0],
  [21, 21, 10, 10],
  [0, 30, 0, 14],
  [-21, 21, -10, 10],
  [-30, 0, -14, 0],
  [-21, -21, -10, -10],
];

const RING = { light: "#10253F", dark: "#FBF8F2" } as const;
const SPOKE = "#F04E30";
const CORE = "#F5B940";

export function ChakraMark({
  size = 28,
  tone = "light",
  className,
}: {
  size?: number;
  /** "light" = on cream/white. "dark" = on navy. */
  tone?: "light" | "dark";
  className?: string;
}) {
  const stroke = size > 48 ? 5 : 6;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 88 88"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <g transform="translate(44,44)">
        <circle r="40" fill="none" stroke={RING[tone]} strokeWidth={stroke} />
        <g stroke={SPOKE} strokeWidth={stroke} strokeLinecap="round">
          {SPOKES.map(([x1, y1, x2, y2]) => (
            <line key={`${x1},${y1}`} x1={x1} y1={y1} x2={x2} y2={y2} />
          ))}
        </g>
        <circle r="7" fill={CORE} />
      </g>
    </svg>
  );
}

/**
 * Mark + wordmark, optionally with the full-name caption.
 *
 * The caption is the first thing to go on a narrow screen: "STF" alone is
 * still the brand, whereas a wrapped two-line company name beside a 28px
 * mark is just noise.
 */
export function ChakraLockup({
  size = 28,
  tone = "light",
  caption = false,
  wordmarkSize = 19,
}: {
  size?: number;
  tone?: "light" | "dark";
  caption?: boolean;
  wordmarkSize?: number;
}) {
  const ink = tone === "dark" ? "var(--m-cream, #FBF8F2)" : "var(--m-navy, #10253F)";
  const sub = tone === "dark" ? "var(--m-on-navy-2, #9FB0C4)" : "var(--m-muted, #4A5B70)";
  const rule =
    tone === "dark" ? "1px solid rgba(251,248,242,.2)" : "1px solid var(--m-border-strong, #DCD3C2)";

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10, color: ink }}>
      <ChakraMark size={size} tone={tone} />
      <span
        style={{
          fontFamily: "var(--m-font-head, Archivo, system-ui, sans-serif)",
          fontWeight: 800,
          fontSize: wordmarkSize,
          letterSpacing: "0.02em",
        }}
      >
        STF
      </span>
      {caption && (
        <span
          style={{
            fontSize: 12,
            color: sub,
            borderLeft: rule,
            paddingLeft: 10,
          }}
        >
          Sudarshan Task Force
        </span>
      )}
    </span>
  );
}
