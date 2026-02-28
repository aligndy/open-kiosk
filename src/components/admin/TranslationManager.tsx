"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";

interface TranslationItem {
  id: number;
  type: "category" | "menu" | "optionGroup" | "option";
  field: string;
  original: string;
  translated: string;
  translationKey: string;
}

interface Settings {
  supportedLanguages: string;
}

const LANGUAGE_LABELS: Record<string, string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
  zh: "中文",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  vi: "Tiếng Việt",
  th: "ภาษาไทย",
};

function safeParseJson(json: string): Record<string, string> {
  try {
    return JSON.parse(json || "{}");
  } catch {
    return {};
  }
}

export default function TranslationManager() {
  const [languages, setLanguages] = useState<string[]>([]);
  const [selectedLang, setSelectedLang] = useState("");
  const [items, setItems] = useState<TranslationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [prefilling, setPrefilling] = useState(false);
  const [prefillStatus, setPrefillStatus] = useState("");
  const t = useT();

  useEffect(() => {
    const fetchSettings = async () => {
      const res = await fetch("/api/settings");
      const data: Settings = await res.json();
      const langs: string[] = JSON.parse(data.supportedLanguages);
      const nonKo = langs.filter((l) => l !== "ko");
      setLanguages(nonKo);
      if (nonKo.length > 0) setSelectedLang(nonKo[0]);
    };
    fetchSettings();
  }, []);

  const fetchTranslations = async (lang: string) => {
    if (!lang) return;
    setLoading(true);

    const [catRes, menuRes] = await Promise.all([
      fetch("/api/categories"),
      fetch("/api/menus?includeInactive=1"),
    ]);
    const categories = await catRes.json();
    const menus = await menuRes.json();

    const result: TranslationItem[] = [];

    for (const cat of categories) {
      const translations = safeParseJson(cat.nameTranslations);
      result.push({
        id: cat.id,
        type: "category",
        field: "name",
        original: cat.name,
        translated: translations[lang] || "",
        translationKey: `category-${cat.id}-name`,
      });
    }

    for (const menu of menus) {
      const nameTranslations = safeParseJson(menu.nameTranslations);
      result.push({
        id: menu.id,
        type: "menu",
        field: "name",
        original: menu.name,
        translated: nameTranslations[lang] || "",
        translationKey: `menu-${menu.id}-name`,
      });

      if (menu.description) {
        const descTranslations = safeParseJson(menu.descriptionTranslations);
        result.push({
          id: menu.id,
          type: "menu",
          field: "description",
          original: menu.description,
          translated: descTranslations[lang] || "",
          translationKey: `menu-${menu.id}-description`,
        });
      }

      for (const group of menu.optionGroups || []) {
        const groupTranslations = safeParseJson(group.nameTranslations);
        result.push({
          id: group.id,
          type: "optionGroup",
          field: "name",
          original: group.name,
          translated: groupTranslations[lang] || "",
          translationKey: `optionGroup-${group.id}-name`,
        });

        for (const opt of group.options || []) {
          const optTranslations = safeParseJson(opt.nameTranslations);
          result.push({
            id: opt.id,
            type: "option",
            field: "name",
            original: opt.name,
            translated: optTranslations[lang] || "",
            translationKey: `option-${opt.id}-name`,
          });
        }
      }
    }

    setItems(result);
    setLoading(false);
  };

  useEffect(() => {
    if (selectedLang) fetchTranslations(selectedLang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLang]);

  const prefillAll = async () => {
    if (languages.length === 0) return;
    setPrefilling(true);
    let totalTranslated = 0;
    try {
      for (let i = 0; i < languages.length; i++) {
        const lang = languages[i];
        const label = LANGUAGE_LABELS[lang] || lang;
        setPrefillStatus(t("admin.translation.translatingLang", { label, current: i + 1, total: languages.length }));
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetLanguage: lang, onlyMissing: true }),
        });
        const data = await res.json();
        if (data.success) {
          totalTranslated += data.translatedCount;
        }
      }
      if (selectedLang) await fetchTranslations(selectedLang);
      alert(t("admin.translation.translationComplete", { count: languages.length, total: totalTranslated }));
    } catch {
      alert(t("admin.translation.prefillError"));
    }
    setPrefilling(false);
    setPrefillStatus("");
  };

  const updateTranslation = (key: string, value: string) => {
    setItems(
      items.map((item) =>
        item.translationKey === key ? { ...item, translated: value } : item
      )
    );
  };

  const saveTranslations = async () => {
    setSaving(true);
    try {
      const [catRes, menuRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/menus?includeInactive=1"),
      ]);
      const categories = await catRes.json();
      const menus = await menuRes.json();

      // Save category translations
      for (const cat of categories) {
        const catItems = items.filter(
          (i) => i.type === "category" && i.id === cat.id
        );
        if (catItems.length === 0) continue;

        const existing = safeParseJson(cat.nameTranslations);
        for (const ci of catItems) {
          existing[selectedLang] = ci.translated;
        }
        await fetch(`/api/categories/${cat.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nameTranslations: JSON.stringify(existing) }),
        });
      }

      // Save menu translations
      for (const menu of menus) {
        const menuItems = items.filter(
          (i) => i.type === "menu" && i.id === menu.id
        );
        if (menuItems.length === 0) continue;

        const data: Record<string, string> = {};
        for (const mi of menuItems) {
          if (mi.field === "name") {
            const existing = safeParseJson(menu.nameTranslations);
            existing[selectedLang] = mi.translated;
            data.nameTranslations = JSON.stringify(existing);
          } else if (mi.field === "description") {
            const existing = safeParseJson(menu.descriptionTranslations);
            existing[selectedLang] = mi.translated;
            data.descriptionTranslations = JSON.stringify(existing);
          }
        }

        await fetch(`/api/menus/${menu.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        // Save option group and option translations
        for (const group of menu.optionGroups || []) {
          const groupItem = items.find(
            (i) => i.type === "optionGroup" && i.id === group.id
          );

          // Collect option translations for this group
          const optItems = items.filter(
            (i) =>
              i.type === "option" &&
              group.options.some((o: { id: number }) => o.id === i.id)
          );

          // Build updated group name translations
          const groupNameTranslations = safeParseJson(group.nameTranslations);
          if (groupItem) {
            groupNameTranslations[selectedLang] = groupItem.translated;
          }

          // Build updated options with their translations preserved
          const updatedOptions = group.options.map((opt: { id: number; name: string; nameTranslations: string; priceModifier: number; sortOrder: number }) => {
            const optItem = optItems.find((i) => i.id === opt.id);
            const optTranslations = safeParseJson(opt.nameTranslations);
            if (optItem) {
              optTranslations[selectedLang] = optItem.translated;
            }
            return {
              name: opt.name,
              nameTranslations: JSON.stringify(optTranslations),
              priceModifier: opt.priceModifier,
              sortOrder: opt.sortOrder,
            };
          });

          // Save group with translations + all options with their translations
          if (groupItem || optItems.length > 0) {
            await fetch(`/api/menus/${menu.id}/options/${group.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                nameTranslations: JSON.stringify(groupNameTranslations),
                options: updatedOptions,
              }),
            });
          }
        }
      }

      alert(t("admin.translation.saved"));
    } catch {
      alert(t("common.saveError"));
    }
    setSaving(false);
  };

  const typeLabel = (type: string, field: string) => {
    const labels: Record<string, string> = {
      category: t("admin.translation.typeCategory"),
      menu: t("admin.translation.typeMenu"),
      optionGroup: t("admin.translation.typeOptionGroup"),
      option: t("admin.translation.typeOption"),
    };
    const fieldLabels: Record<string, string> = {
      name: t("admin.translation.fieldName"),
      description: t("admin.translation.fieldDescription"),
    };
    return `${labels[type] || type} - ${fieldLabels[field] || field}`;
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-4">{t("admin.translation.management")}</h2>

      {languages.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          <p>{t("admin.translation.noLanguages")}</p>
          <p className="text-sm mt-1">{t("admin.translation.addLanguagesHint")}</p>
        </div>
      ) : (
        <>
          <div className="flex gap-3 items-center mb-4">
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm"
            >
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {LANGUAGE_LABELS[lang] || lang}
                </option>
              ))}
            </select>

            <button
              onClick={prefillAll}
              disabled={prefilling}
              className="px-4 py-2 bg-teal-600 text-white text-sm rounded-md hover:bg-teal-700 disabled:opacity-50"
            >
              {prefilling ? prefillStatus : t("admin.translation.prefillAll")}
            </button>

            <button
              onClick={saveTranslations}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? t("common.saving") : t("common.save")}
            </button>
          </div>

          {loading ? (
            <p className="text-gray-500">{t("common.loading")}</p>
          ) : items.length === 0 ? (
            <p className="text-gray-500">{t("admin.translation.noItems")}</p>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 text-gray-600 font-medium w-32">{t("admin.translation.type")}</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">{t("admin.translation.original")}</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">
                      {t("admin.translation.translationFor", { lang: LANGUAGE_LABELS[selectedLang] || selectedLang })}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.translationKey} className="border-b last:border-b-0">
                      <td className="px-4 py-2 text-gray-500 text-xs">{typeLabel(item.type, item.field)}</td>
                      <td className="px-4 py-2 text-gray-800">{item.original}</td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={item.translated}
                          onChange={(e) => updateTranslation(item.translationKey, e.target.value)}
                          className="w-full border rounded px-2 py-1 text-sm"
                          placeholder={t("admin.translation.inputPlaceholder")}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
