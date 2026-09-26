/*
  Rayons de la page d'accueil.

  Composants serveur : ils reçoivent des données déjà chargées et ne font
  aucune requête. Toute la logique de récupération vit dans
  `src/lib/medusa/home.ts`.

  Le registre visuel reprend la direction artistique de MACHÉ — rouge de
  marque réservé aux actions et aux remises, tout le reste en noir et gris.
*/

import { Link } from "next-view-transitions";
import { formatAmount } from "@/lib/format";
import { Slider } from "@/components/slider";
import type { StoreProduct } from "@/lib/medusa/catalog";

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
            className="h-full w-full object-cover transition duration-500 group-hover:scale-110 motion-reduce:transform-none"
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

/*
  LES RANGÉES SE FONT GLISSER, ELLES NE S'EMPILENT PLUS.

  Les articles et les boutiques s'affichaient en grilles figées — des
  blocs posés les uns sous les autres. Ils défilent désormais en
  rangées qu'on fait glisser, au doigt comme aux flèches : l'accueil
  montre plus de choses en moins de hauteur, et invite à parcourir.
*/
export function ProductRailSection({
  title,
  subtitle,
  href,
  linkLabel,
  products,
  autoplayMs = 0,
  spotlight = false,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  products: StoreProduct[];
  /* Défilement automatique, en millisecondes ; 0 pour aucun. */
  autoplayMs?: number;
  /* La carte survolée grandit et passe devant, les autres s'estompent. */
  spotlight?: boolean;
}) {
  if (products.length === 0) return null;

  return (
    <section className="mache-reveal container-page py-5">
      <RailHeader title={title} subtitle={subtitle} href={href} linkLabel={linkLabel} />

      <Slider
        label={title}
        autoplayMs={autoplayMs}
        trackClassName={spotlight ? "mache-spotlight py-5" : ""}
      >
        {products.slice(0, 12).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </Slider>
    </section>
  );
}
