/*
  Session vendeur, côté Mercur.

  Le contrat, tel qu'il est réellement — quatre points qu'aucune lecture
  de la documentation Medusa ne donne, et que seul l'essai a révélés :

  1. L'acteur s'appelle « member », pas « seller ». Les routes
     /auth/seller/* existent et répondent 401 quoi qu'on envoie, ce qui
     donne l'illusion d'un mot de passe refusé.
  2. Les routes /vendor/* exigent un en-tête `x-seller-id`. Sans lui,
     réponse 400 « x-seller-id header is required », même avec un jeton
     parfaitement valide. C'est le modèle de Mercur : un membre peut
     appartenir à plusieurs boutiques, il faut donc dire laquelle.
  3. Créer une boutique demande `member_email` ET `currency_code` ;
     l'omission du premier rend une erreur qui ne le nomme qu'en second
     appel.
  4. Une boutique naît au statut `pending_approval`. Elle existe, son
     propriétaire peut la configurer, mais MACHÉ doit l'approuver.

  Périmètre

  Cette session ne sert QUE la vitrine personnalisable, qui est une
  fonctionnalité MACHÉ absente de Mercur. Tout le reste du métier vendeur
  — produits, stock, commandes, versements — se fait dans le panneau
  Mercur, et rien ici ne le double.
*/

import { cookies } from "next/headers";
import { getMedusaConfig } from "./config";

const TOKEN_COOKIE = "mache_vendor_token";
const SELLER_COOKIE = "mache_vendor_seller";

export type VendorSeller = {
  id: string;
  name: string;
  handle: string;
  status: string;
  description: string | null;
  logo: string | null;
  banner: string | null;
  metadata: Record<string, unknown> | null;
};

type Raw = Record<string, unknown>;
type Result<T> = { ok: true; data: T } | { ok: false; reason: string };

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function request<T>(
  path: string,
  init: {
    method?: string;
    body?: unknown;
    token?: string | null;
    sellerId?: string | null;
  } = {}
): Promise<Result<T>> {
  const configured = getMedusaConfig();

  if (!configured.ok) return { ok: false, reason: configured.reason };

  const headers: Record<string, string> = {
    "x-publishable-api-key": configured.config.key,
    "content-type": "application/json",
    accept: "application/json",
  };

  if (init.token) headers.authorization = `Bearer ${init.token}`;
  if (init.sellerId) headers["x-seller-id"] = init.sellerId;

  try {
    const response = await fetch(`${configured.config.url}${path}`, {
      method: init.method ?? "GET",
      headers,
      body: init.body ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => ({}))) as Raw;

    if (!response.ok) {
      return {
        ok: false,
        reason: str(payload.message) ?? `Le backend a répondu ${response.status}.`,
      };
    }

    return { ok: true, data: payload as T };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, reason: `Backend injoignable : ${message}` };
  }
}

async function readSession() {
  const store = await cookies();

  return {
    token: store.get(TOKEN_COOKIE)?.value ?? null,
    sellerId: store.get(SELLER_COOKIE)?.value ?? null,
  };
}

async function writeSession(token: string, sellerId: string) {
  const store = await cookies();

  const options = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  };

  store.set(TOKEN_COOKIE, token, options);
  store.set(SELLER_COOKIE, sellerId, options);
}

export async function clearVendorSession() {
  const store = await cookies();
  store.delete(TOKEN_COOKIE);
  store.delete(SELLER_COOKIE);
}

function mapSeller(raw: Raw): VendorSeller {
  return {
    id: String(raw.id),
    name: str(raw.name) ?? "Boutique",
    handle: str(raw.handle) ?? String(raw.id),
    status: str(raw.status) ?? "pending_approval",
    description: str(raw.description),
    logo: str(raw.logo),
    banner: str(raw.banner),
    metadata:
      raw.metadata && typeof raw.metadata === "object"
        ? (raw.metadata as Record<string, unknown>)
        : null,
  };
}

/*
  Connexion.

  Le vendeur indique sa boutique en plus de ses identifiants. Ce n'est pas
  un oubli d'ergonomie : l'API vendeur de Mercur n'expose aucune route qui
  liste les boutiques d'un membre sans déjà connaître l'identifiant de
  l'une d'elles. `/vendor/sellers/select` ressemble à cette route, mais
  c'est un POST qui SÉLECTIONNE une boutique dont on donne déjà
  l'identifiant — appelé en GET, il est interprété comme
  `/vendor/sellers/:id` et répond « Seller with id: select was not found ».

  La sécurité ne repose pas sur cette saisie. L'adresse publique d'une
  boutique est connue de tous ; ce qui est vérifié, c'est l'appartenance :
  `/vendor/sellers/me` rend 400 ou 401 si le membre connecté n'appartient
  pas à la boutique demandée. C'est le backend qui tranche, pas ce
  formulaire.
*/
export async function loginVendor(
  email: string,
  password: string,
  storeHandle: string
): Promise<Result<VendorSeller>> {
  const configured = getMedusaConfig();

  if (!configured.ok) return { ok: false, reason: configured.reason };

  /* Adresse publique de la boutique → identifiant, via l'API boutique. */
  const lookup = await request<{ sellers?: Raw[] }>(
    `/store/sellers?handle=${encodeURIComponent(storeHandle)}&limit=1`
  );

  if (!lookup.ok) return lookup;

  const found = (lookup.data.sellers ?? [])[0];

  if (!found) {
    return { ok: false, reason: `Aucune boutique ne porte l'adresse « ${storeHandle} ».` };
  }

  const sellerId = String(found.id);

  const auth = await request<{ token?: string }>("/auth/member/emailpass", {
    method: "POST",
    body: { email, password },
  });

  if (!auth.ok) {
    /* Pas de distinction e-mail / mot de passe : sinon on énumère les comptes. */
    return { ok: false, reason: "Adresse e-mail ou mot de passe incorrect." };
  }

  const token = str(auth.data.token);

  if (!token) return { ok: false, reason: "Aucun jeton n'a été délivré." };

  /* Le backend vérifie l'appartenance ; on ne la déduit de rien. */
  const check = await request<{ seller: Raw }>("/vendor/sellers/me", {
    token,
    sellerId,
  });

  if (!check.ok || !check.data.seller) {
    return {
      ok: false,
      reason: "Ce compte n'est pas membre de cette boutique.",
    };
  }

  await writeSession(token, sellerId);

  return { ok: true, data: mapSeller(check.data.seller) };
}

/* Rend null plutôt qu'une erreur : ne pas être connecté est un état normal. */
export async function getVendorSeller(): Promise<VendorSeller | null> {
  const { token, sellerId } = await readSession();

  if (!token || !sellerId) return null;

  const result = await request<{ seller: Raw }>("/vendor/sellers/me", {
    token,
    sellerId,
  });

  if (!result.ok || !result.data.seller) return null;

  return mapSeller(result.data.seller);
}

/*
  Enregistrement de la vitrine.

  On n'envoie QUE `metadata` : une mise à jour qui renverrait tout l'objet
  écraserait en silence ce que le vendeur vient de changer dans le panneau
  Mercur — son nom, son logo, sa description.
*/
export async function saveStorefrontLayout(
  layout: unknown
): Promise<Result<VendorSeller>> {
  const { token, sellerId } = await readSession();

  if (!token || !sellerId) {
    return { ok: false, reason: "Session vendeur expirée. Reconnectez-vous." };
  }

  /*
    Le champ `metadata` est libre : on relit l'existant pour ne pas
    effacer ce qu'un autre écran y aurait rangé.
  */
  const current = await request<{ seller: Raw }>("/vendor/sellers/me", {
    token,
    sellerId,
  });

  const existing =
    current.ok && current.data.seller?.metadata &&
    typeof current.data.seller.metadata === "object"
      ? (current.data.seller.metadata as Record<string, unknown>)
      : {};

  const result = await request<{ seller: Raw }>("/vendor/sellers/me", {
    method: "POST",
    token,
    sellerId,
    body: { metadata: { ...existing, storefront: layout } },
  });

  if (!result.ok) return result;

  return { ok: true, data: mapSeller(result.data.seller) };
}
