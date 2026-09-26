/*
  LES SECTIONS DE L'ACCUEIL, ENTRE LE GRAND BANDEAU ET LE PIED DE PAGE.
*/

import { Link } from "next-view-transitions";
import { formatAmount } from "@/lib/format";
import { StaggerIn } from "@/components/anim/stagger-in";
import type { StoreProduct, StoreSeller } from "@/lib/medusa/catalog";
import type { CategoryTile } from "@/lib/medusa/home";

/*
  SUR MACHÉ EN CE MOMENT — des produits, pas des cases.

  Une sélection qui tourne entre les vendeurs, chacun à son tour, et qui
  change toutes les heures (voir src/lib/rotation.ts). La section le dit
  telle qu'elle est : ce n'est ni un classement ni une sélection
  « coup de cœur ».
*/
export function Spotlight({ products }: { products: StoreProduct[] }) {
  if (products.length === 0) return null;

  return (
    <section className="mache-reveal container-page py-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--mache-text)] sm:text-2xl">
            Sur MACHÉ en ce moment
          </h2>
          <p className="mt-1 text-sm text-[var(--mache-muted)]">
            Chaque boutique à son tour : la sélection change toutes les heures.
          </p>
        </div>
        <Link href="/shop" className="text-base font-semibold text-[var(--mache-primary)] hover:underline">
          Tout le catalogue →
        </Link>
      </div>

      {/* Les produits entrent en cascade à leur arrivée à l'écran (Motion, version mini). */}
      <StaggerIn className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {products.map((product) => (
          <li key={product.id}>
            <Link href={`/product/${product.handle ?? product.id}`} className="group block">
              <div className="aspect-square overflow-hidden rounded-[10px] bg-[var(--mache-bg-2)]">
                {product.thumbnail && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={product.thumbnail}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110 motion-reduce:transform-none"
                  />
                )}
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-[var(--mache-text)] group-hover:underline">
                {product.title}
              </p>
              {product.price !== null && (
                <p className="mt-0.5 text-base font-bold text-[var(--mache-text)]">
                  {formatAmount(product.price, product.currency)}
                </p>
              )}
            </Link>
          </li>
        ))}
      </StaggerIn>
    </section>
  );
}

/*
  CATÉGORIES : cinq rayons et un « ➕ ».

  Les cinq rayons viennent des favoris du client quand il en a — ce
  qu'il a choisi de nous dire — et sinon d'une liste de départ, la même
  pour tout le monde. Le « ➕ » mène au catalogue complet, où l'on
  filtre, trie par nouveauté, change de rayon.

  Chaque tuile montre de vraies photos d'articles du rayon ; un rayon
  encore vide montre son icône, jamais une image décorative.
*/
export function CategoryTiles({ tiles, fromFavorites }: { tiles: CategoryTile[]; fromFavorites: boolean }) {
  if (tiles.length === 0) return null;

  return (
    <section className="mache-reveal container-page py-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold tracking-tight text-[var(--mache-text)] sm:text-2xl">Catégories</h2>
        {fromFavorites && (
          <p className="mt-1 text-sm text-[var(--mache-muted)]">Choisies d&apos;après vos favoris</p>
        )}
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tiles.map((tile) => (
          <li key={tile.handle}>
            <Link
              href={tile.href}
              className="group relative block aspect-[4/3] overflow-hidden rounded-[12px] border border-[var(--mache-line)] bg-[var(--mache-white)] transition-shadow duration-300 hover:shadow-[0_10px_28px_rgba(16,24,32,0.14)]"
            >
              {tile.images.length > 0 ? (
                <div className={`grid h-full w-full gap-0.5 ${tile.images.length > 1 ? "grid-cols-2" : ""}`}>
                  {tile.images.slice(0, 4).map((src) => (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      key={src}
                      src={src}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 motion-reduce:transform-none"
                    />
                  ))}
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[var(--mache-bg)]">
                  <span className="text-6xl transition-transform duration-300 group-hover:scale-125 motion-reduce:transform-none" aria-hidden="true">
                    {tile.icon}
                  </span>
                </div>
              )}

              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-8 text-lg font-bold text-white">
                {tile.name}
              </span>
            </Link>
          </li>
        ))}

        <li>
          <Link
            href="/shop"
            className="group flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-[12px] border-2 border-dashed border-[var(--mache-line)] bg-[var(--mache-white)] text-center transition-colors hover:border-[var(--mache-primary)]"
          >
            <span className="text-5xl text-[var(--mache-primary)] transition-transform duration-300 group-hover:rotate-90 motion-reduce:transform-none" aria-hidden="true">
              ➕
            </span>
            <span className="text-base font-bold text-[var(--mache-text)]">Tous les rayons</span>
            <span className="px-4 text-sm text-[var(--mache-muted)]">Filtrer, trier par nouveauté, changer de rayon</span>
          </Link>
        </li>
      </ul>
    </section>
  );
}

/*
  NOS MARQUES, en défilement continu de droite à gauche.

  Ce sont les boutiques qui se DÉCLARENT marque officielle : leur
  déclaration, pas un contrôle de MACHÉ — le sous-titre le dit. Aucune :
  pas de section.

  La liste est doublée pour que la boucle se referme sans à-coup ; la
  copie est cachée aux lecteurs d'écran.
*/
export function BrandsMarquee({ brands }: { brands: StoreSeller[] }) {
  if (brands.length === 0) return null;

  const copies = Math.max(2, Math.ceil(8 / brands.length) * 2);

  return (
    <section className="mache-reveal py-6">
      <div className="container-page mb-4">
        <h2 className="text-xl font-bold tracking-tight text-[var(--mache-text)] sm:text-2xl">Nos marques</h2>
        <p className="mt-1 text-sm text-[var(--mache-muted)]">Les boutiques qui se présentent comme marque officielle</p>
      </div>

      <div className="overflow-hidden">
        <ul className="mache-marquee flex w-max gap-4">
          {Array.from({ length: copies }).flatMap((_, copy) =>
            brands.map((brand) => (
              <li key={`${copy}-${brand.id}`} aria-hidden={copy > 0 ? true : undefined}>
                <Link
                  href={`/store/${brand.handle}`}
                  tabIndex={copy > 0 ? -1 : undefined}
                  className="flex items-center gap-3 rounded-full border border-[var(--mache-line)] bg-[var(--mache-white)] px-5 py-3 transition-transform hover:scale-105 motion-reduce:transform-none"
                >
                  <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[var(--mache-bg)] text-sm font-black">
                    {brand.logo ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={brand.logo} alt="" className="h-full w-full object-cover" />
                    ) : (
                      brand.name.slice(0, 2).toUpperCase()
                    )}
                  </span>
                  <span className="whitespace-nowrap text-base font-bold text-[var(--mache-text)]">{brand.name}</span>
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>
    </section>
  );
}

/*
  DEVENEZ VENDEUR CHEZ MACHÉ — en bas de page.

  La phrase « profitez d'un catalogue déjà visité » a été retirée :
  MACHÉ démarre, et promettre de l'audience à un vendeur avant d'en
  avoir, c'est lui vendre ce qu'on n'a pas.
*/
export function SellCta() {
  return (
    <section className="mache-reveal container-page py-5">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[10px] bg-[var(--mache-primary)] p-6 text-white">
        <div>
          <h2 className="text-xl font-black tracking-tight">Devenez vendeur chez MACHÉ</h2>
          <p className="mt-1.5 max-w-xl text-base leading-relaxed text-white/85">
            Vous vendez quelque chose ? Ouvrez votre boutique et gardez votre marque.
            Particuliers, entreprises, fournisseurs et marques officielles.
          </p>
        </div>

        <Link
          href="/sell"
          className="rounded-[6px] bg-white px-5 py-2.5 text-md font-bold text-[var(--mache-primary)] transition-transform hover:scale-105 motion-reduce:transform-none"
        >
          Commencer à vendre
        </Link>
      </div>
    </section>
  );
}
