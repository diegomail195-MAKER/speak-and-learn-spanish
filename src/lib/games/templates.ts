// Game templates. Every template runs on the same activity engine (src/components/player):
// a sequence of questions, each presented, answered by voice and evaluated the same way.
// Templates only change presentation and default evaluation settings.

export type TemplateKey =
  | "SPEAK_AND_ANSWER"
  | "LISTEN_AND_SPEAK"
  | "SPELL_YOUR_NAME"
  | "IMAGE_AND_VOCABULARY"
  | "QUESTION_AND_ANSWER"
  | "FLY_AND_SPEAK"
  | "MEMORY_AND_SPEAK"
  | "MATCH_AND_LEARN"
  | "SPIN_AND_SPEAK"
  | "WATCH_LISTEN_ANSWER";

export interface TemplateDef {
  key: TemplateKey;
  name: string;
  nameEs: string;
  description: string;
  available: boolean;
  /** What the editor asks for per item. */
  fields: { image: "required" | "optional" | "none"; prompt: boolean; answer: boolean; displayText: boolean };
  defaults: {
    acceptShortAnswer: boolean;
    /** Show the expected text on screen (Listen & Speak shows the phrase to repeat). */
    showAnswerText: boolean;
    evaluationMode: "PHRASE" | "LETTERS";
  };
  promptPlaceholder: string;
  answerPlaceholder: string;
}

export const TEMPLATES: TemplateDef[] = [
  {
    key: "SPEAK_AND_ANSWER",
    name: "Speak & Answer",
    nameEs: "Mira y responde",
    description: "An image and a spoken question. Students answer out loud.",
    available: true,
    fields: { image: "required", prompt: true, answer: true, displayText: false },
    defaults: { acceptShortAnswer: true, showAnswerText: false, evaluationMode: "PHRASE" },
    promptPlaceholder: "¿Qué animal es?",
    answerPlaceholder: "Es un perro.",
  },
  {
    key: "LISTEN_AND_SPEAK",
    name: "Listen & Speak",
    nameEs: "Escucha y repite",
    description: "Students hear a word or phrase and repeat it.",
    available: true,
    fields: { image: "optional", prompt: false, answer: true, displayText: false },
    defaults: { acceptShortAnswer: false, showAnswerText: true, evaluationMode: "PHRASE" },
    promptPlaceholder: "",
    answerPlaceholder: "Buenos días",
  },
  {
    key: "IMAGE_AND_VOCABULARY",
    name: "Image & Vocabulary",
    nameEs: "Imagen y vocabulario",
    description: "Students look at a picture and say its name in Spanish.",
    available: true,
    fields: { image: "required", prompt: false, answer: true, displayText: false },
    defaults: { acceptShortAnswer: true, showAnswerText: false, evaluationMode: "PHRASE" },
    promptPlaceholder: "",
    answerPlaceholder: "la manzana",
  },
  {
    key: "QUESTION_AND_ANSWER",
    name: "Question & Answer",
    nameEs: "Pregunta y respuesta",
    description: "Conversation questions answered out loud.",
    available: true,
    fields: { image: "optional", prompt: true, answer: true, displayText: false },
    defaults: { acceptShortAnswer: false, showAnswerText: false, evaluationMode: "PHRASE" },
    promptPlaceholder: "¿Cómo estás?",
    answerPlaceholder: "Estoy bien.",
  },
  {
    key: "SPELL_YOUR_NAME",
    name: "Spell Your Name",
    nameEs: "Deletrea tu nombre",
    description: "Students spell their own first and last name with Spanish letter names.",
    available: true,
    fields: { image: "none", prompt: true, answer: false, displayText: false },
    defaults: { acceptShortAnswer: false, showAnswerText: false, evaluationMode: "LETTERS" },
    promptPlaceholder: "¿Cómo deletreas tu nombre?",
    answerPlaceholder: "",
  },
  { key: "FLY_AND_SPEAK", name: "Fly & Speak", nameEs: "Vuela y habla", description: "A bird flies through obstacles; each one is answered out loud.", available: false, fields: { image: "optional", prompt: true, answer: true, displayText: false }, defaults: { acceptShortAnswer: true, showAnswerText: false, evaluationMode: "PHRASE" }, promptPlaceholder: "", answerPlaceholder: "" },
  { key: "MEMORY_AND_SPEAK", name: "Memory & Speak", nameEs: "Memoria y habla", description: "Remember images and answer orally.", available: false, fields: { image: "required", prompt: false, answer: true, displayText: false }, defaults: { acceptShortAnswer: true, showAnswerText: false, evaluationMode: "PHRASE" }, promptPlaceholder: "", answerPlaceholder: "" },
  { key: "MATCH_AND_LEARN", name: "Match & Learn", nameEs: "Relaciona", description: "Match pictures and words, by touch or voice.", available: false, fields: { image: "required", prompt: false, answer: true, displayText: false }, defaults: { acceptShortAnswer: true, showAnswerText: false, evaluationMode: "PHRASE" }, promptPlaceholder: "", answerPlaceholder: "" },
  { key: "SPIN_AND_SPEAK", name: "Spin & Speak", nameEs: "Gira y habla", description: "A wheel picks the word or question.", available: false, fields: { image: "optional", prompt: true, answer: true, displayText: false }, defaults: { acceptShortAnswer: true, showAnswerText: false, evaluationMode: "PHRASE" }, promptPlaceholder: "", answerPlaceholder: "" },
  { key: "WATCH_LISTEN_ANSWER", name: "Watch, Listen & Answer", nameEs: "Mira, escucha y responde", description: "A video pauses at teacher-set points for a spoken question.", available: false, fields: { image: "none", prompt: true, answer: true, displayText: false }, defaults: { acceptShortAnswer: true, showAnswerText: false, evaluationMode: "PHRASE" }, promptPlaceholder: "", answerPlaceholder: "" },
];

export const templateByKey = (key: string) => TEMPLATES.find((t) => t.key === key);

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
