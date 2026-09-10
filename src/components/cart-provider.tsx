"use client";

/*
  Panier.

  Chaque ligne porte un instantané du produit — titre, prix, image — pris
  au moment de l'ajout. Auparavant seul l'identifiant était conservé et le
  prix était retrouvé dans `mock-data` : dès que le catalogue est venu de
  Supabase, aucun produit réel n'y figurait, et le total retombait à zéro
  sans le moindre message.

  Conserver le prix affiché à l'ajout est aussi la bonne pratique : le
  client paie ce qu'on lui a montré, même si le vendeur change son tarif
  entre-temps. L'écart éventuel se règle à la validation de la commande.
*/

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type CartProduct = {
  id: string;
  handle: string;
  title: string;
  price: number;
  image?: string | null;
  storeId?: string | null;
  storeName?: string | null;
  stock?: number;
};

export type CartItem = CartProduct & { quantity: number };

type CartContextValue = {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (product: CartProduct, quantity?: number) => void;
  decreaseItem: (productId: string) => void;
  increaseItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  count: number;
  subtotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "mache_cart_v1";

function readStoredCart(): CartItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item) =>
        item &&
        typeof item.id === "string" &&
        typeof item.quantity === "number" &&
        item.quantity > 0
    );
  } catch {
    // Stockage indisponible ou contenu illisible : on repart d'un panier vide.
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  /*
    La lecture se fait après le montage : le rendu serveur ne connaît pas
    localStorage, et lire pendant le rendu provoquerait une différence
    d'hydratation.
  */
  useEffect(() => {
    const stored = readStoredCart();
    if (stored.length) setItems(stored);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Navigation privée ou stockage plein : le panier reste en mémoire.
    }
  }, [items]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addToCart = useCallback((product: CartProduct, quantity = 1) => {
    if (!product?.id || quantity < 1) return;

    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);

      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, ...product, quantity: item.quantity + quantity }
            : item
        );
      }

      return [...prev, { ...product, quantity }];
    });

    setIsOpen(true);
  }, []);

  const increaseItem = useCallback((productId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  }, []);

  const decreaseItem = useCallback((productId: string) => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const count = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

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
      clearCart,
      count,
      subtotal,
    }),
    [
      items,
      isOpen,
      openCart,
      closeCart,
      addToCart,
      decreaseItem,
      increaseItem,
      removeItem,
      clearCart,
      count,
      subtotal,
    ]
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
