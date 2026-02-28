"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/stores/cartStore";
import { useLanguageStore } from "@/stores/languageStore";
import SignaturePad, { SignaturePadRef } from "@/components/shop/SignaturePad";

interface PaymentModalProps {
  onClose: () => void;
}

export default function PaymentModal({ onClose }: PaymentModalProps) {
  const router = useRouter();
  const signatureRef = useRef<SignaturePadRef>(null);
  const items = useCartStore((s) => s.items);
  const totalAmount = useCartStore((s) => s.totalAmount());
  const clearCart = useCartStore((s) => s.clearCart);
  const currentLanguage = useLanguageStore((s) => s.currentLanguage);
  const [submitting, setSubmitting] = useState(false);

  async function handlePayment() {
    if (submitting) return;
    setSubmitting(true);

    try {
      const orderItems = items.map((item) => ({
        menuId: item.menuId,
        quantity: item.quantity,
        selectedOptions: item.selectedOptions.map((opt) => ({
          groupId: opt.groupId,
          optionId: opt.optionId,
        })),
      }));

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: orderItems,
          language: currentLanguage,
        }),
      });

      if (!res.ok) throw new Error("Order failed");

      const order = await res.json();
      clearCart();
      router.push(`/shop/order-complete?orderNumber=${order.orderNumber}`);
    } catch {
      alert("주문에 실패했습니다. 다시 시도해주세요.");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6">
        <h2 className="mb-4 text-center text-2xl font-bold text-gray-900">결제</h2>

        {/* Total */}
        <div className="mb-6 rounded-xl bg-gray-50 p-4 text-center">
          <p className="text-lg text-gray-500">결제 금액</p>
          <p className="text-4xl font-extrabold text-gray-900">
            {totalAmount.toLocaleString()}원
          </p>
        </div>

        {/* Signature */}
        <div className="mb-3">
          <p className="mb-2 text-lg font-semibold text-gray-700">서명</p>
          <SignaturePad ref={signatureRef} />
        </div>

        <button
          onClick={() => signatureRef.current?.clear()}
          className="mb-6 flex h-10 items-center justify-center rounded-lg border border-gray-300 px-4 text-base font-medium text-gray-600 active:bg-gray-50"
        >
          다시쓰기
        </button>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex h-16 flex-1 items-center justify-center rounded-xl border-2 border-gray-300 text-xl font-bold text-gray-600 active:bg-gray-50 disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handlePayment}
            disabled={submitting}
            className="flex h-16 flex-[2] items-center justify-center rounded-xl bg-amber-500 text-xl font-bold text-white active:bg-amber-600 disabled:bg-gray-300"
          >
            {submitting ? "처리 중..." : "결제 완료"}
          </button>
        </div>
      </div>
    </div>
  );
}
