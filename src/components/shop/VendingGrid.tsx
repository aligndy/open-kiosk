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

const WireCoil = () => (
  <div className="absolute bottom-0 left-0 right-0 h-10 text-gray-400 pointer-events-none z-20 flex justify-center overflow-visible">
    <svg viewBox="0 0 100 40" fill="none" className="w-[110%] h-full drop-shadow-lg overflow-visible">
      {/* Back half of the coil loops */}
      <path d="M10,20 C10,5 25,5 25,20 M30,20 C30,5 45,5 45,20 M50,20 C50,5 65,5 65,20 M70,20 C70,5 85,5 85,20" stroke="currentColor" strokeWidth="2" className="opacity-40" />
      {/* Front half of the coil loops overlapping */}
      <path d="M5,20 C5,35 20,35 20,20 M25,20 C25,35 40,35 40,20 M45,20 C45,35 60,35 60,20 M65,20 C65,35 80,35 80,20 M85,20 C85,35 100,35 100,20" stroke="currentColor" strokeWidth="3" />
      {/* The rod in the center */}
      <line x1="0" y1="20" x2="100" y2="20" stroke="currentColor" strokeWidth="1.5" className="opacity-60" />
    </svg>
  </div>
);

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

  const chunks = useMemo(() => {
    const ROW_SIZE = 4;
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

  return (
    <div className="relative w-full max-w-5xl mx-auto mt-4 mb-8 overflow-hidden rounded-3xl border-[16px] border-zinc-900 bg-[#151515] shadow-2xl transition-all">
      {/* Inner metallic bezel */}
      <div 
        className="absolute inset-0 border-[24px] pointer-events-none z-30 opacity-90" 
        style={{ 
          borderStyle: 'solid', 
          borderColor: '#d1d5db', 
          borderTopColor: '#f3f4f6', 
          borderBottomColor: '#9ca3af', 
          borderLeftColor: '#e5e7eb', 
          borderRightColor: '#d1d5db' 
        }}
      >
        <div className="w-full h-full shadow-[inset_0_20px_50px_rgba(0,0,0,0.9)] border border-gray-600" />
      </div>

      {/* Glass reflection gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none z-40 transform -skew-x-12 scale-150 translate-x-20"></div>

      {/* Grid container with internal padding to account for the bezel */}
      <div className="relative z-20 flex flex-col pt-16 pb-20 px-12 gap-y-16">
        {chunks.map((rowCards, rowIdx) => (
          <div key={rowIdx} className="relative w-full flex flex-col">
            
            {/* Items Container for the row */}
            <div className="grid grid-cols-4 gap-4 px-2 relative z-10 w-full mb-1">
              {rowCards.map((card, idx) => {
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
                    className="relative flex flex-col items-center h-48 outline-none group active:scale-[0.98] transition-transform"
                  >
                    {/* Quantity badging */}
                    {count > 0 && (
                      <div className="absolute right-0 top-0 z-30 flex h-7 min-w-7 items-center justify-center rounded-full bg-amber-500 px-1 text-sm font-bold text-white shadow-xl ring-2 ring-zinc-800">
                        {count}
                      </div>
                    )}
                    {count > 0 && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          removeByMatch(card.menuId, card.selectedOptions);
                        }}
                        className="absolute left-0 top-0 z-30 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow-xl ring-2 ring-zinc-800 hover:bg-red-600 transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    )}

                    {/* Product Image */}
                    <div className="relative z-10 w-24 h-32 sm:w-28 sm:h-36 flex items-end justify-center pb-4 translate-y-2 group-active:translate-y-5 transition-transform duration-150 ease-out">
                      {card.imageUrl ? (
                        <img
                          src={card.imageUrl}
                          alt={card.menuName}
                          className="max-h-full max-w-full object-contain drop-shadow-[0_15px_10px_rgba(0,0,0,0.7)]"
                        />
                      ) : (
                        <div className="h-20 w-20 bg-zinc-700 rounded-lg flex items-center justify-center shadow-2xl border border-zinc-600">
                          <span className="text-zinc-400 text-xs font-bold uppercase">No Img</span>
                        </div>
                      )}
                    </div>

                    {/* Wire Coil SVG */}
                    <WireCoil />
                  </button>
                );
              })}
            </div>
            
            {/* Continuous Shelf & Labels */}
            <div className="w-full h-14 bg-gradient-to-b from-gray-400 to-gray-600 rounded-t-sm shadow-[0_15px_20px_-5px_rgba(0,0,0,0.8)] border-b-[6px] border-gray-700 relative z-0 flex items-center shadow-inner">
              <div className="grid grid-cols-4 gap-4 px-2 w-full h-full">
                {rowCards.map((card, idx) => (
                  <div key={`label-${idx}`} className="flex items-center justify-center p-2 h-full">
                    <div className="w-full h-full bg-zinc-900 rounded border border-zinc-950 flex flex-col items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)] overflow-hidden px-1 py-0.5">
                      <span className="text-[10px] leading-tight font-bold text-gray-400 uppercase truncate w-full text-center tracking-wider">
                        {card.menuName}
                      </span>
                      <span className="text-[11px] leading-tight font-black text-gray-100 w-full text-center tracking-widest mt-0.5">
                        {formatPrice(card.totalPrice, currentLanguage)}
                      </span>
                    </div>
                  </div>
                ))}
                
                {/* Empty label slots for incomplete rows */}
                {Array.from({ length: 4 - rowCards.length }).map((_, i) => (
                  <div key={`empty-${i}`} className="flex items-center justify-center p-2 h-full">
                    <div className="w-full h-full bg-zinc-900/60 rounded border border-zinc-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"></div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}

