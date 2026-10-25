// Brand mark: a speech bubble whose tail is a tilde — the "ñ" that makes Spanish Spanish.
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path d="M8 10c0-2.2 1.8-4 4-4h24c2.2 0 4 1.8 4 4v18c0 2.2-1.8 4-4 4H21l-8 7v-7h-1c-2.2 0-4-1.8-4-4z" fill="#e4553c" />
      <path d="M15 19.5c2.2-3 4.6-3 6.6-1.2 2 1.8 4.4 1.8 6.6-1.2" stroke="#fff" strokeWidth="3.2" fill="none" strokeLinecap="round" />
      <circle cx="35.5" cy="12.5" r="3.2" fill="#f2b33d" />
    </svg>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      <span className="leading-none">
        <span className="block font-display text-[1.15rem] font-semibold tracking-tight text-ink">Speak &amp; Learn</span>
        {!compact && <span className="block text-[0.72rem] font-bold uppercase tracking-[0.18em] text-coral">Spanish</span>}
      </span>
    </span>
  );
}
