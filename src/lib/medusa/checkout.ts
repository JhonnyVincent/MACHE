/*
  Tunnel de commande.

  Une commande multi-vendeurs, telle que Mercur la traite

  Finaliser un panier ne rend pas une commande mais un GROUPE de commandes
  (`order_group`), avec un `seller_count`. C'est le modèle demandé : une
  commande parente côté client, une commande par vendeur côté vente. Un
  panier contenant les articles de deux boutiques produit deux commandes
  vendeur, chacune avec sa livraison et sa part du paiement.

  C'est aussi pourquoi les options de livraison sont renvoyées GROUPÉES
  PAR VENDEUR et non en liste plate : chaque boutique expédie depuis son
  propre entrepôt, avec ses propres tarifs. Le client choisit donc une
  méthode par vendeur, et les frais s'additionnent.

  Le paiement

  Le seul fournisseur activé est `pp_system_default`, le fournisseur
  manuel de Medusa. Il ne prélève rien et ne prétend pas le faire : la
  commande est créée avec un paiement EN ATTENTE, encaissé à la livraison.
  Ce n'est pas un paiement simulé, c'est la modélisation exacte du
  paiement à la livraison — le seul moyen réellement disponible
  aujourd'hui. Aucune commande n'est marquée payée par le navigateur.
*/

import { cookies } from "next/headers";
import { getMedusaConfig } from "./config";
import {
  backendTimeoutSignal,
  isTimeout,
  TIMEOUT_MESSAGE,
} from "./timeout";

const CART_COOKIE = "mache_cart_id";
const CUSTOMER_TOKEN_COOKIE = "mache_customer_token";

export const MANUAL_PAYMENT_PROVIDER = "pp_system_default";

export type ShippingOption = {
  id: string;
  name: string;
  amount: number | null;
};

/* Les options d'un vendeur : un choix de livraison par boutique. */
export type SellerShipping = {
  sellerId: string;
  sellerName: string;
  options: ShippingOption[];
  chosenOptionId: string | null;
};

export type CheckoutState = {
  hasEmail: boolean;
  hasAddress: boolean;
  shippingBySeller: SellerShipping[];
  allSellersShipped: boolean;
  readyToPay: boolean;
};

type Raw = Record<string, unknown>;
type Result<T> = { ok: true; data: T } | { ok: false; reason: string };

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function call<T>(
  path: string,
  init: { method?: string; body?: unknown } = {}
): Promise<Result<T>> {
  const configured = getMedusaConfig();

  if (!configured.ok) return { ok: false, reason: configured.reason };

  /* Voir cart.ts : sans ce jeton, la commande n'est rattachée à personne. */
  const store = await cookies();
  const customerToken = store.get(CUSTOMER_TOKEN_COOKIE)?.value;

  const headers: Record<string, string> = {
    "x-publishable-api-key": configured.config.key,
    "content-type": "application/json",
    accept: "application/json",
  };

  if (customerToken) headers.authorization = `Bearer ${customerToken}`;

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

async function cartId() {
  const store = await cookies();
  return store.get(CART_COOKIE)?.value ?? null;
}

export type AddressInput = {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  province?: string;
  postalCode?: string;
  countryCode: string;
  phone: string;
};

/*
  Coordonnées et adresse.

  L'adresse de facturation reprend l'adresse de livraison : MACHÉ ne
  demande pas deux adresses à quelqu'un qui paie son colis à la porte.
*/
export async function setCustomerDetails(
  email: string,
  address: AddressInput
): Promise<Result<Raw>> {
  const id = await cartId();

  if (!id) return { ok: false, reason: "Aucun panier en cours." };

  const payload = {
    first_name: address.firstName,
    last_name: address.lastName,
    address_1: address.address1,
    address_2: address.address2 || undefined,
    city: address.city,
    province: address.province || undefined,
    postal_code: address.postalCode || undefined,
    country_code: address.countryCode.toLowerCase(),
    phone: address.phone,
  };

  return call<Raw>(`/store/carts/${id}`, {
    method: "POST",
    body: {
      email,
      shipping_address: payload,
      billing_address: payload,
    },
  });
}

/*
  État du tunnel, déduit du panier lui-même.

  Rien n'est conservé dans une session parallèle : le panier de Medusa
  porte déjà l'e-mail, l'adresse et les méthodes de livraison choisies.
  Un état dupliqué finirait par diverger du panier réel.
*/
export async function getCheckoutState(): Promise<Result<CheckoutState>> {
  const id = await cartId();

  if (!id) return { ok: false, reason: "Aucun panier en cours." };

  const cartResult = await call<{ cart: Raw }>(`/store/carts/${id}`);

  if (!cartResult.ok) return cartResult;

  const cart = cartResult.data.cart;

  const hasEmail = Boolean(str(cart.email));
  const shippingAddress = cart.shipping_address as Raw | null;
  const hasAddress = Boolean(shippingAddress && str(shippingAddress.address_1));

  const chosenMethods = Array.isArray(cart.shipping_methods)
    ? (cart.shipping_methods as Raw[])
    : [];

  const shippingBySeller: SellerShipping[] = [];

  if (hasAddress) {
    const optionsResult = await call<{ shipping_options: Raw }>(
      `/store/shipping-options?cart_id=${id}`
    );

    if (optionsResult.ok) {
      const grouped = optionsResult.data.shipping_options;

      /*
        Mercur renvoie un objet { seller_id: [options] }. Medusa seul
        renverrait un tableau : on accepte les deux, pour ne pas casser si
        la couche marketplace est retirée un jour.
      */
      const entries: [string, Raw[]][] = Array.isArray(grouped)
        ? [["", grouped as Raw[]]]
        : Object.entries((grouped ?? {}) as Record<string, Raw[]>);

      for (const [sellerId, options] of entries) {
        const mapped: ShippingOption[] = (options ?? []).map((option) => ({
          id: String(option.id),
          name: str(option.name) ?? "Livraison",
          amount:
            option.amount === null || option.amount === undefined
              ? null
              : Number(option.amount),
        }));

        const chosen = chosenMethods.find((method) =>
          mapped.some((option) => option.id === str(method.shipping_option_id))
        );

        /* Le nom du vendeur est porté par l'option, pas par la clé. */
        const first = (options ?? [])[0];
        const seller = (first?.seller as Raw | undefined) ?? undefined;

        shippingBySeller.push({
          sellerId,
          sellerName: str(seller?.name) ?? "Boutique",
          options: mapped,
          chosenOptionId: chosen ? str(chosen.shipping_option_id) : null,
        });
      }
    }
  }

  const allSellersShipped =
    shippingBySeller.length > 0 &&
    shippingBySeller.every((seller) => seller.chosenOptionId !== null);

  return {
    ok: true,
    data: {
      hasEmail,
      hasAddress,
      shippingBySeller,
      allSellersShipped,
      readyToPay: hasEmail && hasAddress && allSellersShipped,
    },
  };
}

export async function chooseShippingOption(optionId: string): Promise<Result<Raw>> {
  const id = await cartId();

  if (!id) return { ok: false, reason: "Aucun panier en cours." };
  if (!optionId) return { ok: false, reason: "Option de livraison inconnue." };

  return call<Raw>(`/store/carts/${id}/shipping-methods`, {
    method: "POST",
    body: { option_id: optionId },
  });
}

export type PlacedOrder = {
  orderGroupId: string;
  sellerCount: number;
  total: number;
  currency: string;
};

/*
  Finalisation.

  Trois étapes qui doivent toutes réussir : ouvrir une collection de
  paiement, y initialiser une session chez le fournisseur, puis demander à
  Medusa de transformer le panier en commandes. Si l'une échoue, aucune
  commande n'est créée et le panier reste intact — le client peut
  reprendre où il en était.
*/
export async function placeOrder(): Promise<Result<PlacedOrder>> {
  const id = await cartId();

  if (!id) return { ok: false, reason: "Aucun panier en cours." };

  const collection = await call<{ payment_collection: Raw }>(
    "/store/payment-collections",
    { method: "POST", body: { cart_id: id } }
  );

  if (!collection.ok) return collection;

  const collectionId = str(collection.data.payment_collection?.id);

  if (!collectionId) {
    return { ok: false, reason: "La collection de paiement n'a pas été créée." };
  }

  const session = await call<Raw>(
    `/store/payment-collections/${collectionId}/payment-sessions`,
    { method: "POST", body: { provider_id: MANUAL_PAYMENT_PROVIDER } }
  );

  if (!session.ok) return session;

  const completed = await call<Raw>(`/store/carts/${id}/complete`, {
    method: "POST",
  });

  if (!completed.ok) return completed;

  const group = completed.data.order_group as Raw | undefined;
  const order = completed.data.order as Raw | undefined;

  /*
    Medusa répond `order_group` sur une marketplace, `order` sur une
    boutique simple. Les deux sont acceptés : la seconde forme reste
    valable si un panier ne contient qu'un vendeur.
  */
  const source = group ?? order;

  if (!source) {
    return {
      ok: false,
      reason:
        str((completed.data as Raw).message) ??
        "La commande n'a pas pu être finalisée.",
    };
  }

  /* Le panier est consommé : son cookie ne doit plus désigner rien. */
  const store = await cookies();
  store.delete(CART_COOKIE);

  return {
    ok: true,
    data: {
      orderGroupId: String(source.id),
      sellerCount: Number(source.seller_count ?? 1) || 1,
      total: Number(source.total ?? 0),
      currency: (str(source.currency_code) ?? "htg").toUpperCase(),
    },
  };
}
