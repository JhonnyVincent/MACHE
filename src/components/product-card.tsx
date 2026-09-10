/*
  COMPOSANT : ProductCard

  Sert à :
  - Afficher un produit sur les pages publiques du site
  - Homepage
  - Boutique
  - Catégories
  - Résultats recherche
  - Stores publics

  Correction ajoutée :
  - Compatible avec l’ancien système "images"
  - Compatible avec le nouveau système Supabase "image_urls"
  - Corrige le bug où les images ne s’affichaient pas sur les pages publiques
*/

"use client";

import Link from "next/link";
import { Product } from "@/types";
import { useCart } from "./cart-provider";

export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();

  /*
    IMAGE PRODUIT

    Priorité :
    1. Nouveau système Supabase → image_urls
    2. Ancien système → images
    3. Placeholder si aucune image
  */

  const productImage =
    product.image_urls?.[0] ||
    product.images?.[0] ||
    "/placeholder-product.png";

  return (
    <div className="group card overflow-hidden p-0 transition hover:-translate-y-1">
      <Link href={`/product/${product.slug}`}>
        <div className="relative aspect-[4/3] overflow-hidden">

          {/* BADGE PRODUIT SPONSORISÉ */}
          {product.isSponsored && (
            <span className="absolute left-2 top-2 z-10 rounded bg-black/70 px-2 py-1 text-[10px] text-white">
              publicité
            </span>
          )}

          {/* IMAGE PRODUIT */}
          <img
            src={productImage}
            alt={product.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        </div>
      </Link>

      <div className="p-5">
        <div className="mb-2 flex items-center justify-between gap-2">

          {/* CATÉGORIE */}
          <span className="badge">{product.category}</span>

          {/* NOM VENDEUR */}
          <span className="text-xs text-[var(--mache-muted)]">
            {product.vendorName}
          </span>
        </div>

        {/* TITRE PRODUIT */}
        <Link href={`/product/${product.slug}`}>
          <h3 className="line-clamp-2 text-lg font-semibold">
            {product.title}
          </h3>
        </Link>

        {/* PRIX */}
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

        {/* NOTE PRODUIT */}
        <p className="mt-3 text-sm text-[var(--mache-muted)]">
          ⭐ {product.rating} · {product.reviewCount} avis
        </p>

        {/* ACTIONS */}
        <div className="mt-4 flex gap-2">

          {/* VOIR PRODUIT */}
          <Link
            href={`/product/${product.slug}`}
            className="btn-secondary flex-1 justify-center"
          >
            Voir
          </Link>

          {/* AJOUT PANIER */}
          <button
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
            className="btn-primary flex-1 justify-center"
          >
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}
