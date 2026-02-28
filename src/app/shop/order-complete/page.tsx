"use client";

import { Suspense } from "react";
import OrderComplete from "@/components/shop/OrderComplete";

export default function OrderCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-amber-500" />
        </div>
      }
    >
      <OrderComplete />
    </Suspense>
  );
}
