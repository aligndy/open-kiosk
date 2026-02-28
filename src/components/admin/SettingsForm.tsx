"use client";

import { useEffect, useState } from "react";

const AVAILABLE_LANGUAGES = [
  { code: "ko", label: "한국어" },
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
  { code: "zh", label: "中文" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "th", label: "ภาษาไทย" },
];

export default function SettingsForm() {
  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [clearLogo, setClearLogo] = useState(false);
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>(["ko"]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [missingCount, setMissingCount] = useState(0);
  const [prefilling, setPrefilling] = useState(false);
  const [prefillStatus, setPrefillStatus] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      const res = await fetch("/api/settings");
      const data = await res.json();
      setStoreName(data.storeName || "");
      setStoreDescription(data.storeDescription || "");
      setLogoUrl(data.logoUrl || null);
      const langs = JSON.parse(data.supportedLanguages || '["ko"]');
      setSupportedLanguages(langs);
      setLoading(false);
      checkMissingTranslations(langs);
    };
    fetchSettings();
  }, []);

  const checkMissingTranslations = async (langs: string[]) => {
    const nonKo = langs.filter((l) => l !== "ko");
    if (nonKo.length === 0) { setMissingCount(0); return; }
    try {
      const [catRes, menuRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/menus?includeInactive=1"),
      ]);
      const categories = await catRes.json();
      const menus = await menuRes.json();

      let missing = 0;
      const parse = (json: string) => { try { return JSON.parse(json || "{}"); } catch { return {}; } };
      const isMissing = (json: string, lang: string) => !parse(json)[lang]?.trim();

      for (const cat of categories) {
        for (const lang of nonKo) {
          if (isMissing(cat.nameTranslations, lang)) missing++;
        }
      }
      for (const menu of menus) {
        for (const lang of nonKo) {
          if (isMissing(menu.nameTranslations, lang)) missing++;
          if (menu.description && isMissing(menu.descriptionTranslations, lang)) missing++;
          for (const g of menu.optionGroups || []) {
            if (isMissing(g.nameTranslations, lang)) missing++;
            for (const o of g.options || []) {
              if (isMissing(o.nameTranslations, lang)) missing++;
            }
          }
        }
      }
      setMissingCount(missing);
    } catch {
      setMissingCount(0);
    }
  };

  const prefillMissing = async () => {
    const nonKo = supportedLanguages.filter((l) => l !== "ko");
    if (nonKo.length === 0) return;
    setPrefilling(true);
    let totalTranslated = 0;
    try {
      for (let i = 0; i < nonKo.length; i++) {
        const lang = nonKo[i];
        const label = AVAILABLE_LANGUAGES.find((l) => l.code === lang)?.label || lang;
        setPrefillStatus(`${label} 번역 중... (${i + 1}/${nonKo.length})`);
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetLanguage: lang, onlyMissing: true }),
        });
        const data = await res.json();
        if (data.success) totalTranslated += data.translatedCount;
      }
      alert(`${nonKo.length}개 언어, 총 ${totalTranslated}개 항목 번역 완료`);
      await checkMissingTranslations(supportedLanguages);
    } catch {
      alert("번역 중 오류가 발생했습니다.");
    }
    setPrefilling(false);
    setPrefillStatus("");
  };

  const toggleLanguage = (code: string) => {
    if (code === "ko") return;
    setSupportedLanguages((prev) =>
      prev.includes(code) ? prev.filter((l) => l !== code) : [...prev, code]
    );
  };

  const save = async () => {
    setSaving(true);
    try {
      if (logoFile || clearLogo) {
        const formData = new FormData();
        formData.append("storeName", storeName);
        formData.append("storeDescription", storeDescription);
        formData.append("supportedLanguages", JSON.stringify(supportedLanguages));
        if (logoFile) formData.append("logo", logoFile);
        if (clearLogo) formData.append("clearLogo", "true");
        const res = await fetch("/api/settings", { method: "PUT", body: formData });
        const data = await res.json();
        setLogoUrl(data.logoUrl || null);
        setLogoFile(null);
        setClearLogo(false);
      } else {
        await fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storeName,
            storeDescription,
            supportedLanguages: JSON.stringify(supportedLanguages),
          }),
        });
      }
      alert("설정이 저장되었습니다.");
    } catch {
      alert("저장 중 오류가 발생했습니다.");
    }
    setSaving(false);
  };

  if (loading) {
    return <p className="text-gray-500">로딩 중...</p>;
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-4">설정</h2>

      <div className="max-w-lg space-y-6">
        <div className="bg-white rounded-lg shadow p-4 space-y-4">
          <h3 className="font-medium text-gray-800">매장 정보</h3>
          <div>
            <label className="block text-sm text-gray-600 mb-1">매장명</label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">매장 설명</label>
            <textarea
              value={storeDescription}
              onChange={(e) => setStoreDescription(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm"
              rows={3}
              placeholder="매장에 대한 간단한 설명을 입력하세요"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">매장 로고</label>
            {(logoUrl || logoFile) && !clearLogo ? (
              <div className="flex items-center gap-3 mb-2">
                <img
                  src={logoFile ? URL.createObjectURL(logoFile) : logoUrl!}
                  alt="매장 로고"
                  className="w-20 h-20 object-contain rounded-lg border bg-gray-50"
                />
                <button
                  type="button"
                  onClick={() => { setClearLogo(true); setLogoFile(null); }}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  로고 삭제
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-8 mb-2 text-gray-400">
                <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <p className="text-xs">로고가 없습니다</p>
              </div>
            )}
            <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 cursor-pointer">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              로고 업로드
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) { setLogoFile(file); setClearLogo(false); }
                  e.target.value = "";
                }}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 space-y-4">
          <h3 className="font-medium text-gray-800">지원 언어</h3>
          <p className="text-xs text-gray-500">
            키오스크에서 사용할 언어를 선택하세요. 한국어는 기본으로 포함됩니다.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {AVAILABLE_LANGUAGES.map((lang) => (
              <label
                key={lang.code}
                className={`flex items-center gap-2 p-2 rounded border text-sm cursor-pointer ${
                  supportedLanguages.includes(lang.code)
                    ? "bg-blue-50 border-blue-300"
                    : "bg-white border-gray-200"
                } ${lang.code === "ko" ? "opacity-75 cursor-not-allowed" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={supportedLanguages.includes(lang.code)}
                  onChange={() => toggleLanguage(lang.code)}
                  disabled={lang.code === "ko"}
                />
                <span>{lang.label}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
        >
          {saving ? "저장 중..." : "저장"}
        </button>

        {missingCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-amber-800">
                번역되지 않은 텍스트가 {missingCount}개 있습니다
              </p>
              <p className="text-xs text-amber-600 mt-0.5">AI로 빠진 번역을 한번에 채울 수 있습니다</p>
            </div>
            <button
              onClick={prefillMissing}
              disabled={prefilling}
              className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              {prefilling ? prefillStatus : "지금 바로 빠진 텍스트 번역"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
