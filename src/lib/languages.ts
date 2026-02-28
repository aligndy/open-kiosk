export interface Language {
  code: string;
  label: string;
  flag: string;
}

/** Core languages shown first in customer UI */
export const CORE_LANGUAGES: Language[] = [
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
];

export const CORE_LANGUAGE_CODES = new Set(CORE_LANGUAGES.map((l) => l.code));

/** All available languages (~40) */
export const ALL_LANGUAGES: Language[] = [
  // Core
  ...CORE_LANGUAGES,
  // European
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
  { code: "pl", label: "Polski", flag: "🇵🇱" },
  { code: "cs", label: "Čeština", flag: "🇨🇿" },
  { code: "ro", label: "Română", flag: "🇷🇴" },
  { code: "hu", label: "Magyar", flag: "🇭🇺" },
  { code: "sv", label: "Svenska", flag: "🇸🇪" },
  { code: "da", label: "Dansk", flag: "🇩🇰" },
  { code: "no", label: "Norsk", flag: "🇳🇴" },
  { code: "fi", label: "Suomi", flag: "🇫🇮" },
  { code: "el", label: "Ελληνικά", flag: "🇬🇷" },
  { code: "uk", label: "Українська", flag: "🇺🇦" },
  { code: "bg", label: "Български", flag: "🇧🇬" },
  { code: "hr", label: "Hrvatski", flag: "🇭🇷" },
  { code: "sk", label: "Slovenčina", flag: "🇸🇰" },
  { code: "sl", label: "Slovenščina", flag: "🇸🇮" },
  // Asian
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { code: "th", label: "ภาษาไทย", flag: "🇹🇭" },
  { code: "id", label: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "ms", label: "Bahasa Melayu", flag: "🇲🇾" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
  { code: "bn", label: "বাংলা", flag: "🇧🇩" },
  { code: "ta", label: "தமிழ்", flag: "🇮🇳" },
  { code: "tl", label: "Filipino", flag: "🇵🇭" },
  { code: "km", label: "ខ្មែរ", flag: "🇰🇭" },
  { code: "my", label: "မြန်မာ", flag: "🇲🇲" },
  { code: "mn", label: "Монгол", flag: "🇲🇳" },
  { code: "ne", label: "नेपाली", flag: "🇳🇵" },
  // Middle Eastern
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "he", label: "עברית", flag: "🇮🇱" },
  { code: "fa", label: "فارسی", flag: "🇮🇷" },
  // African
  { code: "sw", label: "Kiswahili", flag: "🇰🇪" },
  // Russian
  { code: "ru", label: "Русский", flag: "🇷🇺" },
];

/** Map of language code to native label */
export const LANGUAGE_LABELS: Record<string, string> = Object.fromEntries(
  ALL_LANGUAGES.map((l) => [l.code, l.label])
);

/** Map of language code to flag emoji */
export const LANGUAGE_FLAGS: Record<string, string> = Object.fromEntries(
  ALL_LANGUAGES.map((l) => [l.code, l.flag])
);
