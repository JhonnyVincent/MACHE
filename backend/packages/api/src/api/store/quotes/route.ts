/*
  ROUTE : demander un devis à une boutique.

  Pourquoi elle existe

  Mercur vend au prix affiché : on ajoute au panier, on paie. Une grande
  part du commerce haïtien ne se fait pas ainsi — on demande un prix pour
  une quantité, on discute le délai et la livraison, et la vente commence
  après cet échange. Sans cette route, cette demande partait sur WhatsApp,
  où elle n'est ni conservée, ni rattachée à un vendeur, ni retrouvable.

  Ouverte, volontairement

  Elle n'exige pas de compte. Exiger une inscription pour demander un
  prix, c'est perdre la demande : celui qui veut connaître un tarif ne
  crée pas un compte d'abord. L'acheteur connecté est reconnu quand il
  l'est, et c'est tout.

  Ce qu'elle refuse

  Une demande adressée à une boutique qui n'existe pas. Elle serait
  écrite en base sans que personne ne puisse jamais la lire, et
  l'acheteur attendrait une réponse qui ne viendrait pas.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { QUOTE_MODULE } from "../../../modules/quote";
import {
  MAX_MESSAGE,
  customerId,
  email,
  newAccessToken,
  publicQuote,
  quantity as readQuantity,
  text,
  withExpiry,
  type QuoteRow,
} from "../../quote-helpers";

/*
  Garde-fou contre l'envoi en masse. Dix demandes par heure et par
  adresse : largement au-dessus de ce qu'un acheteur fait réellement,
  largement en dessous de ce qu'il faut pour noyer la boîte d'un vendeur.
*/
const MAX_PER_HOUR = 10;

/*
  La liste des demandes du client connecté.

  Sans elle, un acheteur qui a un compte dépendrait quand même du lien
  reçu à la création : perdu l'onglet, perdu le devis. Elle ne répond
  qu'à un client identifié, et ne renvoie que ses propres demandes —
  l'identifiant vient de la session, jamais de la requête.
*/
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const customer = customerId(req);

  if (!customer) {
    return res.status(401).json({ message: "Connexion requise." });
  }

  const service = req.scope.resolve(QUOTE_MODULE) as {
    listQuotes: (filters?: unknown, config?: unknown) => Promise<QuoteRow[]>;
  };

  const quotes = await service.listQuotes(
    { customer_id: customer },
    { take: 100, order: { created_at: "DESC" } }
  );

  return res.json({
    quotes: quotes.map((quote) => withExpiry(publicQuote(quote))),
  });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body ?? {}) as Record<string, unknown>;

  const sellerId = text(body.seller_id);
  const buyerName = text(body.buyer_name);
  const buyerEmail = email(body.buyer_email);
  const productTitle = text(body.product_title, 500);
  const qty = readQuantity(body.quantity);

  const missing: string[] = [];

  if (!sellerId) missing.push("seller_id");
  if (!buyerName) missing.push("buyer_name");
  if (!buyerEmail) missing.push("buyer_email");
  if (!productTitle) missing.push("product_title");
  if (qty === null) missing.push("quantity");

  if (missing.length > 0) {
    return res.status(400).json({
      message: `Champs manquants ou invalides : ${missing.join(", ")}.`,
    });
  }

  /*
    La boutique existe-t-elle ? On le vérifie ici plutôt que de faire
    confiance à l'identifiant reçu : il vient du navigateur.
  */
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { data: sellers } = await query.graph({
    entity: "seller",
    fields: ["id"],
    filters: { id: sellerId as string },
  });

  if (!sellers?.length) {
    return res.status(404).json({ message: "Boutique introuvable." });
  }

  const service = req.scope.resolve(QUOTE_MODULE) as {
    listQuotes: (filters?: unknown, config?: unknown) => Promise<QuoteRow[]>;
    createQuotes: (data: unknown) => Promise<QuoteRow>;
  };

  const since = new Date(Date.now() - 60 * 60 * 1000);

  const recent = await service.listQuotes({
    buyer_email: buyerEmail,
    created_at: { $gt: since },
  });

  if (recent.length >= MAX_PER_HOUR) {
    return res.status(429).json({
      message:
        "Trop de demandes envoyées depuis cette adresse. Réessayez dans une heure.",
    });
  }

  const accessToken = newAccessToken();

  const created = await service.createQuotes({
    seller_id: sellerId,
    customer_id: customerId(req),
    access_token: accessToken,
    buyer_name: buyerName,
    buyer_email: buyerEmail,
    buyer_phone: text(body.buyer_phone),
    buyer_company: text(body.buyer_company),
    product_id: text(body.product_id),
    variant_id: text(body.variant_id),
    product_title: productTitle,
    quantity: qty,
    message: text(body.message, MAX_MESSAGE),
  });

  /*
    Le jeton n'est renvoyé qu'ici, une seule fois : c'est le lien que
    l'acheteur garde pour relire la réponse.
  */
  return res.status(201).json({
    quote: publicQuote(created),
    access_token: accessToken,
  });
}
