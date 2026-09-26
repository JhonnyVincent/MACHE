/*
  PAGE : fiche produit

  Lit le catalogue Medusa. Le prix affiché est celui que le backend a
  calculé pour la région : la page n'en recalcule aucun.

  Le bouton d'ajout envoie un `offer_id`, pas un identifiant de variante.
  Sur une marketplace, « taille 44 » ne désigne pas une ligne de commande
  tant qu'on ne sait pas de quelle boutique elle vient — et plusieurs
  boutiques peuvent proposer exactement la même.
*/

import { Link } from "next-view-transitions";
import { fetchProductRatings } from "@/lib/medusa/catalog";
import { getCustomer } from "@/lib/medusa/customer";
import { getFavorites } from "@/lib/medusa/favorites";
import { toggleFavoriteAction } from "@/app/favorites/actions";
import { RatingSummary, ReviewList } from "@/components/ratings";
import { readSellerProfile, type SellerProfile } from "@/lib/seller-profile";
import { SellerProfileBadge } from "@/components/seller-profile-badge";
import { VerifiedBadge } from "@/components/verified-badge";
import { reportOutage } from "@/lib/medusa/outage";
import { notFound } from "next/navigation";
import {
  fetchProductByHandle, fetchProducts, fetchOffersForVariant, formatAmount,
} from "@/lib/medusa/catalog";
import { ProductRailSection } from "@/components/home/rails";
import { addToCartAction } from "@/app/cart/actions";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ variant?: string; error?: string; favori?: string }>;
}) {
  const { slug } = await params;
  const query = searchParams ? await searchParams : {};

  const result = await fetchProductByHandle(slug);

  if (!result.ok) {
    reportOutage("produit", result.reason);

    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-16">
        <h1 className="text-2xl font-bold text-[var(--mache-text)]">
          Fiche indisponible
        </h1>
        <p className="mt-3 text-md leading-relaxed text-[var(--mache-muted)]">
          Cette fiche produit ne peut pas être affichée pour le moment.
          Réessayez dans quelques minutes.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-md font-bold text-white"
        >
          Retour au catalogue
        </Link>
      </main>
    );
  }

  const product = result.data;

  if (!product) notFound();

  /*
    Les avis du produit. L'API publique de Mercur n'en expose aucun ;
    ils viennent de la route `/store/ratings` du backend MACHÉ, et seuls
    les avis modérés et publiés en sortent.
  */
  /*
    Le client connecté et sa liste : le cœur doit refléter l'état réel,
    pas un état par défaut.
  */
  const [customer, favorites] = await Promise.all([
    getCustomer(),
    getFavorites(),
  ]);

  const isFavorite = favorites.includes(product.handle);

  const ratingsResult = await fetchProductRatings(product.id);
  const ratings = ratingsResult.ok
    ? ratingsResult.data
    : { count: 0, average: null, reviews: [] };

  /* Variante choisie, ou la première disponible. */
  const selected =
    product.variants.find((variant) => variant.id === query.variant) ??
    product.variants.find((variant) => variant.available) ??
    product.variants[0] ??
    null;

  const offersResult = selected
    ? await fetchOffersForVariant(selected.id)
    : null;

  const offers = offersResult?.ok ? offersResult.data : [];

  const related = await fetchProducts({ limit: 6 });

  const price = selected?.price ?? product.price;
  const originalPrice = selected?.originalPrice ?? product.originalPrice;
  const currency = selected?.currency ?? product.currency;

  const hasDiscount =
    originalPrice !== null && price !== null && originalPrice > price;

  return (
    <main className="bg-[var(--mache-bg)] pb-10">
      <div className="container-page py-6">
        <nav className="mb-4 text-sm text-[var(--mache-muted)]">
          <Link href="/shop" className="hover:underline">Catalogue</Link>
          <span className="mx-1.5">/</span>
          <span className="text-[var(--mache-text)]">{product.title}</span>
        </nav>

        {query.error && (
          <div className="mb-4 rounded-[8px] border border-[#f2c2c8] bg-[#fdeaec] px-4 py-3 text-base text-[#b01124]">
            {decodeURIComponent(query.error)}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr] xl:grid-cols-[1.1fr_0.9fr]">
          {/* Images */}
          <div>
            {/* Au survol, la photo s'agrandit pour voir le détail. */}
            <div className="group overflow-hidden rounded-[10px] border border-[var(--mache-line)] bg-white">
              <div className="aspect-square overflow-hidden">
                {product.thumbnail ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={product.thumbnail}
                    alt={product.title}
                    className="h-full w-full cursor-zoom-in object-cover transition-transform duration-500 group-hover:scale-125 motion-reduce:transform-none"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-base text-[var(--mache-light)]">
                    Aucune image
                  </div>
                )}
              </div>
            </div>

            {product.images.length > 1 && (
              <div className="mt-2 grid grid-cols-5 gap-2">
                {product.images.slice(0, 5).map((image) => (
                  <span
                    key={image}
                    className="aspect-square overflow-hidden rounded-[6px] border border-[var(--mache-line)] bg-white"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image} alt="" className="h-full w-full object-cover transition-transform duration-300 hover:scale-110 motion-reduce:transform-none" />
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Achat */}
          <div>
            <h1 className="text-2xl font-bold leading-tight tracking-tight text-[var(--mache-text)] sm:text-3xl">
              {product.title}
            </h1>

            {/*
              La note du produit, sous son nom. Rien ne s'affiche tant
              qu'aucun client ne l'a noté : une rangée d'étoiles vides
              se lit comme une mauvaise note, alors qu'un produit neuf
              n'a simplement pas encore été jugé.
            */}
            <p className="mt-1.5">
              <RatingSummary ratings={ratings} />
            </p>

            {product.subtitle && (
              <p className="mt-1.5 text-md text-[var(--mache-muted)]">
                {product.subtitle}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-baseline gap-x-3">
              <span className="text-4xl font-black leading-none tracking-tighter text-[var(--mache-text)]">
                {formatAmount(price, currency)}
              </span>
              {hasDiscount && (
                <span className="text-lg text-[var(--mache-light)] line-through">
                  {formatAmount(originalPrice, currency)}
                </span>
              )}
            </div>

            {/* Variantes */}
            {product.variants.length > 1 && (
              <div className="mt-5">
                <p className="text-sm font-semibold text-[var(--mache-text)]">
                  Choisir une déclinaison
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.variants.map((variant) => (
                    <Link
                      key={variant.id}
                      href={`/product/${product.handle}?variant=${variant.id}`}
                      scroll={false}
                      className={`rounded-[6px] border px-3 py-1.5 text-base transition-colors ${
                        selected?.id === variant.id
                          ? "border-[var(--mache-text)] bg-[var(--mache-text)] font-semibold text-white"
                          : "border-[var(--mache-line)] bg-white text-[var(--mache-text)] hover:border-[var(--mache-primary)]"
                      }`}
                    >
                      {variant.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/*
              Prix dégressifs.

              Annoncés avant l'achat, pas découverts dans le panier : un
              acheteur professionnel décide de sa quantité en fonction du
              palier, pas l'inverse. Les paliers affichés sont ceux de
              CETTE offre — ceux d'un autre vendeur sur la même
              déclinaison ne le concernent pas.
            */}
            {selected && selected.tiers.length > 0 && (
              <div className="mt-5 overflow-hidden rounded-[10px] border border-[var(--mache-line)] bg-white">
                <p className="border-b border-[var(--mache-line)] bg-[var(--mache-bg)] px-3.5 py-2 text-sm font-bold text-[var(--mache-text)]">
                  Tarifs par quantité
                </p>

                <table className="w-full text-base">
                  <tbody>
                    <tr className="border-b border-[var(--mache-line)]">
                      <td className="px-3.5 py-2 text-[var(--mache-muted)]">
                        1
                        {selected.tiers[0].minQuantity > 2
                          ? ` à ${selected.tiers[0].minQuantity - 1}`
                          : ""}{" "}
                        unité{selected.tiers[0].minQuantity > 2 ? "s" : ""}
                      </td>
                      <td className="px-3.5 py-2 text-right font-semibold">
                        {formatAmount(price, currency)}
                      </td>
                    </tr>

                    {selected.tiers.map((tier) => (
                      <tr key={tier.minQuantity} className="border-b border-[var(--mache-line)] last:border-0">
                        <td className="px-3.5 py-2 text-[var(--mache-muted)]">
                          À partir de {tier.minQuantity} unités
                          {tier.maxQuantity ? ` (jusqu'à ${tier.maxQuantity})` : ""}
                        </td>
                        <td className="px-3.5 py-2 text-right font-semibold text-[var(--mache-success)]">
                          {formatAmount(tier.amount, tier.currency)}
                          {price !== null && tier.amount < price && (
                            <span className="ml-1.5 text-xs font-normal text-[var(--mache-muted)]">
                              −{Math.round((1 - tier.amount / price) * 100)} %
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <p className="border-t border-[var(--mache-line)] px-3.5 py-2 text-xs leading-relaxed text-[var(--mache-muted)]">
                  Le tarif s&apos;applique automatiquement au panier dès que la
                  quantité atteint le seuil. Rien à demander.
                </p>
              </div>
            )}

            {/* Ajout au panier */}
            <div className="mt-6">
              {selected?.offerId ? (
                <form action={addToCartAction} className="flex flex-wrap gap-2">
                  <input type="hidden" name="offer_id" value={selected.offerId} />
                  <input
                    type="hidden"
                    name="return_to"
                    value={`/product/${product.handle}?variant=${selected.id}`}
                  />
                  <label htmlFor="quantity" className="sr-only">Quantité</label>
                  <input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min={1}
                    defaultValue={1}
                    className="w-20 rounded-[6px] border border-[var(--mache-line)] px-3 py-2.5 text-md"
                  />
                  <button
                    type="submit"
                    className="flex-1 rounded-[6px] bg-[var(--mache-primary)] px-6 py-2.5 text-md font-bold text-white transition-colors hover:bg-[var(--mache-primary-dark)]"
                  >
                    Ajouter au panier
                  </button>
                </form>
              ) : (
                <p className="rounded-[8px] border border-[#f3d9a5] bg-[#fdf6e8] px-4 py-3 text-base text-[var(--mache-muted)]">
                  Aucun vendeur ne propose actuellement cette déclinaison.
                </p>
              )}
            </div>

            {/*
              Mettre de côté.

              Le cœur n'est pas un bouton d'état affiché au hasard : il
              dit si l'article EST déjà dans la liste, et l'action le
              retire dans ce cas. Un cœur qui ne changerait pas après un
              clic laisserait croire que rien ne s'est passé.

              Sans compte, il renvoie à la connexion plutôt que
              d'échouer : les favoris suivent la personne, pas le
              navigateur, et cela demande un compte.
            */}
            <div className="mt-3">
              {customer ? (
                <form action={toggleFavoriteAction}>
                  <input type="hidden" name="handle" value={product.handle} />
                  <input
                    type="hidden"
                    name="return_to"
                    value={`/product/${product.handle}`}
                  />
                  <button
                    type="submit"
                    className={`inline-flex items-center gap-2 rounded-[6px] border px-4 py-2 text-base font-semibold transition-colors ${
                      isFavorite
                        ? "border-[var(--mache-danger)] bg-[#fdeaec] text-[var(--mache-danger)]"
                        : "border-[var(--mache-line)] text-[var(--mache-muted)] hover:border-[var(--mache-danger)] hover:text-[var(--mache-danger)]"
                    }`}
                  >
                    <span aria-hidden="true">{isFavorite ? "♥" : "♡"}</span>
                    {isFavorite ? "Dans mes favoris" : "Mettre de côté"}
                  </button>
                </form>
              ) : (
                <Link
                  href={`/compte/connexion?next=${encodeURIComponent(`/product/${product.handle}`)}`}
                  className="inline-flex items-center gap-2 rounded-[6px] border border-[var(--mache-line)] px-4 py-2 text-base font-semibold text-[var(--mache-muted)] transition-colors hover:border-[var(--mache-danger)] hover:text-[var(--mache-danger)]"
                >
                  <span aria-hidden="true">♡</span>
                  Mettre de côté
                </Link>
              )}

              {query.favori && (
                <p className="mt-2 text-sm text-[var(--mache-danger)]">
                  {decodeURIComponent(String(query.favori))}
                </p>
              )}
            </div>

            {/*
              Les vendeurs concurrents. C'est ce qui distingue une
              marketplace d'une boutique : le client choisit chez qui il
              achète, et le voit.
            */}
            {offers.length > 0 && (
              <div className="mt-6 rounded-[10px] border border-[var(--mache-line)] bg-white p-4">
                <p className="text-base font-bold text-[var(--mache-text)]">
                  {offers.length > 1
                    ? `${offers.length} boutiques proposent cette déclinaison`
                    : "Vendu par"}
                </p>

                <ul className="mt-2.5 space-y-2">
                  {offers.map((offer) => (
                    <li key={offer.id} className="flex items-center justify-between gap-3">
                      {/*
                        Le nom seul ne dit pas à qui on achète. Le profil
                        déclaré distingue l'artisan du grossiste, ce qui
                        est précisément la question quand plusieurs
                        boutiques proposent le même article.
                      */}
                      <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                        <Link
                          href={`/store/${offer.sellerHandle}`}
                          className="text-base font-medium text-[var(--mache-text)] hover:underline"
                        >
                          {offer.sellerName}
                        </Link>

                        {/*
                          La vérification de MACHÉ, quand elle a été
                          accordée. C'est ici qu'elle sert le plus :
                          l'acheteur choisit entre plusieurs boutiques
                          pour le même article, et c'est le seul
                          élément de la ligne qui ne vienne pas du
                          vendeur lui-même.
                        */}
                        {offer.sellerVerified && <VerifiedBadge compact />}

                        {readSellerProfile(offer.sellerMetadata) && (
                          <SellerProfileBadge
                            profile={
                              readSellerProfile(offer.sellerMetadata) as SellerProfile
                            }
                          />
                        )}
                      </span>

                      <span className="flex shrink-0 items-center gap-3">
                      <form action={addToCartAction}>
                        <input type="hidden" name="offer_id" value={offer.id} />
                        <input type="hidden" name="quantity" value={1} />
                        <input
                          type="hidden"
                          name="return_to"
                          value={`/product/${product.handle}`}
                        />
                        <button
                          type="submit"
                          className="rounded-[4px] border border-[var(--mache-line)] px-2.5 py-1 text-sm font-semibold text-[var(--mache-text)] transition-colors hover:border-[var(--mache-primary)] hover:text-[var(--mache-primary)]"
                        >
                          Acheter ici
                        </button>
                      </form>

                        {/*
                          Acheter au prix affiché convient pour une
                          pièce. Pour deux cents, le prix se négocie —
                          c'est ainsi que se fait une grande part du
                          commerce ici, et cette demande partait
                          jusqu'ici sur WhatsApp, où ni l'acheteur ni le
                          vendeur ne la retrouvent.
                        */}
                        <Link
                          href={`/devis/nouveau?${new URLSearchParams({
                            boutique: offer.sellerId,
                            article: product.title,
                            produit: product.id,
                            ...(selected?.id
                              ? { variante: selected.id }
                              : {}),
                          }).toString()}`}
                          className="whitespace-nowrap text-sm font-semibold text-[var(--mache-primary)] hover:underline"
                        >
                          Demander un devis
                        </Link>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {product.description && (
              <div className="mt-6">
                <h2 className="text-md font-bold text-[var(--mache-text)]">
                  Description
                </h2>
                <p className="mt-2 whitespace-pre-line text-base leading-relaxed text-[var(--mache-muted)]">
                  {product.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {ratings.reviews.length > 0 && (
        <section className="container-page pb-8">
          <h2 className="mb-1 text-xl font-bold tracking-tight text-[var(--mache-text)] sm:text-2xl">
            Avis sur ce produit
          </h2>
          <RatingSummary ratings={ratings} />
          <ReviewList ratings={ratings} />
        </section>
      )}

      {related.ok && related.data.products.length > 0 && (
        <ProductRailSection
          title="Autres produits"
          href="/shop"
          products={related.data.products.filter((item) => item.id !== product.id)}
        />
      )}
    </main>
  );
}
