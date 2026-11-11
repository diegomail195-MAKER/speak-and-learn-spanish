import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import "./globals.css";

// DM Sans: open, very legible letterforms for instructions and answers (early readers).
// Bricolage Grotesque: expressive headings and brand moments only.
const body = DM_Sans({ variable: "--font-body", subsets: ["latin", "latin-ext"], display: "swap" });
const display = Bricolage_Grotesque({ variable: "--font-display-face", subsets: ["latin", "latin-ext"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Speak & Learn Spanish", template: "%s · Speak & Learn Spanish" },
  description: "Interactive Spanish Learning for Kids. Speak. Play. Learn.",
};

export const viewport: Viewport = { themeColor: "#fff8ee", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // Font variables live on <html> so the theme tokens defined on :root can resolve them.
    <html lang="en" className={`${body.variable} ${display.variable}`}>
      <body className="antialiased min-h-dvh">{children}</body>
    </html>
  );
}
