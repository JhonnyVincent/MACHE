/*
  Rayons de la page d'accueil.

  Composants serveur : ils reçoivent des données déjà chargées et ne font
  aucune requête. Toute la logique de récupération vit dans
  `src/lib/medusa/home.ts`.

  Le registre visuel reprend la direction artistique de MACHÉ — rouge de
  marque réservé aux actions et aux remises, tout le reste en noir et gris.
*/

import Link from "next/link";
import {
  formatAmount,
  type StoreProduct,
  type StoreSeller,
  type StoreCategory,
  type StoreCollection,
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
        <h2 className="text-[19px] font-bold leading-tight tracking-[-0.01em] text-[var(--mache-text)] sm:text-[22px]">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-[12.5px] text-[var(--mache-muted)]">{subtitle}</p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="shrink-0 text-[13px] font-semibold text-[var(--mache-primary)] hover:underline"
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
      className="group flex h-full flex-col overflow-hidden rounded-[10px] border border-[var(--mache-line)] bg-[var(--mache-white)] transition-shadow hover:shadow-[0_6px_20px_rgba(16,24,32,0.10)]"
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
          <div className="flex h-full items-center justify-center text-[11.5px] text-[var(--mache-light)]">
            Sans image
          </div>
        )}

        {hasDiscount && (
          <span className="absolute left-2 top-2 rounded-[3px] bg-[var(--mache-primary)] px-1.5 py-0.5 text-[11px] font-bold text-white">
            −{discountPercent} %
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 text-[13.5px] font-medium leading-snug text-[var(--mache-text)] group-hover:underline">
          {product.title}
        </h3>

        <div className="mt-auto pt-2">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-[17px] font-[900] leading-none tracking-[-0.02em] text-[var(--mache-text)]">
              {formatAmount(product.price, product.currency)}
            </span>
            {hasDiscount && (
              <span className="text-[12px] text-[var(--mache-light)] line-through">
                {formatAmount(product.originalPrice, product.currency)}
              </span>
            )}
          </div>

          {product.variantCount > 1 && (
            <p className="mt-1 text-[11.5px] text-[var(--mache-muted)]">
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
              <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--mache-line)] bg-white text-[12px] font-bold text-[var(--mache-muted)]">
                {seller.logo ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={seller.logo} alt="" loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  seller.name.slice(0, 2).toUpperCase()
                )}
              </span>

              <span className="min-w-0">
                <span className="block truncate text-[13.5px] font-semibold text-[var(--mache-text)] group-hover:underline">
                  {seller.name}
                </span>
                {seller.isPremium && (
                  <span className="mt-0.5 inline-block rounded-[3px] bg-[var(--mache-gold-soft)] px-1.5 py-px text-[10px] font-bold text-[var(--mache-gold)]">
                    Premium
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
/* -------------------------------------------------------------------------- */

export function CategoryRailSection({ categories }: { categories: StoreCategory[] }) {
  if (categories.length === 0) return null;

  return (
    <section className="container-page py-5">
      <RailHeader
        title="Parcourir les rayons"
        subtitle="Les catégories réellement ouvertes sur la marketplace"
      />

      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/shop?category=${encodeURIComponent(category.handle)}`}
            className="rounded-[6px] border border-[var(--mache-line)] bg-[var(--mache-white)] px-3.5 py-2 text-[13px] font-medium text-[var(--mache-text)] transition-colors hover:border-[var(--mache-primary)] hover:text-[var(--mache-primary)]"
          >
            {category.name}
          </Link>
        ))}
      </div>
    </section>
  );
}

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
            className="rounded-[8px] border border-[var(--mache-line)] bg-[var(--mache-white)] p-3 text-[13px] font-semibold text-[var(--mache-text)] transition-colors hover:border-[var(--mache-primary)]"
          >
            {collection.title}
          </Link>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* États honnêtes                                                             */
/* -------------------------------------------------------------------------- */

/*
  Les rayons annoncés mais pas encore mesurables. Les montrer vides serait
  malhonnête ; les cacher ferait croire qu'ils n'existent pas au programme.
  On dit ce qui manque, précisément.
*/
export function PendingRailsSection({
  pendingRails,
}: {
  pendingRails: { title: string; missing: string }[];
}) {
  if (pendingRails.length === 0) return null;

  return (
    <section className="container-page py-5">
      <div className="rounded-[10px] border border-dashed border-[var(--mache-line)] bg-[var(--mache-bg)] p-4">
        <h2 className="text-[14px] font-bold text-[var(--mache-text)]">
          Rayons à venir
        </h2>
        <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--mache-muted)]">
          Ces classements existent au programme de MACHÉ. Ils ne sont pas
          affichés tant que la donnée qui les justifie n&apos;existe pas :
          un classement inventé tromperait les clients autant que les
          vendeurs qui s&apos;y croiraient mis en avant.
        </p>

        <ul className="mt-3 space-y-1.5">
          {pendingRails.map((rail) => (
            <li key={rail.title} className="text-[12.5px] leading-relaxed">
              <span className="font-semibold text-[var(--mache-text)]">{rail.title}</span>
              <span className="text-[var(--mache-muted)]"> — demande {rail.missing}.</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function BackendNotice({
  configured,
  problems,
}: {
  configured: boolean;
  problems: string[];
}) {
  if (problems.length === 0) return null;

  return (
    <section className="container-page py-5">
      <div className="rounded-[10px] border border-[#f3d9a5] bg-[#fdf6e8] p-4">
        <h2 className="text-[14px] font-bold text-[var(--mache-text)]">
          {configured
            ? "Le catalogue ne répond pas"
            : "Backend commerce non configuré"}
        </h2>
        <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--mache-muted)]">
          {configured
            ? "Les rayons ci-dessous sont incomplets. Voici ce que le backend a répondu :"
            : "Le catalogue est servi par le backend commerce, dont l'adresse n'est pas renseignée. Ce n'est pas une marketplace sans vendeurs : c'est une connexion absente."}
        </p>

        <ul className="mt-2 space-y-1">
          {problems.map((problem) => (
            <li key={problem} className="text-[12px] text-[var(--mache-muted)]">
              {problem}
            </li>
          ))}
        </ul>

        {/*
          Un message qui nomme le problème sans dire quoi en faire oblige à
          chercher ailleurs. Les trois variables sont donc listées ici.
        */}
        {!configured && (
          <div className="mt-3 border-t border-black/10 pt-3">
            <p className="text-[12px] font-semibold text-[var(--mache-text)]">
              Pour rétablir le catalogue
            </p>
            <ol className="mt-1.5 space-y-1 text-[12px] leading-relaxed text-[var(--mache-muted)]">
              <li>1. Déployer le dossier <code>backend/</code> (le fichier <code>render.yaml</code> est prêt).</li>
              <li>
                2. Renseigner dans l&apos;hébergeur du site :{" "}
                <code>NEXT_PUBLIC_MEDUSA_BACKEND_URL</code>,{" "}
                <code>NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY</code>,{" "}
                <code>NEXT_PUBLIC_MEDUSA_REGION_ID</code>.
              </li>
              <li>3. Redéployer : ces valeurs sont lues au moment de la construction.</li>
            </ol>
          </div>
        )}
      </div>
    </section>
  );
}
