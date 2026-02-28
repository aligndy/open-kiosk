"use client";

import { useState } from "react";
import { useCartStore } from "@/stores/cartStore";
import PaymentModal from "@/components/shop/PaymentModal";

interface CartViewProps {
  onBack: () => void;
}

export default function CartView({ onBack }: CartViewProps) {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const totalAmount = useCartStore((s) => s.totalAmount());
  const [showPayment, setShowPayment] = useState(false);

  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
        <svg className="h-24 w-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
          />
        </svg>
        <p className="text-2xl font-bold text-gray-400">장바구니가 비어있습니다</p>
        <button
          onClick={onBack}
          className="mt-4 flex h-14 items-center rounded-xl bg-amber-500 px-8 text-xl font-bold text-white active:bg-amber-600"
        >
          메뉴로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center bg-white px-4 py-3 shadow-sm">
        <button
          onClick={onBack}
          className="flex h-12 w-12 items-center justify-center rounded-lg text-gray-600"
        >
          <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="flex-1 text-center text-2xl font-bold text-gray-900">장바구니</h1>
        <div className="w-12" />
      </header>

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {items.map((item, index) => (
          <div
            key={index}
            className="mb-3 rounded-xl bg-white p-4 shadow-sm"
          >
            <div className="flex gap-3">
              {/* Image */}
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.menuName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <svg className="h-10 w-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between">
                  <h3 className="text-xl font-bold text-gray-900">{item.menuName}</h3>
                  <button
                    onClick={() => removeItem(index)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Selected options */}
                {item.selectedOptions.length > 0 && (
                  <div className="mt-1 text-base text-gray-500">
                    {item.selectedOptions.map((opt, i) => (
                      <span key={i}>
                        {i > 0 && " / "}
                        {opt.optionName}
                        {opt.priceModifier !== 0 && (
                          <span className="text-gray-400">
                            ({opt.priceModifier > 0 ? "+" : ""}{opt.priceModifier.toLocaleString()}원)
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-lg text-gray-500">x {item.quantity}</span>
                  <span className="text-2xl font-extrabold text-amber-600">
                    {item.subtotal.toLocaleString()}원
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-200 bg-white px-4 py-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xl font-bold text-gray-700">총 금액</span>
          <span className="text-3xl font-extrabold text-gray-900">
            {totalAmount.toLocaleString()}원
          </span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="flex h-16 flex-1 items-center justify-center rounded-xl border-2 border-gray-300 text-xl font-bold text-gray-600 active:bg-gray-50"
          >
            메뉴로 돌아가기
          </button>
          <button
            onClick={() => setShowPayment(true)}
            className="flex h-16 flex-[2] items-center justify-center rounded-xl bg-amber-500 text-xl font-bold text-white active:bg-amber-600"
          >
            결제하기
          </button>
        </div>
      </div>

      {showPayment && (
        <PaymentModal onClose={() => setShowPayment(false)} />
      )}
    </>
  );
}
