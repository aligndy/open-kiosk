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

  return (
    <div className="grid grid-cols-3 gap-2 p-2">
      {cards.map((card, idx) => {
        const count = getCount(card);
        return (
          <button
            key={`${card.menuId}-${idx}`}
            onClick={() =>
              addOrIncrementItem({
                menuId: card.menuId,
                menuName: card.menuName,
                menuNameTranslations: card.menuNameTranslations,
                imageUrl: card.imageUrl,
                unitPrice: card.unitPrice,
                selectedOptions: card.selectedOptions,
              })
            }
            className="relative flex flex-col overflow-hidden rounded-lg bg-white shadow-sm active:scale-[0.97] transition-transform"
          >
            {/* Remove button */}
            {count > 0 && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  removeByMatch(card.menuId, card.selectedOptions);
                }}
                className="absolute right-1 top-1 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow-md"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}

            {/* Quantity badge */}
            {count > 0 && (
              <div className="absolute left-1 top-1 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-xs font-bold text-white shadow-md">
                {count}
              </div>
            )}

            {/* Image */}
            <div className="aspect-square w-full bg-gray-100">
              {card.imageUrl ? (
                <img
                  src={card.imageUrl}
                  alt={card.menuName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <svg className="h-8 w-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

            {/* Info */}
            <div className="flex flex-1 flex-col p-1.5">
              <p className="text-xs font-bold text-gray-900 leading-tight line-clamp-2">
                {card.menuName}
                {card.optionLabel && (
                  <span className="font-normal text-gray-500"> · {card.optionLabel}</span>
                )}
              </p>
              <p className="mt-0.5 text-sm font-extrabold text-amber-600">
                {formatPrice(card.totalPrice, currentLanguage)}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
