// Voice catalogue. Each voice belongs to exactly one language, and the editor only offers the
// voices of the selected language — a Spanish text is never read by an English voice.

export type AppLanguage = "es-419" | "en-US" | "fr-FR";

/**
 * Languages a piece of audio can be in. The activity, answers and language tags use the three
 * main languages; card/item audio may also be in these others (when the voice service has them).
 */
export const EXTRA_AUDIO_LANGUAGES = ["pt-BR", "it-IT", "de-DE", "zh-CN", "ja-JP", "ko-KR"] as const;
export type ExtraAudioLanguage = (typeof EXTRA_AUDIO_LANGUAGES)[number];
export type AudioLanguage = AppLanguage | ExtraAudioLanguage;
export const AUDIO_LANGUAGE_CODES = ["es-419", "en-US", "fr-FR", ...EXTRA_AUDIO_LANGUAGES] as const;

export const AUDIO_LANGUAGE_LABELS: Record<AudioLanguage, { es: string; en: string; native: string }> = {
  "es-419": { es: "Español (Latinoamérica)", en: "Spanish (Latin America)", native: "Español" },
  "en-US": { es: "Inglés (Estados Unidos)", en: "English (US)", native: "English" },
  "fr-FR": { es: "Francés (Francia)", en: "French (France)", native: "Français" },
  "pt-BR": { es: "Portugués (Brasil)", en: "Portuguese (Brazil)", native: "Português" },
  "it-IT": { es: "Italiano", en: "Italian", native: "Italiano" },
  "de-DE": { es: "Alemán", en: "German", native: "Deutsch" },
  "zh-CN": { es: "Chino mandarín", en: "Chinese (Mandarin)", native: "中文" },
  "ja-JP": { es: "Japonés", en: "Japanese", native: "日本語" },
  "ko-KR": { es: "Coreano", en: "Korean", native: "한국어" },
};

export const LANGUAGES: Array<{ code: AppLanguage; label: string }> = [
  { code: "es-419", label: "Español (Latinoamérica)" },
  { code: "en-US", label: "English (US)" },
  { code: "fr-FR", label: "Français" },
];

export interface Voice {
  id: string;
  label: string;
  language: AudioLanguage;
  /** Locale actually sent to the provider (providers don't all accept es-419). */
  providerLocale: string;
  styles?: string[];
  /** AI Gateway: model id ("google/gemini-3.8-flash-tts") and the provider's voice name. */
  model?: string;
  name?: string;
  /** Spoken direction for models that take one (tone, accent, pace). */
  instructions?: string;
  /** "speed" (default) sends the rate as a number; "instructions" says it in words. */
  speedVia?: "speed" | "instructions";
  /** Send providerLocale as the request's language. */
  sendLanguage?: boolean;
  /** Shown first for its language. */
  recommended?: boolean;
  /** One line for the teacher ("warm, female"). */
  description?: string;
}

// ── Vercel AI Gateway voices ───────────────────────────────────────────────────────────────
// Gemini TTS voices are multilingual; the accent, warmth and pace come from a spoken direction
// written in the language itself (a "teacher talking to primary students" read, standard accent).
const GEMINI = "google/gemini-3.8-flash-tts";

const TEACHER: Record<AudioLanguage, { locale: string; direction: string }> = {
  "es-419": { locale: "es-MX", direction: "Lee en español latinoamericano neutro, sin acento regional marcado, como una maestra de primaria que habla con sus estudiantes: voz cálida y clara, ritmo cómodo, pausas naturales y la entonación de la puntuación (¿?, ¡!). Pronuncia cada palabra completa." },
  "en-US": { locale: "en-US", direction: "Read in a general American accent, like a warm elementary school teacher talking with students: clear, friendly, conversational, at a comfortable pace with natural pauses. Follow the punctuation." },
  "fr-FR": { locale: "fr-FR", direction: "Lis en français standard de France, sans accent régional, comme une enseignante d'école primaire qui parle à ses élèves : voix chaleureuse et claire, rythme naturel et confortable, pauses naturelles, liaisons correctes. Respecte la ponctuation." },
  "pt-BR": { locale: "pt-BR", direction: "Leia em português do Brasil padrão, como uma professora do ensino fundamental falando com os alunos: voz calorosa e clara, ritmo confortável, pausas naturais." },
  "it-IT": { locale: "it-IT", direction: "Leggi in italiano standard, come un'insegnante di scuola primaria che parla ai suoi alunni: voce calda e chiara, ritmo comodo, pause naturali." },
  "de-DE": { locale: "de-DE", direction: "Lies auf Hochdeutsch, wie eine Grundschullehrerin, die mit ihren Schülern spricht: warme, klare Stimme, angenehmes Tempo, natürliche Pausen." },
  "zh-CN": { locale: "zh-CN", direction: "用标准普通话朗读，像小学老师和学生说话一样：声音温暖清楚，语速舒适，自然停顿。" },
  "ja-JP": { locale: "ja-JP", direction: "標準語で、小学校の先生が子どもたちに話すように読んでください。温かくはっきりした声で、心地よい速さ、自然な間をとって。" },
  "ko-KR": { locale: "ko-KR", direction: "표준어로, 초등학교 선생님이 학생들에게 말하듯이 읽어 주세요. 따뜻하고 또렷한 목소리, 편안한 속도, 자연스러운 쉼." },
};

const GEMINI_VOICES: Array<{ name: string; es: string; en: string; main?: boolean }> = [
  { name: "Sulafat", es: "cálida · femenina", en: "warm · female", main: true },
  { name: "Achird", es: "amigable · masculina", en: "friendly · male" },
  { name: "Vindemiatrix", es: "suave · femenina", en: "gentle · female" },
  { name: "Iapetus", es: "clara · masculina", en: "clear · male" },
  { name: "Leda", es: "juvenil · femenina", en: "youthful · female" },
];

export const GATEWAY_VOICES: Voice[] = (Object.keys(TEACHER) as AudioLanguage[]).flatMap((language) =>
  GEMINI_VOICES.map((g) => ({
    id: `gemini-${g.name.toLowerCase()}-${language}`,
    label: g.name,
    description: language === "en-US" ? g.en : g.es,
    language,
    providerLocale: TEACHER[language].locale,
    model: GEMINI,
    name: g.name,
    instructions: TEACHER[language].direction,
    speedVia: "instructions" as const,
    recommended: !!g.main,
  })),
);

export const AZURE_VOICES: Voice[] = [
  { id: "es-MX-DaliaNeural", label: "Dalia (México)", language: "es-419", providerLocale: "es-MX", styles: ["cheerful", "sad", "whispering"] },
  { id: "es-MX-JorgeNeural", label: "Jorge (México)", language: "es-419", providerLocale: "es-MX", styles: ["cheerful", "chat"] },
  { id: "es-CO-SalomeNeural", label: "Salomé (Colombia)", language: "es-419", providerLocale: "es-CO" },
  { id: "es-US-PalomaNeural", label: "Paloma (EE. UU.)", language: "es-419", providerLocale: "es-US" },
  { id: "en-US-AnaNeural", label: "Ana (child voice)", language: "en-US", providerLocale: "en-US" },
  { id: "en-US-JennyNeural", label: "Jenny", language: "en-US", providerLocale: "en-US", styles: ["cheerful", "friendly", "excited"] },
  { id: "en-US-GuyNeural", label: "Guy", language: "en-US", providerLocale: "en-US" },
  { id: "fr-FR-DeniseNeural", label: "Denise", language: "fr-FR", providerLocale: "fr-FR" },
  { id: "fr-FR-EloiseNeural", label: "Eloise (voix d'enfant)", language: "fr-FR", providerLocale: "fr-FR" },
  { id: "fr-FR-HenriNeural", label: "Henri", language: "fr-FR", providerLocale: "fr-FR" },
];

export const GOOGLE_VOICES: Voice[] = [
  { id: "es-US-Neural2-A", label: "Neural2 A (femenina)", language: "es-419", providerLocale: "es-US" },
  { id: "es-US-Neural2-B", label: "Neural2 B (masculina)", language: "es-419", providerLocale: "es-US" },
  { id: "es-US-Neural2-C", label: "Neural2 C (masculina)", language: "es-419", providerLocale: "es-US" },
  { id: "en-US-Neural2-F", label: "Neural2 F", language: "en-US", providerLocale: "en-US" },
  { id: "en-US-Neural2-D", label: "Neural2 D", language: "en-US", providerLocale: "en-US" },
  { id: "fr-FR-Neural2-A", label: "Neural2 A", language: "fr-FR", providerLocale: "fr-FR" },
  { id: "fr-FR-Neural2-B", label: "Neural2 B", language: "fr-FR", providerLocale: "fr-FR" },
];

/** BCP-47 tags used for the browser's built-in speech voices, in order of preference. */
export const BROWSER_LOCALES: Record<AudioLanguage, string[]> = {
  "es-419": ["es-419", "es-MX", "es-US", "es-CO", "es-AR", "es"],
  "en-US": ["en-US", "en"],
  "fr-FR": ["fr-FR", "fr"],
  "pt-BR": ["pt-BR", "pt"],
  "it-IT": ["it-IT", "it"],
  "de-DE": ["de-DE", "de"],
  "zh-CN": ["zh-CN", "zh"],
  "ja-JP": ["ja-JP", "ja"],
  "ko-KR": ["ko-KR", "ko"],
};
