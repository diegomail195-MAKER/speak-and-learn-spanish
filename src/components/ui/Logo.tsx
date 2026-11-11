// Brand mark: a speech bubble whose tail is a tilde — the "ñ" that makes Spanish Spanish.
// Indigo bubble, ivory tilde, a mango dot for the reward of being understood.
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path d="M8 10c0-2.2 1.8-4 4-4h24c2.2 0 4 1.8 4 4v18c0 2.2-1.8 4-4 4H21l-8 7v-7h-1c-2.2 0-4-1.8-4-4z" fill="#303477" />
      <path d="M15 19.5c2.2-3 4.6-3 6.6-1.2 2 1.8 4.4 1.8 6.6-1.2" stroke="#fff8ee" strokeWidth="3.2" fill="none" strokeLinecap="round" />
      <circle cx="37" cy="10.5" r="4.2" fill="#f3c55d" stroke="#24283b" strokeWidth="1.6" />
    </svg>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      <span className="leading-none">
        <span className="block font-display text-[1.2rem] font-bold tracking-tight text-ink">Speak &amp; Learn</span>
        {!compact && <span className="mt-0.5 block text-[0.7rem] font-bold uppercase tracking-[0.22em] text-coral">Spanish</span>}
      </span>
    </span>
  );
}
