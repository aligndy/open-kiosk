"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function OrderComplete() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber") || "";
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/shop");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6">
      {/* Checkmark */}
      <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-green-100">
        <svg className="h-16 w-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="mb-2 text-3xl font-bold text-gray-900">주문이 완료되었습니다</h1>

      {orderNumber && (
        <div className="mb-6 mt-4 rounded-xl bg-white px-8 py-5 shadow-sm">
          <p className="text-center text-lg text-gray-500">주문번호</p>
          <p className="text-center text-5xl font-extrabold text-amber-600">{orderNumber}</p>
        </div>
      )}

      <p className="mb-8 text-lg text-gray-400">
        {countdown}초 후 처음 화면으로 돌아갑니다
      </p>

      <button
        onClick={() => router.push("/shop")}
        className="flex h-16 items-center justify-center rounded-xl bg-amber-500 px-10 text-xl font-bold text-white active:bg-amber-600"
      >
        처음으로
      </button>
    </div>
  );
}
