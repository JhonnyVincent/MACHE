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
  Vocabulaire des étiquettes de cache.

  Ces noms ne sont pas internes : le backend commerce les envoie à
  `/api/revalidate` quand un produit ou une offre change, et Next ne vide
  que ce qui porte exactement le nom reçu. Une étiquette écrite d'un côté
  « product-<handle> » et de l'autre « product:<handle> » ne correspond
  jamais — sans erreur, sans journal, et avec un cache qui ne se vide
  pas. C'est ce qui se passait.

  Toute modification ici doit être reportée dans
  `backend/packages/api/src/subscribers/storefront-cache-revalidate.ts`.

    products                  tous les produits
    product:<handle>          une fiche produit
    offers                    toutes les offres
    seller-id:<id>            les offres d'une boutique
    sellers                   toutes les boutiques
    seller-handle:<handle>    une boutique

  Les deux formes « seller » portaient le même préfixe pour deux choses
  différentes — un identifiant d'un côté, une adresse de l'autre. Elles
  sont nommées distinctement : le backend ne connaît que l'identifiant,
  et devait pouvoir viser sans ambiguïté.
*/

/*
  Une variante porte `offer_id` : sur une marketplace, ce n'est pas la
  variante qu'on met au panier mais l'offre d'un vendeur précis. Sans lui,
  « chaussure taille 44 » ne désigne aucune ligne de commande.
*/
/*
  Palier de prix dégressif.

  Medusa porte nativement `min_quantity` sur un prix : au-delà du seuil,
  c'est ce prix-là qui s'applique. Vérifié dans le panier — à cinq unités
  d'un article à 124, le prix unitaire tombe à 60.
*/
export type PriceTier = {
  minQuantity: number;
  maxQuantity: number | null;
  amount: number;
  currency: string;
};

export type StoreVariant = {
  id: string;
  title: string;
  offerId: string | null;
  price: number | null;
  originalPrice: number | null;
  currency: string | null;
  available: boolean;
  /* Paliers de quantité de CETTE offre, du plus petit seuil au plus grand. */
  tiers: PriceTier[];
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
  /* Nom du rayon, pour l'afficher au lieu de son identifiant. */
  collectionTitle: string | null;
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

/*
  Paliers de quantité applicables à une variante.

  `variants.prices` renvoie les prix de TOUTES les offres de la variante —
  sur le catalogue de démonstration, dix prix pour cinq vendeurs et deux
  devises. Les afficher tels quels annoncerait au client le tarif de gros
  d'un concurrent.

  On filtre donc sur deux critères : la règle `offer_id` doit désigner
  l'offre de cette variante, et la devise doit être celle du prix affiché.
*/
function tiersOf(raw: RawProduct, offerId: string | null, currency: string | null): PriceTier[] {
  if (!offerId || !Array.isArray(raw.prices)) return [];

  const tiers: PriceTier[] = [];

  for (const entry of raw.prices as RawProduct[]) {
    const min = Number(entry.min_quantity);

    /* Sans seuil, c'est le prix de base et non un palier. */
    if (!Number.isFinite(min) || min <= 1) continue;

    const priceCurrency = text(entry.currency_code);

    if (currency && priceCurrency && priceCurrency.toLowerCase() !== currency.toLowerCase()) {
      continue;
    }

    const rules = Array.isArray(entry.price_rules) ? (entry.price_rules as RawProduct[]) : [];

    const belongsToOffer = rules.some(
      (rule) => text(rule.attribute) === "offer_id" && text(rule.value) === offerId
    );

    if (!belongsToOffer) continue;

    const amount = Number(entry.amount);

    if (!Number.isFinite(amount)) continue;

    const max = Number(entry.max_quantity);

    tiers.push({
      minQuantity: min,
      maxQuantity: Number.isFinite(max) && max > 0 ? max : null,
      amount,
      currency: (priceCurrency ?? currency ?? "htg").toLowerCase(),
    });
  }

  return tiers.sort((a, b) => a.minQuantity - b.minQuantity);
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
    tiers: tiersOf(raw, text(raw.offer_id), text(calculated?.currency_code)),
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
    collectionTitle: text((raw.collection as Record<string, unknown> | null)?.title),
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
  /*
    Le champ libre du vendeur, d'où se lit le profil qu'il déclare. Sur
    une fiche produit, c'est ce qui permet à un acheteur de distinguer
    les boutiques qui proposent le même article.
  */
  sellerMetadata: Record<string, unknown> | null;
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
    {
      variant_id: variantId,
      limit: 20,
      /*
        Sans `*seller`, la réponse ne porte que l'identifiant, le nom et
        l'adresse de la boutique — pas son champ libre, donc pas le
        profil qu'elle déclare.
      */
      fields: "*seller",
    },
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
        sellerMetadata:
          seller.metadata && typeof seller.metadata === "object"
            ? (seller.metadata as Record<string, unknown>)
            : null,
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
  /* Plusieurs boutiques à la fois : filtrer le catalogue par profil. */
  sellerIds?: string[];
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
async function productIdsForSellers(
  sellerIds: string[]
): Promise<MedusaResult<string[]>> {
  if (sellerIds.length === 0) return { ok: true, data: [] };

  const result = await medusaFetch<{ offers: RawProduct[] }>(
    "/store/offers",
    { seller_id: sellerIds, limit: 200 },
    {
      revalidate: 60,
      tags: ["offers", ...sellerIds.map((id) => `seller-id:${id}`)],
    }
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

  const sellerIds = query.sellerIds ?? (query.sellerId ? [query.sellerId] : []);

  if (sellerIds.length > 0) {
    const ids = await productIdsForSellers(sellerIds);

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
      fields: "*variants.calculated_price,*collection",
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
      /*
        Les deux sélections de prix sont nécessaires. Demander
        `prices.price_rules` SEUL ne rend que `id` et `price_rules` : ni
        `amount`, ni `min_quantity`. Les paliers disparaissaient
        silencieusement — la fiche affichait un prix unique comme si
        aucun tarif de gros n'existait.
      */
      fields:
        "*variants.calculated_price,*variants.prices,*variants.prices.price_rules,*images",
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
    { revalidate: 120, tags: ["sellers", `seller-handle:${handle}`] }
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

  L'implémentation a déménagé dans `src/lib/format.ts`, qui n'importe
  rien : elle est employée par des composants qui tournent aussi dans le
  navigateur. Elle reste réexportée ici pour ne pas casser les appels
  existants.
*/
export { formatAmount } from "../format";

/* -------------------------------------------------------------------------- */
/* Avis                                                                       */
/* -------------------------------------------------------------------------- */

export type StoreReview = {
  id: string;
  rating: number;
  note: string | null;
  /* La réponse publique du vendeur, quand il en a écrit une. */
  sellerNote: string | null;
  createdAt: string | null;
};

export type StoreRatings = {
  count: number;
  /*
    Null quand il n'y a aucun avis — et non zéro. « 0 sur 5 » se lit
    comme une très mauvaise note ; l'absence d'avis n'en est pas une.
  */
  average: number | null;
  reviews: StoreReview[];
};

/*
  Les avis publiés d'une boutique ou d'un produit.

  Mercur enregistre et modère les avis, et n'autorise à noter que ce
  qu'on a commandé — mais n'expose rien publiquement. La route
  `/store/ratings` du backend MACHÉ comble ce trou et ne rend que les
  avis publiés.
*/
async function fetchRatings(
  params: { sellerId: string } | { productId: string }
): Promise<MedusaResult<StoreRatings>> {
  const key = "sellerId" in params ? "seller_id" : "product_id";
  const value = "sellerId" in params ? params.sellerId : params.productId;

  const result = await medusaFetch<{
    count: number;
    average: number | null;
    reviews: {
      id: string;
      rating: number;
      note: string | null;
      seller_note: string | null;
      created_at: string;
    }[];
  }>(
    "/store/ratings",
    { [key]: value },
    { revalidate: 120, tags: ["reviews", `${key}:${value}`] }
  );

  if (!result.ok) return result;

  return {
    ok: true,
    data: {
      count: Number(result.data.count) || 0,
      average:
        typeof result.data.average === "number" ? result.data.average : null,
      reviews: (result.data.reviews ?? []).map((review) => ({
        id: String(review.id),
        rating: Number(review.rating) || 0,
        note: text(review.note),
        sellerNote: text(review.seller_note),
        createdAt: text(review.created_at),
      })),
    },
  };
}

export function fetchSellerRatings(sellerId: string) {
  return fetchRatings({ sellerId });
}

export function fetchProductRatings(productId: string) {
  return fetchRatings({ productId });
}
