/*
  Panier, côté serveur.

  Le panier vit dans Medusa, pas dans le navigateur. Ce n'est pas un
  détail d'implémentation : c'est ce qui garantit que le total affiché est
  celui qui sera facturé. L'ancien panier de MACHÉ gardait un instantané
  du prix pris au moment de l'ajout ; une promotion terminée entre-temps
  n'était pas répercutée, et le client voyait un montant que la commande
  n'aurait pas honoré.

  Ce que Mercur change au contrat de Medusa

  On n'ajoute pas une variante au panier, on ajoute une OFFRE. Sur une
  marketplace, un même produit peut être proposé par plusieurs vendeurs :
  « chaussure taille 44 » ne désigne pas une ligne de commande tant qu'on
  ne sait pas de quelle boutique elle vient. Chaque variante porte donc un
  `offer_id`, et `/store/offers?variant_id=…` liste les vendeurs
  concurrents sur cette variante.

  C'est aussi ce qui rend le panier multi-vendeurs naturel : un panier
  peut contenir des offres de plusieurs boutiques, et Medusa en fait une
  commande que Mercur répartit ensuite par vendeur.

  L'identifiant du panier est conservé dans un cookie httpOnly : il n'est
  jamais lisible par du JavaScript de page, ce qui évite qu'un script tiers
  injecté puisse lire ou détourner le panier d'un visiteur.
*/

import { cookies } from "next/headers";
import { getMedusaConfig } from "./config";

const CART_COOKIE = "mache_cart_id";
const CUSTOMER_TOKEN_COOKIE = "mache_customer_token";

export type CartLine = {
  id: string;
  title: string;
  variantTitle: string | null;
  productHandle: string | null;
  thumbnail: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type Cart = {
  id: string;
  currency: string;
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  shippingTotal: number;
  taxTotal: number;
  discountTotal: number;
  total: number;
};

type Raw = Record<string, unknown>;

function num(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function mapCart(raw: Raw): Cart {
  const items = Array.isArray(raw.items) ? (raw.items as Raw[]) : [];

  const lines: CartLine[] = items.map((item) => ({
    id: String(item.id),
    title: str(item.product_title) ?? str(item.title) ?? "Article",
    variantTitle: str(item.variant_title),
    productHandle: str(item.product_handle),
    thumbnail: str(item.thumbnail),
    quantity: num(item.quantity),
    unitPrice: num(item.unit_price),
    /*
      Medusa ne renvoie pas toujours `total` sur la ligne. Le déduire du
      prix unitaire est exact ici parce que les remises de ligne sont
      déjà reflétées dans `unit_price`.
    */
    total: item.total !== null && item.total !== undefined
      ? num(item.total)
      : num(item.unit_price) * num(item.quantity),
  }));

  return {
    id: String(raw.id),
    currency: (str(raw.currency_code) ?? "htg").toUpperCase(),
    lines,
    itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotal: num(raw.subtotal),
    shippingTotal: num(raw.shipping_total),
    taxTotal: num(raw.tax_total),
    discountTotal: num(raw.discount_total),
    total: num(raw.total),
  };
}

type CallResult<T> = { ok: true; data: T } | { ok: false; reason: string };

async function call<T>(
  path: string,
  init: { method?: string; body?: unknown } = {}
): Promise<CallResult<T>> {
  const configured = getMedusaConfig();

  if (!configured.ok) return { ok: false, reason: configured.reason };

  const { url, key } = configured.config;

  /*
    Le jeton du client connecté est joint quand il existe.

    Sans lui, Medusa rattache la commande à un client anonyme créé à la
    volée : le client verrait alors « aucune commande » dans son espace
    juste après avoir commandé. C'est exactement le genre de panne dont
    personne ne se plaint — on croit simplement que le site a perdu la
    commande.
  */
  const store = await cookies();
  const customerToken = store.get(CUSTOMER_TOKEN_COOKIE)?.value;

  const headers: Record<string, string> = {
    "x-publishable-api-key": key,
    "content-type": "application/json",
    accept: "application/json",
  };

  if (customerToken) headers.authorization = `Bearer ${customerToken}`;

  try {
    const response = await fetch(`${url}${path}`, {
      method: init.method ?? "GET",
      headers,
      body: init.body ? JSON.stringify(init.body) : undefined,
      /* Un panier ne se met jamais en cache : il est propre à la session. */
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => ({}))) as Raw;

    if (!response.ok) {
      const message = str(payload.message);

      return {
        ok: false,
        reason: message ?? `Le panier a répondu ${response.status}.`,
      };
    }

    return { ok: true, data: payload as T };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, reason: `Panier injoignable : ${message}` };
  }
}

/* Lecture seule : ne crée jamais de panier, pour ne pas en semer un par visite. */
export async function getCart(): Promise<Cart | null> {
  const store = await cookies();
  const id = store.get(CART_COOKIE)?.value;

  if (!id) return null;

  const result = await call<{ cart: Raw }>(`/store/carts/${id}`);

  /*
    Un panier disparu — expiré, ou déjà transformé en commande — ne doit
    pas faire échouer la page. On repart de zéro silencieusement.
  */
  if (!result.ok || !result.data.cart) return null;

  return mapCart(result.data.cart);
}

async function getOrCreateCartId(): Promise<CallResult<string>> {
  const store = await cookies();
  const existing = store.get(CART_COOKIE)?.value;

  if (existing) {
    const check = await call<{ cart: Raw }>(`/store/carts/${existing}`);
    if (check.ok && check.data.cart) return { ok: true, data: existing };
  }

  const configured = getMedusaConfig();

  if (!configured.ok) return { ok: false, reason: configured.reason };

  const created = await call<{ cart: Raw }>("/store/carts", {
    method: "POST",
    body: configured.config.regionId
      ? { region_id: configured.config.regionId }
      : {},
  });

  if (!created.ok) return created;

  const id = String(created.data.cart?.id ?? "");

  if (!id) return { ok: false, reason: "Le panier n'a pas pu être créé." };

  store.set(CART_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return { ok: true, data: id };
}

export async function addOfferToCart(
  offerId: string,
  quantity = 1
): Promise<CallResult<Cart>> {
  if (!offerId) return { ok: false, reason: "Offre inconnue." };

  const safeQuantity = Math.max(1, Math.trunc(quantity) || 1);
  const cartId = await getOrCreateCartId();

  if (!cartId.ok) return cartId;

  const result = await call<{ cart: Raw }>(
    `/store/carts/${cartId.data}/line-items`,
    { method: "POST", body: { offer_id: offerId, quantity: safeQuantity } }
  );

  if (!result.ok) return result;

  return { ok: true, data: mapCart(result.data.cart) };
}

export async function updateCartLine(
  lineId: string,
  quantity: number
): Promise<CallResult<Cart>> {
  const store = await cookies();
  const cartId = store.get(CART_COOKIE)?.value;

  if (!cartId) return { ok: false, reason: "Aucun panier en cours." };
  if (!lineId) return { ok: false, reason: "Ligne inconnue." };

  /* Quantité nulle ou négative : c'est une suppression, pas une erreur. */
  if (quantity <= 0) return removeCartLine(lineId);

  const result = await call<{ cart: Raw }>(
    `/store/carts/${cartId}/line-items/${lineId}`,
    { method: "POST", body: { quantity: Math.trunc(quantity) } }
  );

  if (!result.ok) return result;

  return { ok: true, data: mapCart(result.data.cart) };
}

export async function removeCartLine(lineId: string): Promise<CallResult<Cart>> {
  const store = await cookies();
  const cartId = store.get(CART_COOKIE)?.value;

  if (!cartId) return { ok: false, reason: "Aucun panier en cours." };

  const result = await call<{ parent?: Raw }>(
    `/store/carts/${cartId}/line-items/${lineId}`,
    { method: "DELETE" }
  );

  if (!result.ok) return result;

  /* La suppression renvoie le panier restant sous `parent`. */
  const parent = result.data.parent;

  if (parent) return { ok: true, data: mapCart(parent) };

  const refreshed = await getCart();

  return refreshed
    ? { ok: true, data: refreshed }
    : { ok: false, reason: "Panier introuvable après suppression." };
}
