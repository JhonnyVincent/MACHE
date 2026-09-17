/*
  Socle commun de l'espace vendeur.

  Regroupe ce que toutes les pages répètent : contrôle d'accès, profil,
  limites du plan, formatage. Une page vendeur se réduit ainsi à sa
  requête et à son rendu.
*/

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSellerRole, type SellerRole } from "@/lib/authz";

export type PlanLimits = {
  maxStores: number;
  maxArticlesPerStore: number;
  planName: string;
  commission: string;
};

export const PLAN_LIMITS: Record<SellerRole, PlanLimits> = {
  seller_individual: {
    maxStores: 1,
    maxArticlesPerStore: 50,
    planName: "Gratuit",
    commission: "8 %",
  },
  seller_business: {
    maxStores: 2,
    maxArticlesPerStore: 500,
    planName: "Business",
    commission: "6 %",
  },
  supplier: {
    maxStores: 3,
    maxArticlesPerStore: 2000,
    planName: "Fournisseur",
    commission: "5 %",
  },
  official_brand: {
    maxStores: 10,
    maxArticlesPerStore: 10000,
    planName: "Marque officielle",
    commission: "4 %",
  },
};

export const ROLE_LABELS: Record<SellerRole, string> = {
  seller_individual: "Vendeur particulier",
  seller_business: "Vendeur Business",
  supplier: "Fournisseur",
  official_brand: "Marque officielle",
};

export const LOW_STOCK_THRESHOLD = 5;

const numberFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0,
});

export function formatNumber(value: number | null | undefined) {
  return numberFormatter.format(Number(value) || 0);
}

export function formatHTG(value: number | null | undefined) {
  return `${numberFormatter.format(Number(value) || 0)} HTG`;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function initialsOf(value: string, max = 2) {
  const cleaned = (value || "").trim();

  if (!cleaned) return "?";

  return cleaned
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, max)
    .toUpperCase();
}

export type SellerContext = Awaited<ReturnType<typeof requireSeller>>;

/*
  Contrôle d'accès commun à toutes les pages vendeur.
  Redirige plutôt que de renvoyer une erreur : une page vendeur ne
  s'affiche jamais à moitié.
*/
export async function requireSeller(nextPath = "/dashboard/seller") {
  const supabase = await createSupabaseServerClient();

  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  const uid = userData.user.id;

  const { data: profile, error } = await supabase
    .from("users")
    .select("role, full_name, email, address_verified, created_at")
    .eq("id", uid)
    .maybeSingle();

  if (error) {
    console.error("[seller] lecture du profil:", error.message);
  }

  // /dashboard sait expliquer un profil illisible ; on ne devine pas ici.
  if (!profile) {
    redirect("/dashboard");
  }

  const role = String(profile.role || "").trim();

  if (!isSellerRole(role)) {
    redirect(
      `/login?error=${encodeURIComponent(
        `Ce compte n'est pas un compte vendeur (rôle : ${role || "inconnu"}).`
      )}`
    );
  }

  const displayName = profile.full_name?.trim() || "Vendeur";

  return {
    supabase,
    uid,
    email: profile.email || userData.user.email || "",
    profile,
    role,
    roleLabel: ROLE_LABELS[role],
    limits: PLAN_LIMITS[role],
    displayName,
    firstName: displayName.split(" ")[0],
  };
}


/*
  Garde d'accès à une boutique précise.

  Toutes les pages de /dashboard/seller/stores/[id] doivent vérifier que la
  boutique appartient bien au compte connecté. Le faire ici, une fois, évite
  qu'une page oubliée devienne une fuite : un vendeur ne doit jamais voir les
  commandes ni le stock d'un autre.

  Le filtre owner_id est dans la requête, sans se reposer sur le RLS seul.
*/
export async function requireStoreOwner(storeId: string) {
  const context = await requireSeller(`/dashboard/seller/stores/${storeId}`);

  const { data: store, error } = await context.supabase
    .from("stores")
    .select(
      "id, slug, name, description, category, keywords, logo_url, banner_url, is_active, is_verified, legal_doc_url, created_at, rating_average, rating_count"
    )
    .eq("id", storeId)
    .eq("owner_id", context.uid)
    .maybeSingle();

  if (error) {
    console.error("[seller] boutique:", error.message);
  }

  if (!store) {
    redirect("/dashboard/seller/stores?error=boutique_introuvable");
  }

  return { ...context, store };
}
