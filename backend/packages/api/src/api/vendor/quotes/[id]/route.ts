/*
  ROUTE : lire une demande, et y répondre.

  Répondre, c'est annoncer un prix total, éventuellement une date de fin
  de validité, et un message. Le prix est un total pour la quantité
  demandée, pas un prix unitaire : c'est la forme dans laquelle une
  négociation se conclut — « 200 sacs, 180 000 gourdes » — et c'est ce
  que l'acheteur compare.

  Le devis n'entre pas dans Medusa comme une commande. Il n'y a ni
  paiement en ligne, ni stock réservé : l'annoncer comme une commande
  créerait un engagement que rien ne soutient.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { QUOTE_MODULE } from "../../../../modules/quote";
import {
  MAX_MESSAGE,
  publicQuote,
  text,
  withExpiry,
  type QuoteRow,
} from "../../../quote-helpers";

type Service = {
  retrieveQuote: (id: string) => Promise<QuoteRow>;
  updateQuotes: (data: unknown) => Promise<QuoteRow>;
};

/*
  Un plafond, pour que la faute de frappe d'un vendeur — un zéro de trop
  répété — ne parte pas telle quelle à l'acheteur.
*/
const MAX_AMOUNT = 1_000_000_000;

async function own(req: MedusaRequest) {
  const sellerId = (req as unknown as { seller_context?: { seller_id?: string } })
    .seller_context?.seller_id;

  const service = req.scope.resolve(QUOTE_MODULE) as Service;

  if (!sellerId) return { service, quote: null };

  let quote: QuoteRow | null = null;

  try {
    quote = await service.retrieveQuote(String(req.params.id ?? ""));
  } catch {
    quote = null;
  }

  /* La demande d'une autre boutique n'existe pas, de son point de vue. */
  if (!quote || quote.seller_id !== sellerId) return { service, quote: null };

  return { service, quote };
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { quote } = await own(req);

  if (!quote) {
    return res.status(404).json({ message: "Demande introuvable." });
  }

  return res.json({ quote: withExpiry(publicQuote(quote)) });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { service, quote } = await own(req);

  if (!quote) {
    return res.status(404).json({ message: "Demande introuvable." });
  }

  /*
    Une réponse déjà acceptée ou refusée par l'acheteur ne se réécrit
    pas : le prix sur lequel il s'est prononcé doit rester celui qu'il a
    lu.
  */
  if (quote.status === "accepted" || quote.status === "declined") {
    return res.status(409).json({
      message: "L'acheteur s'est déjà prononcé sur cette demande.",
    });
  }

  const body = (req.body ?? {}) as Record<string, unknown>;

  const action = String(body.action ?? "answer");

  if (action === "decline") {
    const updated = await service.updateQuotes({
      id: quote.id,
      status: "declined",
      seller_message: text(body.seller_message, MAX_MESSAGE),
    });

    return res.json({ quote: publicQuote(updated) });
  }

  if (action !== "answer") {
    return res
      .status(400)
      .json({ message: "Action attendue : answer ou decline." });
  }

  const amount = Number(body.quoted_amount);

  if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) {
    return res.status(400).json({
      message: "Indiquez un montant total valide pour la quantité demandée.",
    });
  }

  const currency = text(body.currency_code, 8);

  if (!currency) {
    return res.status(400).json({ message: "Indiquez la devise du montant." });
  }

  let validUntil: Date | null = null;

  if (body.valid_until) {
    const parsed = new Date(String(body.valid_until));

    if (Number.isNaN(parsed.getTime())) {
      return res.status(400).json({ message: "Date de validité illisible." });
    }

    /*
      Une date déjà passée produirait une proposition périmée à la
      seconde où elle est envoyée : l'acheteur la recevrait expirée sans
      comprendre pourquoi.
    */
    if (parsed.getTime() <= Date.now()) {
      return res
        .status(400)
        .json({ message: "La date de validité doit être à venir." });
    }

    validUntil = parsed;
  }

  const updated = await service.updateQuotes({
    id: quote.id,
    status: "answered",
    seller_message: text(body.seller_message, MAX_MESSAGE),
    quoted_amount: amount,
    currency_code: currency.toLowerCase(),
    valid_until: validUntil,
  });

  return res.json({ quote: publicQuote(updated) });
}
