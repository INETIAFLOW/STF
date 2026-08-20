import type { MetadataRoute } from "next";

/**
 * The web manifest — what makes STF installable and lets it open without
 * browser chrome.
 *
 * `start_url: "/"` is deliberate. `src/app/page.tsx` already sends people to
 * `/home` or `/admin` by role, so one installed app serves both surfaces and
 * an employee who is later made a supervisor does not have to reinstall.
 *
 * There is no service worker, so a cold start with no signal still shows the
 * browser's offline page. See DECISIONS.md D-036.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Sudarshan Task Force",
    short_name: "STF",
    description:
      "Workforce, tasks, attendance and payroll inputs in one phone-first system.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#10253F",
    theme_color: "#10253F",
    lang: "en",
    dir: "ltr",
    categories: ["business", "productivity"],
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png" },
      { src: "/icons/512", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/512-maskable",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
