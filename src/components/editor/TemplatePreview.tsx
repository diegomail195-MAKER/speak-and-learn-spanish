// Small animated illustrations of how each activity template plays (gallery cards).
// Drawn here, in the app's own palette; motion stops with prefers-reduced-motion.

const C = { ink: "#1e2340", coral: "#e4553c", teal: "#12827a", sun: "#f2b33d", leaf: "#2b8f55", sky: "#3a74c9", paper: "#faf6ee", line: "#e6dfd0", white: "#fff" };

function Mic({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="13" fill={C.teal} className="tp-pulse" opacity=".25" />
      <circle r="11" fill={C.teal} />
      <rect x="-3.5" y="-7" width="7" height="10" rx="3.5" fill={C.white} />
      <path d="M -6 0 a 6 6 0 0 0 12 0 M 0 6 v 3" stroke={C.white} strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </g>
  );
}

function Flashcards() {
  return (
    <svg viewBox="0 0 200 120" className="h-full w-full">
      <rect x="44" y="20" width="96" height="80" rx="10" fill={C.line} transform="rotate(-7 92 60)" />
      <g className="tp-flip">
        <rect x="52" y="16" width="96" height="84" rx="10" fill={C.white} stroke={C.ink} strokeWidth="2" />
        <circle cx="100" cy="48" r="16" fill={C.coral} />
        <path d="M100 32 q4 -7 10 -6" stroke={C.leaf} strokeWidth="3" fill="none" strokeLinecap="round" />
        <rect x="74" y="74" width="52" height="8" rx="4" fill={C.ink} opacity=".75" />
      </g>
      <Mic x={168} y={92} />
    </svg>
  );
}

function Spell() {
  const letters = ["C", "A", "S", "A"];
  return (
    <svg viewBox="0 0 200 120" className="h-full w-full">
      {letters.map((l, i) => (
        <g key={i} className="tp-letter" style={{ animationDelay: `${i * 0.45}s` }}>
          <rect x={30 + i * 36} y="36" width="30" height="38" rx="7" fill={i % 2 ? C.sun : C.teal} />
          <text x={45 + i * 36} y="62" textAnchor="middle" fontSize="20" fontWeight="700" fill={C.white} fontFamily="system-ui">{l}</text>
        </g>
      ))}
      <text x="100" y="98" textAnchor="middle" fontSize="11" fill={C.ink} fontFamily="system-ui" opacity=".7">ce · a · ese · a</text>
      <Mic x={176} y={22} />
    </svg>
  );
}

function Wheel() {
  const cols = [C.coral, C.teal, C.sun, C.sky, C.leaf, "#b5539a"];
  const n = cols.length;
  return (
    <svg viewBox="0 0 200 120" className="h-full w-full">
      <g transform="translate(100 64)">
        <g className="tp-spin">
          {cols.map((c, i) => {
            const a0 = (i / n) * 2 * Math.PI, a1 = ((i + 1) / n) * 2 * Math.PI, r = 44;
            return <path key={i} d={`M0 0 L${r * Math.cos(a0)} ${r * Math.sin(a0)} A${r} ${r} 0 0 1 ${r * Math.cos(a1)} ${r * Math.sin(a1)} Z`} fill={c} stroke={C.white} strokeWidth="2" />;
          })}
          <circle r="8" fill={C.ink} />
        </g>
      </g>
      <path d="M93 12 L107 12 L100 24 Z" fill={C.ink} />
      <Mic x={170} y={96} />
    </svg>
  );
}

function Diagram() {
  return (
    <svg viewBox="0 0 200 120" className="h-full w-full">
      <circle cx="100" cy="30" r="15" fill={C.sun} />
      <rect x="84" y="47" width="32" height="40" rx="10" fill={C.sky} />
      <rect x="86" y="86" width="10" height="26" rx="5" fill={C.ink} />
      <rect x="104" y="86" width="10" height="26" rx="5" fill={C.ink} />
      <rect x="68" y="50" width="10" height="30" rx="5" fill={C.sky} transform="rotate(20 73 50)" />
      <rect x="122" y="50" width="10" height="30" rx="5" fill={C.sky} transform="rotate(-20 127 50)" />
      <circle cx="100" cy="30" r="5" fill={C.teal} stroke={C.white} strokeWidth="2" className="tp-pulse" />
      <line x1="114" y1="26" x2="140" y2="20" stroke={C.ink} strokeWidth="1.5" />
      <g className="tp-pop">
        <rect x="140" y="11" width="50" height="18" rx="9" fill={C.leaf} />
        <text x="165" y="24" textAnchor="middle" fontSize="10" fontWeight="700" fill={C.white} fontFamily="system-ui">la cabeza</text>
      </g>
      <circle cx="129" cy="80" r="5" fill={C.ink} stroke={C.white} strokeWidth="2" />
      <circle cx="91" cy="106" r="5" fill={C.ink} stroke={C.white} strokeWidth="2" />
    </svg>
  );
}

function Boxes() {
  return (
    <svg viewBox="0 0 200 120" className="h-full w-full">
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={22 + i * 56} y="56" width="44" height="40" rx="6" fill={i === 1 ? "#c98a12" : C.sun} />
          <text x={44 + i * 56} y="83" textAnchor="middle" fontSize="16" fontWeight="700" fill={C.ink} fontFamily="system-ui">{i + 1}</text>
          {i === 1 ? (
            <>
              <g className="tp-pop">
                <circle cx={100} cy="40" r="14" fill={C.coral} />
                <text x={100} y="45" textAnchor="middle" fontSize="13" fill={C.white} fontFamily="system-ui">?</text>
              </g>
              <rect x={74} y="48" width="52" height="10" rx="4" fill={C.ink} className="tp-lid" />
            </>
          ) : (
            <rect x={18 + i * 56} y="48" width="52" height="10" rx="4" fill={C.ink} />
          )}
        </g>
      ))}
    </svg>
  );
}

function ListenRepeat() {
  const bars = [10, 22, 34, 26, 40, 18, 30, 14];
  return (
    <svg viewBox="0 0 200 120" className="h-full w-full">
      <circle cx="44" cy="60" r="22" fill={C.sky} />
      <path d="M36 52 v16 l8 -4 v-8 z M48 52 q8 8 0 16" fill={C.white} stroke={C.white} strokeWidth="2" strokeLinejoin="round" />
      {bars.map((h, i) => (
        <rect key={i} x={80 + i * 10} y={60 - h / 2} width="6" height={h} rx="3" fill={C.teal} className="tp-wave" style={{ animationDelay: `${i * 0.12}s` }} />
      ))}
      <text x="120" y="104" textAnchor="middle" fontSize="12" fontWeight="700" fill={C.ink} fontFamily="system-ui">¡Buenos días!</text>
      <Mic x={176} y={22} />
    </svg>
  );
}

function ImageSpeak() {
  return (
    <svg viewBox="0 0 200 120" className="h-full w-full">
      <rect x="22" y="18" width="84" height="74" rx="10" fill={C.white} stroke={C.line} strokeWidth="2" />
      <ellipse cx="64" cy="64" rx="22" ry="16" fill={C.sun} />
      <circle cx="46" cy="46" r="11" fill={C.sun} />
      <path d="M38 37 l-6 -9 l10 4 z M52 36 l6 -9 l-1 10 z" fill={C.coral} />
      <circle cx="43" cy="45" r="1.8" fill={C.ink} />
      <g className="tp-pop">
        <path d="M118 30 h62 a8 8 0 0 1 8 8 v22 a8 8 0 0 1 -8 8 h-50 l-10 10 v-10 h-2 a8 8 0 0 1 -8 -8 v-22 a8 8 0 0 1 8 -8 z" fill={C.teal} />
        <text x="149" y="54" textAnchor="middle" fontSize="12" fontWeight="700" fill={C.white} fontFamily="system-ui">Es un gato</text>
      </g>
      <Mic x={176} y={100} />
    </svg>
  );
}

function Match() {
  return (
    <svg viewBox="0 0 200 120" className="h-full w-full">
      {[0, 1].map((i) => (
        <g key={i}>
          <rect x={30 + i * 80} y="14" width="60" height="50" rx="8" fill={C.white} stroke={C.line} strokeWidth="2" />
          <circle cx={60 + i * 80} cy="39" r="14" fill={i ? C.leaf : C.coral} />
          <rect x={36 + i * 80} y="70" width="48" height="14" rx="7" fill="none" stroke={C.line} strokeWidth="2" strokeDasharray="4 3" />
        </g>
      ))}
      <g className="tp-slide" style={{ ["--tx" as string]: "-44px", ["--ty" as string]: "-27px" }}>
        <rect x="80" y="96" width="48" height="16" rx="8" fill={C.teal} />
        <text x="104" y="108" textAnchor="middle" fontSize="10" fontWeight="700" fill={C.white} fontFamily="system-ui">la fresa</text>
      </g>
      <Mic x={176} y={104} />
    </svg>
  );
}

function Generic({ glyph, color }: { glyph: string; color: string }) {
  return (
    <svg viewBox="0 0 200 120" className="h-full w-full">
      <rect x="60" y="20" width="80" height="80" rx="20" fill={color} />
      <text x="100" y="72" textAnchor="middle" fontSize="30" fontWeight="700" fill={C.white} fontFamily="system-ui">{glyph}</text>
      <Mic x={160} y={96} />
    </svg>
  );
}

export const PREVIEW_BG: Record<string, string> = {
  FLASHCARDS: "#fde6df",
  SPELL_THE_WORD: "#dff2e5",
  SPIN_THE_WHEEL: "#fdf0d3",
  LABEL_THE_DIAGRAM: "#e1ebf8",
  OPEN_THE_BOX: "#f3ede1",
  LISTEN_AND_SPEAK: "#dcf1ee",
  SPEAK_AND_ANSWER: "#fdf0d3",
  MATCH_AND_SPEAK: "#e1ebf8",
  IMAGE_AND_VOCABULARY: "#fde6df",
  QUESTION_AND_ANSWER: "#dcf1ee",
  SPELL_YOUR_NAME: "#dff2e5",
};

export function TemplatePreview({ k }: { k: string }) {
  switch (k) {
    case "FLASHCARDS": return <Flashcards />;
    case "SPELL_THE_WORD": return <Spell />;
    case "SPIN_THE_WHEEL": return <Wheel />;
    case "LABEL_THE_DIAGRAM": return <Diagram />;
    case "OPEN_THE_BOX": return <Boxes />;
    case "LISTEN_AND_SPEAK": return <ListenRepeat />;
    case "SPEAK_AND_ANSWER": return <ImageSpeak />;
    case "MATCH_AND_SPEAK": return <Match />;
    case "IMAGE_AND_VOCABULARY": return <Generic glyph="◧" color={C.coral} />;
    case "QUESTION_AND_ANSWER": return <Generic glyph="⇄" color={C.teal} />;
    case "SPELL_YOUR_NAME": return <Generic glyph="A·b" color={C.leaf} />;
    default: return <Generic glyph="•" color={C.ink} />;
  }
}
