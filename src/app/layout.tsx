import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";

const body = Nunito({ variable: "--font-body", subsets: ["latin", "latin-ext"] });
const display = Fredoka({ variable: "--font-display-face", subsets: ["latin", "latin-ext"], weight: ["500", "600"] });

export const metadata: Metadata = {
  title: { default: "Speak & Learn Spanish", template: "%s · Speak & Learn Spanish" },
  description: "Interactive Spanish Learning for Kids. Speak. Play. Learn.",
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
