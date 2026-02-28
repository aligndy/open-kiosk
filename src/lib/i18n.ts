"use client";

import { useLanguageStore } from "@/stores/languageStore";

import ko from "@/messages/ko.json";
import en from "@/messages/en.json";
import ja from "@/messages/ja.json";
import zh from "@/messages/zh.json";
import es from "@/messages/es.json";
import fr from "@/messages/fr.json";
import de from "@/messages/de.json";
import vi from "@/messages/vi.json";
import th from "@/messages/th.json";

type Messages = Record<string, string>;

const messages: Record<string, Messages> = {
  ko, en, ja, zh, es, fr, de, vi, th,
};

export function t(
  key: string,
  lang: string,
  params?: Record<string, string | number>,
): string {
  const msg = messages[lang]?.[key] || messages.ko[key] || key;
  if (!params) return msg;
  return msg.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
}

export function useT() {
  const lang = useLanguageStore((s) => s.currentLanguage);
  return (key: string, params?: Record<string, string | number>) =>
    t(key, lang, params);
}

export function formatPrice(amount: number, lang: string): string {
  return t("common.priceFormat", lang, { amount: amount.toLocaleString() });
}

export function useFormatPrice() {
  const lang = useLanguageStore((s) => s.currentLanguage);
  return (amount: number) => formatPrice(amount, lang);
}
