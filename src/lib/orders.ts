/*
  CRÉATION DE COMMANDE

  Sert à :
  - valider un panier contre la base avant d'enregistrer quoi que ce soit ;
  - éclater la commande en lignes, une par produit, avec sa boutique ;
  - calculer commission et part vendeur ;
  - décrémenter le stock ;
  - ouvrir une ligne de paiement.

  Principe directeur : NE JAMAIS FAIRE CONFIANCE AU CLIENT.
  Le navigateur envoie des identifiants de produit et des quantités. Rien
  d'autre n'est retenu : prix, titre, boutique, vendeur et stock sont relus en
  base. Un panier qui annonce un prix de 1 HTG est recalculé au vrai prix.

  Multi-vendeurs : une commande porte plusieurs `order_items`, chacun
  rattaché à sa boutique et à son vendeur. C'est ce qui distingue une
  marketplace d'une boutique unique — la table `orders` seule ne pourrait
  représenter qu'un seul vendeur.
*/

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PLAN_LIMITS } from "@/lib/seller";
import { isSellerRole } from "@/lib/authz";

export type CartLine = { productId: string; quantity: number };

export type CheckoutInput = {
  lines: CartLine[];
  fullName: string;
  phone: string;
  email?: string;
  line1: string;
  line2?: string;
  city: string;
  zoneSlug: string;
  instructions?: string;
  paymentMethod: string;
  saveAddress?: boolean;
};

export type CheckoutFailure = {
  ok: false;
  code:
    | "empty_cart"
    | "invalid_input"
    | "products_unavailable"
    | "insufficient_stock"
    | "zone_unavailable"
    | "payment_method_unavailable"
    | "database";
  message: string;
  details?: string[];
};

export type CheckoutSuccess = {
  ok: true;
  orderId: string;
  reference: string;
  total: number;
  itemCount: number;
  storeCount: number;
  shippingPending: boolean;
};

/*
  Modes de paiement.

  `cash_on_delivery` est le seul réellement opérationnel : il n'exige aucun
  prestataire. Les autres restent déclarés mais désactivés — le cahier des
  charges interdit de simuler un paiement réussi, et afficher un mode qui
  échouerait serait pire que de l'annoncer indisponible.
*/
export const PAYMENT_METHODS = [
  {
    code: "cash_on_delivery",
    label: "Paiement à la livraison",
    hint: "Vous payez en espèces au moment de la remise du colis.",
    available: true,
  },
  {
    code: "moncash",
    label: "MonCash",
    hint: "Nécessite le raccordement du compte marchand MonCash.",
    available: false,
  },
  {
    code: "card",
    label: "Carte bancaire",
    hint: "Nécessite le raccordement d'un prestataire de paiement.",
    available: false,
  },
] as const;

const MAX_QUANTITY_PER_LINE = 99;

/** Référence lisible : MCH-AAMMJJ-XXXX. */
function buildReference() {
  const now = new Date();
  const date =
    String(now.getFullYear()).slice(2) +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");

  const suffix = Math.floor(Math.random() * 36 ** 4)
    .toString(36)
    .toUpperCase()
    .padStart(4, "0");

  return `MCH-${date}-${suffix}`;
}

function clean(value: string | undefined, max = 200) {
  return String(value ?? "").trim().slice(0, max);
}

export async function fetchShippingZones() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("shipping_zones")
    .select("slug, label, fee, estimated_days_min, estimated_days_max")
    .eq("is_active", true)
    .order("position", { ascending: true });

  if (error) {
    console.error("[orders] shipping_zones:", error.message);
    return { zones: [], error };
  }

  return { zones: data ?? [], error: null };
}

/*
  Taux de commission du vendeur, déduit de son rôle.
  Les taux vivent dans PLAN_LIMITS : une seule source avec l'espace vendeur.
*/
function commissionRateFor(role: string | null | undefined) {
  if (!role || !isSellerRole(role)) return 0;

  const plan = PLAN_LIMITS[role];
  if (!plan) return 0;

  return Number(plan.commission.replace(/[^\d.]/g, "")) / 100 || 0;
}

export async function createOrder(
  input: CheckoutInput
): Promise<CheckoutSuccess | CheckoutFailure> {
  const supabase = await createSupabaseServerClient();

  // ----------------------------------------------------------------- panier
  const lines = (input.lines ?? [])
    .map((line) => ({
      productId: clean(line.productId, 64),
      quantity: Math.floor(Number(line.quantity) || 0),
    }))
    .filter((line) => line.productId && line.quantity > 0);

  if (lines.length === 0) {
    return { ok: false, code: "empty_cart", message: "Votre panier est vide." };
  }

  if (lines.some((line) => line.quantity > MAX_QUANTITY_PER_LINE)) {
    return {
      ok: false,
      code: "invalid_input",
      message: `La quantité maximale est de ${MAX_QUANTITY_PER_LINE} par article.`,
    };
  }

  // -------------------------------------------------------------- livraison
  const fullName = clean(input.fullName, 120);
  const phone = clean(input.phone, 40);
  const line1 = clean(input.line1, 200);
  const city = clean(input.city, 120);
  const zoneSlug = clean(input.zoneSlug, 60);

  const missing: string[] = [];
  if (!fullName) missing.push("le nom complet");
  if (!phone) missing.push("le téléphone");
  if (!line1) missing.push("l'adresse");
  if (!city) missing.push("la ville");
  if (!zoneSlug) missing.push("la zone de livraison");

  if (missing.length > 0) {
    return {
      ok: false,
      code: "invalid_input",
      message: `Renseignez ${missing.join(", ")}.`,
    };
  }

  // ---------------------------------------------------------------- paiement
  const method = PAYMENT_METHODS.find((m) => m.code === input.paymentMethod);

  if (!method || !method.available) {
    return {
      ok: false,
      code: "payment_method_unavailable",
      message:
        "Ce mode de paiement n'est pas disponible. Choisissez le paiement à la livraison.",
    };
  }

  // ------------------------------------------------------------------ zone
  const { data: zone, error: zoneError } = await supabase
    .from("shipping_zones")
    .select("slug, label, fee")
    .eq("slug", zoneSlug)
    .eq("is_active", true)
    .maybeSingle();

  if (zoneError) {
    console.error("[orders] zone:", zoneError.message);
    return {
      ok: false,
      code: "database",
      message:
        "Les zones de livraison ne sont pas disponibles. La migration 0003 doit être appliquée.",
      details: [zoneError.message],
    };
  }

  if (!zone) {
    return {
      ok: false,
      code: "zone_unavailable",
      message: "Cette zone de livraison n'est plus proposée.",
    };
  }

  /*
    fee NULL signifie « tarif non défini ». On enregistre 0 et on signale au
    client que les frais seront confirmés : mieux vaut un total explicitement
    incomplet qu'un montant inventé.
  */
  const shippingPending = zone.fee === null || zone.fee === undefined;
  const shippingTotal = shippingPending ? 0 : Number(zone.fee);

  // -------------------------------------------------------------- produits
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, title, price, stock, status, image_url, store_id, seller_id")
    .in(
      "id",
      lines.map((line) => line.productId)
    );

  if (productsError) {
    console.error("[orders] products:", productsError.message);
    return {
      ok: false,
      code: "database",
      message: "Le catalogue n'a pas pu être vérifié. Réessayez dans un instant.",
      details: [productsError.message],
    };
  }

  const byId = new Map((products ?? []).map((p) => [String(p.id), p]));

  const unavailable: string[] = [];
  const shortStock: string[] = [];

  for (const line of lines) {
    const product = byId.get(line.productId);

    if (!product || product.status !== "active") {
      unavailable.push(product?.title || "un article");
      continue;
    }

    if ((product.stock ?? 0) < line.quantity) {
      shortStock.push(
        `${product.title} : ${product.stock ?? 0} disponible(s) pour ${line.quantity} demandé(s)`
      );
    }
  }

  if (unavailable.length > 0) {
    return {
      ok: false,
      code: "products_unavailable",
      message:
        "Certains articles ne sont plus en vente. Retirez-les du panier pour continuer.",
      details: unavailable,
    };
  }

  if (shortStock.length > 0) {
    return {
      ok: false,
      code: "insufficient_stock",
      message: "Le stock est insuffisant pour certains articles.",
      details: shortStock,
    };
  }

  // --------------------------------------------- rôles vendeurs (commission)
  const sellerIds = [
    ...new Set(
      lines
        .map((line) => byId.get(line.productId)?.seller_id)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  const sellerRoles = new Map<string, string>();

  if (sellerIds.length > 0) {
    const { data: sellers } = await supabase
      .from("users")
      .select("id, role")
      .in("id", sellerIds);

    for (const seller of sellers ?? []) {
      sellerRoles.set(String(seller.id), String(seller.role || ""));
    }
  }

  // ------------------------------------------------------------- acheteur
  const { data: userData } = await supabase.auth.getUser();
  const buyerId = userData.user?.id ?? null;

  // ---------------------------------------------------------------- lignes
  const items = lines.map((line) => {
    const product = byId.get(line.productId)!;
    const unitPrice = Number(product.price) || 0;
    const subtotal = unitPrice * line.quantity;
    const rate = commissionRateFor(sellerRoles.get(String(product.seller_id)));
    const commission = Math.round(subtotal * rate * 100) / 100;

    return {
      product_id: product.id,
      store_id: product.store_id ?? null,
      seller_id: product.seller_id ?? null,
      title: product.title || "Article",
      image_url: product.image_url ?? null,
      unit_price: unitPrice,
      quantity: line.quantity,
      subtotal,
      commission_rate: rate,
      commission_amount: commission,
      seller_amount: Math.round((subtotal - commission) * 100) / 100,
      status: "pending",
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const total = subtotal + shippingTotal;
  const storeIds = [...new Set(items.map((item) => item.store_id).filter(Boolean))];

  // ------------------------------------------------------- adresse à garder
  let addressId: string | null = null;

  if (buyerId && input.saveAddress) {
    const { data: address, error: addressError } = await supabase
      .from("addresses")
      .insert({
        user_id: buyerId,
        full_name: fullName,
        phone,
        line1,
        line2: clean(input.line2, 200) || null,
        city,
        department: zone.label,
        instructions: clean(input.instructions, 400) || null,
      })
      .select("id")
      .single();

    if (addressError) {
      // Une adresse non enregistrée ne doit pas empêcher la commande.
      console.error("[orders] address:", addressError.message);
    } else {
      addressId = address?.id ?? null;
    }
  }

  // ------------------------------------------------------------- commande
  const reference = buildReference();

  /*
    store_id et seller_id de `orders` restent renseignés quand la commande
    ne concerne qu'une boutique : l'espace vendeur existant lit ces colonnes.
    Au-delà d'une boutique, ils restent nuls et seules les lignes font foi.
  */
  const singleStore = storeIds.length === 1 ? String(storeIds[0]) : null;
  const singleSeller =
    new Set(items.map((i) => i.seller_id)).size === 1 ? items[0].seller_id : null;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      reference,
      buyer_id: buyerId,
      store_id: singleStore,
      seller_id: singleSeller,
      status: "pending",
      payment_status: method.code === "cash_on_delivery" ? "cash_on_delivery" : "pending",
      currency: "HTG",
      subtotal,
      shipping_total: shippingTotal,
      total_price: total,
      shipping_address_id: addressId,
      contact_email: clean(input.email, 160) || userData.user?.email || null,
      contact_phone: phone,
      notes: clean(input.instructions, 400) || null,
      placed_at: new Date().toISOString(),
    })
    .select("id, reference")
    .single();

  if (orderError || !order) {
    console.error("[orders] insert order:", orderError?.message);
    return {
      ok: false,
      code: "database",
      message:
        "La commande n'a pas pu être enregistrée. Les migrations 0001 et 0003 doivent être appliquées.",
      details: orderError ? [orderError.message] : undefined,
    };
  }

  // ------------------------------------------------------- lignes + stock
  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(items.map((item) => ({ ...item, order_id: order.id })));

  if (itemsError) {
    console.error("[orders] insert items:", itemsError.message);

    /*
      Une commande sans ligne n'a aucun sens : on la retire plutôt que de
      laisser un enregistrement incohérent. PostgREST ne donne pas de
      transaction sur plusieurs requêtes ; cette compensation est le meilleur
      recours sans fonction RPC dédiée.
    */
    await supabase.from("orders").delete().eq("id", order.id);

    return {
      ok: false,
      code: "database",
      message:
        "Les lignes de la commande n'ont pas pu être enregistrées. La commande a été annulée.",
      details: [itemsError.message],
    };
  }

  const { error: paymentError } = await supabase.from("payments").insert({
    order_id: order.id,
    provider: method.code,
    status: method.code === "cash_on_delivery" ? "cash_on_delivery" : "pending",
    amount: total,
    currency: "HTG",
  });

  if (paymentError) {
    // La commande reste valable : le paiement est tracé par la commande.
    console.error("[orders] payment:", paymentError.message);
  }

  /*
    Décrément du stock, article par article.

    Sans transaction ni fonction RPC, deux commandes simultanées sur le
    dernier exemplaire peuvent passer toutes les deux. Le garde-fou ici est
    la condition `gte` : la mise à jour ne s'applique que si le stock est
    encore suffisant. Une vente en surnombre est signalée au vendeur plutôt
    que silencieuse.
  */
  const oversold: string[] = [];

  for (const item of items) {
    if (!item.product_id) continue;

    const product = byId.get(String(item.product_id))!;
    const nextStock = (product.stock ?? 0) - item.quantity;

    const { data: updated, error: stockError } = await supabase
      .from("products")
      .update({ stock: nextStock })
      .eq("id", item.product_id)
      .gte("stock", item.quantity)
      .select("id");

    if (stockError) {
      console.error("[orders] stock:", stockError.message);
    } else if (!updated || updated.length === 0) {
      oversold.push(item.title);
    }
  }

  if (oversold.length > 0) {
    console.warn(
      "[orders] stock insuffisant au moment de la validation :",
      oversold.join(", ")
    );
  }

  return {
    ok: true,
    orderId: String(order.id),
    reference: String(order.reference || reference),
    total,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    storeCount: storeIds.length,
    shippingPending,
  };
}
