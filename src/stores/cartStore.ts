"use client";

import { create } from "zustand";
import type { CartItem, SelectedOption } from "@/types";

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "subtotal">) => void;
  removeItem: (index: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
  clearCart: () => void;
  totalAmount: () => number;
  totalItems: () => number;
}

function calcSubtotal(item: Omit<CartItem, "subtotal">): number {
  const optionsPrice = item.selectedOptions.reduce(
    (sum: number, o: SelectedOption) => sum + o.priceModifier,
    0
  );
  return (item.unitPrice + optionsPrice) * item.quantity;
}

export const useCartStore = create<CartStore>((set, get) => ({
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

  clearCart: () => set({ items: [] }),

  totalAmount: () => get().items.reduce((sum, item) => sum + item.subtotal, 0),

  totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
}));
