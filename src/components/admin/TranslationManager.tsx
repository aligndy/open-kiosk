"use client";

import { useEffect, useState } from "react";

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
  const [translating, setTranslating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [prefilling, setPrefilling] = useState(false);
  const [prefillStatus, setPrefillStatus] = useState("");

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

  const translateAll = async () => {
    if (!selectedLang) return;
    setTranslating(true);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetLanguage: selectedLang }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchTranslations(selectedLang);
      } else {
        alert(data.error?.message || "번역 실패");
      }
    } catch {
      alert("번역 중 오류가 발생했습니다.");
    }
    setTranslating(false);
  };

  const prefillAll = async () => {
    if (languages.length === 0) return;
    setPrefilling(true);
    let totalTranslated = 0;
    try {
      for (let i = 0; i < languages.length; i++) {
        const lang = languages[i];
        const label = LANGUAGE_LABELS[lang] || lang;
        setPrefillStatus(`${label} 번역 중... (${i + 1}/${languages.length})`);
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
      alert(`${languages.length}개 언어, 총 ${totalTranslated}개 항목 번역 완료`);
    } catch {
      alert("전체 번역 중 오류가 발생했습니다.");
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

      alert("번역이 저장되었습니다.");
    } catch {
      alert("저장 중 오류가 발생했습니다.");
    }
    setSaving(false);
  };

  const typeLabel = (type: string, field: string) => {
    const labels: Record<string, string> = {
      category: "카테고리",
      menu: "메뉴",
      optionGroup: "옵션그룹",
      option: "옵션",
    };
    const fieldLabels: Record<string, string> = {
      name: "이름",
      description: "설명",
    };
    return `${labels[type] || type} - ${fieldLabels[field] || field}`;
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-4">번역 관리</h2>

      {languages.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          <p>지원 언어가 설정되지 않았습니다.</p>
          <p className="text-sm mt-1">설정 페이지에서 언어를 추가해주세요.</p>
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
              onClick={translateAll}
              disabled={translating}
              className="px-4 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {translating ? "번역 중..." : "AI 자동 번역"}
            </button>

            <button
              onClick={prefillAll}
              disabled={prefilling || translating}
              className="px-4 py-2 bg-teal-600 text-white text-sm rounded-md hover:bg-teal-700 disabled:opacity-50"
            >
              {prefilling ? prefillStatus : "전체 언어 AI prefill"}
            </button>

            <button
              onClick={saveTranslations}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>

          {loading ? (
            <p className="text-gray-500">로딩 중...</p>
          ) : items.length === 0 ? (
            <p className="text-gray-500">번역할 항목이 없습니다.</p>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 text-gray-600 font-medium w-32">유형</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">원본 (한국어)</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">
                      번역 ({LANGUAGE_LABELS[selectedLang] || selectedLang})
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
                          placeholder="번역을 입력하세요"
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
