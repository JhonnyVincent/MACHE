/*
  PAGE : vitrine d'une boutique

  Une boutique est un vendeur Mercur. Cette page affichait auparavant six
  produits codés en dur et des statistiques inventées — « 4.8/5 », « 92 %
  de réponse rapide », « 120+ produits » — identiques pour toutes les
  boutiques, y compris celles qui n'avaient jamais rien vendu.

  Tout ce qui s'affiche ici vient désormais du backend. Ce qui n'est pas
  mesuré n'est pas affiché.
*/

import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchSellerByHandle, fetchProducts } from "@/lib/medusa/catalog";
import { ProductCard } from "@/components/home/rails";

export const dynamic = "force-dynamic";

export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const sellerResult = await fetchSellerByHandle(slug);

  if (!sellerResult.ok) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-16">
        <h1 className="text-[22px] font-bold text-[var(--mache-text)]">
          Boutique indisponible
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-[var(--mache-muted)]">
          {sellerResult.reason}
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-[14px] font-bold text-white"
        >
          Retour au catalogue
        </Link>
      </main>
    );
  }

  const seller = sellerResult.data;

  if (!seller) notFound();

  const productsResult = await fetchProducts({
    sellerId: seller.id,
    limit: 48,
    order: "-created_at",
  });

  const products = productsResult.ok ? productsResult.data.products : [];

  return (
    <main className="bg-[var(--mache-bg)] pb-10">
      {/* Bandeau de la boutique */}
      <section className="border-b border-[var(--mache-line)] bg-white">
        <div className="relative h-32 bg-[var(--mache-bg)] sm:h-44">
          {seller.banner && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={seller.banner} alt="" className="h-full w-full object-cover" />
          )}
        </div>

        <div className="container-page flex flex-wrap items-center gap-4 py-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--mache-line)] bg-white text-[16px] font-bold text-[var(--mache-muted)]">
            {seller.logo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={seller.logo} alt="" className="h-full w-full object-cover" />
            ) : (
              seller.name.slice(0, 2).toUpperCase()
            )}
          </span>

          <div className="min-w-0 flex-1">
            <h1 className="flex flex-wrap items-center gap-2 text-[22px] font-bold tracking-[-0.01em] text-[var(--mache-text)] sm:text-[26px]">
              {seller.name}
              {seller.isPremium && (
                <span className="rounded-[3px] bg-[var(--mache-gold-soft)] px-2 py-0.5 text-[11px] font-bold text-[var(--mache-gold)]">
                  Premium
                </span>
              )}
            </h1>

            {seller.description && (
              <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-[var(--mache-muted)]">
                {seller.description}
              </p>
            )}

            {productsResult.ok && (
              <p className="mt-1.5 text-[12.5px] text-[var(--mache-muted)]">
                {productsResult.data.count} produit
                {productsResult.data.count > 1 ? "s" : ""} en ligne
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="container-page py-6">
        {!productsResult.ok && (
          <div className="rounded-[10px] border border-[#f3d9a5] bg-[#fdf6e8] p-4">
            <p className="text-[14px] font-bold text-[var(--mache-text)]">
              Catalogue de la boutique indisponible
            </p>
            <p className="mt-1 text-[13px] text-[var(--mache-muted)]">
              {productsResult.reason}
            </p>
          </div>
        )}

        {productsResult.ok && products.length === 0 ? (
          <div className="rounded-[10px] border border-dashed border-[var(--mache-line)] bg-white p-10 text-center">
            <p className="text-[15px] font-bold text-[var(--mache-text)]">
              Cette boutique n&apos;a pas encore de produit en ligne
            </p>
            <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-[var(--mache-muted)]">
              Revenez plus tard, ou parcourez les autres boutiques de MACHÉ.
            </p>
            <Link
              href="/shop"
              className="mt-4 inline-block text-[13px] font-semibold text-[var(--mache-primary)] hover:underline"
            >
              Voir le catalogue
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
