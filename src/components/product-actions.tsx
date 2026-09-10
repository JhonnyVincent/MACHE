"use client";

import { useState } from "react";
import { useCart, type CartProduct } from "./cart-provider";
import { useRouter } from "next/navigation";

/*
  Le composant reçoit l'instantané complet du produit, et non son seul
  identifiant : le panier conserve le prix et le titre affichés au moment
  de l'ajout.
*/
export function ProductActions({ product }: { product: CartProduct }) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const router = useRouter();

  function decrease() {
    setQuantity((prev) => Math.max(1, prev - 1));
  }

  function increase() {
    setQuantity((prev) => prev + 1);
  }

  const outOfStock = typeof product.stock === "number" && product.stock <= 0;

  function add() {
    addToCart(product, quantity);
  }

  function buyNow() {
    addToCart(product, quantity);
    router.push("/cart");
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

      {outOfStock ? (
        <p className="rounded-[10px] border border-[var(--mache-line)] bg-[var(--mache-bg)] px-4 py-3 text-[13px] text-[var(--mache-muted)]">
          Ce produit est en rupture de stock. Il ne peut pas être commandé
          pour le moment.
        </p>
      ) : (
        <div className="flex flex-wrap gap-3">
          <button onClick={add} className="btn-primary">
            Ajouter au panier
          </button>
          <button onClick={buyNow} className="btn-secondary">
            Acheter maintenant
          </button>
        </div>
      )}
    </div>
  );
}
