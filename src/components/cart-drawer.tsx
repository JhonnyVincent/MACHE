"use client";

import Link from "next/link";
import { allProducts } from "@/lib/mock-data";
import { useCart } from "./cart-provider";

export function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    subtotal,
    increaseItem,
    decreaseItem,
    removeItem
  } = useCart();

  const shipping = subtotal >= 100 ? 0 : items.length ? 8 : 0;
  const total = subtotal + shipping;

  const cartProducts = items
    .map((item) => {
      const product = allProducts.find((p) => p.id === item.id);
      if (!product) return null;
      return { ...product, quantity: item.quantity };
    })
    .filter(Boolean);

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-50 ${
        isOpen ? "pointer-events-auto" : ""
      }`}
    >
      <div
        onClick={closeCart}
        className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        className={`absolute left-0 top-0 flex h-full w-[min(430px,100%)] flex-col bg-[var(--mache-white)] shadow-[var(--shadow-medium)] transition duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[var(--mache-line)] px-5 py-4">
          <h3 className="text-[16px] font-[800] tracking-[-0.02em]">
            Votre panier
          </h3>
          <button
            onClick={closeCart}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--mache-bg)] text-[var(--mache-muted)]"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {cartProducts.length === 0 ? (
            <div className="py-12 text-center text-[var(--mache-muted)]">
              <div className="mb-4 text-5xl opacity-30">🛒</div>
              <p className="mb-4 text-sm">Votre panier est vide</p>
              <Link href="/shop" onClick={closeCart} className="btn-primary">
                Découvrir les produits
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {cartProducts.map((product) => {
                if (!product) return null;

                return (
                  <div
                    key={product.id}
                    className="grid grid-cols-[68px_1fr_auto] gap-3 border-b border-[var(--mache-bg-2)] pb-4"
                  >
                    <div className="h-[68px] w-[68px] overflow-hidden rounded-[10px] bg-[var(--mache-bg)]">
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div>
                      <div className="text-[12px] font-[700]">{product.title}</div>
                      <div className="mt-1 text-[11px] text-[var(--mache-muted)]">
                        {product.currency} {product.price}
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={() => decreaseItem(product.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--mache-line)] text-sm"
                        >
                          −
                        </button>
                        <span className="text-sm font-[700]">
                          {product.quantity}
                        </span>
                        <button
                          onClick={() => increaseItem(product.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--mache-line)] text-sm"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeItem(product.id)}
                          className="ml-1 flex h-7 w-7 items-center justify-center rounded-full border border-[var(--mache-line)] text-sm text-[var(--mache-danger)]"
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    <div className="text-[13px] font-[800]">
                      {product.currency} {product.price * product.quantity}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="grid gap-3 border-t border-[var(--mache-line)] px-5 py-4">
          {cartProducts.length > 0 ? (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--mache-muted)]">Sous-total</span>
                <span>USD {subtotal}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-[var(--mache-muted)]">Livraison</span>
                <span>
                  {shipping === 0 ? (
                    <span className="text-[var(--mache-success)]">Gratuite</span>
                  ) : (
                    `USD ${shipping}`
                  )}
                </span>
              </div>

              <div className="flex justify-between text-[18px] font-[900] tracking-[-0.02em]">
                <span>Total</span>
                <span>USD {total}</span>
              </div>

              <Link
                href="/checkout/pending"
                onClick={closeCart}
                className="btn-primary w-full justify-center"
              >
                Passer la commande
              </Link>

              <button onClick={closeCart} className="btn-secondary w-full justify-center">
                Continuer mes achats
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
