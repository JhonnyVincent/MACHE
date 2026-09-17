/*
  AVIS ET NOTES

  Sert à :
  - lire les avis publiés d'un produit ou d'une boutique ;
  - déterminer ce qu'un client a le droit de commenter ;
  - enregistrer un avis et la réponse d'un vendeur.

  Règle de confiance : un avis n'est « vérifié » que s'il est rattaché à une
  ligne de commande du compte qui l'écrit. C'est ce qui distingue un avis
  d'un commentaire, et la contrainte unique sur order_item_id empêche de
  noter deux fois le même achat.

  Le client ne choisit pas ce drapeau : il est déduit côté serveur de la
  commande retrouvée en base.
*/

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type Review = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  authorName: string;
  isVerified: boolean;
  sellerReply: string | null;
  sellerRepliedAt: string | null;
  createdAt: string | null;
};

export type RatingSummary = {
  average: number;
  count: number;
  /** Nombre d'avis par note, de 1 à 5. */
  breakdown: Record<1 | 2 | 3 | 4 | 5, number>;
};

const EMPTY_SUMMARY: RatingSummary = {
  average: 0,
  count: 0,
  breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
};

function summarize(ratings: number[]): RatingSummary {
  if (ratings.length === 0) return EMPTY_SUMMARY;

  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as RatingSummary["breakdown"];

  for (const rating of ratings) {
    const key = Math.min(5, Math.max(1, Math.round(rating))) as 1 | 2 | 3 | 4 | 5;
    breakdown[key] += 1;
  }

  const total = ratings.reduce((sum, r) => sum + r, 0);

  return {
    average: Math.round((total / ratings.length) * 100) / 100,
    count: ratings.length,
    breakdown,
  };
}

type ReviewRow = Record<string, unknown>;

function mapReview(row: ReviewRow, authors: Map<string, string>): Review {
  const authorId = String(row.author_id ?? "");

  return {
    id: String(row.id),
    rating: Number(row.rating) || 0,
    title: (row.title as string) || null,
    body: (row.body as string) || null,
    authorName: authors.get(authorId) || "Client Maché",
    isVerified: Boolean(row.is_verified_purchase),
    sellerReply: (row.seller_reply as string) || null,
    sellerRepliedAt: (row.seller_replied_at as string) || null,
    createdAt: (row.created_at as string) || null,
  };
}

/*
  Les prénoms des auteurs sont chargés séparément : une jointure sur `users`
  depuis une table à lecture publique exposerait plus de colonnes que
  nécessaire, et seul le prénom est affiché.
*/
async function loadAuthorNames(rows: ReviewRow[]) {
  const ids = [...new Set(rows.map((r) => String(r.author_id ?? "")).filter(Boolean))];

  if (ids.length === 0) return new Map<string, string>();

  const supabase = await createSupabaseServerClient();

  const { data } = await supabase.from("users").select("id, full_name").in("id", ids);

  return new Map(
    (data ?? []).map((user) => {
      const full = String(user.full_name || "").trim();
      const first = full.split(/\s+/)[0] || "Client";
      return [String(user.id), first];
    })
  );
}

export async function fetchProductReviews(productId: string, limit = 20) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("reviews")
    .select(
      "id, author_id, rating, title, body, is_verified_purchase, seller_reply, seller_replied_at, created_at"
    )
    .eq("product_id", productId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[reviews] produit:", error.message);
    return { reviews: [] as Review[], summary: EMPTY_SUMMARY, error };
  }

  const rows = (data ?? []) as ReviewRow[];
  const authors = await loadAuthorNames(rows);

  return {
    reviews: rows.map((row) => mapReview(row, authors)),
    summary: summarize(rows.map((row) => Number(row.rating) || 0)),
    error: null,
  };
}

export async function fetchStoreReviews(storeId: string, limit = 50) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("reviews")
    .select(
      "id, author_id, product_id, rating, title, body, is_verified_purchase, seller_reply, seller_replied_at, created_at"
    )
    .eq("store_id", storeId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[reviews] boutique:", error.message);
    return { reviews: [] as Review[], summary: EMPTY_SUMMARY, error };
  }

  const rows = (data ?? []) as ReviewRow[];
  const authors = await loadAuthorNames(rows);

  return {
    reviews: rows.map((row) => mapReview(row, authors)),
    summary: summarize(rows.map((row) => Number(row.rating) || 0)),
    error: null,
  };
}

export type ReviewableItem = {
  orderItemId: string;
  productId: string | null;
  storeId: string | null;
  title: string;
  imageUrl: string | null;
  orderReference: string | null;
  orderedAt: string | null;
};

/*
  Achats que le compte peut commenter.

  Conditions : la commande lui appartient, elle est livrée ou terminée, et
  la ligne n'a pas déjà reçu d'avis. Noter un article jamais reçu n'aurait
  pas de sens, et la marketplace perdrait la valeur de ses notes.
*/
export async function fetchReviewableItems(userId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("id, reference, created_at, status")
    .eq("buyer_id", userId)
    .in("status", ["delivered", "completed"])
    .order("created_at", { ascending: false })
    .limit(100);

  if (ordersError) {
    console.error("[reviews] commandes:", ordersError.message);
    return { items: [] as ReviewableItem[], error: ordersError };
  }

  const orderList = orders ?? [];

  if (orderList.length === 0) {
    return { items: [] as ReviewableItem[], error: null };
  }

  const orderIds = orderList.map((o) => o.id);

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("id, order_id, product_id, store_id, title, image_url")
    .in("order_id", orderIds);

  if (itemsError) {
    console.error("[reviews] lignes:", itemsError.message);
    return { items: [] as ReviewableItem[], error: itemsError };
  }

  const itemList = items ?? [];

  if (itemList.length === 0) {
    return { items: [] as ReviewableItem[], error: null };
  }

  const { data: existing } = await supabase
    .from("reviews")
    .select("order_item_id")
    .eq("author_id", userId)
    .in(
      "order_item_id",
      itemList.map((i) => i.id)
    );

  const reviewed = new Set((existing ?? []).map((r) => String(r.order_item_id)));
  const orderById = new Map(orderList.map((o) => [String(o.id), o]));

  const reviewable = itemList
    .filter((item) => !reviewed.has(String(item.id)))
    .map((item) => {
      const order = orderById.get(String(item.order_id));

      return {
        orderItemId: String(item.id),
        productId: item.product_id ? String(item.product_id) : null,
        storeId: item.store_id ? String(item.store_id) : null,
        title: String(item.title || "Article"),
        imageUrl: (item.image_url as string) || null,
        orderReference: (order?.reference as string) || null,
        orderedAt: (order?.created_at as string) || null,
      } satisfies ReviewableItem;
    });

  return { items: reviewable, error: null };
}

export type ReviewInput = {
  orderItemId: string;
  rating: number;
  title?: string;
  body?: string;
};

export async function createReview(
  userId: string,
  input: ReviewInput
): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = await createSupabaseServerClient();

  const rating = Math.round(Number(input.rating));

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return { ok: false, message: "Choisissez une note entre 1 et 5 étoiles." };
  }

  /*
    La ligne de commande est relue et rattachée à son acheteur : c'est ce
    contrôle, et non le formulaire, qui autorise l'avis.
  */
  const { data: item, error: itemError } = await supabase
    .from("order_items")
    .select("id, product_id, store_id, order_id")
    .eq("id", input.orderItemId)
    .maybeSingle();

  if (itemError || !item) {
    return { ok: false, message: "Cet achat n'a pas été retrouvé." };
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, buyer_id, status")
    .eq("id", item.order_id)
    .maybeSingle();

  if (!order || String(order.buyer_id) !== userId) {
    return { ok: false, message: "Cet achat n'est pas rattaché à votre compte." };
  }

  if (!["delivered", "completed"].includes(String(order.status))) {
    return {
      ok: false,
      message: "Vous pourrez noter cet article une fois la commande livrée.",
    };
  }

  const { error } = await supabase.from("reviews").insert({
    product_id: item.product_id,
    store_id: item.store_id,
    author_id: userId,
    order_item_id: item.id,
    rating,
    title: String(input.title || "").trim().slice(0, 120) || null,
    body: String(input.body || "").trim().slice(0, 2000) || null,
    is_verified_purchase: true,
    status: "published",
  });

  if (error) {
    console.error("[reviews] insert:", error.message);

    if (error.code === "23505" || /duplicate|unique/i.test(error.message)) {
      return { ok: false, message: "Vous avez déjà noté cet achat." };
    }

    return {
      ok: false,
      message:
        "L'avis n'a pas pu être enregistré. Les migrations 0001 et 0004 doivent être appliquées.",
    };
  }

  return { ok: true };
}

/*
  Réponse du vendeur.

  Seules les colonnes de réponse sont écrites : la note et le texte du client
  ne doivent jamais pouvoir être modifiés par la boutique commentée. La
  politique RLS restreint déjà l'accès aux propriétaires de la boutique ; ce
  contrôle applicatif garantit la portée des colonnes.
*/
export async function replyToReview(
  reviewId: string,
  reply: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = await createSupabaseServerClient();

  const text = String(reply || "").trim().slice(0, 1000);

  if (!text) {
    return { ok: false, message: "Votre réponse est vide." };
  }

  const { error } = await supabase
    .from("reviews")
    .update({ seller_reply: text, seller_replied_at: new Date().toISOString() })
    .eq("id", reviewId);

  if (error) {
    console.error("[reviews] reply:", error.message);
    return { ok: false, message: "La réponse n'a pas pu être enregistrée." };
  }

  return { ok: true };
}
