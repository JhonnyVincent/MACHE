/*
  PAGE : fiche produit publique

  Lit le catalogue Supabase. Cette page affichait auparavant les produits
  de `mock-data` : les articles réellement publiés par les vendeurs
  n'étaient jamais visibles.
*/

import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductActions } from "@/components/product-actions";
import { ProductCard } from "@/components/product-card";
import { fetchProductByHandle, fetchProducts, formatPrice } from "@/lib/catalog";
import type { Product } from "@/types";
import type { CatalogProduct } from "@/lib/catalog";

export const dynamic = "force-dynamic";

/* Adapte un produit du catalogue à la forme attendue par ProductCard. */
function toCardProduct(product: CatalogProduct): Product {
  return {
    id: product.id,
    slug: product.handle,
    title: product.title,
    price: product.price,
    currency: "HTG",
    stock: product.stock,
    images: product.images,
    vendorName: product.storeName,
    category: product.category,
    description: product.description,
    rating: 0,
    reviewCount: 0,
    status: "active",
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const product = await fetchProductByHandle(slug);

  if (!product) {
    notFound();
  }

  const { products: related } = await fetchProducts({
    category: product.category,
    limit: 5,
  });

  const others = related.filter((item) => item.id !== product.id).slice(0, 4);

  const image = product.images[0] || "/placeholder-product.png";
  const inStock = product.stock > 0;

  return (
    <main className="container-page py-10">
      <nav className="mb-6 text-[13px] text-[var(--mache-muted)]">
        <Link href="/shop" className="hover:underline">
          Boutique
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:underline">
          {product.category}
        </Link>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="card overflow-hidden p-0">
          <div className="aspect-square bg-[var(--mache-bg)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt={product.title}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <div>
          <h1 className="text-[clamp(24px,3vw,34px)] font-[950] leading-tight tracking-[-0.03em]">
            {product.title}
          </h1>

          <p className="mt-2 text-[13px] text-[var(--mache-muted)]">
            Vendu par{" "}
            {product.storeSlug ? (
              <Link href={`/store/${product.storeSlug}`} className="font-[800] hover:underline">
                {product.storeName}
              </Link>
            ) : (
              <span className="font-[800]">{product.storeName}</span>
            )}
          </p>

          <p className="mt-5 text-[30px] font-[950] tracking-[-0.03em] text-[var(--mache-primary)]">
            {formatPrice(product.price)}
          </p>

          <p className="mt-2 text-[13px]">
            {inStock ? (
              <span className="text-[var(--mache-success)]">
                En stock · {product.stock} disponible{product.stock > 1 ? "s" : ""}
              </span>
            ) : (
              <span className="text-[var(--mache-danger)]">Rupture de stock</span>
            )}
          </p>

          {product.description && (
            <p className="mt-5 text-[14px] leading-[1.8] text-[var(--mache-muted)]">
              {product.description}
            </p>
          )}

          <ProductActions
            product={{
              id: product.id,
              handle: product.handle,
              title: product.title,
              price: product.price,
              image,
              storeId: product.storeId,
              storeName: product.storeName,
              stock: product.stock,
            }}
          />
        </div>
      </div>

      {others.length > 0 && (
        <section className="mt-14">
          <h2 className="section-title">Dans la même catégorie</h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {others.map((item) => (
              <ProductCard key={item.id} product={toCardProduct(item)} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
