/*
  ROUTE : les demandes de devis reçues par la boutique connectée.

  Le filtre par vendeur n'est pas facultatif et n'est pas lu dans la
  requête : il vient de `req.seller_context`, que Mercur remplit à partir
  de la session. Un vendeur qui écrirait `?seller_id=` d'un concurrent
  lirait sinon ses demandes, ses clients et ses prix.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { QUOTE_MODULE } from "../../../modules/quote";
import { publicQuote, withExpiry, type QuoteRow } from "../../quote-helpers";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const sellerId = (req as unknown as { seller_context?: { seller_id?: string } })
    .seller_context?.seller_id;

  if (!sellerId) {
    return res.status(401).json({ message: "Boutique non identifiée." });
  }

  const service = req.scope.resolve(QUOTE_MODULE) as {
    listAndCountQuotes: (
      filters?: unknown,
      config?: unknown
    ) => Promise<[QuoteRow[], number]>;
  };

  const limit = Math.min(
    Math.max(Number(req.query.limit) || DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );

  const offset = Math.max(Number(req.query.offset) || 0, 0);

  const status = typeof req.query.status === "string" ? req.query.status : null;

  const [quotes, count] = await service.listAndCountQuotes(
    { seller_id: sellerId, ...(status ? { status } : {}) },
    { skip: offset, take: limit, order: { created_at: "DESC" } }
  );

  return res.json({
    quotes: quotes.map((quote) => withExpiry(publicQuote(quote))),
    count,
    offset,
    limit,
  });
}
