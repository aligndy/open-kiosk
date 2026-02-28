"use client";

import { Suspense } from "react";
import OrderComplete from "@/components/shop/OrderComplete";

export default function OrderCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="text-xl text-gray-400">로딩 중...</div>
        </div>
      }
    >
      <OrderComplete />
    </Suspense>
  );
}
