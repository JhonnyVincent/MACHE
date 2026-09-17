/*
  MODÉRATION DES PRODUITS

  Sert à :
  - vérifier côté serveur qu'un compte a bien le droit de modérer ;
  - lire la file d'attente des produits à examiner ;
  - appliquer une décision et la journaliser.

  Deux règles tenues ici :

  1. Le rôle est relu en base à chaque décision. Un formulaire, une URL ou un
     champ caché ne prouvent rien : seul `users.role` fait foi.

  2. Seul `status = 'active'` est visible au catalogue public (le filtre est
     dans src/lib/catalog.ts). Approuver ou rejeter change donc réellement la
     visibilité du produit, ce qui est le critère de fin du cahier des
     charges pour le parcours administrateur.
*/

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { computeProductPublicationStatus } from "@/lib/authz";

export const MODERATION_STATUSES = [
  "draft",
  "submitted",
  "manual_review",
  "auto_approved",
  "active",
  "rejected",
  "paused",
  "archived",
] as const;

export type ModerationStatus = (typeof MODERATION_STATUSES)[number];

export const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  submitted: "Soumis",
  manual_review: "À examiner",
  auto_approved: "Validé automatiquement",
  active: "En ligne",
  rejected: "Refusé",
  paused: "En pause",
  archived: "Archivé",
};

export const STATUS_TONES: Record<
  string,
  "success" | "warning" | "danger" | "neutral" | "info"
> = {
  draft: "neutral",
  submitted: "info",
  manual_review: "warning",
  auto_approved: "success",
  active: "success",
  rejected: "danger",
  paused: "warning",
  archived: "neutral",
};

/** Statuts qui attendent une décision humaine. */
export const PENDING_STATUSES = ["submitted", "manual_review"] as const;

export type ModerationProduct = {
  id: string;
  title: string;
  price: number;
  stock: number;
  status: string;
  category: string | null;
  imageUrl: string | null;
  storeId: string | null;
  storeName: string;
  storeVerified: boolean;
  sellerName: string;
  createdAt: string | null;
  submittedAt: string | null;
  rejectionReason: string | null;
};

/*
  Vérifie que l'appelant est administrateur, en relisant son rôle en base.
  Renvoie null si ce n'est pas le cas : l'appelant décide alors quoi faire,
  ce qui évite une redirection imposée depuis une bibliothèque.
*/
export async function requireStaff() {
  const supabase = await createSupabaseServerClient();

  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();

  const role = String(profile?.role || "");

  if (role !== "admin" && role !== "super_admin") return null;

  return { supabase, uid: userData.user.id, role };
}

export async function fetchModerationQueue(statuses: readonly string[] = PENDING_STATUSES) {
  const staff = await requireStaff();

  if (!staff) {
    return { products: [] as ModerationProduct[], counts: {} as Record<string, number>, error: null };
  }

  const { supabase } = staff;

  const { data, error } = await supabase
    .from("products")
    .select(
      "id, title, price, stock, status, category, image_url, store_id, seller_id, created_at, submitted_at, rejection_reason"
    )
    .in("status", [...statuses])
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) {
    console.error("[moderation] file:", error.message);
    return { products: [] as ModerationProduct[], counts: {} as Record<string, number>, error };
  }

  const rows = data ?? [];

  /* Boutiques et vendeurs, chargés séparément pour ne pas dépendre d'une
     jointure PostgREST. */
  const storeIds = [...new Set(rows.map((r) => r.store_id).filter(Boolean))] as string[];
  const sellerIds = [...new Set(rows.map((r) => r.seller_id).filter(Boolean))] as string[];

  const [storesResult, sellersResult] = await Promise.all([
    storeIds.length
      ? supabase.from("stores").select("id, name, is_verified").in("id", storeIds)
      : Promise.resolve({ data: [] }),
    sellerIds.length
      ? supabase.from("users").select("id, full_name").in("id", sellerIds)
      : Promise.resolve({ data: [] }),
  ]);

  const stores = new Map(
    (storesResult.data ?? []).map((s) => [
      String(s.id),
      { name: String(s.name || "Boutique"), verified: Boolean(s.is_verified) },
    ])
  );

  const sellers = new Map(
    (sellersResult.data ?? []).map((u) => [String(u.id), String(u.full_name || "Vendeur")])
  );

  const products: ModerationProduct[] = rows.map((row) => {
    const store = row.store_id ? stores.get(String(row.store_id)) : undefined;

    return {
      id: String(row.id),
      title: String(row.title || "Sans titre"),
      price: Number(row.price) || 0,
      stock: Number(row.stock) || 0,
      status: String(row.status || "draft"),
      category: (row.category as string) || null,
      imageUrl: (row.image_url as string) || null,
      storeId: row.store_id ? String(row.store_id) : null,
      storeName: store?.name || "Boutique inconnue",
      storeVerified: store?.verified ?? false,
      sellerName: row.seller_id ? sellers.get(String(row.seller_id)) || "Vendeur" : "Vendeur",
      createdAt: (row.created_at as string) || null,
      submittedAt: (row.submitted_at as string) || null,
      rejectionReason: (row.rejection_reason as string) || null,
    };
  });

  /* Compteurs par statut, pour les onglets de la file. */
  const counts: Record<string, number> = {};

  await Promise.all(
    MODERATION_STATUSES.map(async (status) => {
      const { count } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("status", status);

      counts[status] = count ?? 0;
    })
  );

  return { products, counts, error: null };
}

export type Decision = "approve" | "reject" | "pause" | "archive" | "restore";

const DECISION_TARGET: Record<Decision, ModerationStatus> = {
  approve: "active",
  reject: "rejected",
  pause: "paused",
  archive: "archived",
  restore: "active",
};

/*
  Applique une décision.

  Le rôle est relu en base : un vendeur qui forgerait la requête n'obtiendrait
  rien. La décision est journalisée dans moderation_events, ce qui rend un
  rejet contestable instruisible.
*/
export async function applyDecision(
  productId: string,
  decision: Decision,
  reason?: string
): Promise<{ ok: true; status: string } | { ok: false; message: string }> {
  const staff = await requireStaff();

  if (!staff) {
    return { ok: false, message: "Cette action demande un compte administrateur." };
  }

  const { supabase, uid } = staff;

  const target = DECISION_TARGET[decision];

  if (!target) {
    return { ok: false, message: "Décision inconnue." };
  }

  if (decision === "reject" && !String(reason || "").trim()) {
    return {
      ok: false,
      message: "Indiquez un motif de refus : le vendeur doit pouvoir corriger.",
    };
  }

  const { data: product, error: readError } = await supabase
    .from("products")
    .select("id, status, store_id")
    .eq("id", productId)
    .maybeSingle();

  if (readError || !product) {
    return { ok: false, message: "Ce produit n'a pas été retrouvé." };
  }

  const { error } = await supabase
    .from("products")
    .update({
      status: target,
      reviewed_at: new Date().toISOString(),
      reviewed_by: uid,
      rejection_reason: decision === "reject" ? String(reason).trim().slice(0, 500) : null,
    })
    .eq("id", productId);

  if (error) {
    console.error("[moderation] update:", error.message);
    return {
      ok: false,
      message:
        "La décision n'a pas pu être enregistrée. La migration 0005 doit être appliquée.",
    };
  }

  const { error: logError } = await supabase.from("moderation_events").insert({
    product_id: productId,
    store_id: product.store_id ?? null,
    actor_id: uid,
    from_status: product.status,
    to_status: target,
    reason: String(reason || "").trim().slice(0, 500) || null,
  });

  if (logError) {
    // La décision est appliquée ; l'absence de journal est signalée sans
    // annuler l'action.
    console.error("[moderation] journal:", logError.message);
  }

  return { ok: true, status: target };
}

/*
  Statut d'une mise en ligne par un vendeur.

  Réutilise computeProductPublicationStatus de lib/authz, qui portait déjà
  cette règle sans être appelé nulle part. Le réglage `require_product_review`
  permet à MACHÉ d'imposer une validation humaine ; un vendeur ne peut pas la
  contourner puisque le statut est décidé côté serveur.
*/
export async function resolvePublicationStatus(input: {
  vendorVerified: boolean;
  documentsValid: boolean;
  categoryAllowed: boolean;
  requiredFieldsComplete: boolean;
  anomalyDetected: boolean;
}): Promise<ModerationStatus> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("marketplace_settings")
    .select("value")
    .eq("key", "require_product_review")
    .maybeSingle();

  const reviewRequired = data?.value === true || data?.value === "true";

  if (reviewRequired) return "manual_review";

  const computed = computeProductPublicationStatus(input);

  return computed === "auto_approved" ? "active" : "manual_review";
}
