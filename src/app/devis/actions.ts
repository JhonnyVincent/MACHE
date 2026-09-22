"use server";

/*
  ACTIONS : demander un devis, accepter ou refuser une proposition.

  Le jeton de lecture n'est pas renvoyé dans l'URL de redirection par
  confort : c'est la seule chose qui permet à un acheteur sans compte de
  relire sa demande. Il est donc placé dans le lien, et ce lien est
  présenté comme tel — « gardez cette adresse » — plutôt que laissé à
  l'acheteur comme un détail technique qu'il perdra.
*/

import { redirect } from "next/navigation";
import { requestQuote, answerQuote } from "@/lib/medusa/quotes";

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function field(data: FormData, name: string): string {
  return String(data.get(name) || "").trim();
}

export async function requestQuoteAction(formData: FormData) {
  const sellerId = field(formData, "seller_id");
  const productTitle = field(formData, "product_title");
  const productId = field(formData, "product_id");
  const variantId = field(formData, "variant_id");

  /*
    Le retour en cas d'erreur ramène sur le formulaire déjà rempli du
    même article : renvoyer sur un formulaire vide ferait tout
    ressaisir.
  */
  const back = `/devis/nouveau?${new URLSearchParams({
    boutique: sellerId,
    article: productTitle,
    ...(productId ? { produit: productId } : {}),
    ...(variantId ? { variante: variantId } : {}),
  }).toString()}`;

  const buyerName = field(formData, "buyer_name");
  const buyerEmail = field(formData, "buyer_email").toLowerCase();
  const quantity = Number(field(formData, "quantity"));

  if (!sellerId || !productTitle) {
    fail(back, "Article ou boutique manquant. Repartez de la fiche produit.");
  }

  if (!buyerName) fail(back, "Indiquez votre nom.");

  if (!buyerEmail.includes("@")) fail(back, "Adresse e-mail invalide.");

  if (!Number.isFinite(quantity) || quantity < 1) {
    fail(back, "Indiquez la quantité souhaitée.");
  }

  const result = await requestQuote({
    sellerId,
    buyerName,
    buyerEmail,
    buyerPhone: field(formData, "buyer_phone") || null,
    buyerCompany: field(formData, "buyer_company") || null,
    productId: productId || null,
    variantId: variantId || null,
    productTitle,
    quantity: Math.floor(quantity),
    message: field(formData, "message") || null,
  });

  if (!result.ok) fail(back, result.reason);

  redirect(
    `/devis/${result.data.quote.id}?jeton=${encodeURIComponent(
      result.data.accessToken
    )}&nouveau=1`
  );
}

export async function answerQuoteAction(formData: FormData) {
  const id = field(formData, "quote_id");
  const token = field(formData, "token");
  const action = field(formData, "action");

  const back = `/devis/${id}${token ? `?jeton=${encodeURIComponent(token)}` : ""}`;

  if (action !== "accept" && action !== "decline") {
    fail(back, "Action inconnue.");
  }

  const result = await answerQuote(id, action, token || null);

  if (!result.ok) fail(back, result.reason);

  redirect(back);
}
