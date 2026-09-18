/*
  Libellés des états d'une commande Medusa.

  Les statuts bruts — `not_fulfilled`, `awaiting`, `captured` — sont des
  termes d'ingénieur. Un client doit lire ce qui le concerne : où en est
  son colis, et ce qu'il doit payer.
*/

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "En cours de traitement",
  completed: "Terminée",
  draft: "Brouillon",
  archived: "Archivée",
  canceled: "Annulée",
  requires_action: "Action requise",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  not_paid: "À régler à la livraison",
  awaiting: "À régler à la livraison",
  authorized: "Autorisé",
  partially_authorized: "Partiellement autorisé",
  captured: "Payé",
  partially_captured: "Partiellement payé",
  refunded: "Remboursé",
  partially_refunded: "Partiellement remboursé",
  canceled: "Annulé",
  requires_action: "Action requise",
};

export const FULFILLMENT_STATUS_LABELS: Record<string, string> = {
  not_fulfilled: "En préparation",
  partially_fulfilled: "Partiellement expédiée",
  fulfilled: "Préparée",
  partially_shipped: "Partiellement expédiée",
  shipped: "Expédiée",
  partially_delivered: "Partiellement livrée",
  delivered: "Livrée",
  partially_returned: "Retour partiel",
  returned: "Retournée",
  canceled: "Annulée",
};

export type Tone = "success" | "warning" | "danger" | "neutral" | "info";

export function fulfillmentTone(status: string): Tone {
  if (status === "delivered") return "success";
  if (status === "shipped" || status === "partially_shipped") return "info";
  if (status === "canceled" || status === "returned") return "danger";
  return "warning";
}

export function paymentTone(status: string): Tone {
  if (status === "captured") return "success";
  if (status === "refunded" || status === "canceled") return "danger";
  return "warning";
}
