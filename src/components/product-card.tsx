"use client";

import Link from "next/link";
import { Product } from "@/types";
import { useCart } from "./cart-provider";

export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();

  return (
    <div className="group card overflow-hidden p-0 transition hover:-translate-y-1">
      <Link href={`/product/${product.slug}`}>
        <div className="aspect-[4/3] overflow-hidden">
          <img
            src={product.images[0]}
            alt={product.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        </div>
      </Link>

      <div className="p-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="badge">{product.category}</span>
          <span className="text-xs text-[var(--mache-muted)]">{product.vendorName}</span>
        </div>

        <Link href={`/product/${product.slug}`}>
          <h3 className="line-clamp-2 text-lg font-semibold">{product.title}</h3>
        </Link>

        <div className="mt-3 flex items-center gap-2">
          <span className="text-lg font-bold">
            {product.currency} {product.price}
          </span>
          {product.compareAtPrice ? (
            <span className="text-sm text-[var(--mache-muted)] line-through">
              {product.currency} {product.compareAtPrice}
            </span>
          ) : null}
        </div>

        <p className="mt-3 text-sm text-[var(--mache-muted)]">
          ⭐ {product.rating} · {product.reviewCount} avis
        </p>

        <div className="mt-4 flex gap-2">
          <Link href={`/product/${product.slug}`} className="btn-secondary flex-1 justify-center">
            Voir
          </Link>
          <button
            onClick={() => addToCart(product.id, 1)}
            className="btn-primary flex-1 justify-center"
          >
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}
