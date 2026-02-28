"use client";

import { useCartStore } from "@/stores/cartStore";
import { useT } from "@/lib/i18n";
import { Coffee, ShoppingBag } from "lucide-react";

export default function OrderTypeSelection() {
    const setOrderType = useCartStore((s) => s.setOrderType);
    const t = useT();

    return (
        <div className="flex h-[calc(100vh-100px)] flex-col items-center justify-center p-6 bg-gray-50">
            <h2 className="text-3xl font-bold text-gray-900 mb-12">
                {t("shop.selectOrderType")}
            </h2>

            <div className="grid grid-cols-2 gap-8 w-full max-w-2xl">
                <button
                    onClick={() => setOrderType("dineIn")}
                    className="flex flex-col items-center justify-center gap-6 rounded-3xl bg-white p-12 shadow-md border-2 border-transparent hover:border-amber-500 hover:shadow-lg transition-all active:scale-[0.98]"
                >
                    <div className="flex h-32 w-32 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                        <Coffee size={64} strokeWidth={1.5} />
                    </div>
                    <span className="text-3xl font-bold text-gray-800">
                        {t("shop.orderType.dineIn")}
                    </span>
                </button>

                <button
                    onClick={() => setOrderType("takeOut")}
                    className="flex flex-col items-center justify-center gap-6 rounded-3xl bg-white p-12 shadow-md border-2 border-transparent hover:border-amber-500 hover:shadow-lg transition-all active:scale-[0.98]"
                >
                    <div className="flex h-32 w-32 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                        <ShoppingBag size={64} strokeWidth={1.5} />
                    </div>
                    <span className="text-3xl font-bold text-gray-800">
                        {t("shop.orderType.takeOut")}
                    </span>
                </button>
            </div>
        </div>
    );
}
