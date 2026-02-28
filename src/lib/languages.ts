export interface Language {
  code: string;
  label: string;
}

/** Core languages shown first in customer UI */
export const CORE_LANGUAGES: Language[] = [
  { code: "ko", label: "한국어" },
  { code: "en", label: "English" },
  { code: "zh", label: "中文" },
  { code: "ja", label: "日本語" },
];

export const CORE_LANGUAGE_CODES = new Set(CORE_LANGUAGES.map((l) => l.code));

/** All available languages (~40) */
export const ALL_LANGUAGES: Language[] = [
  // Core
  ...CORE_LANGUAGES,
  // European
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "es", label: "Español" },
  { code: "it", label: "Italiano" },
  { code: "pt", label: "Português" },
  { code: "nl", label: "Nederlands" },
  { code: "pl", label: "Polski" },
  { code: "cs", label: "Čeština" },
  { code: "ro", label: "Română" },
  { code: "hu", label: "Magyar" },
  { code: "sv", label: "Svenska" },
  { code: "da", label: "Dansk" },
  { code: "no", label: "Norsk" },
  { code: "fi", label: "Suomi" },
  { code: "el", label: "Ελληνικά" },
  { code: "uk", label: "Українська" },
  { code: "bg", label: "Български" },
  { code: "hr", label: "Hrvatski" },
  { code: "sk", label: "Slovenčina" },
  { code: "sl", label: "Slovenščina" },
  // Asian
  { code: "vi", label: "Tiếng Việt" },
  { code: "th", label: "ภาษาไทย" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "ms", label: "Bahasa Melayu" },
  { code: "hi", label: "हिन्दी" },
  { code: "bn", label: "বাংলা" },
  { code: "ta", label: "தமிழ்" },
  { code: "tl", label: "Filipino" },
  { code: "km", label: "ខ្មែរ" },
  { code: "my", label: "မြန်မာ" },
  { code: "mn", label: "Монгол" },
  { code: "ne", label: "नेपाली" },
  // Middle Eastern
  { code: "ar", label: "العربية" },
  { code: "tr", label: "Türkçe" },
  { code: "he", label: "עברית" },
  { code: "fa", label: "فارسی" },
  // African
  { code: "sw", label: "Kiswahili" },
  // Russian
  { code: "ru", label: "Русский" },
];

/** Map of language code to native label */
export const LANGUAGE_LABELS: Record<string, string> = Object.fromEntries(
  ALL_LANGUAGES.map((l) => [l.code, l.label])
);
