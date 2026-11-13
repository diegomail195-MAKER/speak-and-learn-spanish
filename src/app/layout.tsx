import type { Metadata, Viewport } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import "./globals.css";

const body = Nunito({ variable: "--font-body", subsets: ["latin", "latin-ext"] });
const display = Baloo_2({ variable: "--font-display-face", subsets: ["latin", "latin-ext"], weight: ["600", "700", "800"] });

export const metadata: Metadata = {
  title: { default: "LaxtroSpeak · Speak & Learn Spanish", template: "%s · LaxtroSpeak" },
  description: "Spanish songs, videos, games and flashcards for kids (ages 6–12). Speak. Play. Learn.",
};

export const viewport: Viewport = { themeColor: "#fff8ec", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // Font variables live on <html> so the theme tokens defined on :root can resolve them.
    <html lang="en" className={`${body.variable} ${display.variable}`}>
      <body className="antialiased min-h-dvh">{children}</body>
    </html>
  );
}
