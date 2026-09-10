/*
  COMPOSANT : ProductCard

  Carte produit des pages publiques : accueil, boutique, catégories,
  résultats de recherche, vitrines de boutiques.

  Registre commerçant plutôt que vitrine : le prix domine, la remise est
  chiffrée, la disponibilité est dite. La note n'apparaît que si elle
  existe réellement — afficher « ⭐ 0 · 0 avis » sur chaque produit
  décrédibilise l'ensemble du catalogue.
*/

"use client";

import Link from "next/link";
import { Product } from "@/types";
import { useCart } from "./cart-provider";
import { formatPrice } from "@/lib/format";

export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();

  /*
    Priorité des images :
    1. image_urls (Supabase, plusieurs images)
    2. images (ancien format)
    3. visuel de repli
  */
  const productImage =
    product.image_urls?.[0] || product.images?.[0] || "/placeholder-product.png";

  const hasDiscount =
    typeof product.compareAtPrice === "number" &&
    product.compareAtPrice > product.price;

  const discountPercent = hasDiscount
    ? Math.round((1 - product.price / (product.compareAtPrice as number)) * 100)
    : 0;

  const outOfStock = product.stock <= 0;
  const lowStock = !outOfStock && product.stock <= 5;

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-[10px] border border-[var(--mache-line)] bg-[var(--mache-white)] transition-shadow hover:shadow-[0_6px_20px_rgba(16,24,32,0.10)]">
      <Link href={`/product/${product.slug}`} className="relative block">
        <div className="relative aspect-square overflow-hidden bg-[var(--mache-bg)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={productImage}
            alt={product.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
          />

          {outOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <span className="rounded-[3px] bg-[var(--mache-text)] px-2 py-1 text-[11px] font-bold text-white">
                Rupture de stock
              </span>
            </div>
          )}
        </div>

        {hasDiscount && (
          <span className="absolute left-2 top-2 rounded-[3px] bg-[var(--mache-primary)] px-1.5 py-0.5 text-[11px] font-bold text-white">
            −{discountPercent} %
          </span>
        )}

        {product.isSponsored && (
          <span className="absolute right-2 top-2 rounded-[3px] bg-black/65 px-1.5 py-0.5 text-[10px] font-medium text-white">
            Sponsorisé
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-3">
        <Link href={`/product/${product.slug}`}>
          <h3 className="line-clamp-2 text-[13.5px] font-medium leading-snug text-[var(--mache-text)] hover:underline">
            {product.title}
          </h3>
        </Link>

        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-[18px] font-[900] leading-none tracking-[-0.02em] text-[var(--mache-text)]">
            {formatPrice(product.price)}
          </span>

          {hasDiscount && (
            <span className="text-[12px] text-[var(--mache-light)] line-through">
              {formatPrice(product.compareAtPrice as number)}
            </span>
          )}
        </div>

        <p className="mt-1.5 truncate text-[11.5px] text-[var(--mache-muted)]">
          {product.vendorName}
          {product.category ? ` · ${product.category}` : ""}
        </p>

        {/* La note n'est affichée que lorsqu'elle repose sur de vrais avis. */}
        {product.reviewCount > 0 && (
          <p className="mt-1 text-[11.5px] text-[var(--mache-muted)]">
            ★ {product.rating.toFixed(1)} · {product.reviewCount} avis
          </p>
        )}

        {lowStock && (
          <p className="mt-1 text-[11.5px] font-semibold text-[var(--mache-danger)]">
            Plus que {product.stock} en stock
          </p>
        )}

        {/* mt-auto : le bouton s'aligne d'une carte à l'autre, quelle que
            soit la longueur du titre. */}
        <button
          disabled={outOfStock}
          onClick={() =>
            addToCart(
              {
                id: product.id,
                handle: product.slug,
                title: product.title,
                price: product.price,
                image: productImage,
                storeName: product.vendorName,
                stock: product.stock,
              },
              1
            )
          }
          className="mt-auto w-full rounded-[6px] bg-[var(--mache-primary)] px-3 py-2 text-[12.5px] font-bold text-white transition-colors hover:bg-[var(--mache-primary-dark)] disabled:cursor-not-allowed disabled:bg-[var(--mache-line)] disabled:text-[var(--mache-muted)]"
        >
          {outOfStock ? "Indisponible" : "Ajouter au panier"}
        </button>
      </div>
    </div>
  );
}
