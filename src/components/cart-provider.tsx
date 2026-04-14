"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { allProducts } from "@/lib/mock-data";

type CartItem = {
  id: string;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (productId: string, quantity?: number) => void;
  decreaseItem: (productId: string) => void;
  increaseItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  count: number;
  subtotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  function openCart() {
    setIsOpen(true);
  }

  function closeCart() {
    setIsOpen(false);
  }

  function addToCart(productId: string, quantity = 1) {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === productId);

      if (existing) {
        return prev.map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [...prev, { id: productId, quantity }];
    });

    setIsOpen(true);
  }

  function increaseItem(productId: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  }

  function decreaseItem(productId: string) {
    setItems((prev) =>
      prev
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((item) => item.id !== productId));
  }

  const count = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const product = allProducts.find((p) => p.id === item.id);
      if (!product) return sum;
      return sum + product.price * item.quantity;
    }, 0);
  }, [items]);

  const value = useMemo(
    () => ({
      items,
      isOpen,
      openCart,
      closeCart,
      addToCart,
      decreaseItem,
      increaseItem,
      removeItem,
      count,
      subtotal
    }),
    [items, isOpen, count, subtotal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart doit être utilisé dans CartProvider.");
  }

  return context;
}
