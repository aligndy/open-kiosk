"use client";

import { useState } from "react";
import { MenuWithOptions, SelectedOption, getTranslation } from "@/types";
import { useCartStore } from "@/stores/cartStore";
import { useLanguageStore } from "@/stores/languageStore";

interface OptionModalProps {
  menu: MenuWithOptions;
  onClose: () => void;
}

export default function OptionModal({ menu, onClose }: OptionModalProps) {
  const addItem = useCartStore((s) => s.addItem);
  const currentLanguage = useLanguageStore((s) => s.currentLanguage);
  const [quantity, setQuantity] = useState(1);
  // Map of groupId -> selected optionId
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>(() => {
    // Pre-select first option for required groups
    const initial: Record<number, number> = {};
    for (const group of menu.optionGroups) {
      if (group.required && group.options.length > 0) {
        initial[group.id] = group.options[0].id;
      }
    }
    return initial;
  });

  const menuName = getTranslation(menu.nameTranslations, currentLanguage, menu.name);

  // Calculate total price
  const optionsPrice = Object.entries(selectedOptions).reduce((sum, [groupId, optionId]) => {
    const group = menu.optionGroups.find((g) => g.id === Number(groupId));
    const option = group?.options.find((o) => o.id === optionId);
    return sum + (option?.priceModifier || 0);
  }, 0);
  const totalPrice = (menu.price + optionsPrice) * quantity;

  function handleSelectOption(groupId: number, optionId: number) {
    setSelectedOptions((prev) => {
      if (prev[groupId] === optionId) {
        // Deselect only if not required
        const group = menu.optionGroups.find((g) => g.id === groupId);
        if (!group?.required) {
          const next = { ...prev };
          delete next[groupId];
          return next;
        }
        return prev;
      }
      return { ...prev, [groupId]: optionId };
    });
  }

  function handleAddToCart() {
    const options: SelectedOption[] = [];
    for (const [groupId, optionId] of Object.entries(selectedOptions)) {
      const group = menu.optionGroups.find((g) => g.id === Number(groupId));
      const option = group?.options.find((o) => o.id === optionId);
      if (group && option) {
        options.push({
          groupId: group.id,
          optionId: option.id,
          groupName: group.name,
          optionName: option.name,
          priceModifier: option.priceModifier,
        });
      }
    }

    addItem({
      menuId: menu.id,
      menuName: menu.name,
      imageUrl: menu.imageUrl,
      quantity,
      unitPrice: menu.price,
      selectedOptions: options,
    });
    onClose();
  }

  // Check if all required groups are selected
  const allRequiredSelected = menu.optionGroups
    .filter((g) => g.required)
    .every((g) => selectedOptions[g.id] !== undefined);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-2xl bg-white">
        {/* Close button */}
        <div className="flex justify-end p-3">
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-gray-400"
          >
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {/* Menu image */}
          <div className="mx-auto mb-4 aspect-square w-full max-w-[280px] overflow-hidden rounded-xl bg-gray-100">
            {menu.imageUrl ? (
              <img
                src={menu.imageUrl}
                alt={menuName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <svg className="h-20 w-20 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          {/* Menu name & price */}
          <h2 className="text-2xl font-bold text-gray-900">{menuName}</h2>
          {menu.description && (
            <p className="mt-1 text-lg text-gray-500">
              {getTranslation(menu.descriptionTranslations, currentLanguage, menu.description)}
            </p>
          )}
          <p className="mt-1 text-3xl font-extrabold text-amber-600">
            {menu.price.toLocaleString()}원
          </p>

          {/* Option groups */}
          {menu.optionGroups.map((group) => (
            <div key={group.id} className="mt-5">
              <h3 className="mb-2 text-lg font-bold text-gray-800">
                {getTranslation(group.nameTranslations, currentLanguage, group.name)}
                {group.required && (
                  <span className="ml-2 text-sm font-medium text-red-500">필수</span>
                )}
              </h3>
              <div className="flex flex-wrap gap-2">
                {group.options.map((option) => {
                  const isSelected = selectedOptions[group.id] === option.id;
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleSelectOption(group.id, option.id)}
                      className={`flex h-14 items-center rounded-xl border-2 px-4 text-lg font-medium transition-colors ${
                        isSelected
                          ? "border-amber-500 bg-amber-50 text-amber-700"
                          : "border-gray-200 bg-white text-gray-700"
                      }`}
                    >
                      {getTranslation(option.nameTranslations, currentLanguage, option.name)}
                      {option.priceModifier !== 0 && (
                        <span className="ml-1 text-base text-gray-500">
                          {option.priceModifier > 0 ? "+" : ""}
                          {option.priceModifier.toLocaleString()}원
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Quantity selector */}
          <div className="mt-6 flex items-center justify-center gap-5">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-gray-300 text-2xl font-bold text-gray-600 active:bg-gray-100"
            >
              -
            </button>
            <span className="min-w-[3rem] text-center text-3xl font-bold text-gray-900">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-amber-500 bg-amber-50 text-2xl font-bold text-amber-600 active:bg-amber-100"
            >
              +
            </button>
          </div>
        </div>

        {/* Add to cart button */}
        <div className="border-t border-gray-100 px-5 py-4">
          <button
            onClick={handleAddToCart}
            disabled={!allRequiredSelected}
            className="flex h-16 w-full items-center justify-center rounded-xl bg-amber-500 text-xl font-bold text-white active:bg-amber-600 disabled:bg-gray-300 disabled:text-gray-500"
          >
            {totalPrice.toLocaleString()}원 장바구니 담기
          </button>
        </div>
      </div>
    </div>
  );
}
