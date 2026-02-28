"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";

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
  const [useCameraDetection, setUseCameraDetection] = useState(true);
  const [vendingModeAge, setVendingModeAge] = useState(50);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [missingCount, setMissingCount] = useState(0);
  const [prefilling, setPrefilling] = useState(false);
  const [prefillStatus, setPrefillStatus] = useState("");
  const t = useT();

  useEffect(() => {
    const fetchSettings = async () => {
      const res = await fetch("/api/settings");
      const data = await res.json();
      setStoreName(data.storeName || "");
      setStoreDescription(data.storeDescription || "");
      setLogoUrl(data.logoUrl || null);
      setUseCameraDetection(data.useCameraDetection ?? true);
      setVendingModeAge(data.vendingModeAge || 50);
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
        setPrefillStatus(t("admin.settings.translatingLang", { label, current: i + 1, total: nonKo.length }));
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetLanguage: lang, onlyMissing: true }),
        });
        const data = await res.json();
        if (data.success) totalTranslated += data.translatedCount;
      }
      alert(t("admin.settings.translationComplete", { count: nonKo.length, total: totalTranslated }));
      await checkMissingTranslations(supportedLanguages);
    } catch {
      alert(t("admin.settings.translationError"));
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
        formData.append("useCameraDetection", String(useCameraDetection));
        formData.append("vendingModeAge", String(vendingModeAge));
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
            useCameraDetection,
            vendingModeAge,
          }),
        });
      }
      alert(t("admin.settings.saved"));
    } catch {
      alert(t("common.saveError"));
    }
    setSaving(false);
  };

  if (loading) {
    return <p className="text-gray-500">{t("common.loading")}</p>;
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-4">{t("admin.settings.title")}</h2>

      <div className="max-w-lg space-y-6">
        <div className="bg-white rounded-lg shadow p-4 space-y-4">
          <h3 className="font-medium text-gray-800">{t("admin.settings.storeInfo")}</h3>
          <div>
            <label className="block text-sm text-gray-600 mb-1">{t("admin.settings.storeName")}</label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">{t("admin.settings.storeDescription")}</label>
            <textarea
              value={storeDescription}
              onChange={(e) => setStoreDescription(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm"
              rows={3}
              placeholder={t("admin.settings.storeDescPlaceholder")}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">{t("admin.settings.storeLogo")}</label>
            {(logoUrl || logoFile) && !clearLogo ? (
              <div className="flex items-center gap-3 mb-2">
                <img
                  src={logoFile ? URL.createObjectURL(logoFile) : logoUrl!}
                  alt={t("admin.settings.storeLogo")}
                  className="w-20 h-20 object-contain rounded-lg border bg-gray-50"
                />
                <button
                  type="button"
                  onClick={() => { setClearLogo(true); setLogoFile(null); }}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  {t("admin.settings.deleteLogo")}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-8 mb-2 text-gray-400">
                <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <p className="text-xs">{t("admin.settings.noLogo")}</p>
              </div>
            )}
            <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 cursor-pointer">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              {t("admin.settings.uploadLogo")}
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
          <h3 className="font-medium text-gray-800">{t("admin.settings.supportedLanguages")}</h3>
          <p className="text-xs text-gray-500">
            {t("admin.settings.languageDescription")}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {AVAILABLE_LANGUAGES.map((lang) => (
              <label
                key={lang.code}
                className={`flex items-center gap-2 p-2 rounded border text-sm cursor-pointer ${supportedLanguages.includes(lang.code)
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

        <div className="bg-white rounded-lg shadow p-4 space-y-4">
          <h3 className="font-medium text-gray-800">{t("admin.settings.cameraDetection")}</h3>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useCameraDetection}
              onChange={(e) => setUseCameraDetection(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">{t("admin.settings.enableCameraDetection")}</span>
          </label>

          {useCameraDetection && (
            <div className="pl-6 space-y-2 mt-2">
              <label className="block text-sm text-gray-600 mb-1">{t("admin.settings.vendingModeAge")}</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={vendingModeAge}
                  onChange={(e) => setVendingModeAge(Number(e.target.value))}
                  className="w-24 border rounded-md px-3 py-2 text-sm"
                />
                <span className="text-sm text-gray-500">세 이상일 경우 자판기 모드로 자동 전환</span>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
        >
          {saving ? t("common.saving") : t("common.save")}
        </button>

        {missingCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-amber-800">
                {t("admin.settings.missingTranslations", { count: missingCount })}
              </p>
              <p className="text-xs text-amber-600 mt-0.5">{t("admin.settings.canPrefill")}</p>
            </div>
            <button
              onClick={prefillMissing}
              disabled={prefilling}
              className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              {prefilling ? prefillStatus : t("admin.settings.prefillNow")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
