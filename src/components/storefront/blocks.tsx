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
  const ctaHref = propString(props, "ctaHref", "#produits");

  return (
    <section className="relative overflow-hidden border-b border-[var(--mache-line)] bg-[var(--mache-dark)] text-white">
      {seller.banner && (
        <div className="absolute inset-0 opacity-35">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={seller.banner} alt="" className="h-full w-full object-cover" />
        </div>
      )}

      <div className="container-page relative py-12 sm:py-16">
        <h1 className="max-w-3xl text-[clamp(26px,4vw,42px)] font-[900] leading-[1.08] tracking-[-0.02em]">
          {title}
        </h1>

        {subtitle && (
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-white/75">
            {subtitle}
          </p>
        )}

        {ctaLabel && (
          <Link
            href={ctaHref}
            className="mt-6 inline-block rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-[var(--mache-primary-strong)]"
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
      <div className="container-page py-2.5 text-center text-[13.5px] font-semibold text-[var(--mache-primary-dark)]">
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
          <h2 className="text-[19px] font-bold tracking-[-0.01em] text-[var(--mache-text)] sm:text-[22px]">
            {title}
          </h2>
        )}
        {body && (
          <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-[var(--mache-muted)]">
            {body}
          </p>
        )}
      </div>
    </section>
  );
}

function ImageBlock({ props }: { props: Record<string, unknown> }) {
  const url = propString(props, "url");

  if (!/^https?:\/\//i.test(url)) return null;

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
          <figcaption className="mt-2 text-[12.5px] text-[var(--mache-muted)]">
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
      <h2 className="mb-3 text-[19px] font-bold tracking-[-0.01em] text-[var(--mache-text)] sm:text-[22px]">
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
      <h2 className="mb-3 text-[19px] font-bold tracking-[-0.01em] text-[var(--mache-text)] sm:text-[22px]">
        {title}
      </h2>

      <div className="max-w-2xl divide-y divide-[var(--mache-line)] rounded-[10px] border border-[var(--mache-line)] bg-white">
        {items.map((item) => (
          <details key={item.question} className="group p-4">
            <summary className="cursor-pointer text-[14px] font-semibold text-[var(--mache-text)]">
              {item.question}
            </summary>
            <p className="mt-2 whitespace-pre-line text-[13.5px] leading-relaxed text-[var(--mache-muted)]">
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
        <p className="text-[15px] font-bold text-[var(--mache-primary-dark)]">{title}</p>
        <p className="text-[14px] font-semibold text-[var(--mache-primary-dark)]">
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
  */
  const categories = [...new Set(products.map((p) => p.collectionId).filter(Boolean))];

  if (categories.length === 0) return null;

  return (
    <section className="container-page py-6">
      <h2 className="mb-3 text-[19px] font-bold tracking-[-0.01em] text-[var(--mache-text)] sm:text-[22px]">
        {title}
      </h2>
      <div className="flex flex-wrap gap-2">
        {categories.map((id) => (
          <Link
            key={String(id)}
            href={`/shop?collection=${encodeURIComponent(String(id))}`}
            className="rounded-[6px] border border-[var(--mache-line)] bg-white px-3.5 py-2 text-[13px] font-medium text-[var(--mache-text)] hover:border-[var(--mache-primary)]"
          >
            Voir la sélection
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
