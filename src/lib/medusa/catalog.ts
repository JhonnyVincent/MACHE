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

/*
  Une variante porte `offer_id` : sur une marketplace, ce n'est pas la
  variante qu'on met au panier mais l'offre d'un vendeur précis. Sans lui,
  « chaussure taille 44 » ne désigne aucune ligne de commande.
*/
export type StoreVariant = {
  id: string;
  title: string;
  offerId: string | null;
  price: number | null;
  originalPrice: number | null;
  currency: string | null;
  available: boolean;
};

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
  variants: StoreVariant[];
};

export type StoreSeller = {
  id: string;
  handle: string;
  name: string;
  description: string | null;
  logo: string | null;
  banner: string | null;
  isPremium: boolean;
  /* Champ libre du vendeur ; y vit notamment la mise en page de sa vitrine. */
  metadata: Record<string, unknown> | null;
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

function mapVariant(raw: RawProduct): StoreVariant {
  const calculated = raw.calculated_price as Record<string, unknown> | undefined;

  const amount = Number(calculated?.calculated_amount);
  const original = Number(calculated?.original_amount);

  return {
    id: String(raw.id),
    title: text(raw.title) ?? "Variante",
    offerId: text(raw.offer_id),
    price: Number.isFinite(amount) ? amount : null,
    originalPrice:
      Number.isFinite(original) && Number.isFinite(amount) && original > amount
        ? original
        : null,
    currency: text(calculated?.currency_code),
    /*
      Medusa ne renvoie une quantité que si l'inventaire est suivi. Sans
      suivi, la variante est disponible : supposer l'inverse masquerait
      des produits parfaitement vendables.
    */
    available:
      raw.manage_inventory === false ||
      raw.allow_backorder === true ||
      Number(raw.inventory_quantity ?? 1) > 0,
  };
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
    variants: Array.isArray(raw.variants)
      ? (raw.variants as RawProduct[]).map(mapVariant)
      : [],
  };
}

export type StoreOffer = {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerHandle: string;
  variantId: string;
};

/*
  Les vendeurs proposant une même variante.

  C'est le cœur du modèle marketplace : quatre boutiques peuvent vendre la
  même paire de chaussures, et le client choisit laquelle.
*/
export async function fetchOffersForVariant(
  variantId: string
): Promise<MedusaResult<StoreOffer[]>> {
  const result = await medusaFetch<{ offers: RawProduct[] }>(
    "/store/offers",
    { variant_id: variantId, limit: 20 },
    { revalidate: 60, tags: ["offers"] }
  );

  if (!result.ok) return result;

  return {
    ok: true,
    data: (result.data.offers ?? []).map((raw) => {
      const seller = (raw.seller as Record<string, unknown>) ?? {};

      return {
        id: String(raw.id),
        sellerId: String(seller.id ?? ""),
        sellerName: text(seller.name) ?? "Boutique",
        sellerHandle: text(seller.handle) ?? "",
        variantId: String(raw.variant_id ?? ""),
      };
    }),
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
    metadata:
      raw.metadata && typeof raw.metadata === "object"
        ? (raw.metadata as Record<string, unknown>)
        : null,
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

/*
  Produits d'un vendeur.

  `/store/products` N'ACCEPTE PAS de filtre `seller_id` : il répond
  « Unrecognized fields: 'seller_id' ». C'est logique une fois le modèle
  compris — un produit n'appartient pas à un vendeur, ce sont les OFFRES
  qui rattachent un vendeur à une variante, et plusieurs boutiques peuvent
  proposer le même produit.

  On passe donc par les offres pour obtenir les identifiants de produits,
  puis on demande ces produits-là. Deux requêtes plutôt qu'une, mais qui
  rendent le bon résultat.
*/
async function productIdsForSeller(
  sellerId: string
): Promise<MedusaResult<string[]>> {
  const result = await medusaFetch<{ offers: RawProduct[] }>(
    "/store/offers",
    { seller_id: sellerId, limit: 200 },
    { revalidate: 60, tags: ["offers", `seller:${sellerId}`] }
  );

  if (!result.ok) return result;

  const ids = [
    ...new Set(
      (result.data.offers ?? [])
        .map((offer) => text(offer.product_id))
        .filter((id): id is string => Boolean(id))
    ),
  ];

  return { ok: true, data: ids };
}

export async function fetchProducts(
  query: ProductQuery = {}
): Promise<MedusaResult<{ products: StoreProduct[]; count: number }>> {
  let idFilter: string[] | undefined;

  if (query.sellerId) {
    const ids = await productIdsForSeller(query.sellerId);

    if (!ids.ok) return ids;

    /* Vendeur sans offre : zéro produit, et ce n'est pas une erreur. */
    if (ids.data.length === 0) {
      return { ok: true, data: { products: [], count: 0 } };
    }

    idFilter = ids.data;
  }

  const result = await medusaFetch<{ products: RawProduct[]; count: number }>(
    "/store/products",
    {
      limit: query.limit ?? 24,
      offset: query.offset ?? 0,
      q: query.q,
      collection_id: query.collectionId,
      category_id: query.categoryId,
      id: idFilter,
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
