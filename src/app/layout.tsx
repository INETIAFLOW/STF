import type { Metadata, Viewport } from "next";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "STF — Sudarshan Task Force",
    template: "%s · STF",
  },
  description:
    "Workforce, tasks, attendance and payroll inputs in one phone-first system.",
  icons: {
    icon: "/brand/STF-favicon.svg",
    apple: "/brand/STF-app-icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2F45C4",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
