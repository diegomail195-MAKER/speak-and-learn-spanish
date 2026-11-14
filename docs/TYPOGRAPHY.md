# Typography

LextroSpeak uses **Century Gothic** as its only typeface (titles, menus, buttons, forms, activities,
tables and emails). Usernames, class codes and PINs keep a monospace face so 0/O and 1/l can't be confused.

## How it is set up

- One token in `src/app/globals.css`:
  `--font-gothic: "Century Gothic", "CenturyGothic", var(--font-gothic-fallback), "URW Gothic", sans-serif`
  and both `--font-sans` and `--font-display` point to it (Tailwind `font-sans` / `font-display`).
- `src/app/layout.tsx` loads **Didact Gothic** with `next/font/google`. Next.js downloads it at build
  time and serves it from our own domain, so browsers never contact Google Fonts.
- Inline SVG art uses `font-family="inherit"`, so it follows the same token.
- Emails use `'Century Gothic', CenturyGothic, 'URW Gothic', sans-serif` (email apps can't load web fonts).

## Licence status

Century Gothic is a commercial font (Monotype). The project has **no web-font licence** for it, so no
Century Gothic files are shipped. Devices that already have it installed (most Windows computers and
Macs with Microsoft Office) show the authentic font. Every other device (iPad, Chromebook, Android,
Macs without Office) shows **Didact Gothic**, a temporary open-licence (SIL OFL) geometric face in the
same style. Didact Gothic only has a regular weight, so bold text there is synthesized by the browser.

## To use authentic Century Gothic everywhere

1. Buy a web-font licence for Century Gothic (Regular and Bold) from Monotype / MyFonts, sized for the
   expected monthly page views.
2. Put the licensed `.woff2` files in `public/fonts/` and add `@font-face` rules for "Century Gothic"
   (400 and 700) in `globals.css`.
3. Remove the Didact Gothic fallback from `layout.tsx` if no longer wanted.
