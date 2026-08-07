import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guards on the generated token stylesheet — the design system's contract.
 * If these fail, run `npm run tokens` or fix the generator; never edit
 * tokens.css by hand.
 */
const css = readFileSync(
  join(__dirname, "..", "styles", "tokens.css"),
  "utf8",
);

describe("generated tokens.css", () => {
  it("contains the brand foundation colours from colors.json", () => {
    expect(css).toContain("--stf-color-brand-primary: #2F45C4");
    expect(css).toContain("--stf-color-surface-canvas: #F7F8FC");
    expect(css).toContain("--stf-color-surface-canvas-warm: #FAF8F5");
    expect(css).toContain("--stf-color-warm-accent: #A2451F");
  });

  it("dark mode overrides only exist under [data-theme=dark]", () => {
    const darkBlock = css.split('[data-theme="dark"]')[1]?.split("}")[0] ?? "";
    expect(darkBlock).toContain("--stf-color-surface-canvas: #0E1230");
    // The dark block must contain colour tokens only — no sizes or spacing.
    expect(darkBlock).not.toContain("--stf-font-size");
    expect(darkBlock).not.toContain("--stf-space");
  });

  it("desktop typography overrides live in a single lg media query", () => {
    const mediaBlocks = css.match(/@media \(min-width: 1024px\)/g) ?? [];
    expect(mediaBlocks.length).toBe(1);
    const mediaBlock = css.split("@media (min-width: 1024px)")[1] ?? "";
    const themeStart = mediaBlock.indexOf("@theme");
    const scoped = themeStart === -1 ? mediaBlock : mediaBlock.slice(0, themeStart);
    expect(scoped).toContain("--stf-font-size-h1: 32px");
    expect(scoped).not.toContain("--stf-color");
  });

  it("the two card radii exist (admin 12px / employee 16px)", () => {
    expect(css).toContain("--stf-radius-card: 12px");
    expect(css).toContain("--stf-radius-card-employee: 16px");
  });

  it("wipes Tailwind default palettes so only STF tokens exist", () => {
    expect(css).toContain("--color-*: initial");
    expect(css).toContain("--radius-*: initial");
    expect(css).toContain("--shadow-*: initial");
    expect(css).toContain("--text-*: initial");
  });

  it("breakpoints match the approved set", () => {
    expect(css).toContain("--breakpoint-xs: 360px");
    expect(css).toContain("--breakpoint-md: 768px");
    expect(css).toContain("--breakpoint-lg: 1024px");
    expect(css).toContain("--breakpoint-2xl: 1536px");
  });
});
