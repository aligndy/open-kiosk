"use client";

import { useT, useFormatPrice } from "@/lib/i18n";

interface CartBarProps {
  totalItems: number;
  totalAmount: number;
  onOpenCart: () => void;
}

export default function CartBar({ totalItems, totalAmount, onOpenCart }: CartBarProps) {
  const t = useT();
  const fp = useFormatPrice();

  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-gray-200 bg-white px-4 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
      <button
        onClick={onOpenCart}
        className="flex h-16 w-full items-center justify-between rounded-xl bg-amber-500 px-6 text-white active:bg-amber-600"
      >
        <span className="text-xl font-bold">
          {t("cart.viewCart")}
        </span>
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-600 text-lg font-bold">
            {totalItems}
          </span>
          <span className="text-2xl font-bold">
            {fp(totalAmount)}
          </span>
        </div>
      </button>
    </div>
  );
}
