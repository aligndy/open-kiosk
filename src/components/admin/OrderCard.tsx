"use client";

import { useT, useFormatPrice } from "@/lib/i18n";

interface OrderItem {
  id: number;
  menuName: string;
  quantity: number;
  unitPrice: number;
  selectedOptions: string;
  subtotal: number;
}

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  totalAmount: number;
  language: string;
  createdAt: string;
  items: OrderItem[];
}

interface OrderCardProps {
  order: Order;
  showComplete: boolean;
  onComplete: (id: number) => void;
  isNew?: boolean;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseOptions(optionsJson: string) {
  try {
    const opts = JSON.parse(optionsJson);
    if (!Array.isArray(opts) || opts.length === 0) return null;
    return opts
      .map(
        (o: { group: string; option: string; price: number }) =>
          `${o.option}${o.price > 0 ? `(+${o.price.toLocaleString()})` : ""}`
      )
      .join(", ");
  } catch {
    return null;
  }
}

export type { Order, OrderItem };

export default function OrderCard({ order, showComplete, onComplete, isNew }: OrderCardProps) {
  const t = useT();
  const fp = useFormatPrice();

  return (
    <div className={`bg-white rounded-lg shadow p-4 border ${isNew ? "border-red-400 ring-2 ring-red-200" : ""}`}>
      <div className="flex justify-between items-center mb-3">
        <span className="flex items-center gap-2 text-lg font-bold text-gray-800">
          {isNew && <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />}
          {order.orderNumber}
        </span>
        <span className="text-sm text-gray-500">
          {formatTime(order.createdAt)}
        </span>
      </div>

      <div className="space-y-2 mb-3">
        {order.items.map((item) => (
          <div key={item.id} className="text-sm">
            <div className="flex justify-between">
              <span className="text-gray-700">
                {item.menuName} x{item.quantity}
              </span>
              <span className="text-gray-600">
                {fp(item.subtotal)}
              </span>
            </div>
            {parseOptions(item.selectedOptions) && (
              <p className="text-xs text-gray-400 ml-2">
                {parseOptions(item.selectedOptions)}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="border-t pt-2 flex justify-between items-center">
        <span className="font-bold text-gray-800">
          {fp(order.totalAmount)}
        </span>
        {showComplete && (
          <button
            onClick={() => onComplete(order.id)}
            className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
          >
            {t("admin.order.complete")}
          </button>
        )}
      </div>
    </div>
  );
}
