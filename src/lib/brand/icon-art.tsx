import type { ReactElement } from "react";

/**
 * The STF app icon, drawn for `ImageResponse`.
 *
 * The repo ships only SVG artwork, and neither Safari (`apple-touch-icon`)
 * nor Chrome's installability check will take an SVG. Rather than add a
 * rasteriser dependency or commit binaries, this redraws
 * `public/brand/STF-app-icon.svg` with the boxes Satori understands, so
 * Next generates real PNGs at request time.
 *
 * The Chakra mark is circles and straight strokes, which is fortunate: a
 * ring is a bordered box with a 50% radius, and each spoke is a rounded bar
 * rotated about its own centre. Geometry comes from the brand spec in the
 * same units as the SVG (an 88-unit box, r=40 ring, spokes r=30→r=14 at 45°
 * steps, r=7 centre) and is converted here, so the two cannot drift.
 */

/** The plate the mark sits on. Also the PWA splash colour. */
export const BRAND_NAVY = "#10253F";
const RING = "#FBF8F2";
const SPOKE = "#F04E30";
const CORE = "#F5B940";

/** The mark occupies this fraction of the icon box, per the app-icon SVG. */
const MARK_SPAN = 368 / 512;

/**
 * `maskable` shrinks the artwork into the centre so Android can crop it to
 * a circle or squircle without slicing the mark. The background still
 * bleeds to the edge, which is what the maskable contract requires.
 */
export function iconArt(size: number, maskable = false): ReactElement {
  const scale = maskable ? 0.62 : 1;
  // One SVG unit, in device pixels, after the maskable inset.
  const u = (size * MARK_SPAN * scale) / 88;
  const c = size / 2;
  const px = (n: number) => Math.round(n);

  // r=40 with a 5-unit stroke: the outer edge lands at 42.5 units, and a
  // bordered box measures to its outer edge, so the box is 85 units.
  const ringBox = px(85 * u);
  const ringStroke = Math.max(1, px(5 * u));

  const spokeLen = px(16 * u); // r=30 → r=14
  const spokeThick = Math.max(1, px(5 * u));
  const spokeR = 22 * u; // midpoint of the stroke, measured from centre
  const coreBox = px(14 * u);

  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: size,
        height: size,
        backgroundColor: BRAND_NAVY,
        // Maskable icons must be square: the launcher applies its own mask.
        borderRadius: maskable ? 0 : px(size * 0.25),
      }}
    >
      <div
        style={{
          position: "absolute",
          left: px(c - ringBox / 2),
          top: px(c - ringBox / 2),
          width: ringBox,
          height: ringBox,
          borderRadius: ringBox / 2,
          border: `${ringStroke}px solid ${RING}`,
        }}
      />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const a = (i * Math.PI) / 4;
        // Bars start vertical, so the offset uses sin/-cos and the rotation
        // is the same angle — the bar always points away from the centre.
        const x = c + spokeR * Math.sin(a);
        const y = c - spokeR * Math.cos(a);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: px(x - spokeThick / 2),
              top: px(y - spokeLen / 2),
              width: spokeThick,
              height: spokeLen,
              borderRadius: spokeThick / 2,
              backgroundColor: SPOKE,
              transform: `rotate(${i * 45}deg)`,
            }}
          />
        );
      })}
      <div
        style={{
          position: "absolute",
          left: px(c - coreBox / 2),
          top: px(c - coreBox / 2),
          width: coreBox,
          height: coreBox,
          borderRadius: coreBox / 2,
          backgroundColor: CORE,
        }}
      />
    </div>
  );
}
