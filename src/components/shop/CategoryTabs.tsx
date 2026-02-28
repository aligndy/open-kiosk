"use client";

import { getTranslation } from "@/types";

interface CategoryTabsProps {
  categories: { id: number; name: string; nameTranslations: string }[];
  activeCategory: number | null;
  onSelect: (id: number) => void;
  currentLanguage: string;
}

export default function CategoryTabs({
  categories,
  activeCategory,
  onSelect,
  currentLanguage,
}: CategoryTabsProps) {
  return (
    <div className="sticky top-[60px] z-10 overflow-x-auto border-b border-gray-200 bg-white">
      <div className="flex gap-1 px-2 py-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`shrink-0 rounded-full px-5 py-3 text-lg font-semibold transition-colors ${
              activeCategory === cat.id
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
