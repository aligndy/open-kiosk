"use client";

import { useState } from "react";
import { LANGUAGE_LABELS, LANGUAGE_FLAGS, CORE_LANGUAGE_CODES } from "@/lib/languages";

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
  const [showFullPage, setShowFullPage] = useState(false);

  if (supportedLanguages.length <= 1) return null;

  const coreLangs = supportedLanguages.filter((l) => CORE_LANGUAGE_CODES.has(l));
  const otherLangs = supportedLanguages.filter((l) => !CORE_LANGUAGE_CODES.has(l));
  const hasOthers = otherLangs.length > 0;
  const flag = LANGUAGE_FLAGS[currentLanguage] || "";

  const handleSelect = (lang: string) => {
    onSelect(lang);
    setLangOpen(false);
    setShowFullPage(false);
  };

  return (
    <>
      {/* Trigger button */}
      <div className="relative">
        <button
          onClick={() => { setLangOpen(!langOpen); setShowFullPage(false); }}
          className="flex h-12 items-center gap-1.5 rounded-lg border border-gray-300 px-3 text-lg font-medium text-gray-700"
        >
          <span className="text-xl">{flag}</span>
          {LANGUAGE_LABELS[currentLanguage] || currentLanguage}
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown with core languages */}
        {langOpen && !showFullPage && (
          <div className="absolute right-0 top-14 z-40 min-w-[180px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            {coreLangs.map((lang) => (
              <button
                key={lang}
                onClick={() => handleSelect(lang)}
                className={`flex w-full items-center gap-2.5 px-4 py-3 text-left text-lg ${
                  lang === currentLanguage
                    ? "bg-amber-50 font-bold text-amber-700"
                    : "text-gray-700"
                }`}
              >
                <span className="text-xl">{LANGUAGE_FLAGS[lang]}</span>
                {LANGUAGE_LABELS[lang] || lang}
              </button>
            ))}

            {hasOthers && (
              <button
                onClick={() => setShowFullPage(true)}
                className="flex w-full items-center justify-center gap-1 px-4 py-3 text-base text-gray-400 border-t border-gray-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                + {otherLangs.length}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {langOpen && !showFullPage && (
        <div className="fixed inset-0 z-20" onClick={() => setLangOpen(false)} />
      )}

      {/* Full-page language selector */}
      {showFullPage && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">Language</h2>
            <button
              onClick={() => { setShowFullPage(false); setLangOpen(false); }}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Language grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 gap-3">
              {supportedLanguages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleSelect(lang)}
                  className={`flex items-center gap-3 px-4 py-4 rounded-xl text-left text-lg transition-colors ${
                    lang === currentLanguage
                      ? "bg-amber-50 border-2 border-amber-400 font-bold text-amber-700"
                      : "bg-gray-50 border-2 border-transparent text-gray-700 active:bg-gray-100"
                  }`}
                >
                  <span className="text-2xl">{LANGUAGE_FLAGS[lang]}</span>
                  <span className="truncate">{LANGUAGE_LABELS[lang] || lang}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
