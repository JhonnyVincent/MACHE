/*
  PAGE : vitrine publique d'une boutique

  Cette page affichait six produits codés en dur et des statistiques
  inventées — « 4.8/5 », « 92 % de réponse rapide », « 120+ produits » —
  identiques pour toutes les boutiques. Tout provient désormais de la base,
  et ce qui n'est pas mesuré n'est plus affiché.
*/

import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import {
  fetchStoreBySlug,
  fetchProducts,
  type CatalogProduct,
} from "@/lib/catalog";
import type { Product } from "@/types";

export const dynamic = "force-dynamic";

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

function formatSince(value: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const store = await fetchStoreBySlug(slug);

  if (!store) {
    notFound();
  }

  const { products } = await fetchProducts({ storeId: store.id, limit: 60 });

  const categories = [...new Set(products.map((product) => product.category))].sort(
    (a, b) => a.localeCompare(b, "fr")
  );

  const inStock = products.filter((product) => product.stock > 0).length;
  const since = formatSince(store.createdAt);
  const initials = store.name.slice(0, 2).toUpperCase();

  return (
    <main className="container-page py-10">
      <header className="card overflow-hidden p-0">
        <div className="h-28 bg-gradient-to-r from-[#0f1b2e] via-[#152540] to-[var(--mache-primary)]" />

        <div className="flex flex-wrap items-end gap-4 px-6 pb-6">
          <div className="-mt-10 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-4 border-[var(--mache-white)] bg-[var(--mache-primary)] text-[22px] font-[950] text-white">
            {store.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={store.logoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[clamp(22px,2.6vw,30px)] font-[950] tracking-[-0.03em]">
                {store.name}
              </h1>
              {store.isVerified && (
                <span className="badge border-[#b7dfc9] bg-[#eefaf3] text-[var(--mache-success)]">
                  Boutique vérifiée
                </span>
              )}
            </div>

            <p className="mt-1 text-[13px] text-[var(--mache-muted)]">
              {store.category ? `${store.category} · ` : ""}
              {since ? `Sur Maché depuis ${since}` : "Boutique Maché"}
            </p>
          </div>
        </div>
      </header>

      {store.description && (
        <p className="mt-5 max-w-3xl text-[14px] leading-[1.8] text-[var(--mache-muted)]">
          {store.description}
        </p>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-[11px] font-[800] uppercase tracking-[0.08em] text-[var(--mache-muted)]">
            Produits en ligne
          </p>
          <p className="mt-1 text-[24px] font-[950]">{products.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] font-[800] uppercase tracking-[0.08em] text-[var(--mache-muted)]">
            Disponibles
          </p>
          <p className="mt-1 text-[24px] font-[950]">{inStock}</p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] font-[800] uppercase tracking-[0.08em] text-[var(--mache-muted)]">
            Catégories
          </p>
          <p className="mt-1 text-[24px] font-[950]">{categories.length}</p>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="section-title">Les produits de la boutique</h2>

        {products.length === 0 ? (
          <div className="card mt-6 p-10 text-center">
            <p className="text-[16px] font-[900]">Aucun produit pour le moment</p>
            <p className="mx-auto mt-2 max-w-md text-[13px] leading-[1.7] text-[var(--mache-muted)]">
              Cette boutique n&apos;a pas encore mis d&apos;article en ligne.
              Revenez bientôt.
            </p>
            <div className="mt-5">
              <Link href="/shop" className="btn-secondary">
                Voir tout le catalogue
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={toCardProduct(product)} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
