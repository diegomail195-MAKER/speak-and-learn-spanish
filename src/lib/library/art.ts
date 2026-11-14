/* eslint-disable */
// @ts-nocheck -- ported as-is from the approved LaxtroSpeak prototype (original SVG art).
// LaxtroSpeak — original SVG illustrations (all drawn for this project): Piñita, topic art and
// one picture per vocabulary word. Returns SVG markup strings (static, trusted content).
type ArtApi = {
  pinita: (mood?: "happy" | "cheer" | "think") => string;
  topics: Record<string, () => string>;
  ico: (name: string, cls?: string) => string;
  pic: (topic: string, id: string, label?: string) => string;
  logoMark: () => string;
};

export const ART: ArtApi = (function () {

  const INK = '#1F2A44';
  const svg = (body, vb = '0 0 200 200', label = '') =>
    `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" role="img"${label ? ` aria-label="${label}"` : ' aria-hidden="true"'}>${body}</svg>`;
  const eyes = (lx, rx, y, r = 7) =>
    `<circle cx="${lx}" cy="${y}" r="${r}" fill="${INK}"/><circle cx="${rx}" cy="${y}" r="${r}" fill="${INK}"/>` +
    `<circle cx="${lx + r * 0.35}" cy="${y - r * 0.4}" r="${r * 0.35}" fill="#fff"/><circle cx="${rx + r * 0.35}" cy="${y - r * 0.4}" r="${r * 0.35}" fill="#fff"/>`;
  const cheeks = (lx, rx, y) =>
    `<ellipse cx="${lx}" cy="${y}" rx="9" ry="6" fill="#FF8FA3" opacity=".55"/><ellipse cx="${rx}" cy="${y}" rx="9" ry="6" fill="#FF8FA3" opacity=".55"/>`;
  const shadow = `<ellipse cx="100" cy="186" rx="58" ry="8" fill="${INK}" opacity=".08"/>`;

  const animals = {
    perro: () => svg(`${shadow}
      <path d="M48 62 C30 64 22 96 30 128 C34 142 50 140 54 126 L62 84Z" fill="#7A4A2A"/>
      <path d="M152 62 C170 64 178 96 170 128 C166 142 150 140 146 126 L138 84Z" fill="#7A4A2A"/>
      <ellipse cx="100" cy="102" rx="56" ry="58" fill="#C98B4E"/>
      <ellipse cx="100" cy="134" rx="34" ry="26" fill="#F6E3C8"/>
      <ellipse cx="78" cy="84" rx="14" ry="16" fill="#A86C38" opacity=".6"/>
      ${eyes(80, 120, 92)}
      <ellipse cx="100" cy="120" rx="12" ry="9" fill="${INK}"/>
      <path d="M100 129 v8 M88 138 q12 10 24 0" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M94 141 q6 16 12 0Z" fill="#FF6F7D"/>
      ${cheeks(66, 134, 116)}`, '0 0 200 200', 'el perro'),

    oveja: () => svg(`${shadow}
      <g fill="#fff" stroke="#D6DCE6" stroke-width="3">
        <circle cx="62" cy="70" r="24"/><circle cx="100" cy="56" r="26"/><circle cx="138" cy="70" r="24"/>
        <circle cx="48" cy="106" r="24"/><circle cx="152" cy="106" r="24"/>
        <circle cx="62" cy="142" r="24"/><circle cx="100" cy="152" r="26"/><circle cx="138" cy="142" r="24"/>
      </g>
      <circle cx="100" cy="104" r="44" fill="#fff"/>
      <path d="M56 96 C40 92 34 104 44 112 C52 116 60 110 62 104Z" fill="#5B5466"/>
      <path d="M144 96 C160 92 166 104 156 112 C148 116 140 110 138 104Z" fill="#5B5466"/>
      <ellipse cx="100" cy="112" rx="34" ry="40" fill="#5B5466"/>
      <circle cx="88" cy="72" r="12" fill="#fff"/><circle cx="104" cy="66" r="13" fill="#fff"/><circle cx="116" cy="74" r="11" fill="#fff"/>
      ${eyes(87, 113, 106, 6)}
      <ellipse cx="100" cy="132" rx="9" ry="6" fill="#3A3442"/>
      <path d="M92 140 q8 7 16 0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>
      ${cheeks(76, 124, 124)}`, '0 0 200 200', 'la oveja'),

    tigre: () => svg(`${shadow}
      <circle cx="56" cy="56" r="20" fill="#F28C28"/><circle cx="56" cy="56" r="10" fill="#FFD9B0"/>
      <circle cx="144" cy="56" r="20" fill="#F28C28"/><circle cx="144" cy="56" r="10" fill="#FFD9B0"/>
      <ellipse cx="100" cy="106" rx="62" ry="58" fill="#F28C28"/>
      <path d="M100 50 l-8 16 h16Z M84 52 l-4 12 h8Z M116 52 l-4 12 h8Z" fill="${INK}"/>
      <path d="M38 96 h18 M40 112 h16 M162 96 h-18 M160 112 h-16" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
      <path d="M62 128 C66 160 134 160 138 128 C130 116 70 116 62 128Z" fill="#FFF4E6"/>
      ${eyes(78, 122, 96)}
      <path d="M90 118 h20 l-10 10Z" fill="#E0566B"/>
      <path d="M100 128 v6 M88 138 q12 8 24 0" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>
      ${cheeks(64, 136, 118)}`, '0 0 200 200', 'el tigre'),

    capibara: () => svg(`${shadow}
      <ellipse cx="60" cy="60" rx="12" ry="10" fill="#8A5A36"/><ellipse cx="140" cy="60" rx="12" ry="10" fill="#8A5A36"/>
      <rect x="44" y="54" width="112" height="120" rx="48" fill="#B07A4C"/>
      <rect x="60" y="112" width="80" height="56" rx="28" fill="#8A5A36"/>
      <ellipse cx="86" cy="132" rx="6" ry="4" fill="${INK}"/><ellipse cx="114" cy="132" rx="6" ry="4" fill="${INK}"/>
      <path d="M90 150 q10 6 20 0" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M72 92 q8 -6 16 0 M112 92 q8 -6 16 0" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <circle cx="100" cy="40" r="17" fill="#FFB020"/><path d="M100 24 q6 -10 14 -8 q-4 8 -14 8Z" fill="#3DBE6E"/>
      ${cheeks(64, 136, 112)}`, '0 0 200 200', 'la capibara'),

    conejo: () => svg(`${shadow}
      <ellipse cx="76" cy="50" rx="16" ry="44" fill="#E9EDF3" transform="rotate(-10 76 50)"/>
      <ellipse cx="76" cy="52" rx="7" ry="32" fill="#FFB3C1" transform="rotate(-10 76 52)"/>
      <ellipse cx="124" cy="50" rx="16" ry="44" fill="#E9EDF3" transform="rotate(10 124 50)"/>
      <ellipse cx="124" cy="52" rx="7" ry="32" fill="#FFB3C1" transform="rotate(10 124 52)"/>
      <ellipse cx="100" cy="122" rx="54" ry="50" fill="#E9EDF3"/>
      ${eyes(80, 120, 114)}
      <path d="M93 132 h14 l-7 7Z" fill="#FF7F96"/>
      <path d="M100 139 v5 M90 146 q10 8 20 0" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>
      <rect x="94" y="148" width="12" height="11" rx="2" fill="#fff" stroke="${INK}" stroke-width="2"/>
      <path d="M40 130 h26 M42 142 l24 -6 M160 130 h-26 M158 142 l-24 -6" stroke="#9AA4B5" stroke-width="2.5" stroke-linecap="round"/>
      ${cheeks(66, 134, 136)}`, '0 0 200 200', 'el conejo'),

    tortuga: () => svg(`${shadow}
      <ellipse cx="56" cy="160" rx="14" ry="12" fill="#7FCB7A"/><ellipse cx="144" cy="160" rx="14" ry="12" fill="#7FCB7A"/>
      <circle cx="160" cy="112" r="26" fill="#7FCB7A"/>
      ${eyes(154, 172, 106, 5)}
      <path d="M156 122 q8 6 16 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M30 150 C30 80 140 70 150 150Z" fill="#2E9E6A"/>
      <path d="M58 104 l16 -10 l18 8 l0 18 l-18 8 l-16 -8Z M100 96 l18 2 l10 14 l-8 16 l-18 -4 l-2 -16Z M50 132 l18 -4 l14 12 l-4 10 h-28Z M96 136 l18 -6 l16 12 l2 8 h-34Z" fill="#53C08A"/>
      <rect x="24" y="146" width="132" height="12" rx="6" fill="#23845A"/>
      <path d="M30 140 q-14 4 -16 12" stroke="#7FCB7A" stroke-width="8" fill="none" stroke-linecap="round"/>`, '0 0 200 200', 'la tortuga'),

    delfin: () => svg(`
      <path d="M14 168 q20 -12 40 0 t40 0 t40 0 t40 0 t40 0 V200 H14Z" fill="#7FD3F5"/>
      <path d="M36 146 C40 90 92 50 150 58 C170 60 182 70 188 80 C176 80 168 84 164 92 C150 120 110 146 60 150 Z" fill="#3D8FE0"/>
      <path d="M60 150 C100 146 146 126 160 98 C140 112 106 128 62 136Z" fill="#BFE6FF"/>
      <path d="M110 62 C112 40 128 30 138 28 C132 42 132 52 136 60Z" fill="#2C74C0"/>
      <path d="M44 140 C24 130 14 140 10 154 C22 148 32 150 40 156Z" fill="#2C74C0"/>
      <path d="M96 120 C92 136 80 146 70 150 C86 150 98 142 104 130Z" fill="#2C74C0"/>
      <circle cx="150" cy="76" r="6" fill="${INK}"/><circle cx="152" cy="73.5" r="2.2" fill="#fff"/>
      <path d="M164 92 q10 4 20 -6" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <ellipse cx="140" cy="88" rx="7" ry="4.5" fill="#FF8FA3" opacity=".6"/>
      <circle cx="30" cy="110" r="5" fill="#BFE6FF"/><circle cx="20" cy="96" r="3.5" fill="#BFE6FF"/>`, '0 0 200 200', 'el delfín'),

    panda: () => svg(`${shadow}
      <circle cx="54" cy="58" r="22" fill="${INK}"/><circle cx="146" cy="58" r="22" fill="${INK}"/>
      <ellipse cx="100" cy="106" rx="62" ry="58" fill="#fff" stroke="#E3E7EE" stroke-width="3"/>
      <ellipse cx="76" cy="98" rx="17" ry="22" fill="${INK}" transform="rotate(-22 76 98)"/>
      <ellipse cx="124" cy="98" rx="17" ry="22" fill="${INK}" transform="rotate(22 124 98)"/>
      <circle cx="78" cy="98" r="7" fill="#fff"/><circle cx="122" cy="98" r="7" fill="#fff"/>
      <circle cx="79" cy="99" r="4" fill="${INK}"/><circle cx="121" cy="99" r="4" fill="${INK}"/>
      <ellipse cx="100" cy="124" rx="10" ry="7" fill="${INK}"/>
      <path d="M100 131 v6 M89 140 q11 8 22 0" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>
      ${cheeks(62, 138, 126)}
      <path d="M150 150 l20 -40" stroke="#5DBB63" stroke-width="7" stroke-linecap="round"/><path d="M162 124 q10 -6 14 -2 q-6 8 -14 2Z" fill="#5DBB63"/>`, '0 0 200 200', 'el panda'),
  };

  /* Piñita — original LaxtroSpeak mascot: a little star piñata. */
  function pinita(mood = 'happy') {
    const mouth = mood === 'cheer'
      ? `<path d="M86 112 q14 18 28 0Z" fill="${INK}"/><path d="M93 118 q7 6 14 0" fill="#FF6F7D"/>`
      : mood === 'think'
      ? `<path d="M90 116 q10 -4 20 2" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>`
      : `<path d="M88 112 q12 12 24 0" stroke="${INK}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
    const sparkle = mood === 'cheer'
      ? `<path d="M30 40 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4Z" fill="#FFC93C"/><path d="M168 30 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3Z" fill="#3DD6A3"/>`
      : '';
    const cone = (rot, c) =>
      `<g transform="rotate(${rot} 100 100)"><path d="M88 54 L100 10 L112 54Z" fill="${c}"/><path d="M100 10 l-6 -8 M100 10 l0 -10 M100 10 l6 -8" stroke="${c}" stroke-width="3" stroke-linecap="round"/></g>`;
    return svg(`${sparkle}
      ${cone(0, '#FFC93C')}${cone(72, '#4CB8F5')}${cone(144, '#3DD6A3')}${cone(216, '#FF8A3D')}${cone(288, '#B57BFF')}
      <circle cx="100" cy="100" r="50" fill="#F2559A"/>
      <path d="M52 84 h96" stroke="#FFC93C" stroke-width="9" stroke-dasharray="7 4"/>
      <path d="M50 124 h100" stroke="#4CB8F5" stroke-width="9" stroke-dasharray="7 4"/>
      <circle cx="100" cy="100" r="50" fill="none" stroke="#C93A7A" stroke-width="3"/>
      ${eyes(84, 116, 98, 6.5)}
      ${cheeks(72, 128, 110)}
      ${mouth}`, '0 0 200 200', 'Piñita');
  }

  const logoMark = () => svg(`
    <path d="M14 10 h52 a10 10 0 0 1 10 10 v30 a10 10 0 0 1 -10 10 h-30 l-14 12 v-12 h-8 a10 10 0 0 1 -10 -10 v-30 a10 10 0 0 1 10 -10Z" fill="#FF5A4E"/>
    <text x="40" y="47" text-anchor="middle" font-family="inherit" font-weight="800" font-size="34" fill="#fff">ñ</text>
    <circle cx="70" cy="12" r="9" fill="#FFC93C"/>`, '0 0 80 80');

  /* Topic illustrations */
  const topics = {
    greetings: () => svg(`
      <rect x="24" y="36" width="152" height="96" rx="30" fill="#fff"/>
      <path d="M60 128 l-10 30 l34 -28Z" fill="#fff"/>
      <text x="100" y="100" text-anchor="middle" font-family="inherit" font-weight="800" font-size="42" fill="${INK}">¡Hola!</text>
      <circle cx="160" cy="150" r="22" fill="#FF8A3D"/><path d="M150 150 q10 10 20 0" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <circle cx="153" cy="143" r="3" fill="${INK}"/><circle cx="167" cy="143" r="3" fill="${INK}"/>`),
    numbers: () => svg(`
      <rect x="20" y="96" width="52" height="52" rx="12" fill="#FF5A4E"/><text x="46" y="136" text-anchor="middle" font-family="inherit" font-weight="800" font-size="40" fill="#fff">1</text>
      <rect x="74" y="64" width="52" height="52" rx="12" fill="#FFC93C"/><text x="100" y="104" text-anchor="middle" font-family="inherit" font-weight="800" font-size="40" fill="${INK}">2</text>
      <rect x="128" y="96" width="52" height="52" rx="12" fill="#3DD6A3"/><text x="154" y="136" text-anchor="middle" font-family="inherit" font-weight="800" font-size="40" fill="${INK}">3</text>
      <rect x="20" y="150" width="160" height="10" rx="5" fill="#fff" opacity=".7"/>`),
    colors: () => svg(`
      <path d="M100 30 C40 30 20 80 30 120 C40 160 80 172 96 150 C108 134 92 120 108 112 C124 104 140 124 160 112 C188 96 176 30 100 30Z" fill="#fff"/>
      <circle cx="66" cy="70" r="13" fill="#FF5A4E"/><circle cx="104" cy="56" r="13" fill="#FFC93C"/><circle cx="142" cy="70" r="13" fill="#3DD6A3"/>
      <circle cx="56" cy="110" r="13" fill="#4CB8F5"/><circle cx="76" cy="144" r="10" fill="#B57BFF"/>
      <path d="M128 168 l40 -60" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><path d="M164 112 l10 -16 l6 4 l-8 18Z" fill="#FF5A4E"/>`),
    shapes: () => svg(`
      <circle cx="62" cy="70" r="34" fill="#FF5A4E"/>
      <rect x="108" y="40" width="64" height="64" rx="10" fill="#FFC93C"/>
      <path d="M100 116 l40 62 h-80Z" fill="#fff"/>
      <path d="M154 126 l10 20 l22 3 l-16 15 l4 22 l-20 -11 l-20 11 l4 -22 l-16 -15 l22 -3Z" fill="#B57BFF"/>`),
    animals: () => animals.capibara().replace('aria-label="la capibara"', 'aria-hidden="true"').replace('role="img"', ''),
  };

  /* Small UI icons */
  const icon = {
    home: '<path d="M4 11 L12 4 L20 11 V20 H14 V14 H10 V20 H4Z"/>',
    songs: '<path d="M9 18 V6 L20 4 V16"/><circle cx="7" cy="18" r="2.6"/><circle cx="18" cy="16" r="2.6"/>',
    games: '<rect x="3" y="7" width="18" height="11" rx="5"/><path d="M8 10 v5 M5.5 12.5 h5"/><circle cx="16" cy="11" r="1"/><circle cx="18" cy="14" r="1"/>',
    flashcards: '<rect x="3" y="6" width="13" height="15" rx="2"/><path d="M8 3 h11 a2 2 0 0 1 2 2 v13"/>',
    printables: '<path d="M7 9 V3 H17 V9"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14 H17 V21 H7Z"/>',
    speaker: '<path d="M4 9 H8 L13 5 V19 L8 15 H4Z"/><path d="M16 9 q3 3 0 6 M18.5 6.5 q6 5.5 0 11"/>',
    back: '<path d="M15 5 L8 12 L15 19"/>',
    next: '<path d="M9 5 L16 12 L9 19"/>',
    shuffle: '<path d="M3 7 H7 L15 17 H21 M18 14 L21 17 L18 20 M3 17 H7 L9.5 14 M13 10 L15 7 H21 M18 4 L21 7 L18 10"/>',
    flip: '<path d="M4 12 a8 8 0 0 1 14 -5 M20 12 a8 8 0 0 1 -14 5 M18 3 v4 h-4 M6 21 v-4 h4"/>',
    check: '<path d="M5 12 L10 17 L19 7"/>',
    play: '<path d="M8 5 L19 12 L8 19Z"/>',
    pause: '<path d="M8 5 V19 M16 5 V19"/>',
    video: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9 L15 12 L10 15Z"/>',
    book: '<path d="M4 5 a2 2 0 0 1 2 -2 H12 V21 H6 a2 2 0 0 1 -2 -2Z M12 3 H18 a2 2 0 0 1 2 2 V19 a2 2 0 0 1 -2 2 H12"/>',
    cc: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 10 a2 2 0 1 0 0 4 M16 10 a2 2 0 1 0 0 4"/>',
    star: '<path d="M12 3 l2.8 5.8 6.2.9 -4.5 4.4 1 6.2 -5.5 -2.9 -5.5 2.9 1 -6.2 -4.5 -4.4 6.2 -.9Z"/>',
  };
  const ico = (name, cls = '') =>
    `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${icon[name] || ''}</svg>`;

  /* ---------- Greetings scenes ---------- */
  const frame = (bg, body, label) => svg(`<rect x="10" y="10" width="180" height="180" rx="36" fill="${bg}"/>${body}`, '0 0 200 200', label);
  const hand = (tx = 0, flip = false) => `<g transform="translate(${tx} 0) ${flip ? 'translate(200 0) scale(-1 1)' : ''}">
      <path d="M70 160 C60 130 58 110 62 92 C64 84 74 84 76 92 L80 112 L80 62 C80 52 94 52 94 62 L94 104 L96 52 C96 42 110 42 110 52 L110 104 L114 60 C114 50 128 50 128 60 L126 110 L134 92 C138 84 150 88 146 98 L130 146 C124 162 108 170 92 170 C82 170 74 166 70 160Z" fill="#FFCFA3" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/></g>`;
  const greetings = {
    hola: () => frame('#FFE7A0', `${hand()}<path d="M44 70 q-12 16 0 32 M30 62 q-18 24 0 48 M158 70 q12 16 0 32 M172 62 q18 24 0 48" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>`, 'hola'),
    adios: () => frame('#D9F1FF', `<rect x="44" y="40" width="70" height="132" rx="6" fill="#B9773E" stroke="${INK}" stroke-width="4"/>
      <circle cx="100" cy="108" r="6" fill="#FFC93C"/><path d="M114 40 L150 54 V160 L114 172Z" fill="#8A5A36" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M126 106 h46 M160 92 l14 14 l-14 14" stroke="${INK}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`, 'adiós'),
    buenosdias: () => frame('#FFD6C4', `<circle cx="100" cy="140" r="44" fill="#FFB020"/>
      ${[0, 30, 60, 90, 120, 150, 180].map((a) => `<path d="M100 140 m${-Math.cos(a * Math.PI / 180) * 54} ${-Math.sin(a * Math.PI / 180) * 54} l${-Math.cos(a * Math.PI / 180) * 16} ${-Math.sin(a * Math.PI / 180) * 16}" stroke="#FF8A3D" stroke-width="7" stroke-linecap="round"/>`).join('')}
      <path d="M10 140 Q60 120 100 136 T190 132 V154 a36 36 0 0 1 -36 36 H46 a36 36 0 0 1 -36 -36Z" fill="#3DBE6E"/>
      <circle cx="88" cy="130" r="4" fill="${INK}"/><circle cx="112" cy="130" r="4" fill="${INK}"/>`, 'buenos días'),
    buenastardes: () => frame('#9FDBFF', `<circle cx="132" cy="70" r="30" fill="#FFC93C"/>
      <g fill="#fff"><circle cx="60" cy="110" r="20"/><circle cx="84" cy="100" r="24"/><circle cx="108" cy="112" r="18"/><rect x="40" y="110" width="84" height="20" rx="10"/></g>
      <path d="M10 156 Q100 136 190 156 V154 a36 36 0 0 1 -36 36 H46 a36 36 0 0 1 -36 -36Z" fill="#7FCB7A"/>
      <rect x="128" y="132" width="34" height="30" rx="6" fill="#FF5A4E" stroke="${INK}" stroke-width="3"/><path d="M136 132 v-6 h18 v6" stroke="${INK}" stroke-width="3" fill="none"/>`, 'buenas tardes'),
    buenasnoches: () => frame('#26315A', `<path d="M118 48 A46 46 0 1 0 150 128 A38 38 0 1 1 118 48Z" fill="#FFE27A"/>
      <path d="M52 52 l4 9 l9 4 l-9 4 l-4 9 l-4 -9 l-9 -4 l9 -4Z M150 40 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3Z M156 150 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3Z" fill="#fff"/>
      <path d="M86 110 q6 5 12 0" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M84 96 q5 4 10 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`, 'buenas noches'),
    comoestas: () => frame('#E5DBFF', `<circle cx="84" cy="112" r="46" fill="#FFC93C" stroke="${INK}" stroke-width="4"/>
      ${eyes(68, 100, 104, 6)}<path d="M70 128 h28" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
      <rect x="116" y="30" width="64" height="58" rx="20" fill="#fff" stroke="${INK}" stroke-width="4"/><path d="M124 84 l-10 18 l24 -14" fill="#fff" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <text x="148" y="76" text-anchor="middle" font-family="inherit" font-weight="800" font-size="44" fill="#B57BFF">?</text>`, '¿cómo estás?'),
    muybien: () => frame('#C9F5DF', `<path d="M58 96 h22 v74 h-22Z" fill="#4CB8F5" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M80 100 L104 50 C108 38 126 40 124 56 L118 86 H150 C160 86 166 96 162 106 L150 154 C147 164 140 170 130 170 H80Z" fill="#FFCFA3" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M150 40 l4 9 l9 4 l-9 4 l-4 9 l-4 -9 l-9 -4 l9 -4Z" fill="#FFC93C"/>`, 'muy bien'),
    gracias: () => frame('#FFD5E5', `<path d="M100 166 C40 124 30 96 42 74 C54 52 86 52 100 78 C114 52 146 52 158 74 C170 96 160 124 100 166Z" fill="#FF5A4E" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M64 82 q8 -10 18 -6" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M160 40 l4 9 l9 4 l-9 4 l-4 9 l-4 -9 l-9 -4 l9 -4Z M36 132 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3Z" fill="#FFC93C"/>`, 'gracias'),
  };

  /* ---------- Numbers: ten-frames ---------- */
  const NUM_COLORS = ['#FF5A4E', '#FF8A3D', '#FFB020', '#3DBE6E', '#3DD6A3', '#4CB8F5', '#3D8FE0', '#B57BFF', '#F2559A', '#C93A7A'];
  function numberPic(n, label) {
    let cells = '';
    for (let k = 0; k < 10; k++) {
      const x = 22 + (k % 5) * 32, y = 66 + Math.floor(k / 5) * 34;
      cells += `<rect x="${x}" y="${y}" width="28" height="30" rx="6" fill="#fff" stroke="${INK}" stroke-width="2.5"/>`;
      if (k < n) cells += `<circle cx="${x + 14}" cy="${y + 15}" r="10" fill="${NUM_COLORS[n - 1]}"/>`;
    }
    return svg(`<rect x="10" y="38" width="180" height="104" rx="22" fill="#FFF1DE" stroke="${INK}" stroke-width="3"/>${cells}
      <rect x="66" y="150" width="68" height="40" rx="14" fill="${NUM_COLORS[n - 1]}"/><text x="100" y="181" text-anchor="middle" font-family="inherit" font-weight="800" font-size="32" fill="#fff">${n}</text>`, '0 0 200 200', label);
  }

  /* ---------- Colors: paint splats ---------- */
  const COLOR_HEX = { rojo: '#E53935', azul: '#1E6FD9', amarillo: '#FFD21F', verde: '#2EA44F', anaranjado: '#FF8A1F', morado: '#8E44C9', rosado: '#FF8FC1', cafe: '#8B5A2B' };
  function colorPic(id, label) {
    const c = COLOR_HEX[id];
    return svg(`<path d="M100 26 C122 26 128 46 146 44 C170 42 184 66 172 86 C164 100 182 112 176 132 C168 158 140 156 128 170 C114 186 86 186 74 170 C62 156 34 162 26 138 C18 116 38 104 32 88 C24 66 44 44 64 48 C80 50 82 26 100 26Z" fill="${c}" stroke="${INK}" stroke-width="4"/>
      <circle cx="176" cy="40" r="10" fill="${c}" stroke="${INK}" stroke-width="3"/><circle cx="26" cy="176" r="8" fill="${c}" stroke="${INK}" stroke-width="3"/>
      <ellipse cx="78" cy="78" rx="16" ry="9" fill="#fff" opacity=".45" transform="rotate(-30 78 78)"/>`, '0 0 200 200', label);
  }

  /* ---------- Shapes ---------- */
  const SH = {
    circulo: `<circle cx="100" cy="104" r="68" fill="#FF5A4E"/>`,
    cuadrado: `<rect x="38" y="42" width="124" height="124" rx="10" fill="#FFC93C"/>`,
    triangulo: `<path d="M100 30 L172 166 H28Z" fill="#3DD6A3" stroke-linejoin="round"/>`,
    rectangulo: `<rect x="22" y="62" width="156" height="84" rx="10" fill="#4CB8F5"/>`,
    estrella: `<path d="M100 22 l22 48 l52 6 l-39 35 l11 52 l-46 -27 l-46 27 l11 -52 l-39 -35 l52 -6Z" fill="#FFB020"/>`,
    corazon: `<path d="M100 172 C40 130 22 98 36 72 C50 46 86 48 100 76 C114 48 150 46 164 72 C178 98 160 130 100 172Z" fill="#F2559A"/>`,
    ovalo: `<ellipse cx="100" cy="104" rx="52" ry="76" fill="#B57BFF"/>`,
    rombo: `<path d="M100 24 L168 104 L100 184 L32 104Z" fill="#FF8A3D"/>`,
  };
  const shapePic = (id, label) => svg(`<g stroke="${INK}" stroke-width="5" stroke-linejoin="round">${SH[id]}</g>`, '0 0 200 200', label);

  /* Picture for any vocab item */
  function pic(topic, id, label) {
    if (topic === 'animals') return animals[id]();
    if (topic === 'greetings') return greetings[id]();
    if (topic === 'numbers') return numberPic(+id, label);
    if (topic === 'colors') return colorPic(id, label);
    if (topic === 'shapes') return shapePic(id, label);
    return '';
  }

  return { animals, pinita, logoMark, topics, ico, pic };
})();

/** "animals:perro" → SVG markup ("" when unknown). "topic:animals" → topic card art. */
export function artSvg(key: string | undefined | null): string {
  if (!key) return "";
  const [group, id] = key.split(":");
  try {
    if (group === "topic") return ART.topics[id]?.() ?? "";
    if (group === "pinita") return ART.pinita((id as "happy") || "happy");
    return ART.pic(group, id, "") ?? "";
  } catch {
    return "";
  }
}
