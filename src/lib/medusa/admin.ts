/*
  L'administration de MACHÉ, sur les comptes Medusa.

  Ce qui a changé, et pourquoi

  Cet espace lisait ses comptes et ses rôles dans Supabase. Le projet
  Supabase a été supprimé : chaque écran d'administration authentifiait
  donc contre un service qui n'existe plus. Les comptes vivent
  désormais dans Medusa — la table `user`, celle du personnel, distincte
  des clients et des vendeurs.

  Ce que cet espace fait, et ce qu'il ne fait pas

  Il ne réimplémente pas le panneau d'administration de Medusa/Mercur.
  Celui-ci est servi par le backend et gère déjà les boutiques, les
  offres, les commissions, les versements, les avis, les commandes et
  les clients — tenu à jour en amont, et plus complet que ce que ce
  site saurait refaire.

  C'est la même décision que pour l'espace vendeur, prise pour la même
  raison : trente-cinq pages avaient été écrites ici pour redire ce
  qu'un produit maintenu ailleurs disait déjà, et elles finissaient par
  afficher des chiffres qui ne correspondaient plus à rien.

  Cet espace est donc une porte : il authentifie, il montre l'état réel
  de la marketplace, et il mène au panneau pour agir.
*/

import { cookies } from "next/headers";
import { getMedusaConfig } from "./config";
import {
  backendTimeoutSignal,
  isTimeout,
  TIMEOUT_MESSAGE,
} from "./timeout";

const TOKEN_COOKIE = "mache_admin_token";

export type AdminUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
};

type Raw = Record<string, unknown>;
type Result<T> = { ok: true; data: T } | { ok: false; reason: string };

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function request<T>(
  path: string,
  init: { method?: string; body?: unknown; token?: string | null } = {}
): Promise<Result<T>> {
  const configured = getMedusaConfig();

  if (!configured.ok) return { ok: false, reason: configured.reason };

  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json",
  };

  if (init.token) headers.authorization = `Bearer ${init.token}`;

  try {
    const response = await fetch(`${configured.config.url}${path}`, {
      /* Une attente qui ne finit jamais fige l\'écran sans rien dire. */
      signal: backendTimeoutSignal(),
      method: init.method ?? "GET",
      headers,
      body: init.body ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => ({}))) as Raw;

    if (!response.ok) {
      return {
        ok: false,
        reason:
          str(payload.message) ?? `Le backend a répondu ${response.status}.`,
      };
    }

    return { ok: true, data: payload as T };
  } catch (error) {
    /*
      Un abandon n\'est pas une panne réseau : il vaut la peine
      d\'être réessayé, et le dire évite de renoncer.
    */
    if (isTimeout(error)) {
      return { ok: false, reason: TIMEOUT_MESSAGE };
    }

    const message = error instanceof Error ? error.message : String(error);

    return { ok: false, reason: `Backend injoignable : ${message}` };
  }
}

async function readToken() {
  const store = await cookies();

  return store.get(TOKEN_COOKIE)?.value ?? null;
}

/*
  Le jeton vit dans un cookie httpOnly : jamais lisible par du
  JavaScript de page, donc hors de portée d'un script tiers. Il ouvre
  l'administration de la marketplace entière — c'est le jeton le plus
  sensible du site.

  Douze heures, et pas une semaine comme le compte client : une session
  d'administration oubliée sur un poste partagé est un risque d'une
  autre nature qu'un panier oublié.
*/
async function writeToken(token: string) {
  const store = await cookies();

  store.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearAdminSession() {
  const store = await cookies();

  store.delete(TOKEN_COOKIE);
}

export async function loginAdmin(
  email: string,
  password: string
): Promise<Result<AdminUser>> {
  const auth = await request<{ token?: string }>("/auth/user/emailpass", {
    method: "POST",
    body: { email, password },
  });

  if (!auth.ok) {
    /*
      Pas de distinction entre « adresse inconnue » et « mot de passe
      incorrect » : la faire permettrait d'énumérer les comptes du
      personnel, qui sont exactement ceux qu'on cherche à atteindre.
    */
    return { ok: false, reason: "Adresse e-mail ou mot de passe incorrect." };
  }

  const token = str(auth.data.token);

  if (!token) return { ok: false, reason: "Aucun jeton n'a été délivré." };

  /*
    Le jeton est vérifié avant d'être posé. Medusa délivre un jeton
    d'authentification même à quelqu'un qui n'a pas de compte de
    personnel rattaché ; sans ce contrôle, il entrerait dans un espace
    d'administration vide en croyant y être admis.
  */
  const me = await request<{ user?: Raw }>("/admin/users/me", { token });

  if (!me.ok || !me.data.user?.id) {
    return {
      ok: false,
      reason:
        "Ce compte n'est pas un compte du personnel MACHÉ. Pour acheter ou vendre, utilisez l'espace client ou l'espace vendeur.",
    };
  }

  await writeToken(token);

  return { ok: true, data: parseUser(me.data.user) };
}

function parseUser(raw: Raw): AdminUser {
  return {
    id: String(raw.id ?? ""),
    email: str(raw.email) ?? "",
    firstName: str(raw.first_name),
    lastName: str(raw.last_name),
  };
}

/*
  Le compte connecté, ou `null`.

  Le jeton n'est pas cru sur parole : il est présenté au backend à
  chaque fois. Un jeton expiré, révoqué, ou émis pour un compte
  supprimé doit fermer la porte — se fier au seul cookie la laisserait
  ouverte jusqu'à son expiration.
*/
export async function getAdminUser(): Promise<AdminUser | null> {
  const token = await readToken();

  if (!token) return null;

  const me = await request<{ user?: Raw }>("/admin/users/me", { token });

  if (!me.ok || !me.data.user?.id) return null;

  return parseUser(me.data.user);
}

export type MarketplaceState = {
  sellers: number;
  pending: number;
  /* Null quand le chiffre n'a pas pu être lu : zéro serait un mensonge. */
  orders: number | null;
};

/*
  L'état réel de la marketplace, lu dans Medusa.

  Chaque nombre est lu, jamais estimé. Quand une lecture échoue, elle
  rend `null` plutôt que zéro : « aucune commande » et « je n'ai pas pu
  compter » sont deux choses différentes, et la seconde ne doit pas se
  déguiser en première.
*/
export async function fetchMarketplaceState(): Promise<Result<MarketplaceState>> {
  const token = await readToken();

  if (!token) return { ok: false, reason: "Session expirée." };

  const sellers = await request<{ sellers?: Raw[]; count?: number }>(
    "/admin/sellers?limit=200",
    { token }
  );

  if (!sellers.ok) return sellers;

  const rows = Array.isArray(sellers.data.sellers) ? sellers.data.sellers : [];

  /*
    Une boutique « pending_approval » attend une décision humaine.
    C'est la seule urgence dont cet espace est responsable.
  */
  const pending = rows.filter(
    (row) => str(row.status) === "pending_approval"
  ).length;

  const orders = await request<{ count?: number }>("/admin/orders?limit=1", {
    token,
  });

  return {
    ok: true,
    data: {
      sellers: Number(sellers.data.count) || rows.length,
      pending,
      orders: orders.ok ? Number(orders.data.count) || 0 : null,
    },
  };
}

export type AdminSeller = {
  id: string;
  name: string;
  handle: string;
  email: string | null;
  status: string;
  createdAt: string | null;
};

/*
  Les boutiques, telles que le backend les connaît.

  Lecture seule. Approuver, suspendre ou vérifier une boutique se fait
  dans le panneau du backend : refaire ici les écrans d'action
  reviendrait à entretenir deux versions du même geste, qui finiraient
  par diverger.
*/
export async function fetchSellers(): Promise<Result<AdminSeller[]>> {
  const token = await readToken();

  if (!token) return { ok: false, reason: "Session expirée." };

  const result = await request<{ sellers?: Raw[] }>("/admin/sellers?limit=200", {
    token,
  });

  if (!result.ok) return result;

  const rows = Array.isArray(result.data.sellers) ? result.data.sellers : [];

  return {
    ok: true,
    data: rows.map((row) => ({
      id: String(row.id ?? ""),
      name: str(row.name) ?? "Boutique",
      handle: str(row.handle) ?? "",
      email: str(row.email),
      status: str(row.status) ?? "unknown",
      createdAt: str(row.created_at),
    })),
  };
}

/*
  Les statuts de Mercur, en français, dits pour ce qu'ils sont.

  « pending_approval » n'est pas « en cours de traitement » : personne
  ne traite rien tant qu'un humain ne décide pas. Le libellé nomme donc
  l'attente d'une décision, pas un traitement imaginaire.
*/
export const SELLER_STATUS_LABELS: Record<string, string> = {
  pending_approval: "Attend votre décision",
  /* Mercur nomme « open » une boutique approuvée et ouverte à la vente. */
  open: "Ouverte",
  active: "Ouverte",
  suspended: "Suspendue",
  rejected: "Refusée",
  unknown: "Statut inconnu",
};

/*
  Une boutique approuvée. Sert à colorer son état sans réécrire la
  liste des statuts à chaque endroit qui l'affiche.
*/
export function sellerIsOpen(status: string): boolean {
  return status === "open" || status === "active";
}

/*
  Approuver une boutique.

  C'est la seule décision d'administration qui vit ici plutôt que dans
  le panneau du backend, et elle y vit pour une raison précise : c'est
  la seule que la vue d'ensemble signale comme urgente. Afficher
  « 5 boutiques attendent votre décision » sans permettre de décider
  laisse le commerçant attendre pendant qu'on cherche le bon écran
  ailleurs.

  Elle n'est pas réimplémentée pour autant : elle appelle la route
  d'approbation de Mercur, qui exécute son propre workflow. Le panneau
  et cette page font donc littéralement la même chose, et ne peuvent
  pas diverger.

  Il n'y a pas de refus ici. Refuser une boutique est une décision
  lourde, souvent à motiver, parfois à revenir dessus : elle appartient
  au panneau, qui en tient l'historique.
*/
export async function approveSeller(sellerId: string): Promise<Result<true>> {
  const token = await readToken();

  if (!token) return { ok: false, reason: "Session expirée." };

  const result = await request<Raw>(
    `/admin/sellers/${encodeURIComponent(sellerId)}/approve`,
    { method: "POST", body: {}, token }
  );

  if (!result.ok) return result;

  return { ok: true, data: true };
}
