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
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>(["ko"]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const res = await fetch("/api/settings");
      const data = await res.json();
      setStoreName(data.storeName || "");
      setSupportedLanguages(JSON.parse(data.supportedLanguages || '["ko"]'));
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const toggleLanguage = (code: string) => {
    if (code === "ko") return;
    setSupportedLanguages((prev) =>
      prev.includes(code) ? prev.filter((l) => l !== code) : [...prev, code]
    );
  };

  const save = async () => {
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName,
          supportedLanguages: JSON.stringify(supportedLanguages),
        }),
      });
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
      </div>
    </div>
  );
}
