/*
  Rayons de la page d'accueil.

  Composants serveur : ils reçoivent des données déjà chargées et ne font
  aucune requête. Toute la logique de récupération vit dans
  `src/lib/medusa/home.ts`.

  Le registre visuel reprend la direction artistique de MACHÉ — rouge de
  marque réservé aux actions et aux remises, tout le reste en noir et gris.
*/

import Link from "next/link";
import { VerifiedBadge } from "@/components/verified-badge";
import { formatAmount } from "@/lib/format";
import type { CategoryTile } from "@/lib/medusa/home";
import type {
  StoreProduct,
  StoreSeller,
  StoreCategory,
  StoreCollection,
} from "@/lib/medusa/catalog";

/* -------------------------------------------------------------------------- */
/* En-tête de rayon                                                           */
/* -------------------------------------------------------------------------- */

function RailHeader({
  title,
  subtitle,
  href,
  linkLabel = "Tout voir",
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 className="text-xl font-bold leading-tight tracking-tight text-[var(--mache-text)] sm:text-2xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-sm text-[var(--mache-muted)]">{subtitle}</p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="shrink-0 text-base font-semibold text-[var(--mache-primary)] hover:underline"
        >
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Carte produit                                                              */
/* -------------------------------------------------------------------------- */

/*
  La carte mène à la fiche produit et n'ajoute pas au panier.

  Le panier de MACHÉ vit encore côté navigateur, avec un instantané du
  prix. Medusa gère les paniers côté serveur : brancher un bouton
  « ajouter » sur l'ancien panier ferait cohabiter deux calculs de total,
  donc deux vérités sur ce que paie le client. La bascule du panier est
  une étape à part entière.
*/
export function ProductCard({ product }: { product: StoreProduct }) {
  const hasDiscount =
    product.originalPrice !== null &&
    product.price !== null &&
    product.originalPrice > product.price;

  const discountPercent = hasDiscount
    ? Math.round((1 - (product.price as number) / (product.originalPrice as number)) * 100)
    : 0;

  return (
    <Link
      href={`/product/${product.handle}`}
      className="group flex h-full flex-col overflow-hidden rounded-[10px] border border-[var(--mache-line)] bg-[var(--mache-white)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(16,24,32,0.12)] motion-reduce:transform-none motion-reduce:transition-none"
    >
      <div className="relative aspect-square overflow-hidden bg-[var(--mache-bg)]">
        {product.thumbnail ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={product.thumbnail}
            alt={product.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-[var(--mache-light)]">
            Sans image
          </div>
        )}

        {hasDiscount && (
          <span className="absolute left-2 top-2 rounded-[3px] bg-[var(--mache-primary)] px-1.5 py-0.5 text-xs font-bold text-white">
            −{discountPercent} %
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 text-base font-medium leading-snug text-[var(--mache-text)] group-hover:underline">
          {product.title}
        </h3>

        <div className="mt-auto pt-2">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-lg font-black leading-none tracking-tighter text-[var(--mache-text)]">
              {formatAmount(product.price, product.currency)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-[var(--mache-light)] line-through">
                {formatAmount(product.originalPrice, product.currency)}
              </span>
            )}
          </div>

          {product.variantCount > 1 && (
            <p className="mt-1 text-xs text-[var(--mache-muted)]">
              {product.variantCount} variantes
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

export function ProductRailSection({
  title,
  subtitle,
  href,
  products,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  products: StoreProduct[];
}) {
  if (products.length === 0) return null;

  return (
    <section className="container-page py-5">
      <RailHeader title={title} subtitle={subtitle} href={href} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {products.slice(0, 12).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Boutiques                                                                  */
/* -------------------------------------------------------------------------- */

export function SellerRailSection({
  title,
  subtitle,
  sellers,
}: {
  title: string;
  subtitle?: string;
  sellers: StoreSeller[];
}) {
  if (sellers.length === 0) return null;

  return (
    <section className="container-page py-5">
      <RailHeader title={title} subtitle={subtitle} href="/shop" linkLabel="Toutes les boutiques" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {sellers.map((seller) => (
          <Link
            key={seller.id}
            href={`/store/${seller.handle}`}
            className="group overflow-hidden rounded-[10px] border border-[var(--mache-line)] bg-[var(--mache-white)] transition-shadow hover:shadow-[0_6px_20px_rgba(16,24,32,0.10)]"
          >
            <div className="relative h-20 bg-[var(--mache-bg)]">
              {seller.banner && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={seller.banner} alt="" loading="lazy" className="h-full w-full object-cover" />
              )}
            </div>

            <div className="flex items-center gap-2.5 p-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--mache-line)] bg-white text-sm font-bold text-[var(--mache-muted)]">
                {seller.logo ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={seller.logo} alt="" loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  seller.name.slice(0, 2).toUpperCase()
                )}
              </span>

              <span className="min-w-0">
                <span className="block truncate text-base font-semibold text-[var(--mache-text)] group-hover:underline">
                  {seller.name}
                </span>
                {/*
                  « Premium » laissait croire à un niveau de service
                  acheté. Le champ dit autre chose : MACHÉ a contrôlé
                  les documents de cette entreprise.
                */}
                {seller.isPremium && (
                  <span className="mt-0.5 inline-block">
                    <VerifiedBadge compact />
                  </span>
                )}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Catégories et collections                                                  */
export function CollectionRailSection({ collections }: { collections: StoreCollection[] }) {
  if (collections.length === 0) return null;

  return (
    <section className="container-page py-5">
      <RailHeader title="Collections" subtitle="Sélections constituées par MACHÉ et ses vendeurs" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {collections.map((collection) => (
          <Link
            key={collection.id}
            href={`/shop?collection=${encodeURIComponent(collection.handle)}`}
            className="rounded-[8px] border border-[var(--mache-line)] bg-[var(--mache-white)] p-3 text-base font-semibold text-[var(--mache-text)] transition-colors hover:border-[var(--mache-primary)]"
          >
            {collection.title}
          </Link>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* La mosaïque des rayons                                                      */
/* -------------------------------------------------------------------------- */

/*
  CE QUI MEUBLE VRAIMENT L'ACCUEIL D'UNE PLACE DE MARCHÉ.

  Chez Amazon ou Cdiscount, ce ne sont pas des mots : ce sont des
  PHOTOS de produits, rangées par rayon. Une bande de liens texte, si
  bien écrite soit-elle, donne l'impression d'un site vide — même quand
  le catalogue ne l'est pas.

  MACHÉ n'a aucune photo à lui : les visuels de stock ont été retirés
  volontairement, et en remettre serait décorer avec des articles qui
  n'existent pas. Mais les vendeurs, eux, photographient les leurs. Une
  tuile emprunte donc quatre vraies vignettes au rayon qu'elle annonce.

  UN RAYON VIDE NE MENT PAS

  Sans produit, pas de vignette : la tuile affiche son nom et le dit.
  C'est le seul traitement honnête, et il a un avantage — le jour où un
  vendeur y dépose son premier article, la tuile se remplit toute
  seule.

  Les rayons GARNIS passent devant. Un accueil qui ouvre sur quatre
  cases vides annonce un site vide ; les mêmes cases reléguées plus bas
  annoncent un catalogue qui commence.
*/
export function CategoryMosaicSection({ tiles }: { tiles: CategoryTile[] }) {
  if (tiles.length === 0) return null;

  const ordered = [...tiles].sort(
    (a, b) => b.thumbnails.length - a.thumbnails.length || b.count - a.count
  );

  return (
    <section className="mache-reveal container-page py-5">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 className="text-xl font-bold tracking-tight text-[var(--mache-text)] sm:text-2xl">
          Parcourir les rayons
        </h2>

        <Link
          href="/shop"
          className="text-sm font-semibold text-[var(--mache-primary)] hover:underline"
        >
          Tout le catalogue
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ordered.map((tile) => (
          <Link
            key={tile.id}
            href={`/shop?category=${encodeURIComponent(tile.handle)}`}
            className="group flex flex-col rounded-[10px] border border-[var(--mache-line)] bg-[var(--mache-white)] p-4 transition-colors hover:border-[var(--mache-primary)]"
          >
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-md font-bold leading-snug text-[var(--mache-text)]">
                {tile.name}
              </h3>
              <span
                aria-hidden="true"
                className="text-[var(--mache-muted)] transition-transform group-hover:translate-x-0.5"
              >
                ›
              </span>
            </div>

            {tile.thumbnails.length > 0 ? (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {tile.thumbnails.map((src, index) => (
                  <div
                    key={`${tile.id}-${index}`}
                    className="aspect-square overflow-hidden rounded-[6px] bg-[var(--mache-bg-2)]"
                  >
                    {/*
                      `alt` vide et `aria-hidden` : ces vignettes
                      décorent le nom du rayon, qui est juste au-dessus.
                      Les décrire ferait entendre quatre fois la même
                      chose à qui navigue au clavier ou à la voix.
                    */}
                    <img
                      src={src}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 flex flex-1 items-center rounded-[6px] border border-dashed border-[var(--mache-line)] px-3 py-5">
                <p className="text-sm leading-relaxed text-[var(--mache-muted)]">
                  Aucun article pour l&apos;instant. Ce rayon se remplira dès
                  qu&apos;un vendeur y déposera le sien.
                </p>
              </div>
            )}

            {tile.count > 0 && (
              <p className="tnum mt-3 text-sm text-[var(--mache-muted)]">
                {tile.count} article{tile.count > 1 ? "s" : ""}
              </p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
