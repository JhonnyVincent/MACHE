/*
  Compte client, côté Medusa.

  Pourquoi ce fichier existe

  Le tunnel de commande a été ouvert avant que le storefront sache
  authentifier un client : on pouvait donc commander sans jamais revoir sa
  commande. `/store/orders` exige une session client, et l'espace client
  lisait encore les commandes Supabase, c'est-à-dire des commandes qui
  n'existent plus.

  Le jeton

  Medusa rend un JWT à l'inscription comme à la connexion. Il est conservé
  dans un cookie httpOnly : jamais lisible par du JavaScript de page, donc
  hors de portée d'un script tiers injecté. Il n'est lu que côté serveur,
  et joint aux requêtes en en-tête Authorization.

  Ce que ce fichier ne couvre pas

  L'administration, les agents et les partenaires restent sur les rôles
  Supabase : Medusa ne connaît pas ces métiers, qui sont propres à MACHÉ.
  Les vendeurs, eux, s'authentifient sur le panneau Mercur. Trois publics,
  trois portes — mais une seule par public, jamais deux pour le même.
*/

import { cookies } from "next/headers";
import { getMedusaConfig } from "./config";
import {
  backendTimeoutSignal,
  isTimeout,
  TIMEOUT_MESSAGE,
} from "./timeout";

const TOKEN_COOKIE = "mache_customer_token";

export type Customer = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
};

export type CustomerAddress = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  address1: string;
  address2: string | null;
  city: string;
  province: string | null;
  postalCode: string | null;
  countryCode: string;
  phone: string | null;
  isDefaultShipping: boolean;
};

export type CustomerOrder = {
  id: string;
  displayId: number | null;
  createdAt: string | null;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  total: number;
  currency: string;
  itemCount: number;
  items: {
    id: string;
    title: string;
    quantity: number;
    thumbnail: string | null;
    /*
      Nécessaire pour déposer un avis : Mercur n'autorise à noter qu'un
      produit effectivement commandé, et veut son identifiant.
    */
    productId: string | null;
    productHandle: string | null;
  }[];
};

type Raw = Record<string, unknown>;
type Result<T> = { ok: true; data: T } | { ok: false; reason: string };

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function num(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function request<T>(
  path: string,
  init: { method?: string; body?: unknown; token?: string | null } = {}
): Promise<Result<T>> {
  const configured = getMedusaConfig();

  if (!configured.ok) return { ok: false, reason: configured.reason };

  const headers: Record<string, string> = {
    "x-publishable-api-key": configured.config.key,
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
        reason: str(payload.message) ?? `Le backend a répondu ${response.status}.`,
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

async function writeToken(token: string) {
  const store = await cookies();

  store.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearCustomerSession() {
  const store = await cookies();
  store.delete(TOKEN_COOKIE);
}

/*
  Inscription — trois appels, et le troisième n'est pas optionnel.

  Medusa délivre à l'inscription un jeton qui ne sert QU'À créer la fiche
  client : présenté à /store/orders, il renvoie 401. Vérifié, jeton en
  main. Le conserver comme session donnerait un compte tout neuf dont
  l'espace client répondrait « commandes indisponibles » — une panne
  silencieuse, que l'utilisateur mettrait sur le compte du site.

  On enchaîne donc par une connexion, dont le jeton est celui de la
  session. C'est aussi lui qui rattache le panier au client : sans ce
  rattachement, la commande part sur un client anonyme et n'apparaît
  jamais dans l'espace de la personne qui vient de la passer.
*/
export async function registerCustomer(
  email: string,
  password: string,
  firstName: string,
  lastName: string
): Promise<Result<Customer>> {
  const auth = await request<{ token?: string }>(
    "/auth/customer/emailpass/register",
    { method: "POST", body: { email, password } }
  );

  if (!auth.ok) return auth;

  const token = str(auth.data.token);

  if (!token) return { ok: false, reason: "Aucun jeton n'a été délivré." };

  const created = await request<{ customer: Raw }>("/store/customers", {
    method: "POST",
    token,
    body: { email, first_name: firstName, last_name: lastName },
  });

  if (!created.ok) return created;

  /*
    Connexion immédiate : c'est ce jeton-ci qui ouvre /store/orders et
    rattache le panier. Si elle échoue, le compte existe bel et bien — on
    le dit, plutôt que de laisser la personne devant un espace vide.
  */
  const session = await request<{ token?: string }>("/auth/customer/emailpass", {
    method: "POST",
    body: { email, password },
  });

  const sessionToken = session.ok ? str(session.data.token) : null;

  if (!sessionToken) {
    return {
      ok: false,
      reason:
        "Votre compte a bien été créé, mais la connexion automatique a échoué. Connectez-vous avec votre adresse e-mail et votre mot de passe.",
    };
  }

  await writeToken(sessionToken);

  const customer = created.data.customer;

  return {
    ok: true,
    data: {
      id: String(customer.id),
      email: str(customer.email) ?? email,
      firstName: str(customer.first_name),
      lastName: str(customer.last_name),
      phone: str(customer.phone),
    },
  };
}

export async function loginCustomer(
  email: string,
  password: string
): Promise<Result<true>> {
  const auth = await request<{ token?: string }>("/auth/customer/emailpass", {
    method: "POST",
    body: { email, password },
  });

  if (!auth.ok) {
    /*
      On ne distingue pas « e-mail inconnu » de « mot de passe faux » :
      le faire permettrait d'énumérer les comptes existants.
    */
    return { ok: false, reason: "Adresse e-mail ou mot de passe incorrect." };
  }

  const token = str(auth.data.token);

  if (!token) return { ok: false, reason: "Aucun jeton n'a été délivré." };

  await writeToken(token);

  return { ok: true, data: true };
}

/* Rend null plutôt qu'une erreur : ne pas être connecté est un état normal. */
export async function getCustomer(): Promise<Customer | null> {
  const token = await readToken();

  if (!token) return null;

  const result = await request<{ customer: Raw }>("/store/customers/me", { token });

  if (!result.ok) return null;

  const customer = result.data.customer;

  return {
    id: String(customer.id),
    email: str(customer.email) ?? "",
    firstName: str(customer.first_name),
    lastName: str(customer.last_name),
    phone: str(customer.phone),
  };
}

function mapOrder(raw: Raw): CustomerOrder {
  const items = Array.isArray(raw.items) ? (raw.items as Raw[]) : [];

  return {
    id: String(raw.id),
    displayId: raw.display_id === undefined ? null : Number(raw.display_id),
    createdAt: str(raw.created_at),
    status: str(raw.status) ?? "pending",
    paymentStatus: str(raw.payment_status) ?? "not_paid",
    fulfillmentStatus: str(raw.fulfillment_status) ?? "not_fulfilled",
    total: num(raw.total),
    currency: (str(raw.currency_code) ?? "htg").toUpperCase(),
    itemCount: items.reduce((sum, item) => sum + num(item.quantity), 0),
    items: items.map((item) => ({
      id: String(item.id),
      title: str(item.product_title) ?? str(item.title) ?? "Article",
      quantity: num(item.quantity),
      thumbnail: str(item.thumbnail),
      productId: str(item.product_id),
      productHandle: str(item.product_handle),
    })),
  };
}

export async function getCustomerOrders(): Promise<Result<CustomerOrder[]>> {
  const token = await readToken();

  if (!token) return { ok: false, reason: "Non connecté." };

  const result = await request<{ orders: Raw[] }>("/store/orders?limit=50", { token });

  if (!result.ok) return result;

  return { ok: true, data: (result.data.orders ?? []).map(mapOrder) };
}

export async function getCustomerOrder(
  orderId: string
): Promise<Result<CustomerOrder | null>> {
  const token = await readToken();

  if (!token) return { ok: false, reason: "Non connecté." };

  const result = await request<{ order: Raw }>(`/store/orders/${orderId}`, { token });

  if (!result.ok) return result;

  return { ok: true, data: result.data.order ? mapOrder(result.data.order) : null };
}

export async function getCustomerAddresses(): Promise<Result<CustomerAddress[]>> {
  const token = await readToken();

  if (!token) return { ok: false, reason: "Non connecté." };

  const result = await request<{ addresses: Raw[] }>(
    "/store/customers/me/addresses",
    { token }
  );

  if (!result.ok) return result;

  return {
    ok: true,
    data: (result.data.addresses ?? []).map((raw) => ({
      id: String(raw.id),
      firstName: str(raw.first_name),
      lastName: str(raw.last_name),
      address1: str(raw.address_1) ?? "",
      address2: str(raw.address_2),
      city: str(raw.city) ?? "",
      province: str(raw.province),
      postalCode: str(raw.postal_code),
      countryCode: (str(raw.country_code) ?? "ht").toUpperCase(),
      phone: str(raw.phone),
      isDefaultShipping: Boolean(raw.is_default_shipping),
    })),
  };
}


/* -------------------------------------------------------------------------- */
/* Avis                                                                       */
/* -------------------------------------------------------------------------- */

/*
  Déposer un avis sur un produit commandé.

  Mercur exige l'identifiant de la commande et vérifie qu'elle appartient
  bien au client connecté : on ne peut noter que ce qu'on a acheté.
  Vérifié — un identifiant de commande inventé est refusé.

  L'avis n'apparaît pas tout de suite : il est enregistré « en attente »
  et n'est publié qu'après modération par MACHÉ. L'écran le dit, sans
  quoi le client croirait son avis perdu.
*/
export async function submitProductReview(input: {
  orderId: string;
  productId: string;
  rating: number;
  note: string;
}): Promise<Result<{ pending: true }>> {
  const token = await readToken();

  if (!token) return { ok: false, reason: "Non connecté." };

  const rating = Math.round(Number(input.rating));

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return { ok: false, reason: "La note doit être comprise entre 1 et 5." };
  }

  /* Mercur refuse au-delà de 300 caractères : on coupe avant de poster. */
  const note = input.note.trim().slice(0, 300);

  const result = await request<{ review: Raw }>("/store/reviews", {
    method: "POST",
    token,
    body: {
      order_id: input.orderId,
      reference: "product",
      reference_id: input.productId,
      rating,
      customer_note: note || null,
    },
  });

  if (!result.ok) return result;

  return { ok: true, data: { pending: true } };
}
