"use client";

import { useState } from "react";
import { useCart } from "./cart-provider";
import { useRouter } from "next/navigation";

export function ProductActions({
  productId
}: {
  productId: string;
}) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const router = useRouter();

  function decrease() {
    setQuantity((prev) => Math.max(1, prev - 1));
  }

  function increase() {
    setQuantity((prev) => prev + 1);
  }

  function add() {
    addToCart(productId, quantity);
  }

  function buyNow() {
    addToCart(productId, quantity);
    router.push("/checkout/pending");
  }

  return (
    <div className="mt-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex items-center overflow-hidden rounded-[8px] border border-[var(--mache-line)]">
          <button onClick={decrease} className="h-10 w-10 text-lg">
            −
          </button>
          <div className="flex h-10 items-center border-x border-[var(--mache-line)] px-4 font-[700]">
            {quantity}
          </div>
          <button onClick={increase} className="h-10 w-10 text-lg">
            +
          </button>
        </div>

        <span className="text-[13px] text-[var(--mache-muted)]">Quantité</span>
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={add} className="btn-primary">
          Ajouter au panier
        </button>
        <button onClick={buyNow} className="btn-secondary">
          Acheter maintenant
        </button>
        <button className="btn-secondary">Ajouter à la wishlist</button>
      </div>
    </div>
  );
}
