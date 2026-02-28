"use client";

import { useMemo } from "react";
import { CategoryWithMenus, MenuWithOptions, SelectedOption, getTranslation } from "@/types";
import { useCartStore } from "@/stores/cartStore";
import { formatPrice } from "@/lib/i18n";

interface VendingGridProps {
  categories: CategoryWithMenus[];
  currentLanguage: string;
}

interface VendingCard {
  menuId: number;
  menuName: string;
  menuNameTranslations: string;
  imageUrl: string | null;
  unitPrice: number;
  selectedOptions: SelectedOption[];
  optionLabel: string;
  totalPrice: number;
}

function buildCombinations(menu: MenuWithOptions, currentLanguage: string): VendingCard[] {
  const requiredGroups = menu.optionGroups.filter((g) => g.required);

  const menuName = getTranslation(menu.nameTranslations, currentLanguage, menu.name);

  if (requiredGroups.length === 0) {
    return [
      {
        menuId: menu.id,
        menuName,
        menuNameTranslations: menu.nameTranslations,
        imageUrl: menu.imageUrl,
        unitPrice: menu.price,
        selectedOptions: [],
        optionLabel: "",
        totalPrice: menu.price,
      },
    ];
  }

  // Cartesian product of required option groups
  let combos: SelectedOption[][] = [[]];
  for (const group of requiredGroups) {
    const next: SelectedOption[][] = [];
    for (const combo of combos) {
      for (const opt of group.options) {
        next.push([
          ...combo,
          {
            groupId: group.id,
            optionId: opt.id,
            groupName: group.name,
            groupNameTranslations: group.nameTranslations,
            optionName: opt.name,
            optionNameTranslations: opt.nameTranslations,
            priceModifier: opt.priceModifier,
          },
        ]);
      }
    }
    combos = next;
  }

  return combos.map((selectedOptions) => {
    const optionTotal = selectedOptions.reduce((s, o) => s + o.priceModifier, 0);
    const labels = selectedOptions.map((o) => getTranslation(o.optionNameTranslations, currentLanguage, o.optionName)).join(" / ");
    return {
      menuId: menu.id,
      menuName,
      menuNameTranslations: menu.nameTranslations,
      imageUrl: menu.imageUrl,
      unitPrice: menu.price,
      selectedOptions,
      optionLabel: labels,
      totalPrice: menu.price + optionTotal,
    };
  });
}

export default function VendingGrid({ categories, currentLanguage }: VendingGridProps) {
  const addOrIncrementItem = useCartStore((s) => s.addOrIncrementItem);
  const removeByMatch = useCartStore((s) => s.removeByMatch);
  const items = useCartStore((s) => s.items);

  const cards = useMemo(() => {
    const result: VendingCard[] = [];
    for (const cat of categories) {
      for (const menu of cat.menus) {
        if (!menu.isActive) continue;
        result.push(...buildCombinations(menu, currentLanguage));
      }
    }
    return result;
  }, [categories, currentLanguage]);

  const ROW_SIZE = 5;

  const chunks = useMemo(() => {
    const res: VendingCard[][] = [];
    for (let i = 0; i < cards.length; i += ROW_SIZE) {
      res.push(cards.slice(i, i + ROW_SIZE));
    }
    return res;
  }, [cards]);

  const getCount = (card: VendingCard) => {
    const key = JSON.stringify(
      [...card.selectedOptions]
        .sort((a, b) => a.groupId - b.groupId || a.optionId - b.optionId)
        .map((o) => ({ groupId: o.groupId, optionId: o.optionId }))
    );
    const item = items.find((i) => {
      const iKey = JSON.stringify(
        [...i.selectedOptions]
          .sort((a, b) => a.groupId - b.groupId || a.optionId - b.optionId)
          .map((o) => ({ groupId: o.groupId, optionId: o.optionId }))
      );
      return i.menuId === card.menuId && iKey === key;
    });
    return item?.quantity ?? 0;
  };

  const handleAdd = (card: VendingCard) => {
    addOrIncrementItem({
      menuId: card.menuId,
      menuName: card.menuName,
      menuNameTranslations: card.menuNameTranslations,
      imageUrl: card.imageUrl,
      unitPrice: card.unitPrice,
      selectedOptions: card.selectedOptions,
    });
  };

  return (
    <div className="relative isolate w-full max-w-5xl mx-auto mt-4 mb-8 overflow-hidden rounded-2xl border-[12px] border-zinc-800 bg-white shadow-2xl">
      {/* Vending machine inner frame */}
      <div className="absolute inset-0 border-4 border-gray-300 pointer-events-none z-[2] rounded-sm" />

      {/* Subtle glass reflection */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent pointer-events-none z-[3]" />

      {/* Rows */}
      <div className="relative z-[1] flex flex-col py-4 px-3 gap-y-0">
        {chunks.map((rowCards, rowIdx) => (
          <div key={rowIdx} className="relative w-full flex flex-col">

            {/* Items grid - each cell contains image + price + button */}
            <div className="grid gap-0 px-0" style={{ gridTemplateColumns: `repeat(${ROW_SIZE}, 1fr)` }}>
              {rowCards.map((card, idx) => {
                const count = getCount(card);
                return (
                  <div
                    key={`${card.menuId}-${idx}`}
                    onClick={() => handleAdd(card)}
                    className={`relative flex flex-col items-center cursor-pointer transition-all rounded-lg px-1 pt-2 pb-1 ${count > 0 ? "bg-amber-50 ring-2 ring-amber-400 rounded-lg" : "hover:bg-gray-50"}`}
                  >
                    {/* Remove button */}
                    {count > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeByMatch(card.menuId, card.selectedOptions);
                        }}
                        className="absolute right-0.5 top-0.5 z-[5] flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                      >
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}

                    {/* Product image */}
                    <div className="w-24 h-28 sm:w-28 sm:h-36 flex items-end justify-center mb-0.5">
                      {card.imageUrl ? (
                        <img
                          src={card.imageUrl}
                          alt={card.menuName}
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <div className="h-14 w-14 bg-gray-200 rounded flex items-center justify-center border border-gray-300">
                          <span className="text-gray-400 text-[8px] font-bold uppercase">No Img</span>
                        </div>
                      )}
                    </div>

                    {/* Menu name */}
                    <span className="text-[9px] sm:text-[10px] font-semibold text-gray-800 truncate w-full text-center leading-tight">
                      {card.menuName}
                    </span>

                    {/* Option label */}
                    {card.optionLabel && (
                      <span className="text-[8px] text-gray-500 truncate w-full text-center leading-tight">
                        {card.optionLabel}
                      </span>
                    )}

                    {/* Price */}
                    <span className="text-[10px] sm:text-xs font-bold text-red-600 mt-0.5">
                      {formatPrice(card.totalPrice, currentLanguage)}
                    </span>

                    {/* Button - recessed slot with oval push button */}
                    <div
                      className="mt-1.5 mb-1 w-11 h-8 sm:w-14 sm:h-9 rounded-[10px] bg-gray-300 flex items-center justify-center"
                      style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.25)' }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAdd(card);
                        }}
                        className={`w-9 h-5 sm:w-11 sm:h-6 rounded-[8px] active:scale-90 active:translate-y-px transition-all duration-100 flex items-center justify-center ${count > 0 ? "bg-amber-700 hover:bg-amber-800" : "bg-gradient-to-b from-zinc-600 to-zinc-800 hover:from-zinc-500 hover:to-zinc-700"}`}
                        style={{ boxShadow: 'inset 0 -2px 3px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.1), 0 1px 2px rgba(0,0,0,0.3)' }}
                      >
                        {count > 0 && (
                          <span className="text-[8px] sm:text-[9px] font-bold text-white">{count}</span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Shelf with blue trim */}
            <div className="w-full h-2.5 bg-gradient-to-b from-blue-300 to-blue-400 shadow-sm mt-0.5" />
          </div>
        ))}
      </div>
    </div>
  );
}
