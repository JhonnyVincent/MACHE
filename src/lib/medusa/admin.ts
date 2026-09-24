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
  const status = await request<{ enabled?: boolean }>("/admin/mache/two-factor", { token });

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
    "/admin/mache/two-factor",
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
  /* Mercur distingue la résiliation de la suspension. Le site aussi. */
  terminated: "Résiliée",
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

  const result = await request<Raw>("/admin/mache/two-factor", { token });

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
    "/admin/mache/two-factor",
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

  const result = await request<{ recovery_codes?: unknown }>("/admin/mache/two-factor", {
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

  const result = await request<Raw>("/admin/mache/two-factor", {
    method: "POST",
    token,
    body: { action: "disable", ...input },
  });

  if (!result.ok) return result;

  return { ok: true, data: true };
}

/* -------------------------------------------------------------------------- */
/* Contrats                                                                   */
/* -------------------------------------------------------------------------- */

export type AdminContract = {
  id: string;
  displayId: number;
  title: string;
  summary: string | null;
  body: string;
  version: number;
  family: string;
  contentHash: string | null;
  status: "draft" | "published" | "archived";
  publishedAt: string | null;
  createdAt: string | null;
};

export type AdminSignature = {
  id: string;
  sellerId: string;
  status: "sent" | "viewed" | "signed" | "declined" | "revoked";
  sentAt: string | null;
  viewedAt: string | null;
  signedAt: string | null;
  declinedAt: string | null;
  signerName: string | null;
  signerRole: string | null;
  signerEmail: string | null;
  signerIp: string | null;
  declineReason: string | null;
  proofHash: string | null;
  dueAt: string | null;
};

export type SignatureTally = {
  sent: number;
  viewed: number;
  signed: number;
  declined: number;
  revoked: number;
};

function mapAdminContract(raw: Raw): AdminContract {
  return {
    id: String(raw.id ?? ""),
    displayId: Number(raw.display_id) || 0,
    title: str(raw.title) ?? "Contrat",
    summary: str(raw.summary),
    body: typeof raw.body === "string" ? raw.body : "",
    version: Number(raw.version) || 1,
    family: str(raw.family) ?? "",
    contentHash: str(raw.content_hash),
    status: (str(raw.status) ?? "draft") as AdminContract["status"],
    publishedAt: str(raw.published_at),
    createdAt: str(raw.created_at),
  };
}

function mapAdminSignature(raw: Raw): AdminSignature {
  return {
    id: String(raw.id ?? ""),
    sellerId: str(raw.seller_id) ?? "",
    status: (str(raw.status) ?? "sent") as AdminSignature["status"],
    sentAt: str(raw.sent_at),
    viewedAt: str(raw.viewed_at),
    signedAt: str(raw.signed_at),
    declinedAt: str(raw.declined_at),
    signerName: str(raw.signer_name),
    signerRole: str(raw.signer_role),
    signerEmail: str(raw.signer_email),
    signerIp: str(raw.signer_ip),
    declineReason: str(raw.decline_reason),
    proofHash: str(raw.proof_hash),
    dueAt: str(raw.due_at),
  };
}

async function contractRequest<T>(
  path: string,
  init: { method?: string; body?: unknown } = {}
): Promise<Result<T>> {
  const token = await readToken();

  if (!token) return { ok: false, reason: "Session expirée." };

  return request<T>(path, { ...init, token });
}

export async function fetchContracts(): Promise<Result<AdminContract[]>> {
  const result = await contractRequest<{ contracts?: Raw[] }>(
    "/admin/mache/contracts?limit=100"
  );

  if (!result.ok) return result;

  return { ok: true, data: (result.data.contracts ?? []).map(mapAdminContract) };
}

export async function fetchContract(id: string): Promise<Result<AdminContract>> {
  const result = await contractRequest<{ contract?: Raw }>(
    `/admin/mache/contracts/${encodeURIComponent(id)}`
  );

  if (!result.ok) return result;

  if (!result.data.contract) return { ok: false, reason: "Contrat introuvable." };

  return { ok: true, data: mapAdminContract(result.data.contract) };
}

export async function createContract(input: {
  title: string;
  summary?: string;
  body: string;
}): Promise<Result<AdminContract>> {
  const result = await contractRequest<{ contract?: Raw }>("/admin/mache/contracts", {
    method: "POST",
    body: { title: input.title, summary: input.summary, body: input.body },
  });

  if (!result.ok) return result;

  return { ok: true, data: mapAdminContract(result.data.contract ?? {}) };
}

/*
  Les quatre verbes du cycle de vie. Ils passent par la même route, avec
  une `action` — c'est le backend qui décide si l'état courant permet le
  geste demandé. Le storefront ne rejoue pas cette décision : deux
  jugements pour une question finissent par diverger, et c'est le plus
  permissif qui gagnerait.
*/
async function contractAction(
  id: string,
  payload: Record<string, unknown>
): Promise<Result<AdminContract>> {
  const result = await contractRequest<{ contract?: Raw }>(
    `/admin/mache/contracts/${encodeURIComponent(id)}`,
    { method: "POST", body: payload }
  );

  if (!result.ok) return result;

  return { ok: true, data: mapAdminContract(result.data.contract ?? {}) };
}

export function editContract(
  id: string,
  input: { title?: string; summary?: string; body?: string }
) {
  return contractAction(id, { action: "edit", ...input });
}

export function publishContract(id: string) {
  return contractAction(id, { action: "publish" });
}

export function newContractVersion(
  id: string,
  input: { body: string; title?: string; summary?: string }
) {
  return contractAction(id, { action: "new_version", ...input });
}

export function archiveContract(id: string) {
  return contractAction(id, { action: "archive" });
}

export async function sendContract(
  id: string,
  sellerIds: string[],
  dueAt?: string
): Promise<Result<{ sent: number; skipped: number }>> {
  const result = await contractRequest<{ sent?: number; skipped?: number }>(
    `/admin/mache/contracts/${encodeURIComponent(id)}/send`,
    { method: "POST", body: { seller_ids: sellerIds, due_at: dueAt } }
  );

  if (!result.ok) return result;

  return {
    ok: true,
    data: {
      sent: Number(result.data.sent) || 0,
      skipped: Number(result.data.skipped) || 0,
    },
  };
}

export async function fetchContractSignatures(
  id: string
): Promise<Result<{ signatures: AdminSignature[]; tally: SignatureTally }>> {
  const result = await contractRequest<{ signatures?: Raw[]; tally?: Raw }>(
    `/admin/mache/contracts/${encodeURIComponent(id)}/signatures`
  );

  if (!result.ok) return result;

  const raw = result.data.tally ?? {};

  return {
    ok: true,
    data: {
      signatures: (result.data.signatures ?? []).map(mapAdminSignature),
      tally: {
        sent: Number(raw.sent) || 0,
        viewed: Number(raw.viewed) || 0,
        signed: Number(raw.signed) || 0,
        declined: Number(raw.declined) || 0,
        revoked: Number(raw.revoked) || 0,
      },
    },
  };
}

export async function revokeSignature(
  contractId: string,
  signatureId: string
): Promise<Result<true>> {
  const result = await contractRequest<Raw>(
    `/admin/mache/contracts/${encodeURIComponent(contractId)}/signatures`,
    { method: "POST", body: { signature_id: signatureId } }
  );

  if (!result.ok) return result;

  return { ok: true, data: true };
}

export const CONTRACT_STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  published: "Publié",
  archived: "Archivé",
};

export const SIGNATURE_STATUS_LABELS: Record<string, string> = {
  sent: "Envoyé, non lu",
  viewed: "Lu, sans réponse",
  signed: "Signé",
  declined: "Refusé",
  revoked: "Retiré",
};

/* -------------------------------------------------------------------------- */
/* Les textes publics du site                                                 */
/* -------------------------------------------------------------------------- */

export type PolicyPage = {
  slug: string;
  label: string;
  path: string;
  hint: string;
};

export type AdminPolicy = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  body: string;
  version: number;
  contentHash: string | null;
  status: "draft" | "live" | "archived";
  publishedAt: string | null;
  changeNote: string | null;
  updatedAt: string | null;
};

function mapPolicy(raw: Raw): AdminPolicy {
  return {
    id: String(raw.id ?? ""),
    slug: str(raw.slug) ?? "",
    title: str(raw.title) ?? "",
    summary: str(raw.summary),
    body: typeof raw.body === "string" ? raw.body : "",
    version: Number(raw.version) || 1,
    contentHash: str(raw.content_hash),
    status: (str(raw.status) ?? "draft") as AdminPolicy["status"],
    publishedAt: str(raw.published_at),
    changeNote: str(raw.change_note),
    updatedAt: str(raw.updated_at),
  };
}

export async function fetchPolicies(): Promise<
  Result<{ policies: AdminPolicy[]; pages: PolicyPage[] }>
> {
  const result = await contractRequest<{ policies?: Raw[]; pages?: Raw[] }>(
    "/admin/mache/policies"
  );

  if (!result.ok) return result;

  return {
    ok: true,
    data: {
      policies: (result.data.policies ?? []).map(mapPolicy),
      pages: (result.data.pages ?? []).map((raw) => ({
        slug: str(raw.slug) ?? "",
        label: str(raw.label) ?? "",
        path: str(raw.path) ?? "",
        hint: str(raw.hint) ?? "",
      })),
    },
  };
}

export async function fetchPolicyVersion(id: string): Promise<Result<AdminPolicy>> {
  const result = await contractRequest<{ policy?: Raw }>(
    `/admin/mache/policies/${encodeURIComponent(id)}`
  );

  if (!result.ok) return result;

  if (!result.data.policy) return { ok: false, reason: "Texte introuvable." };

  return { ok: true, data: mapPolicy(result.data.policy) };
}

export async function createPolicy(input: {
  slug: string;
  title: string;
  summary?: string;
  body: string;
  changeNote?: string;
}): Promise<Result<AdminPolicy>> {
  const result = await contractRequest<{ policy?: Raw }>("/admin/mache/policies", {
    method: "POST",
    body: {
      slug: input.slug,
      title: input.title,
      summary: input.summary,
      body: input.body,
      change_note: input.changeNote,
    },
  });

  if (!result.ok) return result;

  return { ok: true, data: mapPolicy(result.data.policy ?? {}) };
}

async function policyAction(
  id: string,
  payload: Record<string, unknown>
): Promise<Result<AdminPolicy>> {
  const result = await contractRequest<{ policy?: Raw }>(
    `/admin/mache/policies/${encodeURIComponent(id)}`,
    { method: "POST", body: payload }
  );

  if (!result.ok) return result;

  return { ok: true, data: mapPolicy(result.data.policy ?? {}) };
}

export function editPolicy(
  id: string,
  input: { title?: string; summary?: string; body?: string; changeNote?: string }
) {
  return policyAction(id, {
    action: "edit",
    title: input.title,
    summary: input.summary,
    body: input.body,
    change_note: input.changeNote,
  });
}

export function publishPolicy(id: string) {
  return policyAction(id, { action: "publish" });
}

export function newPolicyVersion(
  id: string,
  input: { body: string; title?: string; summary?: string; changeNote?: string }
) {
  return policyAction(id, {
    action: "new_version",
    body: input.body,
    title: input.title,
    summary: input.summary,
    change_note: input.changeNote,
  });
}

export function archivePolicy(id: string) {
  return policyAction(id, { action: "archive" });
}

export const POLICY_STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  live: "En vigueur",
  archived: "Version précédente",
};

/* -------------------------------------------------------------------------- */
/* Messagerie                                                                 */
/* -------------------------------------------------------------------------- */

export type AdminMessage = {
  id: string;
  author: "sender" | "mache";
  authorName: string;
  body: string;
  internal: boolean;
  createdAt: string | null;
};

export type AdminThread = {
  id: string;
  displayId: number;
  subject: string;
  category: string;
  fromName: string;
  fromEmail: string;
  fromPhone: string | null;
  customerId: string | null;
  sellerId: string | null;
  status: "open" | "answered" | "closed";
  awaitingMache: boolean;
  awaitingSender: boolean;
  lastMessageAt: string | null;
  createdAt: string | null;
  messages: AdminMessage[];
};

function mapAdminThread(raw: Raw): AdminThread {
  const messages = Array.isArray(raw.messages) ? (raw.messages as Raw[]) : [];

  return {
    id: String(raw.id ?? ""),
    displayId: Number(raw.display_id) || 0,
    subject: str(raw.subject) ?? "",
    category: str(raw.category) ?? "question",
    fromName: str(raw.from_name) ?? "",
    fromEmail: str(raw.from_email) ?? "",
    fromPhone: str(raw.from_phone),
    customerId: str(raw.customer_id),
    sellerId: str(raw.seller_id),
    status: (str(raw.status) ?? "open") as AdminThread["status"],
    awaitingMache: raw.awaiting_mache === true,
    awaitingSender: raw.awaiting_sender === true,
    lastMessageAt: str(raw.last_message_at),
    createdAt: str(raw.created_at),
    messages: messages.map((message) => ({
      id: String(message.id ?? ""),
      author: (str(message.author) ?? "sender") as AdminMessage["author"],
      authorName: str(message.author_name) ?? "",
      body: typeof message.body === "string" ? message.body : "",
      internal: message.internal === true,
      createdAt: str(message.created_at),
    })),
  };
}

export async function fetchThreads(
  status?: string
): Promise<Result<{ threads: AdminThread[]; waiting: number }>> {
  const search = status ? `?status=${encodeURIComponent(status)}` : "";

  const result = await contractRequest<{ threads?: Raw[]; waiting?: number }>(
    `/admin/mache/messages${search}`
  );

  if (!result.ok) return result;

  return {
    ok: true,
    data: {
      threads: (result.data.threads ?? []).map(mapAdminThread),
      waiting: Number(result.data.waiting) || 0,
    },
  };
}

export async function fetchThread(id: string): Promise<Result<AdminThread>> {
  const result = await contractRequest<{ thread?: Raw }>(
    `/admin/mache/messages/${encodeURIComponent(id)}`
  );

  if (!result.ok) return result;

  if (!result.data.thread) return { ok: false, reason: "Conversation introuvable." };

  return { ok: true, data: mapAdminThread(result.data.thread) };
}

async function threadAction(
  id: string,
  payload: Record<string, unknown>
): Promise<Result<AdminThread>> {
  const result = await contractRequest<{ thread?: Raw }>(
    `/admin/mache/messages/${encodeURIComponent(id)}`,
    { method: "POST", body: payload }
  );

  if (!result.ok) return result;

  return { ok: true, data: mapAdminThread(result.data.thread ?? {}) };
}

export function replyToCustomer(id: string, message: string) {
  return threadAction(id, { action: "reply", message });
}

/*
  Une note interne ne part chez personne. Elle porte le nom de celui qui
  l'écrit, pour qu'on sache plus tard qui a vérifié quoi.
*/
export function addInternalNote(id: string, message: string, authorName: string) {
  return threadAction(id, { action: "note", message, author_name: authorName });
}

export function closeThread(id: string) {
  return threadAction(id, { action: "close" });
}

export function reopenThread(id: string) {
  return threadAction(id, { action: "reopen" });
}

export const THREAD_CATEGORY_LABELS: Record<string, string> = {
  question: "Question",
  commande: "Commande",
  boutique: "Boutique",
  signalement: "Signalement",
  autre: "Autre",
};

export const ADMIN_THREAD_STATUS: Record<string, string> = {
  open: "À traiter",
  answered: "Répondu",
  closed: "Close",
};

/* -------------------------------------------------------------------------- */
/* Suspendre, rétablir, résilier une boutique                                 */
/* -------------------------------------------------------------------------- */

/*
  Ces gestes passent par les routes DÉDIÉES de Mercur — /suspend,
  /unsuspend, /terminate, /unterminate — et non par une écriture
  directe du statut.

  La différence n'est pas cosmétique. Ces routes déclenchent chacune un
  workflow : ce qui doit accompagner une suspension — retirer la
  boutique du catalogue, ce que Mercur décide d'y attacher aujourd'hui
  et demain — s'exécute. Écrire `status: "suspended"` à la main
  changerait une colonne et laisserait le reste en place : une boutique
  marquée suspendue qui continuerait de vendre.

  RIEN N'EST SUPPRIMÉ, ET C'EST DÉLIBÉRÉ

  Supprimer un vendeur emporterait ses commandes passées et les
  commissions qu'il doit à MACHÉ. Les deux états de Mercur préservent
  l'historique comptable :

  - SUSPENDRE est réversible. La boutique ne vend plus ; elle peut
    revenir.
  - RÉSILIER met fin à la relation. Réversible aussi, techniquement,
    mais ce n'est pas le même acte : l'écran les présente séparément
    pour qu'on ne résilie pas en croyant suspendre.

  Le motif est facultatif côté Mercur. L'écran le demande quand même :
  six mois plus tard, une boutique suspendue sans motif est une
  décision que plus personne ne sait justifier — ni défendre si le
  vendeur la conteste.
*/
async function sellerAction(
  sellerId: string,
  verb: "suspend" | "unsuspend" | "terminate" | "unterminate",
  reason?: string
): Promise<Result<true>> {
  const token = await readToken();

  if (!token) return { ok: false, reason: "Session expirée." };

  const result = await request<Raw>(
    `/admin/sellers/${encodeURIComponent(sellerId)}/${verb}`,
    {
      method: "POST",
      /*
        Le motif n'est envoyé que s'il y en a un : Mercur l'accepte
        optionnel, et transmettre une chaîne vide l'enregistrerait comme
        un motif — un motif vide, qui se lirait plus tard comme « on
        n'avait rien à dire ».
      */
      body: reason ? { reason } : {},
      token,
    }
  );

  if (!result.ok) return result;

  return { ok: true, data: true };
}

export function suspendSeller(sellerId: string, reason?: string) {
  return sellerAction(sellerId, "suspend", reason);
}

export function unsuspendSeller(sellerId: string) {
  return sellerAction(sellerId, "unsuspend");
}

export function terminateSeller(sellerId: string, reason?: string) {
  return sellerAction(sellerId, "terminate", reason);
}

export function unterminateSeller(sellerId: string) {
  return sellerAction(sellerId, "unterminate");
}
