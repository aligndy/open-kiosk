"use client";

import { useLanguageStore } from "@/stores/languageStore";
import { messages } from "@/messages";

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
