/* eslint-disable @next/next/no-img-element */
// LextroSpeak logo (the approved wordmark) with the LextroSpeak motto.
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex flex-col gap-1 leading-none">
      <img src="/brand/lextrospeak-logo.png" alt="LextroSpeak" width={884} height={160} className={compact ? "h-6 w-auto sm:h-7" : "h-8 w-auto sm:h-9"} />
      {!compact && <span className="text-[0.78rem] font-extrabold tracking-[0.02em] text-ink-2">Speak. Learn. Grow.</span>}
    </span>
  );
}

export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden="true">
      <path d="M14 10h52a10 10 0 0 1 10 10v30a10 10 0 0 1-10 10H36L22 72V60h-8A10 10 0 0 1 4 50V20a10 10 0 0 1 10-10Z" fill="#FF5A4E" />
      <text x="40" y="47" textAnchor="middle" fontFamily="inherit" fontWeight="800" fontSize="34" fill="#fff">ñ</text>
      <circle cx="70" cy="12" r="9" fill="#FFC93C" />
    </svg>
  );
}
