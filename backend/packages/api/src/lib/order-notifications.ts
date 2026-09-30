/*
  Lire une commande pour les e-mails : ce qu'il faut, et rien de plus.

  Mercur découpe un panier en une commande par boutique (« order ») et
  les réunit dans un groupe (« order_group »). Le paiement reste sur le
  panier du groupe : c'est là qu'on lit s'il s'agit du paiement à la
  livraison (le fournisseur système de Medusa, seul branché aujourd'hui).
*/

import type { OrderLine, OrderSummary } from "./notification-emails";

/* Le fournisseur de paiement « manuel » de Medusa : rien n'est encaissé en ligne. */
export const CASH_ON_DELIVERY_PROVIDER = "pp_system_default";

type RawItem = { title?: string | null; product_title?: string | null; quantity?: number | null };

type RawAddress = {
  first_name?: string | null;
  last_name?: string | null;
  address_1?: string | null;
  address_2?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  country_code?: string | null;
  phone?: string | null;
} | null;

export type RawOrder = {
  id: string;
  display_id?: number | null;
  email?: string | null;
  currency_code?: string | null;
  total?: number | string | null;
  items?: RawItem[] | null;
  shipping_address?: RawAddress;
  customer?: { first_name?: string | null; last_name?: string | null } | null;
  seller?: { id?: string; name?: string | null; email?: string | null; handle?: string | null } | null;
};

export const ORDER_FIELDS = [
  "id",
  "display_id",
  "email",
  "currency_code",
  "total",
  "items.title",
  "items.product_title",
  "items.quantity",
  "shipping_address.*",
  "customer.first_name",
  "customer.last_name",
  "seller.id",
  "seller.name",
  "seller.email",
  "seller.handle",
];

export function lines(order: RawOrder): OrderLine[] {
  return (order.items ?? []).map((item) => ({
    title: String(item.product_title || item.title || "Article"),
    quantity: Number(item.quantity) || 1,
  }));
}

export function summary(order: RawOrder): OrderSummary {
  const total = order.total === null || order.total === undefined ? null : Number(order.total);

  return {
    displayId: order.display_id ?? order.id,
    sellerName: String(order.seller?.name || "la boutique"),
    lines: lines(order),
    total: Number.isFinite(total) ? total : null,
    currency: order.currency_code ?? null,
  };
}

const COUNTRIES: Record<string, string> = { ht: "Haïti", fr: "France", us: "États-Unis", ca: "Canada" };

export function customerName(order: RawOrder): string {
  const address = order.shipping_address;
  const first = address?.first_name || order.customer?.first_name || "";
  const last = address?.last_name || order.customer?.last_name || "";

  return `${first} ${last}`.trim();
}

export function addressText(address: RawAddress): string {
  if (!address) return "";

  const country = address.country_code ? COUNTRIES[address.country_code.toLowerCase()] ?? address.country_code.toUpperCase() : "";

  return [
    address.address_1,
    address.address_2,
    [address.postal_code, address.city].filter(Boolean).join(" "),
    address.province,
    country,
  ]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join("\n");
}

/*
  true : paiement à la livraison. false : un autre fournisseur (en ligne).
  null : on ne sait pas — l'e-mail n'en parlera pas.
*/
export function isCashOnDelivery(providerIds: Array<string | null | undefined>): boolean | null {
  const ids = providerIds.filter((id): id is string => Boolean(id));

  if (ids.length === 0) return null;

  return ids.every((id) => id === CASH_ON_DELIVERY_PROVIDER);
}
