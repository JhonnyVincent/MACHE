/*
  PAGE : vitrine d'une boutique

  Une boutique est un vendeur Mercur. Cette page affichait auparavant six
  produits codés en dur et des statistiques inventées — « 4.8/5 », « 92 %
  de réponse rapide », « 120+ produits » — identiques pour toutes les
  boutiques, y compris celles qui n'avaient jamais rien vendu.

  Mise en page personnalisée

  Chaque vendeur peut composer sa vitrine : la mise en page est lue dans
  `seller.metadata.storefront`, au format Puck. Sans mise en page
  enregistrée, une présentation par défaut s'applique — une boutique neuve
  ne doit pas être une page blanche.
*/

import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchSellerByHandle, fetchProducts } from "@/lib/medusa/catalog";
import { ProductCard } from "@/components/home/rails";
import { parseLayout } from "@/lib/storefront/blocks";
import { RenderBlock } from "@/components/storefront/blocks";

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

  /*
    La mise en page est lue depuis le vendeur. `parseLayout` ignore les
    blocs dont le type est inconnu plutôt que d'échouer : une clé mal
    saisie ne doit pas rendre une boutique inaccessible.
  */
  const { layout, isCustom } = parseLayout(seller.metadata, seller.name);

  return (
    <main className="bg-[var(--mache-bg)] pb-10">
      {/* En-tête de boutique : identité, toujours affichée. */}
      <section className="border-b border-[var(--mache-line)] bg-white">
        <div className="container-page flex flex-wrap items-center gap-4 py-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--mache-line)] bg-white text-[15px] font-bold text-[var(--mache-muted)]">
            {seller.logo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={seller.logo} alt="" className="h-full w-full object-cover" />
            ) : (
              seller.name.slice(0, 2).toUpperCase()
            )}
          </span>

          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-2 text-[18px] font-bold tracking-[-0.01em] text-[var(--mache-text)]">
              {seller.name}
              {seller.isPremium && (
                <span className="rounded-[3px] bg-[var(--mache-gold-soft)] px-2 py-0.5 text-[11px] font-bold text-[var(--mache-gold)]">
                  Premium
                </span>
              )}
            </p>

            {productsResult.ok && (
              <p className="mt-0.5 text-[12.5px] text-[var(--mache-muted)]">
                {productsResult.data.count} produit
                {productsResult.data.count > 1 ? "s" : ""} en ligne
                {isCustom ? " · vitrine personnalisée" : ""}
              </p>
            )}
          </div>
        </div>
      </section>

      {!productsResult.ok && (
        <div className="container-page py-6">
          <div className="rounded-[10px] border border-[#f3d9a5] bg-[#fdf6e8] p-4">
            <p className="text-[14px] font-bold text-[var(--mache-text)]">
              Catalogue de la boutique indisponible
            </p>
            <p className="mt-1 text-[13px] text-[var(--mache-muted)]">
              {productsResult.reason}
            </p>
          </div>
        </div>
      )}

      {/* Les blocs composés par le vendeur. */}
      {layout.content.map((block, index) => (
        <RenderBlock
          key={`${block.type}-${index}`}
          block={block}
          context={{ seller, products }}
        />
      ))}

      {productsResult.ok && products.length === 0 && (
        <div className="container-page py-6">
          <div className="rounded-[10px] border border-dashed border-[var(--mache-line)] bg-white p-10 text-center">
            <p className="text-[15px] font-bold text-[var(--mache-text)]">
              Cette boutique n&apos;a pas encore de produit en ligne
            </p>
            <Link
              href="/shop"
              className="mt-4 inline-block text-[13px] font-semibold text-[var(--mache-primary)] hover:underline"
            >
              Voir le catalogue
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
