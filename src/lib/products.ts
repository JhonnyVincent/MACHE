/*
  Écriture des produits vendeur.

  Pourquoi ce fichier existe

  Le projet avait trois chemins de création ou de modification d'un
  produit, qui n'écrivaient pas les mêmes colonnes :

  - la création dans une boutique écrivait `image_url` ;
  - la modification écrivait `image_urls`, jamais `image_url` — or les
    pages publiques ne lisaient que `image_url`, donc changer la photo
    d'un produit ne changeait rien côté client ;
  - la création depuis le compte écrivait `name`, `images`, `pdf_url` et
    un statut « published » absent de la contrainte de la table : cet
    insert était rejeté par la base.

  Tout passe désormais ici. Une seule définition des colonnes, une seule
  vérification de propriété, une seule décision de statut.

  Règle de sécurité : le statut de publication n'est jamais pris dans le
  formulaire. Un vendeur choisit de mettre en ligne ou de retirer ; c'est
  MACHÉ qui décide si « en ligne » signifie visible tout de suite ou après
  examen.
*/

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolvePublicationStatus } from "@/lib/moderation";
import { findCategory } from "@/lib/categories";

export function slugifyProduct(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

/* Les images sont saisies une par ligne, ou séparées par des virgules. */
export function parseImageUrls(value: string) {
  return Array.from(
    new Set(
      value
        .split(/\n|,/)
        .map((url) => url.trim())
        .filter(Boolean)
    )
  ).slice(0, 10);
}

/*
  Intention du vendeur, telle qu'exprimée par le formulaire.

  « online » n'est pas un statut : c'est une demande. Le statut réel est
  calculé ensuite, et peut valoir `manual_review` si MACHÉ impose un
  examen ou si la boutique n'est pas vérifiée.
*/
export type PublishIntent = "online" | "paused" | "draft";

export const PUBLISH_INTENT_LABELS: Record<PublishIntent, string> = {
  online: "Mettre en ligne",
  paused: "Mettre en pause",
  draft: "Garder en brouillon",
};

export function intentOfStatus(status: string): PublishIntent {
  if (["active", "auto_approved", "submitted", "manual_review"].includes(status)) {
    return "online";
  }

  if (status === "paused") return "paused";

  return "draft";
}

export const PRODUCT_STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  submitted: "Envoyé",
  manual_review: "En cours d'examen",
  auto_approved: "Validé",
  active: "En ligne",
  rejected: "Refusé",
  paused: "En pause",
  archived: "Archivé",
};

export const PRODUCT_STATUS_TONES: Record<
  string,
  "success" | "warning" | "danger" | "neutral" | "info"
> = {
  draft: "neutral",
  submitted: "info",
  manual_review: "warning",
  auto_approved: "success",
  active: "success",
  rejected: "danger",
  paused: "neutral",
  archived: "neutral",
};

/*
  Garde d'écriture : la boutique doit appartenir au compte connecté.
  Le filtre owner_id est dans la requête, sans se reposer sur le RLS seul.
*/
export async function requireOwnedStoreForWrite(storeId: string, backTo: string) {
  const supabase = await createSupabaseServerClient();

  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect(`/login?next=${encodeURIComponent(backTo)}`);
  }

  const { data: store } = await supabase
    .from("stores")
    .select("id, slug, is_verified, legal_doc_url")
    .eq("id", storeId)
    .eq("owner_id", userData.user.id)
    .maybeSingle();

  if (!store) {
    redirect("/dashboard/seller/stores?error=boutique_introuvable");
  }

  return { supabase, store, uid: userData.user.id };
}

export type ProductFormValues = {
  title: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  slug: string;
  imageUrls: string[];
  intent: PublishIntent;
};

export function readProductForm(formData: FormData): ProductFormValues {
  const title = String(formData.get("title") || "").trim();
  const rawIntent = String(formData.get("intent") || "draft");

  const intent: PublishIntent = ["online", "paused", "draft"].includes(rawIntent)
    ? (rawIntent as PublishIntent)
    : "draft";

  return {
    title,
    description: String(formData.get("description") || "").trim(),
    category: String(formData.get("category") || "").trim(),
    price: Number(formData.get("price") || 0),
    stock: Math.max(0, Math.trunc(Number(formData.get("stock") || 0))),
    slug: slugifyProduct(String(formData.get("slug") || "") || title),
    imageUrls: parseImageUrls(String(formData.get("image_urls") || "")),
    intent,
  };
}

/* Renvoie le premier message d'erreur, ou null si la saisie est correcte. */
export function validateProductForm(values: ProductFormValues): string | null {
  if (!values.title) return "Le nom du produit est obligatoire.";
  if (values.title.length > 140) return "Le nom ne peut pas dépasser 140 caractères.";
  if (!values.category) return "Choisissez une catégorie.";
  if (!findCategory(values.category)) return "Cette catégorie n'existe pas.";
  if (!(values.price > 0)) return "Indiquez un prix supérieur à zéro.";
  if (!Number.isFinite(values.stock) || values.stock < 0) {
    return "Le stock ne peut pas être négatif.";
  }

  for (const url of values.imageUrls) {
    if (!/^https?:\/\//i.test(url)) {
      return `L'adresse « ${url} » doit commencer par http:// ou https://`;
    }
  }

  if (values.intent === "online" && values.imageUrls.length === 0) {
    return "Un produit mis en ligne doit avoir au moins une image.";
  }

  return null;
}

/*
  Statut réel, décidé côté serveur.

  Un vendeur qui demande la mise en ligne n'obtient `active` que si la
  boutique est vérifiée, ses documents fournis et qu'aucun examen manuel
  n'est imposé par MACHÉ. Sinon le produit part en `manual_review`.
*/
export async function resolveStatusFor(
  values: ProductFormValues,
  store: { is_verified?: boolean | null; legal_doc_url?: string | null }
) {
  if (values.intent === "paused") return "paused";
  if (values.intent === "draft") return "draft";

  return resolvePublicationStatus({
    vendorVerified: Boolean(store.is_verified),
    documentsValid: Boolean(store.legal_doc_url),
    categoryAllowed: Boolean(values.category),
    requiredFieldsComplete: Boolean(values.title && values.price > 0),
    anomalyDetected: false,
  });
}

/*
  Colonnes écrites, identiques à la création et à la modification.

  `image_url` est tenu à jour en miroir du premier élément de `image_urls` :
  les pages publiques et les anciens produits s'appuient dessus. Écrire les
  deux évite qu'une photo changée dans le back-office reste l'ancienne côté
  client — c'était le cas.
*/
export function productColumns(values: ProductFormValues, status: string) {
  return {
    title: values.title,
    slug: values.slug,
    description: values.description,
    category: values.category,
    price: values.price,
    stock: values.stock,
    image_urls: values.imageUrls,
    image_url: values.imageUrls[0] ?? null,
    status,
    updated_at: new Date().toISOString(),
  };
}
