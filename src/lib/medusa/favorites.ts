/*
  Les favoris d'un client.

  Ce qu'ils étaient

  Des lignes Supabase portant des identifiants de produits Supabase.
  Depuis que le catalogue vit dans Medusa, ces identifiants ne
  désignaient plus rien : la page affichait une liste vide à qui avait
  mis dix articles de côté, et le bouton d'ajout n'existait nulle part.
  Une entrée de l'en-tête menait donc à une impasse, sur chaque page du
  site.

  Où ils vivent maintenant

  Dans le champ libre du client Medusa, sous forme d'adresses de
  produits (« cloudpeak-golden-slide »). Pas d'identifiants internes :
  une adresse reste lisible, se recopie, et survit à une reconstruction
  du catalogue.

  Pourquoi pas un cookie

  Un cookie suivrait le navigateur, pas la personne : mettre un article
  de côté sur son téléphone et ne pas le retrouver sur son ordinateur
  est précisément ce qu'on attend d'une liste d'envies, et ne pas le
  faire. Les favoris demandent donc un compte, et la page le dit.

  Bornes

  Cinquante articles. Ce n'est pas une contrainte technique : c'est
  qu'au-delà, une liste d'envies n'est plus une liste d'envies, et que
  le champ libre d'un client n'est pas un entrepôt.
*/

import { cookies } from "next/headers";
import { getMedusaConfig } from "./config";
import {
  backendTimeoutSignal,
  isTimeout,
  TIMEOUT_MESSAGE,
} from "./timeout";

const CUSTOMER_TOKEN_COOKIE = "mache_customer_token";

const MAX_FAVORITES = 50;

/* Les adresses de produits Medusa : minuscules, chiffres, tirets. */
const HANDLE = /^[a-z0-9][a-z0-9-]{0,99}$/;

type Result<T> = { ok: true; data: T } | { ok: false; reason: string };

async function readToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(CUSTOMER_TOKEN_COOKIE)?.value ?? null;
}

async function call<T>(
  path: string,
  init: { method?: string; body?: unknown; token: string }
): Promise<Result<T>> {
  const configured = getMedusaConfig();

  if (!configured.ok) return { ok: false, reason: configured.reason };

  try {
    const response = await fetch(`${configured.config.url}${path}`, {
      /* Une attente qui ne finit jamais fige l\'écran sans rien dire. */
      signal: backendTimeoutSignal(),
      method: init.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": configured.config.key,
        Authorization: `Bearer ${init.token}`,
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });

    if (!response.ok) {
      return { ok: false, reason: `Le serveur a répondu ${response.status}.` };
    }

    return { ok: true, data: (await response.json()) as T };
  } catch (error) {
    /*
      Un abandon vaut la peine d'être réessayé ; une panne réseau
      rarement. Les confondre ferait renoncer quelqu'un dont la
      demande serait passée au second essai.
    */
    if (isTimeout(error)) {
      return { ok: false, reason: TIMEOUT_MESSAGE };
    }

    return { ok: false, reason: "Le backend commerce ne répond pas." };
  }
}

/*
  Nettoyage de ce qui sort de la base.

  Le champ libre d'un client est écrit par le client : il peut y ranger
  n'importe quoi, et cette liste sert ensuite à demander des produits.
  On n'en retient que des adresses de la forme attendue, sans doublon,
  et pas plus que la borne.
*/
function sanitize(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];

  const seen = new Set<string>();

  for (const entry of raw) {
    if (typeof entry !== "string") continue;

    const handle = entry.trim().toLowerCase();

    if (!HANDLE.test(handle)) continue;

    seen.add(handle);

    if (seen.size >= MAX_FAVORITES) break;
  }

  return [...seen];
}

/* Les favoris du client connecté. Liste vide si personne ne l'est. */
export async function getFavorites(): Promise<string[]> {
  const token = await readToken();

  if (!token) return [];

  const result = await call<{ customer: { metadata?: unknown } }>(
    "/store/customers/me",
    { token }
  );

  if (!result.ok) return [];

  const metadata = result.data.customer?.metadata;

  return sanitize(
    metadata && typeof metadata === "object"
      ? (metadata as Record<string, unknown>).favorites
      : []
  );
}

/*
  Ajoute ou retire un article, et dit ce qui a été fait.

  L'écriture relit et renvoie le champ libre entier : envoyer seulement
  les favoris effacerait ce qu'un autre écran y aurait rangé.
*/
export async function toggleFavorite(
  handle: string
): Promise<Result<{ favorites: string[]; added: boolean }>> {
  const token = await readToken();

  if (!token) {
    return { ok: false, reason: "Connectez-vous pour mettre un article de côté." };
  }

  const clean = handle.trim().toLowerCase();

  if (!HANDLE.test(clean)) {
    return { ok: false, reason: "Article inconnu." };
  }

  const current = await call<{ customer: { metadata?: unknown } }>(
    "/store/customers/me",
    { token }
  );

  if (!current.ok) return current;

  const metadata =
    current.data.customer?.metadata &&
    typeof current.data.customer.metadata === "object"
      ? (current.data.customer.metadata as Record<string, unknown>)
      : {};

  const existing = sanitize(metadata.favorites);
  const added = !existing.includes(clean);

  if (added && existing.length >= MAX_FAVORITES) {
    return {
      ok: false,
      reason: `Votre liste est pleine (${MAX_FAVORITES} articles). Retirez-en un avant d'en ajouter.`,
    };
  }

  const favorites = added
    ? [...existing, clean]
    : existing.filter((entry) => entry !== clean);

  const saved = await call<unknown>("/store/customers/me", {
    method: "POST",
    token,
    body: { metadata: { ...metadata, favorites } },
  });

  if (!saved.ok) return saved;

  return { ok: true, data: { favorites, added } };
}
