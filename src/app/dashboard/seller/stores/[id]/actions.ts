"use server";

/*
  ACTIONS : réglages d'une boutique.

  Regroupe les écritures des pages « Ma boutique », « Apparence »,
  « Documents » et « Paramètres ». Elles partagent la même exigence : ne
  jamais écrire sans avoir revérifié, côté serveur, que la boutique
  appartient bien au compte connecté — l'identifiant de boutique vient du
  formulaire, donc du client, et ne se croit pas.

  Chaque action n'écrit que les colonnes de son écran. Une action qui
  enverrait l'objet entier écraserait en silence ce qu'un autre écran
  vient de modifier.
*/

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { findCategory } from "@/lib/categories";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function fail(storeId: string, section: string, message: string): never {
  redirect(
    `/dashboard/seller/stores/${storeId}/${section}?error=${encodeURIComponent(message)}`
  );
}

function done(storeId: string, section: string, code: string): never {
  revalidatePath(`/dashboard/seller/stores/${storeId}`, "layout");
  redirect(`/dashboard/seller/stores/${storeId}/${section}?success=${code}`);
}

/*
  Garde d'écriture. Renvoie le client Supabase et la boutique seulement si
  le compte connecté en est le propriétaire. Le filtre owner_id est dans
  la requête : on ne s'en remet pas au RLS seul.
*/
async function requireOwnedStore(storeId: string, section: string) {
  if (!storeId) fail("", section, "Boutique inconnue.");

  const supabase = await createSupabaseServerClient();

  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect(`/login?next=/dashboard/seller/stores/${storeId}/${section}`);
  }

  const { data: store } = await supabase
    .from("stores")
    .select("id, slug, name, is_verified")
    .eq("id", storeId)
    .eq("owner_id", userData.user.id)
    .maybeSingle();

  if (!store) {
    redirect("/dashboard/seller/stores?error=boutique_introuvable");
  }

  return { supabase, store, uid: userData.user.id };
}

/* Informations d'identité : nom, catégorie, description, mots-clés. */
export async function updateStoreIdentityAction(formData: FormData) {
  const storeId = String(formData.get("store_id") || "");
  const { supabase, uid } = await requireOwnedStore(storeId, "store");

  const name = String(formData.get("name") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const keywordsRaw = String(formData.get("keywords") || "").trim();

  if (!name) fail(storeId, "store", "Le nom de la boutique est obligatoire.");

  if (name.length > 80) {
    fail(storeId, "store", "Le nom ne peut pas dépasser 80 caractères.");
  }

  // La catégorie doit exister dans l'arborescence : une valeur libre rendrait
  // la boutique introuvable dans la navigation publique.
  if (category && !findCategory(category)) {
    fail(storeId, "store", "Cette catégorie n'existe pas.");
  }

  const keywords = keywordsRaw
    ? Array.from(
        new Set(
          keywordsRaw
            .split(",")
            .map((item) => item.trim().toLowerCase())
            .filter(Boolean)
        )
      ).slice(0, 20)
    : [];

  const { error } = await supabase
    .from("stores")
    .update({ name, category, description, keywords })
    .eq("id", storeId)
    .eq("owner_id", uid);

  if (error) fail(storeId, "store", error.message);

  done(storeId, "store", "identity");
}

/* Apparence : logo et bannière. Seules des URL sont stockées. */
export async function updateStoreAppearanceAction(formData: FormData) {
  const storeId = String(formData.get("store_id") || "");
  const { supabase, uid } = await requireOwnedStore(storeId, "customization");

  const logoUrl = String(formData.get("logo_url") || "").trim();
  const bannerUrl = String(formData.get("banner_url") || "").trim();

  for (const [label, value] of [
    ["logo", logoUrl],
    ["bannière", bannerUrl],
  ] as const) {
    if (value && !/^https?:\/\//i.test(value)) {
      fail(
        storeId,
        "customization",
        `L'adresse du ${label} doit commencer par http:// ou https://`
      );
    }
  }

  const { error } = await supabase
    .from("stores")
    .update({ logo_url: logoUrl || null, banner_url: bannerUrl || null })
    .eq("id", storeId)
    .eq("owner_id", uid);

  if (error) fail(storeId, "customization", error.message);

  done(storeId, "customization", "appearance");
}

/*
  Document légal.

  On enregistre l'adresse du document et rien d'autre : `is_verified` est
  décidé par la modération MACHÉ, jamais par le vendeur lui-même.
*/
export async function updateStoreDocumentAction(formData: FormData) {
  const storeId = String(formData.get("store_id") || "");
  const { supabase, uid } = await requireOwnedStore(storeId, "documents");

  const legalDocUrl = String(formData.get("legal_doc_url") || "").trim();

  if (!legalDocUrl) {
    fail(storeId, "documents", "Indiquez l'adresse du document.");
  }

  if (!/^https?:\/\//i.test(legalDocUrl)) {
    fail(storeId, "documents", "L'adresse doit commencer par http:// ou https://");
  }

  const { error } = await supabase
    .from("stores")
    .update({ legal_doc_url: legalDocUrl })
    .eq("id", storeId)
    .eq("owner_id", uid);

  if (error) fail(storeId, "documents", error.message);

  done(storeId, "documents", "document");
}

/*
  Adresse publique de la boutique.

  Changer le slug casse les liens déjà partagés : c'est écrit à l'écran, et
  l'unicité est vérifiée avant l'écriture pour donner un message clair
  plutôt qu'une erreur de contrainte.
*/
export async function updateStoreSlugAction(formData: FormData) {
  const storeId = String(formData.get("store_id") || "");
  const { supabase, uid, store } = await requireOwnedStore(storeId, "settings");

  const slug = slugify(String(formData.get("slug") || ""));

  if (!slug) fail(storeId, "settings", "L'adresse publique est obligatoire.");

  if (slug.length < 3) {
    fail(storeId, "settings", "L'adresse publique doit faire au moins 3 caractères.");
  }

  if (slug === store.slug) {
    done(storeId, "settings", "slug_unchanged");
  }

  const { data: taken } = await supabase
    .from("stores")
    .select("id")
    .eq("slug", slug)
    .neq("id", storeId)
    .maybeSingle();

  if (taken) {
    fail(storeId, "settings", `L'adresse « ${slug} » est déjà utilisée.`);
  }

  const { error } = await supabase
    .from("stores")
    .update({ slug })
    .eq("id", storeId)
    .eq("owner_id", uid);

  if (error) fail(storeId, "settings", error.message);

  done(storeId, "settings", "slug");
}

/*
  Ouverture / fermeture de la boutique.

  Fermer, c'est `is_active = false` : la boutique disparaît des pages
  publiques mais les commandes, les avis et l'historique restent intacts.
  Aucune suppression n'est proposée tant qu'il existe des commandes à
  honorer — ce serait effacer les preuves d'une vente.
*/
export async function setStoreActiveAction(formData: FormData) {
  const storeId = String(formData.get("store_id") || "");
  const { supabase, uid } = await requireOwnedStore(storeId, "settings");

  const active = String(formData.get("active") || "") === "true";

  const { error } = await supabase
    .from("stores")
    .update({ is_active: active })
    .eq("id", storeId)
    .eq("owner_id", uid);

  if (error) fail(storeId, "settings", error.message);

  done(storeId, "settings", active ? "reopened" : "closed");
}
