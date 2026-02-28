"use client";

import { useState } from "react";
import { LANGUAGE_LABELS, CORE_LANGUAGE_CODES } from "@/lib/languages";

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
  const [showMore, setShowMore] = useState(false);

  if (supportedLanguages.length <= 1) return null;

  const coreLangs = supportedLanguages.filter((l) => CORE_LANGUAGE_CODES.has(l));
  const otherLangs = supportedLanguages.filter((l) => !CORE_LANGUAGE_CODES.has(l));
  const hasOthers = otherLangs.length > 0;

  const handleSelect = (lang: string) => {
    onSelect(lang);
    setLangOpen(false);
    setShowMore(false);
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => { setLangOpen(!langOpen); setShowMore(false); }}
          className="flex h-12 items-center gap-1 rounded-lg border border-gray-300 px-3 text-lg font-medium text-gray-700"
        >
          {LANGUAGE_LABELS[currentLanguage] || currentLanguage}
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {langOpen && (
          <div className="absolute right-0 top-14 z-40 min-w-[160px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            {coreLangs.map((lang) => (
              <button
                key={lang}
                onClick={() => handleSelect(lang)}
                className={`block w-full px-4 py-3 text-left text-lg ${
                  lang === currentLanguage
                    ? "bg-amber-50 font-bold text-amber-700"
                    : "text-gray-700"
                }`}
              >
                {LANGUAGE_LABELS[lang] || lang}
              </button>
            ))}

            {hasOthers && !showMore && (
              <button
                onClick={() => setShowMore(true)}
                className="block w-full px-4 py-3 text-left text-base text-gray-400 border-t border-gray-100"
              >
                + {otherLangs.length}
              </button>
            )}

            {hasOthers && showMore && (
              <>
                <div className="border-t border-gray-100" />
                {otherLangs.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => handleSelect(lang)}
                    className={`block w-full px-4 py-3 text-left text-lg ${
                      lang === currentLanguage
                        ? "bg-amber-50 font-bold text-amber-700"
                        : "text-gray-700"
                    }`}
                  >
                    {LANGUAGE_LABELS[lang] || lang}
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Click outside to close language dropdown */}
      {langOpen && (
        <div className="fixed inset-0 z-20" onClick={() => { setLangOpen(false); setShowMore(false); }} />
      )}
    </>
  );
}
