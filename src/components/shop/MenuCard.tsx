"use client";

import { MenuWithOptions, getTranslation } from "@/types";

interface MenuCardProps {
  menu: MenuWithOptions;
  currentLanguage: string;
  onSelect: (menu: MenuWithOptions) => void;
}

export default function MenuCard({ menu, currentLanguage, onSelect }: MenuCardProps) {
  return (
    <button
      key={menu.id}
      onClick={() => onSelect(menu)}
      className="flex flex-col overflow-hidden rounded-xl bg-white shadow-sm active:scale-[0.98] transition-transform"
    >
      {/* Menu image */}
      <div className="relative aspect-square w-full bg-gray-100">
        {menu.imageUrl ? (
          <img
            src={menu.imageUrl}
            alt={getTranslation(menu.nameTranslations, currentLanguage, menu.name)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl text-gray-300">
            <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Menu info */}
      <div className="flex flex-col gap-1 p-3">
        <span className="text-left text-xl font-bold leading-tight text-gray-900">
          {getTranslation(menu.nameTranslations, currentLanguage, menu.name)}
        </span>
        <span className="text-left text-2xl font-extrabold text-amber-600">
          {menu.price.toLocaleString()}원
        </span>
      </div>
    </button>
  );
}
