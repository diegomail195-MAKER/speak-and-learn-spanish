// Activity templates. Every template runs on the same activity engine
// (src/components/player/useVoiceSession): each item is a question that is presented, answered
// (by voice, typing or drag & drop) and checked on the server the same way. A template only
// chooses the board the student sees, which fields the editor asks for, and its options.

export type TemplateKey =
  | "FLASHCARDS"
  | "SPELL_THE_WORD"
  | "SPIN_THE_WHEEL"
  | "LABEL_THE_DIAGRAM"
  | "OPEN_THE_BOX"
  | "LISTEN_AND_SPEAK"
  | "SPEAK_AND_ANSWER"
  | "MATCH_AND_SPEAK"
  | "IMAGE_AND_VOCABULARY"
  | "QUESTION_AND_ANSWER"
  | "SPELL_YOUR_NAME"
  // planned, not selectable
  | "FLY_AND_SPEAK"
  | "MEMORY_AND_SPEAK"
  | "MATCH_AND_LEARN"
  | "SPIN_AND_SPEAK"
  | "WATCH_LISTEN_ANSWER";

export type Board = "sequence" | "flashcards" | "spell" | "wheel" | "diagram" | "boxes" | "match";
export type TemplateFilter = "speaking" | "cards" | "spelling" | "games" | "pictures";

export type OptionDef =
  | { key: string; label: string; help?: string; type: "boolean"; default: boolean }
  | { key: string; label: string; help?: string; type: "choice"; default: string; choices: Array<{ value: string; label: string }> }
  | { key: string; label: string; help?: string; type: "number"; default: number; min: number; max: number };

export interface TemplateDef {
  key: TemplateKey;
  name: string;
  nameEs: string;
  description: string;
  /** One line on how it plays, shown in the gallery. */
  howItPlays: string;
  available: boolean;
  board: Board;
  filters: TemplateFilter[];
  /** How students answer. */
  answers: "voice" | "voice-or-typing" | "voice-optional";
  /** What the editor asks for per item. */
  fields: {
    image: "required" | "optional" | "none";
    prompt: boolean;
    answer: boolean;
    /** Text on the card / box / wheel slice / diagram label. */
    itemText?: { label: string; placeholder: string; required: boolean };
    translation?: boolean;
    point?: boolean;
  };
  /** The diagram image is one picture for the whole activity. */
  activityImage?: boolean;
  defaults: {
    acceptShortAnswer: boolean;
    showAnswerText: boolean;
    evaluationMode: "PHRASE" | "LETTERS";
  };
  options: OptionDef[];
  itemNoun: string;
  promptPlaceholder: string;
  answerPlaceholder: string;
  /** Items the editor starts with. */
  minItems?: number;
}

export const TEMPLATES: TemplateDef[] = [
  {
    key: "FLASHCARDS",
    name: "Flashcards",
    nameEs: "Tarjetas",
    description: "Cards with a front and a back. Students flip, listen, repeat and answer out loud.",
    howItPlays: "Front: picture and question. Say the answer, then flip to check. Missed cards come back.",
    available: true,
    board: "flashcards",
    filters: ["cards", "speaking", "pictures"],
    answers: "voice",
    fields: { image: "optional", prompt: true, answer: true, itemText: { label: "Front text", placeholder: "la manzana", required: false }, translation: true },
    defaults: { acceptShortAnswer: true, showAnswerText: false, evaluationMode: "PHRASE" },
    options: [
      { key: "shuffle", label: "Shuffle cards", type: "boolean", default: false },
      { key: "practiceMissed", label: "Practice missed cards at the end", type: "boolean", default: true },
    ],
    itemNoun: "card",
    promptPlaceholder: "¿Qué fruta es?",
    answerPlaceholder: "La manzana.",
  },
  {
    key: "SPELL_THE_WORD",
    name: "Spell the Word",
    nameEs: "Deletrea la palabra",
    description: "Students type the word, or spell it out loud letter by letter with Spanish letter names.",
    howItPlays: "Hear the word, then spell it: C–A–S–A (“ce, a, ese, a”). Letters light up as they're heard.",
    available: true,
    board: "spell",
    filters: ["spelling", "speaking"],
    answers: "voice-or-typing",
    fields: { image: "optional", prompt: false, answer: true },
    defaults: { acceptShortAnswer: false, showAnswerText: false, evaluationMode: "LETTERS" },
    options: [
      {
        key: "spellMode",
        label: "How students spell",
        type: "choice",
        default: "voice",
        choices: [
          { value: "voice", label: "Spell by voice (letter names)" },
          { value: "type", label: "Type the word" },
        ],
      },
      { key: "showWord", label: "Show the word before spelling", help: "Off: students only hear it and see the picture.", type: "boolean", default: false },
      { key: "caseSensitive", label: "Capital letters must match (typing)", type: "boolean", default: false },
      {
        key: "letterNames",
        label: "Letter names the app says",
        help: "Students may use any common name; this only changes the spoken model.",
        type: "choice",
        default: "rae",
        choices: [
          { value: "rae", label: "uve · doble uve · ye" },
          { value: "latam", label: "ve corta · doble ve · i griega" },
        ],
      },
    ],
    itemNoun: "word",
    promptPlaceholder: "",
    answerPlaceholder: "mariposa",
  },
  {
    key: "SPIN_THE_WHEEL",
    name: "Spin the Wheel",
    nameEs: "La ruleta",
    description: "A wheel picks a word, picture or question; students answer out loud.",
    howItPlays: "Spin, hear the question, answer by voice. Completed slices can leave the wheel.",
    available: true,
    board: "wheel",
    filters: ["games", "speaking"],
    answers: "voice",
    fields: { image: "optional", prompt: true, answer: true, itemText: { label: "Text on the wheel", placeholder: "Colores", required: true } },
    defaults: { acceptShortAnswer: true, showAnswerText: false, evaluationMode: "PHRASE" },
    options: [
      { key: "removeCompleted", label: "Remove completed slices", type: "boolean", default: true },
      { key: "repeatMissed", label: "Missed slices stay on the wheel", type: "boolean", default: true },
      { key: "timed", label: "Timed mode", type: "boolean", default: false },
      { key: "seconds", label: "Seconds per answer (timed mode)", type: "number", default: 20, min: 5, max: 120 },
    ],
    itemNoun: "slice",
    promptPlaceholder: "¿De qué color es el sol?",
    answerPlaceholder: "Amarillo.",
    minItems: 2,
  },
  {
    key: "LABEL_THE_DIAGRAM",
    name: "Label the Diagram",
    nameEs: "Etiqueta el dibujo",
    description: "One picture with points to label: parts of the body, a house, a map, a clock.",
    howItPlays: "A point lights up: drag its label, type it, or say it. Correct labels appear on the picture.",
    available: true,
    board: "diagram",
    filters: ["pictures", "speaking", "spelling"],
    answers: "voice-or-typing",
    fields: { image: "none", prompt: true, answer: true, point: true, itemText: { label: "Label", placeholder: "la cabeza", required: true } },
    activityImage: true,
    defaults: { acceptShortAnswer: true, showAnswerText: false, evaluationMode: "PHRASE" },
    options: [
      {
        key: "diagramMode",
        label: "How students label",
        type: "choice",
        default: "speak",
        choices: [
          { value: "speak", label: "Speak the label" },
          { value: "drag", label: "Drag & drop labels" },
          { value: "type", label: "Type the label" },
        ],
      },
    ],
    itemNoun: "point",
    promptPlaceholder: "¿Qué parte del cuerpo es?",
    answerPlaceholder: "La cabeza.",
    minItems: 2,
  },
  {
    key: "OPEN_THE_BOX",
    name: "Open the Box",
    nameEs: "Abre la caja",
    description: "Numbered boxes hide a picture, word or question. Each box is answered and checked.",
    howItPlays: "Tap a box, it opens, the question plays, answer out loud. Review the missed boxes at the end.",
    available: true,
    board: "boxes",
    filters: ["games", "speaking", "pictures"],
    answers: "voice",
    fields: { image: "optional", prompt: true, answer: true, itemText: { label: "Word or phrase inside", placeholder: "", required: false } },
    defaults: { acceptShortAnswer: true, showAnswerText: false, evaluationMode: "PHRASE" },
    options: [
      {
        key: "boxOrder",
        label: "Box order",
        type: "choice",
        default: "free",
        choices: [
          { value: "free", label: "Students choose any box" },
          { value: "sequential", label: "In order (1, 2, 3…)" },
          { value: "random", label: "Random box each time" },
        ],
      },
      { key: "reviewIncorrect", label: "Review missed boxes at the end", type: "boolean", default: true },
    ],
    itemNoun: "box",
    promptPlaceholder: "¿Qué es?",
    answerPlaceholder: "Es un gato.",
    minItems: 2,
  },
  {
    key: "LISTEN_AND_SPEAK",
    name: "Listen & Repeat",
    nameEs: "Escucha y repite",
    description: "Students hear a word or phrase and repeat it.",
    howItPlays: "Listen to the model, then say it. With Azure Speech, a pronunciation score is shown to the teacher.",
    available: true,
    board: "sequence",
    filters: ["speaking"],
    answers: "voice",
    fields: { image: "optional", prompt: false, answer: true },
    defaults: { acceptShortAnswer: false, showAnswerText: true, evaluationMode: "PHRASE" },
    options: [],
    itemNoun: "phrase",
    promptPlaceholder: "",
    answerPlaceholder: "Buenos días",
  },
  {
    key: "SPEAK_AND_ANSWER",
    name: "Image & Speak",
    nameEs: "Mira y responde",
    description: "A picture and a spoken question. Students answer out loud.",
    howItPlays: "See the picture, hear “¿Qué animal es?”, answer “Es un perro.”",
    available: true,
    board: "sequence",
    filters: ["pictures", "speaking"],
    answers: "voice",
    fields: { image: "required", prompt: true, answer: true },
    defaults: { acceptShortAnswer: true, showAnswerText: false, evaluationMode: "PHRASE" },
    options: [],
    itemNoun: "question",
    promptPlaceholder: "¿Qué animal es?",
    answerPlaceholder: "Es un perro.",
  },
  {
    key: "MATCH_AND_SPEAK",
    name: "Match & Speak",
    nameEs: "Relaciona y habla",
    description: "Match each picture with its word, then say it out loud.",
    howItPlays: "Drag a word onto its picture. After each match, say the word.",
    available: true,
    board: "match",
    filters: ["pictures", "games", "speaking"],
    answers: "voice-optional",
    fields: { image: "required", prompt: false, answer: true },
    defaults: { acceptShortAnswer: true, showAnswerText: true, evaluationMode: "PHRASE" },
    options: [{ key: "speakRequired", label: "Saying the word is required", help: "Off: students may skip the spoken part.", type: "boolean", default: true }],
    itemNoun: "pair",
    promptPlaceholder: "",
    answerPlaceholder: "el perro",
    minItems: 2,
  },
  {
    key: "IMAGE_AND_VOCABULARY",
    name: "Picture Words",
    nameEs: "Imagen y vocabulario",
    description: "Students look at a picture and say its name in Spanish.",
    howItPlays: "A picture appears; say its name.",
    available: true,
    board: "sequence",
    filters: ["pictures", "speaking"],
    answers: "voice",
    fields: { image: "required", prompt: false, answer: true },
    defaults: { acceptShortAnswer: true, showAnswerText: false, evaluationMode: "PHRASE" },
    options: [],
    itemNoun: "picture",
    promptPlaceholder: "",
    answerPlaceholder: "la manzana",
  },
  {
    key: "QUESTION_AND_ANSWER",
    name: "Question & Answer",
    nameEs: "Pregunta y respuesta",
    description: "Conversation questions answered out loud.",
    howItPlays: "Hear “¿Cómo estás?”, answer “Estoy bien.”",
    available: true,
    board: "sequence",
    filters: ["speaking"],
    answers: "voice",
    fields: { image: "optional", prompt: true, answer: true },
    defaults: { acceptShortAnswer: false, showAnswerText: false, evaluationMode: "PHRASE" },
    options: [],
    itemNoun: "question",
    promptPlaceholder: "¿Cómo estás?",
    answerPlaceholder: "Estoy bien.",
  },
  {
    key: "SPELL_YOUR_NAME",
    name: "Spell Your Name",
    nameEs: "Deletrea tu nombre",
    description: "Students spell their own first and last name with Spanish letter names.",
    howItPlays: "“¿Cómo deletreas tu nombre?” — “de, i, e, ge, o”.",
    available: true,
    board: "sequence",
    filters: ["spelling", "speaking"],
    answers: "voice",
    fields: { image: "none", prompt: true, answer: false },
    defaults: { acceptShortAnswer: false, showAnswerText: false, evaluationMode: "LETTERS" },
    options: [{
        key: "letterNames",
        label: "Letter names the app says",
        help: "Students may use any common name; this only changes the spoken model.",
        type: "choice",
        default: "rae",
        choices: [
          { value: "rae", label: "uve · doble uve · ye" },
          { value: "latam", label: "ve corta · doble ve · i griega" },
        ],
      },],
    itemNoun: "question",
    promptPlaceholder: "¿Cómo deletreas tu nombre?",
    answerPlaceholder: "",
  },
  ...(["FLY_AND_SPEAK", "MEMORY_AND_SPEAK", "MATCH_AND_LEARN", "SPIN_AND_SPEAK", "WATCH_LISTEN_ANSWER"] as const).map(
    (key): TemplateDef => ({
      key,
      name: key,
      nameEs: key,
      description: "Planned.",
      howItPlays: "",
      available: false,
      board: "sequence",
      filters: [],
      answers: "voice",
      fields: { image: "optional", prompt: true, answer: true },
      defaults: { acceptShortAnswer: true, showAnswerText: false, evaluationMode: "PHRASE" },
      options: [],
      itemNoun: "question",
      promptPlaceholder: "",
      answerPlaceholder: "",
    }),
  ),
];

export const templateByKey = (key: string) => TEMPLATES.find((t) => t.key === key);

export const FILTERS: Array<{ key: TemplateFilter | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "speaking", label: "Speaking" },
  { key: "cards", label: "Cards" },
  { key: "spelling", label: "Spelling" },
  { key: "pictures", label: "Pictures" },
  { key: "games", label: "Games" },
];

/** Template options with their defaults filled in. */
export function templateOptions(t: TemplateDef | undefined, saved: Record<string, unknown> | undefined): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const o of t?.options ?? []) {
    const v = saved?.[o.key];
    out[o.key] = typeof v === typeof o.default ? (v as string | number | boolean) : o.default;
  }
  return out;
}

export const DEFAULT_CATEGORIES: Array<[string, string]> = [
  ["Alphabet", "El abecedario"],
  ["Vowels", "Las vocales"],
  ["Numbers", "Los números"],
  ["Colors", "Los colores"],
  ["Shapes", "Las formas"],
  ["Greetings", "Los saludos"],
  ["Animals", "Los animales"],
  ["Family", "La familia"],
  ["School", "La escuela"],
  ["Food", "La comida"],
  ["Weather", "El clima"],
  ["Time", "La hora"],
  ["Emotions", "Las emociones"],
  ["Daily Routines", "Rutinas diarias"],
  ["Conversations", "Conversaciones"],
  ["Songs", "Canciones"],
];
