/*
  ROUTE : relire sa demande de devis, l'accepter ou la refuser.

  Qui a le droit de lire

  Celui qui détient le jeton remis à la création, ou le client connecté
  auquel la demande est rattachée. Rien d'autre : un identifiant de devis
  ne suffit pas.

  Accepter, ici, n'est pas payer

  MACHÉ n'encaisse rien : le paiement se fait en main propre. Accepter un
  devis dit au vendeur que l'acheteur veut la commande au prix proposé.
  Rien de plus, et la page le dit dans ces termes plutôt que de laisser
  croire à un achat conclu.

  Un devis périmé ne s'accepte pas : le vendeur a fixé lui-même une date
  de validité, et l'ignorer l'engagerait sur un prix qu'il a retiré.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { QUOTE_MODULE } from "../../../../modules/quote";
import {
  customerId,
  publicQuote,
  tokenMatches,
  withExpiry,
  type QuoteRow,
} from "../../../quote-helpers";

type Service = {
  retrieveQuote: (id: string) => Promise<QuoteRow>;
  updateQuotes: (data: unknown) => Promise<QuoteRow>;
};

async function readAllowed(req: MedusaRequest) {
  const service = req.scope.resolve(QUOTE_MODULE) as Service;

  const id = String(req.params.id ?? "");

  let quote: QuoteRow | null = null;

  try {
    quote = await service.retrieveQuote(id);
  } catch {
    quote = null;
  }

  if (!quote) return { service, quote: null, allowed: false };

  const token =
    (req.query.token as string | undefined) ??
    ((req.body ?? {}) as { token?: unknown }).token;

  const byToken = tokenMatches(quote.access_token, token);

  const customer = customerId(req);

  const byCustomer = Boolean(
    customer && quote.customer_id && quote.customer_id === customer
  );

  return { service, quote, allowed: byToken || byCustomer };
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { quote, allowed } = await readAllowed(req);

  /*
    Même réponse quand la demande n'existe pas et quand le jeton est
    faux. Distinguer les deux dirait à un inconnu quels identifiants
    existent.
  */
  if (!quote || !allowed) {
    return res.status(404).json({ message: "Demande introuvable." });
  }

  return res.json({ quote: withExpiry(publicQuote(quote)) });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { service, quote, allowed } = await readAllowed(req);

  if (!quote || !allowed) {
    return res.status(404).json({ message: "Demande introuvable." });
  }

  const action = String(((req.body ?? {}) as { action?: unknown }).action ?? "");

  if (action !== "accept" && action !== "decline") {
    return res
      .status(400)
      .json({ message: "Action attendue : accept ou decline." });
  }

  const current = withExpiry(publicQuote(quote));

  if (current.status !== "answered") {
    return res.status(409).json({
      message:
        current.status === "expired"
          ? "Cette proposition a expiré. Demandez-en une nouvelle."
          : "Cette demande n'a pas encore reçu de proposition.",
    });
  }

  const updated = await service.updateQuotes({
    id: quote.id,
    status: action === "accept" ? "accepted" : "declined",
  });

  return res.json({ quote: publicQuote(updated) });
}
