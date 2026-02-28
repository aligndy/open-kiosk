"use client";

import { create } from "zustand";

interface LanguageStore {
  currentLanguage: string;
  supportedLanguages: string[];
  setLanguage: (lang: string) => void;
  setSupportedLanguages: (langs: string[]) => void;
}

export const useLanguageStore = create<LanguageStore>((set) => ({
  currentLanguage: "ko",
  supportedLanguages: ["ko"],
  setLanguage: (lang) => set({ currentLanguage: lang }),
  setSupportedLanguages: (langs) => set({ supportedLanguages: langs }),
}));
