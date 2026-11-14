import type { Metadata, Viewport } from "next";
import { Didact_Gothic } from "next/font/google";
import "./globals.css";

// Typeface: Century Gothic. It is a commercial font, so no font files are shipped: devices that
// have it installed (most Windows and Office computers) use it, and every other device uses
// Didact Gothic, an open-licence (OFL) geometric face in the same style, self-hosted by Next.js
// at build time (no request to Google from the browser). See docs/TYPOGRAPHY.md.
const gothic = Didact_Gothic({ variable: "--font-gothic-fallback", subsets: ["latin", "latin-ext"], weight: "400" });

export const metadata: Metadata = {
  title: { default: "LaxtroSpeak · Speak. Learn. Grow.", template: "%s · LaxtroSpeak" },
  description: "Spanish songs, videos, games and flashcards for kids (ages 6–12). Speak. Learn. Grow.",
};

export const viewport: Viewport = { themeColor: "#fff8ec", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // Font variables live on <html> so the theme tokens defined on :root can resolve them.
    <html lang="en" className={gothic.variable}>
      <body className="antialiased min-h-dvh">{children}</body>
    </html>
  );
}
