// Voice catalogue. Each voice belongs to exactly one language, and the editor only offers the
// voices of the selected language — a Spanish text is never read by an English voice.

export type AppLanguage = "es-419" | "en-US" | "fr-FR";

export const LANGUAGES: Array<{ code: AppLanguage; label: string }> = [
  { code: "es-419", label: "Español (Latinoamérica)" },
  { code: "en-US", label: "English (US)" },
  { code: "fr-FR", label: "Français" },
];

export interface Voice {
  id: string;
  label: string;
  language: AppLanguage;
  /** Locale actually sent to the provider (providers don't all accept es-419). */
  providerLocale: string;
  styles?: string[];
}

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
export const BROWSER_LOCALES: Record<AppLanguage, string[]> = {
  "es-419": ["es-419", "es-MX", "es-US", "es-CO", "es-AR", "es"],
  "en-US": ["en-US", "en"],
  "fr-FR": ["fr-FR", "fr"],
};
