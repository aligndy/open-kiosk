"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface OrderItem {
  id: number;
  menuName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  selectedOptions: string;
}

interface Order {
  id: number;
  orderNumber: string;
  totalAmount: number;
  items: OrderItem[];
}

export default function OrderComplete() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const orderNumber = searchParams.get("orderNumber") || "";
  const [countdown, setCountdown] = useState(5);
  const [order, setOrder] = useState<Order | null>(null);
  const [orderLoaded, setOrderLoaded] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetch(`/api/orders/${orderId}`)
        .then((res) => res.json())
        .then((data) => setOrder(data))
        .catch(() => {})
        .finally(() => setOrderLoaded(true));
    } else {
      setOrderLoaded(true);
    }
  }, [orderId]);

  useEffect(() => {
    if (!orderLoaded) return;
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
  }, [router, orderLoaded]);

  function parseOptions(json: string): { group: string; option: string; price: number }[] {
    try {
      return JSON.parse(json);
    } catch {
      return [];
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6">
      {/* Checkmark */}
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
        <svg className="h-14 w-14 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="mb-2 text-3xl font-bold text-gray-900">주문이 완료되었습니다</h1>

      {orderNumber && (
        <div className="mb-4 mt-2 rounded-xl bg-white px-8 py-4 shadow-sm">
          <p className="text-center text-base text-gray-500">주문번호</p>
          <p className="text-center text-4xl font-extrabold text-amber-600">{orderNumber}</p>
        </div>
      )}

      {/* Order Items */}
      {!orderLoaded && (
        <div className="mb-4 w-full max-w-sm rounded-xl bg-white p-4 shadow-sm text-center text-gray-400">
          주문 내역 로딩 중...
        </div>
      )}
      {orderLoaded && order && order.items.length > 0 && (
        <div className="mb-4 w-full max-w-sm rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-bold text-gray-800">주문 내역</h2>
          <ul className="space-y-3">
            {order.items.map((item) => {
              const options = parseOptions(item.selectedOptions);
              return (
                <li key={item.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-gray-900">
                      {item.menuName}
                      <span className="ml-1 text-sm font-normal text-gray-500">x{item.quantity}</span>
                    </span>
                    <span className="text-base font-bold text-gray-900">
                      {item.subtotal.toLocaleString()}원
                    </span>
                  </div>
                  {options.length > 0 && (
                    <div className="mt-1 text-sm text-gray-500">
                      {options.map((o, i) => (
                        <span key={i}>
                          {o.option}
                          {o.price > 0 && ` (+${o.price.toLocaleString()}원)`}
                          {i < options.length - 1 && ", "}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3">
            <span className="text-base font-bold text-gray-700">합계</span>
            <span className="text-xl font-extrabold text-amber-600">
              {order.totalAmount.toLocaleString()}원
            </span>
          </div>
        </div>
      )}

      <p className="mb-6 text-lg text-gray-400">
        {countdown}초 후 처음 화면으로 돌아갑니다
      </p>

      <button
        onClick={() => router.push("/shop")}
        className="flex h-16 w-full max-w-sm items-center justify-center rounded-xl bg-amber-500 text-xl font-bold text-white active:bg-amber-600"
      >
        처음으로 돌아가기
      </button>
    </div>
  );
}
