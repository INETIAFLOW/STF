import {
  Schibsted_Grotesk,
  Spline_Sans_Mono,
  Wix_Madefor_Text,
} from "next/font/google";

/**
 * Fonts are self-hosted: next/font downloads the files at build time and
 * serves them from our own origin — no request to the Google CDN at runtime
 * (01-brand/typography.md §2; design handoff README §2).
 *
 * Preload policy: the handoff asks for exactly two preloaded faces —
 * Wix Madefor Text 400 and Schibsted Grotesk 700. next/font preloads per
 * family, so heading + body are preloaded and the mono face loads with
 * `swap` only. Deviation logged in DECISIONS.md (D-P1-03).
 */
export const schibstedGrotesk = Schibsted_Grotesk({
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700"],
  variable: "--font-schibsted-grotesk",
  display: "swap",
  preload: true,
});

export const wixMadeforText = Wix_Madefor_Text({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-wix-madefor-text",
  display: "swap",
  preload: true,
});

export const splineSansMono = Spline_Sans_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-spline-sans-mono",
  display: "swap",
  preload: false,
});

export const fontVariables = `${schibstedGrotesk.variable} ${wixMadeforText.variable} ${splineSansMono.variable}`;
