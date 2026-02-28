"use client";

import { create } from "zustand";
import type { CartItem, SelectedOption } from "@/types";

function optionsKey(options: SelectedOption[]): string {
  const sorted = [...options].sort((a, b) => a.groupId - b.groupId || a.optionId - b.optionId);
  return JSON.stringify(sorted.map((o) => ({ groupId: o.groupId, optionId: o.optionId })));
}

interface CartStore {
  orderType: "dineIn" | "takeOut" | null;
  setOrderType: (type: "dineIn" | "takeOut" | null) => void;
  items: CartItem[];
  addItem: (item: Omit<CartItem, "subtotal">) => void;
  removeItem: (index: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
  clearCart: () => void;
  totalAmount: () => number;
  totalItems: () => number;
  addOrIncrementItem: (item: Omit<CartItem, "subtotal" | "quantity">) => void;
  removeByMatch: (menuId: number, selectedOptions: SelectedOption[]) => void;
  getItemCount: (menuId: number, selectedOptions: SelectedOption[]) => number;
}

function calcSubtotal(item: Omit<CartItem, "subtotal">): number {
  const optionsPrice = item.selectedOptions.reduce(
    (sum: number, o: SelectedOption) => sum + o.priceModifier,
    0
  );
  return (item.unitPrice + optionsPrice) * item.quantity;
}

export const useCartStore = create<CartStore>((set, get) => ({
  orderType: null,
  setOrderType: (orderType) => set({ orderType }),
  items: [],

  addItem: (item) => {
    const subtotal = calcSubtotal(item);
    set((state) => ({
      items: [...state.items, { ...item, subtotal }],
    }));
  },

  removeItem: (index) => {
    set((state) => ({
      items: state.items.filter((_, i) => i !== index),
    }));
  },

  updateQuantity: (index, quantity) => {
    set((state) => {
      const items = [...state.items];
      if (items[index]) {
        items[index] = {
          ...items[index],
          quantity,
          subtotal: calcSubtotal({ ...items[index], quantity }),
        };
      }
      return { items };
    });
  },

  clearCart: () => set({ items: [], orderType: null }),

  addOrIncrementItem: (item) => {
    const key = optionsKey(item.selectedOptions);
    set((state) => {
      const idx = state.items.findIndex(
        (i) => i.menuId === item.menuId && optionsKey(i.selectedOptions) === key
      );
      if (idx >= 0) {
        const items = [...state.items];
        const newQty = items[idx].quantity + 1;
        items[idx] = {
          ...items[idx],
          quantity: newQty,
          subtotal: calcSubtotal({ ...items[idx], quantity: newQty }),
        };
        return { items };
      }
      const newItem = { ...item, quantity: 1 };
      return { items: [...state.items, { ...newItem, subtotal: calcSubtotal(newItem) }] };
    });
  },

  removeByMatch: (menuId, selectedOptions) => {
    const key = optionsKey(selectedOptions);
    set((state) => ({
      items: state.items.filter(
        (i) => !(i.menuId === menuId && optionsKey(i.selectedOptions) === key)
      ),
    }));
  },

  getItemCount: (menuId, selectedOptions) => {
    const key = optionsKey(selectedOptions);
    const item = get().items.find(
      (i) => i.menuId === menuId && optionsKey(i.selectedOptions) === key
    );
    return item?.quantity ?? 0;
  },

  totalAmount: () => get().items.reduce((sum, item) => sum + item.subtotal, 0),

  totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
}));
