"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import OrderCard, { type Order } from "./OrderCard";

export default function OrderManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<"pending" | "completed">("pending");
  const [loading, setLoading] = useState(true);
  const [newOrderIds, setNewOrderIds] = useState<Set<number>>(new Set());
  const prevOrderIdsRef = useRef<Set<number>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const initialLoadRef = useRef(true);

  const fetchOrders = useCallback(async () => {
    const res = await fetch(`/api/orders?status=${tab}`);
    const data: Order[] = await res.json();
    setOrders(data);
    setLoading(false);

    if (tab === "pending") {
      const currentIds = new Set(data.map((o) => o.id));

      if (initialLoadRef.current) {
        prevOrderIdsRef.current = currentIds;
        initialLoadRef.current = false;
        return;
      }

      const added = new Set<number>();
      for (const id of currentIds) {
        if (!prevOrderIdsRef.current.has(id)) {
          added.add(id);
        }
      }

      if (added.size > 0) {
        setNewOrderIds((prev) => new Set([...prev, ...added]));
        audioRef.current?.play().catch(() => {});
      }

      prevOrderIdsRef.current = currentIds;
    }
  }, [tab]);

  useEffect(() => {
    initialLoadRef.current = true;
    setLoading(true);
    fetchOrders();

    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const completeOrder = async (id: number) => {
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    setNewOrderIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    fetchOrders();
  };

  const pendingCount = tab === "pending" ? orders.length : null;

  return (
    <div>
      {/* Notification sound - simple beep via Web Audio is handled inline */}
      <audio
        ref={audioRef}
        src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2LkZeWkYuEfXV2fYSNk5iWkYuDe3R0eoCIkJaWkoyFfnZ0eX+HjpSXlJCKhH13dXl+hIuSlZOPi4V/enh5foSKkJSTkIuGgHt5en6DipCTko+LhoF8enp+g4mOkZGOi4aBfXt7foOIjZCQjYqGgn58fH6Ch4yPj4yKhoN/fXx+goeKjY2LiYaDgH5+f4GFiYuMi4mHhIKAf3+BhIeJi4qJh4WDgYB/gYOGiImJiIeGhIKBgIGDBg=="
        preload="auto"
      />

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">주문 관리</h2>
        {newOrderIds.size > 0 && (
          <span className="flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-600 animate-pulse">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            새 주문 {newOrderIds.size}건
          </span>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("pending")}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            tab === "pending"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-600 border"
          }`}
        >
          대기중{pendingCount !== null && pendingCount > 0 && ` (${pendingCount})`}
        </button>
        <button
          onClick={() => setTab("completed")}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            tab === "completed"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-600 border"
          }`}
        >
          완료
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">로딩 중...</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-500">
          {tab === "pending" ? "대기중인 주문이 없습니다." : "완료된 주문이 없습니다."}
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              showComplete={tab === "pending"}
              onComplete={completeOrder}
              isNew={newOrderIds.has(order.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
