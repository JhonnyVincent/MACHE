/*
  ROUTE : les promotions en cours, pour le bandeau de l'accueil.

  POURQUOI ELLE EXISTE

  Le bandeau qui défile en haut du site annonçait un texte écrit en dur,
  identique depuis des mois. Un bandeau qui ne change jamais cesse d'être
  lu : on apprend en trois visites qu'il ne dit rien de neuf, et le jour
  où il annonce une vraie promotion, personne ne le regarde plus.

  Il lit donc les promotions RÉELLEMENT en cours. Quand il n'y en a
  aucune, il ne montre rien — plutôt qu'une remise inventée pour meubler.

  CE QU'ELLE NE PUBLIE PAS

  Le porteur du coût. Savoir qu'une remise est payée par MACHÉ plutôt
  que par la boutique ne regarde que MACHÉ et le vendeur ; l'acheteur,
  lui, paie le même prix dans les deux cas.

  Les promotions d'une BOUTIQUE non plus. Le bandeau est celui de MACHÉ :
  y faire défiler la promotion d'un vendeur donnerait à sa boutique une
  vitrine que les autres n'ont pas, sans que personne ne l'ait décidé.
  Seules passent les promotions sans vendeur — celles de la place
  elle-même.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/* De quoi remplir un bandeau sans le transformer en catalogue. */
const MAX = 12;

type PromotionRow = {
  id: string;
  code: string | null;
  status: string | null;
  is_automatic: boolean | null;
  application_method?: {
    type: string | null;
    value: number | string | null;
    currency_code: string | null;
  } | null;
  seller?: { id: string } | null;
};

/*
  La phrase que lit l'acheteur.

  « -15 % » se comprend d'un coup d'œil ; « application_method.value:
  15 » non. Et une promotion à code nomme son code, parce que sans lui
  l'annonce ne sert à rien.
*/
function announce(promotion: PromotionRow): string | null {
  const method = promotion.application_method;

  if (!method) return null;

  const value = Number(method.value);

  if (!Number.isFinite(value) || value <= 0) return null;

  const remise =
    method.type === "percentage"
      ? `−${value} %`
      : `−${value} ${(method.currency_code ?? "").toUpperCase()}`.trim();

  /*
    Une promotion automatique s'applique seule : annoncer un code
    enverrait l'acheteur en chercher un qui n'existe pas.
  */
  if (promotion.is_automatic) return remise;

  return promotion.code ? `${remise} avec le code ${promotion.code}` : null;
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { data } = await query.graph({
    entity: "promotion",
    fields: [
      "id",
      "code",
      "status",
      "is_automatic",
      "application_method.type",
      "application_method.value",
      "application_method.currency_code",
      "seller.id",
    ],
    filters: { status: "active" },
  });

  const rows = (data as unknown as PromotionRow[]) ?? [];

  const items = rows
    /* Celles de MACHÉ, pas celles d'une boutique. */
    .filter((promotion) => !promotion.seller)
    .map((promotion) => ({
      id: promotion.id,
      label: announce(promotion),
      code: promotion.is_automatic ? null : promotion.code,
    }))
    .filter((item): item is { id: string; label: string; code: string | null } =>
      Boolean(item.label)
    )
    .slice(0, MAX);

  return res.json({ promotions: items, count: items.length });
}
