/*
  Catalogue du storefront, alimenté par Medusa.

  Ce fichier traduit les réponses de l'API en objets stables pour les
  pages. Cette traduction n'est pas un détail : sans elle, la forme exacte
  des réponses de Medusa se répandrait dans chaque composant, et la
  moindre évolution de l'API imposerait de tout reprendre.

  Les prix

  Medusa renvoie un montant déjà calculé pour la région demandée, taxes et
  promotions comprises selon la configuration. Le storefront ne recalcule
  rien : il affiche `calculated_amount`. Un prix recalculé côté client est
  un prix faux dès la première promotion.
*/

import { medusaFetch, type MedusaResult } from "./client";
import { medusaRegionId } from "./config";

export type StoreProduct = {
  id: string;
  handle: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  thumbnail: string | null;
  images: string[];
  /* Montant dans l'unité de la devise, ou null si non calculable. */
  price: number | null;
  /* Prix barré, uniquement s'il est réellement supérieur au prix payé. */
  originalPrice: number | null;
  currency: string | null;
  collectionId: string | null;
  createdAt: string | null;
  variantCount: number;
};

export type StoreSeller = {
  id: string;
  handle: string;
  name: string;
  description: string | null;
  logo: string | null;
  banner: string | null;
  isPremium: boolean;
};

export type StoreCollection = {
  id: string;
  handle: string;
  title: string;
};

export type StoreCategory = {
  id: string;
  handle: string;
  name: string;
  description: string | null;
};

type RawProduct = Record<string, unknown>;

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function firstVariantPrice(raw: RawProduct) {
  const variants = Array.isArray(raw.variants) ? raw.variants : [];

  for (const variant of variants) {
    const calculated = (variant as Record<string, unknown>)?.calculated_price as
      | Record<string, unknown>
      | undefined;

    if (!calculated) continue;

    const amount = Number(calculated.calculated_amount);
    const original = Number(calculated.original_amount);
    const currency = text(calculated.currency_code);

    if (!Number.isFinite(amount)) continue;

    return {
      price: amount,
      /*
        Le prix barré n'est retenu que s'il est strictement supérieur :
        Medusa renvoie souvent le même montant des deux côtés, et
        l'afficher barré inventerait une remise de zéro pour cent.
      */
      originalPrice: Number.isFinite(original) && original > amount ? original : null,
      currency,
    };
  }

  return { price: null, originalPrice: null, currency: null };
}

function mapProduct(raw: RawProduct): StoreProduct {
  const { price, originalPrice, currency } = firstVariantPrice(raw);

  const images = Array.isArray(raw.images)
    ? (raw.images as Record<string, unknown>[])
        .map((image) => text(image?.url))
        .filter((url): url is string => Boolean(url))
    : [];

  const thumbnail = text(raw.thumbnail) ?? images[0] ?? null;

  return {
    id: String(raw.id),
    handle: text(raw.handle) ?? String(raw.id),
    title: text(raw.title) ?? "Produit",
    subtitle: text(raw.subtitle),
    description: text(raw.description),
    thumbnail,
    images: images.length > 0 ? images : thumbnail ? [thumbnail] : [],
    price,
    originalPrice,
    currency,
    collectionId: text(raw.collection_id),
    createdAt: text(raw.created_at),
    variantCount: Array.isArray(raw.variants) ? raw.variants.length : 0,
  };
}

function mapSeller(raw: RawProduct): StoreSeller {
  return {
    id: String(raw.id),
    handle: text(raw.handle) ?? String(raw.id),
    name: text(raw.name) ?? "Boutique",
    description: text(raw.description),
    logo: text(raw.logo),
    banner: text(raw.banner),
    isPremium: Boolean(raw.is_premium),
  };
}

export type ProductQuery = {
  limit?: number;
  offset?: number;
  /* Recherche plein texte, déléguée au backend. */
  q?: string;
  collectionId?: string;
  categoryId?: string;
  sellerId?: string;
  /* `created_at` décroissant pour les nouveautés, etc. */
  order?: string;
};

export async function fetchProducts(
  query: ProductQuery = {}
): Promise<MedusaResult<{ products: StoreProduct[]; count: number }>> {
  const result = await medusaFetch<{ products: RawProduct[]; count: number }>(
    "/store/products",
    {
      limit: query.limit ?? 24,
      offset: query.offset ?? 0,
      q: query.q,
      collection_id: query.collectionId,
      category_id: query.categoryId,
      seller_id: query.sellerId,
      order: query.order,
      /* Sans région, Medusa refuse de calculer les prix, et c'est sain. */
      region_id: medusaRegionId() || undefined,
      fields: "*variants.calculated_price",
    },
    { revalidate: 60, tags: ["products"] }
  );

  if (!result.ok) return result;

  return {
    ok: true,
    data: {
      products: (result.data.products ?? []).map(mapProduct),
      count: Number(result.data.count) || 0,
    },
  };
}

export async function fetchProductByHandle(
  handle: string
): Promise<MedusaResult<StoreProduct | null>> {
  const result = await medusaFetch<{ products: RawProduct[] }>(
    "/store/products",
    {
      handle,
      limit: 1,
      region_id: medusaRegionId() || undefined,
      fields: "*variants.calculated_price,*images",
    },
    { revalidate: 60, tags: ["products", `product:${handle}`] }
  );

  if (!result.ok) return result;

  const first = (result.data.products ?? [])[0];

  return { ok: true, data: first ? mapProduct(first) : null };
}

export async function fetchSellers(
  limit = 12
): Promise<MedusaResult<{ sellers: StoreSeller[]; count: number }>> {
  const result = await medusaFetch<{ sellers: RawProduct[]; count: number }>(
    "/store/sellers",
    { limit },
    { revalidate: 120, tags: ["sellers"] }
  );

  if (!result.ok) return result;

  return {
    ok: true,
    data: {
      sellers: (result.data.sellers ?? []).map(mapSeller),
      count: Number(result.data.count) || 0,
    },
  };
}

export async function fetchSellerByHandle(
  handle: string
): Promise<MedusaResult<StoreSeller | null>> {
  const result = await medusaFetch<{ sellers: RawProduct[] }>(
    "/store/sellers",
    { handle, limit: 1 },
    { revalidate: 120, tags: ["sellers", `seller:${handle}`] }
  );

  if (!result.ok) return result;

  const first = (result.data.sellers ?? [])[0];

  return { ok: true, data: first ? mapSeller(first) : null };
}

export async function fetchCollections(
  limit = 12
): Promise<MedusaResult<StoreCollection[]>> {
  const result = await medusaFetch<{ collections: RawProduct[] }>(
    "/store/collections",
    { limit },
    { revalidate: 300, tags: ["collections"] }
  );

  if (!result.ok) return result;

  return {
    ok: true,
    data: (result.data.collections ?? []).map((raw) => ({
      id: String(raw.id),
      handle: text(raw.handle) ?? String(raw.id),
      title: text(raw.title) ?? "Collection",
    })),
  };
}

export async function fetchCategories(
  limit = 24
): Promise<MedusaResult<StoreCategory[]>> {
  const result = await medusaFetch<{ product_categories: RawProduct[] }>(
    "/store/product-categories",
    { limit },
    { revalidate: 300, tags: ["categories"] }
  );

  if (!result.ok) return result;

  return {
    ok: true,
    data: (result.data.product_categories ?? []).map((raw) => ({
      id: String(raw.id),
      handle: text(raw.handle) ?? String(raw.id),
      name: text(raw.name) ?? "Catégorie",
      description: text(raw.description),
    })),
  };
}

/*
  Mise en forme d'un montant.

  La devise vient du backend : coder « HTG » en dur ici afficherait des
  gourdes sur un catalogue facturé en dollars.
*/
export function formatAmount(
  amount: number | null,
  currency: string | null
): string {
  if (amount === null) return "Prix indisponible";

  const code = (currency || "HTG").toUpperCase();

  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    /* Devise inconnue d'Intl : on reste lisible plutôt que d'échouer. */
    return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(amount)} ${code}`;
  }
}
