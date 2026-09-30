/*
  RÉFÉRENCEMENT ET APERÇUS DE PARTAGE.

  Deux publics lisent le <head> d'une page sans jamais la voir :

  - Google, qui affiche le titre et la description dans ses résultats ;
  - WhatsApp, Facebook, Messenger, qui fabriquent l'aperçu d'un lien
    collé dans une conversation (photo, titre, prix).

  En Haïti, un produit se vend d'abord en se partageant sur WhatsApp. Un
  lien qui arrive sans photo ni prix, avec pour seul titre « MACHE »,
  ressemble à un lien douteux : personne ne clique.

  Ce module ne dit rien qui ne soit sur la page elle-même : le titre,
  la description et le prix viennent du catalogue.
*/

import type { Metadata } from "next";
import { formatAmount } from "./format";

export const SITE_NAME = "MACHE";

export const SITE_DESCRIPTION =
  "Marketplace haïtienne : boutiques indépendantes, artisans, marques et fournisseurs d'Haïti et de la diaspora, réunis au même endroit.";

/* L'image d'aperçu quand une page n'a pas de photo à elle. */
export const DEFAULT_SHARE_IMAGE = "/images/partage-mache.jpg";

/*
  L'adresse publique du site, pour les liens absolus qu'exigent les
  aperçus et le plan du site.

  NEXT_PUBLIC_SITE_URL si on la fixe (le jour d'un nom de domaine) ;
  sinon RENDER_EXTERNAL_URL, que Render pose de lui-même sur chaque
  service ; sinon l'adresse locale.
*/
export function siteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    "http://localhost:3000";

  return raw.replace(/\/+$/, "");
}

/*
  Une description propre : sans balise, sans blancs répétés, et coupée
  au dernier mot entier avant la limite que Google affiche.
*/
export function cleanDescription(text: string | null | undefined, max = 160): string | null {
  if (!text) return null;

  const flat = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

  if (!flat) return null;
  if (flat.length <= max) return flat;

  const cut = flat.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");

  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

/* Une adresse d'image utilisable dans un aperçu : absolue, en https ou http. */
function absoluteImage(src: string | null | undefined): string | null {
  if (!src) return null;
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith("/")) return `${siteUrl()}${src}`;
  return null;
}

type PageSeo = {
  title: string;
  description?: string | null;
  path: string;
  image?: string | null;
  imageAlt?: string;
  noIndex?: boolean;
};

/* Les métadonnées d'une page ordinaire. */
export function pageMetadata({ title, description, path, image, imageAlt, noIndex }: PageSeo): Metadata {
  const desc = cleanDescription(description) ?? SITE_DESCRIPTION;
  const img = absoluteImage(image) ?? absoluteImage(DEFAULT_SHARE_IMAGE)!;

  return {
    title,
    description: desc,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "fr_FR",
      title: `${title} | ${SITE_NAME}`,
      description: desc,
      url: path,
      images: [{ url: img, alt: imageAlt ?? title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description: desc,
      images: [img],
    },
    /*
      Toujours explicite : une page publique posée sous /dashboard
      hériterait sinon du « noindex » des espaces connectés.
    */
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
  };
}

/*
  Une section privée (un layout) : son titre par défaut, et le modèle
  « … | MACHE » transmis à ses pages. Next n'hérite pas du modèle au-delà
  d'un layout qui pose son propre titre : il faut le redonner ici.
*/
export function privateSectionMetadata(title: string): Metadata {
  return {
    /* Le titre par défaut reçoit déjà le modèle du parent : pas de suffixe ici. */
    title: { default: title, template: `%s | ${SITE_NAME}` },
    robots: { index: false, follow: false },
  };
}

/* Les pages privées : un titre, et rien pour les moteurs de recherche. */
export function privateMetadata(title: string): Metadata {
  return { title, robots: { index: false, follow: false } };
}

type ProductSeo = {
  handle: string;
  title: string;
  description: string | null;
  subtitle: string | null;
  price: number | null;
  currency: string | null;
  thumbnail: string | null;
  images: string[];
};

/*
  La fiche produit : le prix fait partie du titre de l'aperçu, parce que
  c'est la première question de celui qui reçoit le lien.
*/
export function productMetadata(product: ProductSeo): Metadata {
  const price = product.price !== null ? formatAmount(product.price, product.currency) : null;
  const title = price ? `${product.title} — ${price}` : product.title;

  const description =
    cleanDescription(product.description) ??
    cleanDescription(product.subtitle) ??
    `${product.title}, en vente sur MACHE, la marketplace haïtienne.`;

  return pageMetadata({
    title,
    description,
    path: `/product/${product.handle}`,
    image: product.thumbnail ?? product.images[0] ?? null,
    imageAlt: product.title,
  });
}

type StoreSeo = {
  handle: string;
  name: string;
  description: string | null;
  logo: string | null;
  banner: string | null;
};

export function storeMetadata(seller: StoreSeo): Metadata {
  return pageMetadata({
    title: `${seller.name} — boutique`,
    description:
      cleanDescription(seller.description) ??
      `Les produits de ${seller.name}, boutique sur MACHE, la marketplace haïtienne.`,
    path: `/store/${seller.handle}`,
    image: seller.banner ?? seller.logo,
    imageAlt: seller.name,
  });
}
