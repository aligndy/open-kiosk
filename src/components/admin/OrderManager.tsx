"use client";

import { useEffect, useState, useCallback } from "react";
import OrderCard, { type Order } from "./OrderCard";

export default function OrderManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<"pending" | "completed">("pending");
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/orders?status=${tab}`);
    const data = await res.json();
    setOrders(data);
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const completeOrder = async (id: number) => {
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    fetchOrders();
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-4">주문 관리</h2>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("pending")}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            tab === "pending"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-600 border"
          }`}
        >
          대기중
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
