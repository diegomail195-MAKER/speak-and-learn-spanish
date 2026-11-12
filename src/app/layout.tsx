import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site";

const body = Nunito({ variable: "--font-body", subsets: ["latin", "latin-ext"] });
const display = Fredoka({ variable: "--font-display-face", subsets: ["latin", "latin-ext"], weight: ["500", "600"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Speak & Learn Spanish | Interactive Spanish Learning for Kids", template: "%s · Speak & Learn Spanish" },
  description:
    "Speak & Learn Spanish helps elementary teachers build voice-first Spanish games in minutes. Kids see a picture, hear a question and answer out loud in Spanish.",
  applicationName: "Speak & Learn Spanish",
  keywords: ["Spanish for kids", "learn Spanish", "Spanish games", "elementary Spanish", "Spanish teacher tools", "speak Spanish"],
  openGraph: {
    type: "website",
    siteName: "Speak & Learn Spanish",
    title: "Speak & Learn Spanish | Interactive Spanish Learning for Kids",
    description: "Voice-first Spanish games for elementary classrooms. Speak. Play. Learn.",
  },
  // Optional: the code from Google Search Console's "HTML tag" method, if DNS verification isn't used.
  ...(process.env.GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } } : {}),
};

export const viewport: Viewport = { themeColor: "#faf6ee", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // Font variables live on <html> so the theme tokens defined on :root can resolve them.
    <html lang="en" className={`${body.variable} ${display.variable}`}>
      <body className="antialiased min-h-dvh">{children}</body>
    </html>
  );
}
