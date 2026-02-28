"use client";

import { getTranslation } from "@/types";

interface CategoryTabsProps {
  categories: { id: number; name: string; nameTranslations: string }[];
  activeCategory: number | null;
  onSelect: (id: number) => void;
  currentLanguage: string;
  vendingMode?: boolean;
  onVendingToggle?: () => void;
}

export default function CategoryTabs({
  categories,
  activeCategory,
  onSelect,
  currentLanguage,
  vendingMode,
  onVendingToggle,
}: CategoryTabsProps) {
  const showVending = categories.length >= 2 && onVendingToggle;

  return (
    <div className="sticky top-[60px] z-10 overflow-x-auto border-b border-gray-200 bg-white">
      <div className="flex gap-1 px-2 py-2">
        {showVending && (
          <button
            onClick={onVendingToggle}
            className={`shrink-0 rounded-full px-5 py-3 text-lg font-semibold transition-colors ${
              vendingMode
                ? "bg-purple-600 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            자판기
          </button>
        )}
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`shrink-0 rounded-full px-5 py-3 text-lg font-semibold transition-colors ${
              !vendingMode && activeCategory === cat.id
                ? "bg-amber-500 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {getTranslation(cat.nameTranslations, currentLanguage, cat.name)}
          </button>
        ))}
      </div>
    </div>
  );
}
