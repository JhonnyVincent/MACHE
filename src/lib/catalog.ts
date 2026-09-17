/*
  Catalogue public.

  Source unique des produits et des boutiques affichés côté client. Les
  pages publiques lisaient jusqu'ici `src/lib/mock-data.ts` : les produits
  réellement créés par les vendeurs n'apparaissaient donc jamais sur le
  site.

  Deux partis pris :

  - Les boutiques sont chargées par une seconde requête plutôt que par une
    jointure. Une jointure PostgREST dépend de la détection d'une clé
    étrangère ; si elle manque, toute la requête échoue. Deux requêtes
    simples ne dépendent de rien.
  - `slug` n'est pas renseigné à la création d'un produit. L'identifiant
    sert donc de repli dans les URL, et la recherche accepte les deux.
*/

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { categoryLabel, categoryMatchValues, categorySlug } from "@/lib/categories";

export type CatalogProduct = {
  id: string;
  handle: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  categorySlug?: string;
  images: string[];
  status: string;
  ratingAverage: number;
  ratingCount: number;
  storeId: string | null;
  storeName: string;
  storeSlug: string | null;
  createdAt: string | null;
};

export type CatalogStore = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  logoUrl: string | null;
  isVerified: boolean;
  createdAt: string | null;
};

const PRODUCT_COLUMNS =
  "id, title, slug, description, category, price, stock, status, image_url, image_urls, store_id, created_at, rating_average, rating_count";

const STORE_COLUMNS =
  "id, slug, name, description, category, logo_url, is_verified, created_at";

type ProductRow = Record<string, unknown>;

function text(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function number(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/*
  Deux colonnes portent les images d'un produit : `image_urls` (tableau,
  format du projet) et `image_url` (une seule, plus ancienne). Le
  formulaire de création écrivait l'une, celui de modification l'autre, et
  les pages publiques ne lisaient que la seconde : changer la photo d'un
  produit ne changeait rien côté client.

  Les deux sont désormais lues ici, le tableau en premier, et les actions
  d'écriture tiennent les deux à jour. Rien n'est supprimé en base : les
  produits déjà enregistrés sous l'un ou l'autre format s'affichent.
*/
function imagesOf(row: ProductRow): string[] {
  const list = Array.isArray(row.image_urls)
    ? row.image_urls.map((value) => text(value)).filter(Boolean)
    : [];

  if (list.length > 0) return list;

  const single = text(row.image_url);

  return single ? [single] : [];
}

function mapProduct(row: ProductRow, stores: Map<string, CatalogStore>): CatalogProduct {
  const storeId = text(row.store_id) || null;
  const store = storeId ? stores.get(storeId) : undefined;

  return {
    id: String(row.id),
    handle: text(row.slug) || String(row.id),
    title: text(row.title, "Produit sans titre"),
    description: text(row.description),
    price: number(row.price),
    stock: number(row.stock),
    category: categoryLabel(text(row.category)),
    categorySlug: categorySlug(text(row.category)),
    images: imagesOf(row),
    status: text(row.status, "active"),
    ratingAverage: number(row.rating_average),
    ratingCount: number(row.rating_count),
    storeId,
    storeName: store?.name || "Boutique MACHE",
    storeSlug: store?.slug || null,
    createdAt: text(row.created_at) || null,
  };
}

async function attachStores(rows: ProductRow[]) {
  const supabase = await createSupabaseServerClient();

  const ids = [...new Set(rows.map((row) => text(row.store_id)).filter(Boolean))];

  if (ids.length === 0) return new Map<string, CatalogStore>();

  const { data, error } = await supabase
    .from("stores")
    .select(STORE_COLUMNS)
    .in("id", ids);

  if (error) {
    console.error("[catalog] stores:", error.message);
    return new Map<string, CatalogStore>();
  }

  return new Map(
    (data ?? []).map((row) => [
      String(row.id),
      {
        id: String(row.id),
        slug: text(row.slug),
        name: text(row.name, "Boutique"),
        description: text(row.description),
        category: text(row.category),
        logoUrl: text(row.logo_url) || null,
        isVerified: Boolean(row.is_verified),
        createdAt: text(row.created_at) || null,
      },
    ])
  );
}

export type ProductQuery = {
  search?: string;
  category?: string;
  storeId?: string;
  sort?: "recent" | "price_asc" | "price_desc";
  limit?: number;
};

export async function fetchProducts(options: ProductQuery = {}) {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("status", "active");

  if (options.storeId) {
    query = query.eq("store_id", options.storeId);
  }

  /*
    Le filtre reçoit un slug d'URL. Une simple égalité ne suffit pas : la même
    catégorie existe en base sous plusieurs écritures — « Mode », « mode »,
    « Vêtements » pour l'ancienne liste — et une catégorie parente doit
    ramener les produits de ses sous-catégories.
  */
  if (options.category && options.category !== "Tous") {
    query = query.in("category", categoryMatchValues(options.category));
  }

  if (options.search) {
    // Échappe les caractères qui ont un sens dans un filtre PostgREST.
    const term = options.search.replace(/[%,()]/g, " ").trim();

    if (term) {
      query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
    }
  }

  if (options.sort === "price_asc") {
    query = query.order("price", { ascending: true });
  } else if (options.sort === "price_desc") {
    query = query.order("price", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query.limit(options.limit ?? 60);

  if (error) {
    console.error("[catalog] products:", error.message);
    return { products: [] as CatalogProduct[], error };
  }

  const rows = (data ?? []) as ProductRow[];
  const stores = await attachStores(rows);

  return { products: rows.map((row) => mapProduct(row, stores)), error: null };
}

/** Recherche par slug, avec repli sur l'identifiant. */
export async function fetchProductByHandle(handle: string) {
  const supabase = await createSupabaseServerClient();

  const bySlug = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("slug", handle)
    .eq("status", "active")
    .maybeSingle();

  let row = bySlug.data as ProductRow | null;

  if (!row) {
    const byId = await supabase
      .from("products")
      .select(PRODUCT_COLUMNS)
      .eq("id", handle)
      .maybeSingle();

    row = (byId.data as ProductRow | null) ?? null;
  }

  if (!row) return null;

  const stores = await attachStores([row]);

  return mapProduct(row, stores);
}

export async function fetchStoreBySlug(slug: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("stores")
    .select(STORE_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("[catalog] store:", error.message);
    return null;
  }

  if (!data) return null;

  return {
    id: String(data.id),
    slug: text(data.slug),
    name: text(data.name, "Boutique"),
    description: text(data.description),
    category: text(data.category),
    logoUrl: text(data.logo_url) || null,
    isVerified: Boolean(data.is_verified),
    createdAt: text(data.created_at) || null,
  } satisfies CatalogStore;
}

/*
  Catégories réellement présentes au catalogue. PostgREST n'expose pas de
  DISTINCT : on déduplique côté serveur sur un échantillon large.
*/
export async function fetchCategories() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("products")
    .select("category")
    .eq("status", "active")
    .limit(500);

  if (error) {
    console.error("[catalog] categories:", error.message);
    return [] as string[];
  }

  const categories = new Set<string>();

  for (const row of data ?? []) {
    const value = text(row.category);
    if (value) categories.add(value);
  }

  return [...categories].sort((a, b) => a.localeCompare(b, "fr"));
}

const htgFormatter = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

export function formatPrice(value: number) {
  return `${htgFormatter.format(Number(value) || 0)} HTG`;
}
