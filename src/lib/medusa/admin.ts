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

/*
  Le jeton d'une connexion qui attend son second facteur.

  Il est SÉPARÉ du cookie de session, et c'est tout l'intérêt : tant
  qu'il est là et pas l'autre, aucune page d'administration ne
  s'ouvre — `getAdminUser` ne lit que le cookie de session.

  Ce qu'il faut savoir et ne pas se cacher : ce jeton est un vrai jeton
  d'administration, délivré par Medusa sur le seul mot de passe. Le
  second facteur l'empêche d'ouvrir les écrans MACHÉ ; il ne le rend
  pas inopérant face à l'API du backend. D'où sa durée très courte.
*/
const PENDING_COOKIE = "mache_admin_pending";

/* Dix minutes : le temps de sortir son téléphone, pas celui d'oublier l'onglet. */
const PENDING_MAX_AGE = 60 * 10;

export type AdminUser = {
  /* Vrai quand la connexion attend encore son code à usage unique. */
  needsCode?: boolean;
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

  /*
    Le second facteur, s'il est actif sur ce compte.

    Une lecture qui ÉCHOUE n'ouvre pas la porte : on refuse la
    connexion. C'est le sens du garde-fou — si l'on ne peut pas savoir
    s'il faut un code, supposer que non annulerait la protection
    exactement le jour où le backend hoquette.
  */
  const status = await request<{ enabled?: boolean }>("/admin/mache/2fa", { token });

  if (!status.ok) {
    return {
      ok: false,
      reason:
        "Impossible de vérifier si ce compte demande un code. Par précaution, la connexion est refusée. Réessayez dans un instant.",
    };
  }

  if (status.data.enabled === true) {
    await writePending(token);

    return { ok: true, data: { ...parseUser(me.data.user), needsCode: true } };
  }

  await writeToken(token);

  return { ok: true, data: { ...parseUser(me.data.user), needsCode: false } };
}

async function writePending(token: string) {
  const store = await cookies();

  store.set(PENDING_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: PENDING_MAX_AGE,
  });
}

async function readPending() {
  const store = await cookies();

  return store.get(PENDING_COOKIE)?.value ?? null;
}

export async function clearPendingAdmin() {
  const store = await cookies();

  store.delete(PENDING_COOKIE);
}

/* Y a-t-il une connexion qui attend son code ? */
export async function adminAwaitingCode(): Promise<boolean> {
  return (await readPending()) !== null;
}

/*
  Le second facteur est présenté. S'il passe, la connexion en attente
  devient une session.

  La promotion se fait ICI et nulle part ailleurs : c'est le seul
  endroit du storefront qui transforme un jeton en attente en session
  d'administration.
*/
export async function verifyAdminSecondFactor(input: {
  code?: string;
  recovery?: string;
}): Promise<Result<{ usedRecovery: boolean; recoveryLeft: number | null }>> {
  const token = await readPending();

  if (!token) {
    return {
      ok: false,
      reason: "La connexion a expiré. Saisissez à nouveau votre mot de passe.",
    };
  }

  const result = await request<{ used?: string; recovery_left?: number }>(
    "/admin/mache/2fa",
    {
      method: "POST",
      token,
      body: input.recovery
        ? { action: "verify", recovery: input.recovery }
        : { action: "verify", code: input.code },
    }
  );

  if (!result.ok) return result;

  await writeToken(token);
  await clearPendingAdmin();

  return {
    ok: true,
    data: {
      usedRecovery: result.data.used === "recovery",
      recoveryLeft:
        typeof result.data.recovery_left === "number"
          ? result.data.recovery_left
          : null,
    },
  };
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
  /*
    La vérification par MACHÉ. Elle vit dans `is_premium`, un champ du
    modèle vendeur — PAS dans `metadata`, que le vendeur écrit
    lui-même. C'est toute la différence : un badge qu'on peut
    s'attribuer soi-même ne vérifie rien.

    Vérifié dans le contrat de Mercur avant de s'en servir : ce champ
    n'apparaît pas dans ce qu'une route vendeur accepte, et apparaît
    dans ce qu'une route d'administration accepte.
  */
  verified: boolean;
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
      verified: row.is_premium === true,
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

/*
  Accorder ou retirer la vérification d'une boutique.

  Approuver et vérifier ne sont PAS la même décision, et le site les
  confondait : il promettait un « badge vérifié, accordé après contrôle
  des documents » à trois endroits, sans qu'aucun moyen de l'accorder
  n'existe.

  - Approuver ouvre la boutique : elle peut vendre, elle apparaît dans
    le catalogue. C'est une décision d'accès.
  - Vérifier dit que MACHÉ a contrôlé les documents de l'entreprise.
    C'est une affirmation faite aux acheteurs, et elle engage MACHÉ.

  Une boutique peut vendre sans être vérifiée. L'inverse n'aurait pas
  de sens.

  Où c'est rangé, et pourquoi là

  Dans `is_premium`, un champ du modèle vendeur — et non dans
  `metadata`, que le vendeur écrit lui-même. Vérifié dans le contrat de
  Mercur : ce champ n'existe pas dans ce qu'une route vendeur accepte.
  Un vendeur ne peut donc pas se déclarer vérifié, ce qui est la seule
  chose qui donne un sens au badge.
*/
export async function setSellerVerified(
  sellerId: string,
  verified: boolean
): Promise<Result<true>> {
  const token = await readToken();

  if (!token) return { ok: false, reason: "Session expirée." };

  const result = await request<Raw>(
    `/admin/sellers/${encodeURIComponent(sellerId)}`,
    { method: "POST", body: { is_premium: verified }, token }
  );

  if (!result.ok) return result;

  return { ok: true, data: true };
}

/* -------------------------------------------------------------------------- */
/* Ce que MACHÉ gagne                                                         */
/* -------------------------------------------------------------------------- */

/*
  Le mot juste : DÛ, pas encaissé.

  MACHÉ ne perçoit pas les paiements — l'acheteur règle le vendeur en
  main propre. Ces montants sont donc des créances, pas de la trésorerie.
  Le type porte ce nom pour que personne ne puisse l'oublier en lisant
  l'écran qui s'en sert.
*/
export type RevenueBucket = {
  currencyCode: string;
  /* Ce que les acheteurs ont payé aux vendeurs, dans cette devise. */
  volume: number;
  /* Ce que MACHÉ a gagné dessus, et doit facturer. */
  commission: number;
  orders: number;
  /*
    Le taux réellement constaté, commission divisée par volume. Il tient
    compte des taux réduits et des commandes passées sous un ancien
    barème — un écart avec le taux affiché est une information, pas une
    erreur d'arrondi.
  */
  effectiveRate: number | null;
};

export type MacheRevenue = {
  days: number;
  current: RevenueBucket[];
  previous: RevenueBucket[];
  /* Commissions sur frais de port, qu'on ne sait pas rattacher à une devise. */
  unattributed: number;
  subscriptionsNote: string;
  ordersRead: number;
  truncated: boolean;
};

function bucket(raw: Raw): RevenueBucket {
  const rate = raw.effective_rate;

  return {
    currencyCode: str(raw.currency_code) ?? "—",
    volume: Number(raw.volume) || 0,
    commission: Number(raw.commission) || 0,
    orders: Number(raw.orders) || 0,
    effectiveRate: typeof rate === "number" && Number.isFinite(rate) ? rate : null,
  };
}

export async function fetchMacheRevenue(days = 30): Promise<Result<MacheRevenue>> {
  const token = await readToken();

  if (!token) return { ok: false, reason: "Session expirée." };

  const result = await request<{
    period?: { days?: number };
    currencies?: Raw[];
    previous?: Raw[];
    unattributed_commission?: number;
    subscriptions?: { note?: string };
    orders_read?: number;
    truncated?: boolean;
  }>(`/admin/mache/revenue?days=${days}`, { token });

  if (!result.ok) return result;

  return {
    ok: true,
    data: {
      days: Number(result.data.period?.days) || days,
      current: (result.data.currencies ?? []).map(bucket),
      previous: (result.data.previous ?? []).map(bucket),
      unattributed: Number(result.data.unattributed_commission) || 0,
      subscriptionsNote: str(result.data.subscriptions?.note) ?? "",
      ordersRead: Number(result.data.orders_read) || 0,
      truncated: result.data.truncated === true,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* L'habillage saisonnier du site                                             */
/* -------------------------------------------------------------------------- */

export type AdminTheme = {
  key: string;
  label: string;
  description: string;
  banner: string | null;
  variables: Record<string, string>;
};

export async function fetchThemes(): Promise<
  Result<{ active: string; themes: AdminTheme[] }>
> {
  const token = await readToken();

  if (!token) return { ok: false, reason: "Session expirée." };

  const result = await request<{ active?: string; themes?: Raw[] }>(
    "/admin/mache/theme",
    { token }
  );

  if (!result.ok) return result;

  return {
    ok: true,
    data: {
      active: str(result.data.active) ?? "default",
      themes: (result.data.themes ?? []).map((raw) => ({
        key: str(raw.key) ?? "default",
        label: str(raw.label) ?? "",
        description: str(raw.description) ?? "",
        banner: str(raw.banner),
        variables:
          raw.variables && typeof raw.variables === "object"
            ? (raw.variables as Record<string, string>)
            : {},
      })),
    },
  };
}

/*
  Le storefront garde l'habillage cinq minutes en cache. Après un
  changement, il faut donc vider cette entrée — sinon l'administrateur
  voit « enregistré », recharge l'accueil, et ne constate rien pendant
  cinq minutes. Il en conclurait que ça n'a pas marché, et
  recommencerait.

  L'invalidation appartient à l'appelant (une action serveur), car
  `revalidateTag` n'a de sens que dans ce contexte.
*/
export async function setSiteTheme(key: string): Promise<Result<true>> {
  const token = await readToken();

  if (!token) return { ok: false, reason: "Session expirée." };

  const result = await request<Raw>("/admin/mache/theme", {
    method: "POST",
    token,
    body: { theme: key },
  });

  if (!result.ok) return result;

  return { ok: true, data: true };
}

/* -------------------------------------------------------------------------- */
/* Réglage du second facteur                                                  */
/* -------------------------------------------------------------------------- */

export type TwoFactorState = {
  enabled: boolean;
  pending: boolean;
  recoveryLeft: number;
  locked: boolean;
  scopeNote: string;
};

export async function fetchTwoFactor(): Promise<Result<TwoFactorState>> {
  const token = await readToken();

  if (!token) return { ok: false, reason: "Session expirée." };

  const result = await request<Raw>("/admin/mache/2fa", { token });

  if (!result.ok) return result;

  return {
    ok: true,
    data: {
      enabled: result.data.enabled === true,
      pending: result.data.pending === true,
      recoveryLeft: Number(result.data.recovery_left) || 0,
      locked: result.data.locked === true,
      scopeNote: str(result.data.scope_note) ?? "",
    },
  };
}

/*
  Démarre l'inscription. C'est le seul appel qui rend le secret : il
  faut bien que l'application d'authentification puisse le lire.
*/
export async function startTwoFactor(): Promise<
  Result<{ secret: string; uri: string }>
> {
  const token = await readToken();

  if (!token) return { ok: false, reason: "Session expirée." };

  const result = await request<{ secret?: string; uri?: string }>(
    "/admin/mache/2fa",
    { method: "POST", token, body: { action: "start" } }
  );

  if (!result.ok) return result;

  const secret = str(result.data.secret);
  const uri = str(result.data.uri);

  if (!secret || !uri) {
    return { ok: false, reason: "Le backend n'a pas rendu de secret." };
  }

  return { ok: true, data: { secret, uri } };
}

/*
  Confirme l'inscription avec un premier code valide, et rend les codes
  de secours — la seule et unique fois où ils sont lisibles.
*/
export async function confirmTwoFactor(
  code: string
): Promise<Result<string[]>> {
  const token = await readToken();

  if (!token) return { ok: false, reason: "Session expirée." };

  const result = await request<{ recovery_codes?: unknown }>("/admin/mache/2fa", {
    method: "POST",
    token,
    body: { action: "confirm", code },
  });

  if (!result.ok) return result;

  const codes = Array.isArray(result.data.recovery_codes)
    ? result.data.recovery_codes.filter(
        (item): item is string => typeof item === "string"
      )
    : [];

  return { ok: true, data: codes };
}

export async function disableTwoFactor(input: {
  code?: string;
  recovery?: string;
}): Promise<Result<true>> {
  const token = await readToken();

  if (!token) return { ok: false, reason: "Session expirée." };

  const result = await request<Raw>("/admin/mache/2fa", {
    method: "POST",
    token,
    body: { action: "disable", ...input },
  });

  if (!result.ok) return result;

  return { ok: true, data: true };
}
