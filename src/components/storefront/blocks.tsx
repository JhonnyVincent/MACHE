/*
  Rendu des blocs d'une boutique personnalisée.

  Composants serveur : ils reçoivent des données déjà chargées. Un bloc
  qui irait chercher ses propres produits multiplierait les requêtes par
  le nombre de blocs posés.

  Chaque bloc se rend vide plutôt que de casser quand ses propriétés
  manquent : une mise en page est saisie par un vendeur, pas par un
  développeur, et une virgule oubliée ne doit pas rendre la boutique
  inaccessible.
*/

import Link from "next/link";
import {
  propString, propNumber, propList,
  type Block, type ProductSelection,
} from "@/lib/storefront/blocks";
import type { StoreProduct, StoreSeller } from "@/lib/medusa/catalog";
import { safeLinkHref, safeImageSrc } from "@/lib/safe-url";
import { ProductCard } from "@/components/home/rails";

type RenderContext = {
  seller: StoreSeller;
  products: StoreProduct[];
};

/* -------------------------------------------------------------------------- */

function Hero({ props, seller }: { props: Record<string, unknown>; seller: StoreSeller }) {
  const title = propString(props, "title", seller.name);
  const subtitle = propString(props, "subtitle", seller.description ?? "");
  const ctaLabel = propString(props, "ctaLabel");
  /*
    Lien posé par le vendeur : « javascript:… » s'exécuterait au clic dans
    la session du visiteur. C'est une faille stockée, déclenchée par
    n'importe quel client de la boutique.
  */
  const ctaHref = safeLinkHref(propString(props, "ctaHref", "#produits"), "#produits");

  return (
    <section className="relative overflow-hidden border-b border-[var(--mache-line)] bg-[var(--mache-dark)] text-white">
      {safeImageSrc(seller.banner) && (
        <div className="absolute inset-0 opacity-35">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={safeImageSrc(seller.banner) as string}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="container-page relative py-12 sm:py-16">
        <h1 className="max-w-3xl text-hero font-black tracking-tightest">
          {title}
        </h1>

        {subtitle && (
          <p className="mt-3 max-w-2xl text-md leading-relaxed text-white/75">
            {subtitle}
          </p>
        )}

        {ctaLabel && (
          <Link
            href={ctaHref}
            className="mt-6 inline-block rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-md font-bold text-white transition-colors hover:bg-[var(--mache-primary-strong)]"
          >
            {ctaLabel}
          </Link>
        )}
      </div>
    </section>
  );
}

function Banner({ props }: { props: Record<string, unknown> }) {
  const message = propString(props, "message");

  if (!message) return null;

  return (
    <section className="border-b border-[var(--mache-line)] bg-[var(--mache-primary-soft)]">
      <div className="container-page py-2.5 text-center text-base font-semibold text-[var(--mache-primary-dark)]">
        {message}
      </div>
    </section>
  );
}

function TextBlock({ props }: { props: Record<string, unknown> }) {
  const title = propString(props, "title");
  const body = propString(props, "body");

  if (!title && !body) return null;

  return (
    <section className="container-page py-6">
      <div className="max-w-2xl">
        {title && (
          <h2 className="text-xl font-bold tracking-tight text-[var(--mache-text)] sm:text-2xl">
            {title}
          </h2>
        )}
        {body && (
          <p className="mt-2 whitespace-pre-line text-md leading-relaxed text-[var(--mache-muted)]">
            {body}
          </p>
        )}
      </div>
    </section>
  );
}

function ImageBlock({ props }: { props: Record<string, unknown> }) {
  /* Seul http(s) : « data: » permettrait un SVG, donc du script. */
  const url = safeImageSrc(propString(props, "url"));

  if (!url) return null;

  const caption = propString(props, "caption");
  const alt = propString(props, "alt", caption);

  return (
    <section className="container-page py-6">
      <figure>
        <div className="overflow-hidden rounded-[10px] border border-[var(--mache-line)] bg-[var(--mache-bg)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={alt} loading="lazy" className="w-full object-cover" />
        </div>
        {caption && (
          <figcaption className="mt-2 text-sm text-[var(--mache-muted)]">
            {caption}
          </figcaption>
        )}
      </figure>
    </section>
  );
}

/*
  Grille de produits.

  La sélection n'invente rien : « derniers ajoutés » suit la date de
  création, « en promotion » compare le prix calculé au prix d'origine.
  Il n'y a pas de « meilleures ventes » — faute de cumul des ventes.
*/
function ProductsBlock({
  props,
  products,
}: {
  props: Record<string, unknown>;
  products: StoreProduct[];
}) {
  const title = propString(props, "title", "Nos produits");
  const selection = propString(props, "selection", "latest") as ProductSelection;
  const limit = Math.min(24, Math.max(1, propNumber(props, "limit", 12)));

  let selected = products;

  if (selection === "discounted") {
    selected = products.filter(
      (product) =>
        product.originalPrice !== null &&
        product.price !== null &&
        product.originalPrice > product.price
    );
  }

  selected = selected.slice(0, limit);

  if (selected.length === 0) {
    /*
      Un bloc « promotions » sur une boutique sans promotion en cours ne
      s'affiche pas : mieux vaut une section absente qu'un titre suivi du
      vide.
    */
    return null;
  }

  return (
    <section id="produits" className="container-page py-6">
      <h2 className="mb-3 text-xl font-bold tracking-tight text-[var(--mache-text)] sm:text-2xl">
        {title}
      </h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {selected.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

function FaqBlock({ props }: { props: Record<string, unknown> }) {
  const title = propString(props, "title", "Questions fréquentes");

  const items = propList(props, "items")
    .map((item) => {
      const entry = item as Record<string, unknown>;
      return {
        question: propString(entry, "question"),
        answer: propString(entry, "answer"),
      };
    })
    .filter((item) => item.question && item.answer);

  if (items.length === 0) return null;

  return (
    <section className="container-page py-6">
      <h2 className="mb-3 text-xl font-bold tracking-tight text-[var(--mache-text)] sm:text-2xl">
        {title}
      </h2>

      <div className="max-w-2xl divide-y divide-[var(--mache-line)] rounded-[10px] border border-[var(--mache-line)] bg-white">
        {items.map((item) => (
          <details key={item.question} className="group p-4">
            <summary className="cursor-pointer text-md font-semibold text-[var(--mache-text)]">
              {item.question}
            </summary>
            <p className="mt-2 whitespace-pre-line text-base leading-relaxed text-[var(--mache-muted)]">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

/*
  Compte à rebours.

  Rendu côté serveur, donc sans minuterie qui s'anime : la date est
  comparée à l'instant du rendu. Une fois l'échéance passée, le bloc
  disparaît de lui-même — un vendeur ne devrait pas avoir à retirer à la
  main une promotion terminée pour que sa boutique cesse de mentir.
*/
function CountdownBlock({ props }: { props: Record<string, unknown> }) {
  const title = propString(props, "title");
  const until = propString(props, "until");

  if (!title || !until) return null;

  const deadline = new Date(until);

  if (Number.isNaN(deadline.getTime())) return null;

  const remaining = deadline.getTime() - Date.now();

  if (remaining <= 0) return null;

  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor((remaining % 86_400_000) / 3_600_000);

  return (
    <section className="container-page py-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[var(--mache-line)] bg-[var(--mache-primary-soft)] p-4">
        <p className="text-md font-bold text-[var(--mache-primary-dark)]">{title}</p>
        <p className="text-md font-semibold text-[var(--mache-primary-dark)]">
          {days > 0
            ? `Encore ${days} jour${days > 1 ? "s" : ""}`
            : `Encore ${Math.max(1, hours)} heure${hours > 1 ? "s" : ""}`}
        </p>
      </div>
    </section>
  );
}

function CategoriesBlock({
  props,
  products,
}: {
  props: Record<string, unknown>;
  products: StoreProduct[];
}) {
  const title = propString(props, "title", "Nos rayons");

  /*
    Les rayons sont déduits des produits réellement en vente dans la
    boutique : une liste saisie à la main finirait par annoncer des rayons
    vides.

    Chaque rayon porte son nom et le nombre d'articles qu'il contient. Il
    n'affichait auparavant que « Voir la sélection », répété autant de fois
    qu'il y avait de rayons : une rangée de boutons identiques, entre
    lesquels le client n'avait aucun moyen de choisir.
  */
  const byCollection = new Map<string, { title: string; count: number }>();

  for (const product of products) {
    if (!product.collectionId) continue;

    const entry = byCollection.get(product.collectionId);

    if (entry) {
      entry.count += 1;
      continue;
    }

    byCollection.set(product.collectionId, {
      title: product.collectionTitle ?? "Rayon",
      count: 1,
    });
  }

  const categories = [...byCollection.entries()].sort(
    (a, b) => b[1].count - a[1].count
  );

  if (categories.length === 0) return null;

  return (
    <section className="container-page py-6">
      <h2 className="mb-3 text-xl font-bold tracking-tight text-[var(--mache-text)] sm:text-2xl">
        {title}
      </h2>
      <div className="flex flex-wrap gap-2">
        {categories.map(([id, entry]) => (
          <Link
            key={id}
            href={`/shop?collection=${encodeURIComponent(id)}`}
            className="rounded-[6px] border border-[var(--mache-line)] bg-white px-3.5 py-2 text-base font-medium text-[var(--mache-text)] hover:border-[var(--mache-primary)]"
          >
            {entry.title}
            <span className="ml-1.5 text-sm font-normal text-[var(--mache-muted)]">
              {entry.count}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

export function RenderBlock({
  block,
  context,
}: {
  block: Block;
  context: RenderContext;
}) {
  switch (block.type) {
    case "hero":
      return <Hero props={block.props} seller={context.seller} />;
    case "banner":
      return <Banner props={block.props} />;
    case "text":
      return <TextBlock props={block.props} />;
    case "image":
      return <ImageBlock props={block.props} />;
    case "products":
      return <ProductsBlock props={block.props} products={context.products} />;
    case "categories":
      return <CategoriesBlock props={block.props} products={context.products} />;
    case "faq":
      return <FaqBlock props={block.props} />;
    case "countdown":
      return <CountdownBlock props={block.props} />;
    default:
      /* Type inconnu : déjà filtré par parseLayout, mais on ne casse pas. */
      return null;
  }
}
