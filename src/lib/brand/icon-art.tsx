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
 * Geometry is taken from that file so the two cannot drift: a 512 box with
 * `rx=128` (25%), and three pills at the coordinates below expressed as
 * fractions of the box.
 */

export const BRAND_BLUE = "#2F45C4";

/** x, y, width — as fractions of the icon box. Height is uniform. */
const BARS = [
  { left: 0.2051, top: 0.2186, width: 0.3484, fill: "#8B97E8" },
  { left: 0.3391, top: 0.4195, width: 0.4287, fill: "#C7CEF5" },
  { left: 0.473, top: 0.6205, width: 0.3484, fill: "#FFFFFF" },
];
const BAR_HEIGHT = 0.134;

/**
 * `maskable` shrinks the artwork into the centre so Android can crop it to
 * a circle or squircle without slicing the mark. The background still
 * bleeds to the edge, which is what the maskable contract requires.
 */
export function iconArt(size: number, maskable = false): ReactElement {
  const scale = maskable ? 0.62 : 1;
  const offset = (1 - scale) / 2;
  const px = (fraction: number) => Math.round(fraction * size);

  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: size,
        height: size,
        backgroundColor: BRAND_BLUE,
        // Maskable icons must be square: the launcher applies its own mask.
        borderRadius: maskable ? 0 : px(0.25),
      }}
    >
      {BARS.map((bar) => {
        const height = px(BAR_HEIGHT * scale);
        return (
          <div
            key={bar.fill}
            style={{
              position: "absolute",
              left: px(offset + bar.left * scale),
              top: px(offset + bar.top * scale),
              width: px(bar.width * scale),
              height,
              borderRadius: height / 2,
              backgroundColor: bar.fill,
            }}
          />
        );
      })}
    </div>
  );
}
