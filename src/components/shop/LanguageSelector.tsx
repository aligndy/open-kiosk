"use client";

import { useState } from "react";

const LANGUAGE_LABELS: Record<string, string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
  zh: "中文",
  fr: "Français",
  es: "Español",
  de: "Deutsch",
  vi: "Tiếng Việt",
  th: "ภาษาไทย",
};

interface LanguageSelectorProps {
  currentLanguage: string;
  supportedLanguages: string[];
  onSelect: (lang: string) => void;
}

export default function LanguageSelector({
  currentLanguage,
  supportedLanguages,
  onSelect,
}: LanguageSelectorProps) {
  const [langOpen, setLangOpen] = useState(false);

  if (supportedLanguages.length <= 1) return null;

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setLangOpen(!langOpen)}
          className="flex h-12 items-center gap-1 rounded-lg border border-gray-300 px-3 text-lg font-medium text-gray-700"
        >
          {LANGUAGE_LABELS[currentLanguage] || currentLanguage}
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {langOpen && (
          <div className="absolute right-0 top-14 z-40 min-w-[140px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            {supportedLanguages.map((lang) => (
              <button
                key={lang}
                onClick={() => {
                  onSelect(lang);
                  setLangOpen(false);
                }}
                className={`block w-full px-4 py-3 text-left text-lg ${
                  lang === currentLanguage
                    ? "bg-amber-50 font-bold text-amber-700"
                    : "text-gray-700"
                }`}
              >
                {LANGUAGE_LABELS[lang] || lang}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Click outside to close language dropdown */}
      {langOpen && (
        <div className="fixed inset-0 z-20" onClick={() => setLangOpen(false)} />
      )}
    </>
  );
}
