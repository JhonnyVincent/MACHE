/*
  La confirmation d'une livraison par le code, écrite UNE fois.

  Pourquoi pas deux fois

  Trois routes confirment une livraison : celle du vendeur qui a livré
  lui-même, celle de l'agent qui a porté le colis, celle du point de
  retrait qui le remet. Ce sont trois personnes différentes, mais c'est
  le même acte et il doit obéir aux mêmes règles.

  Recopiée dans trois fichiers, cette logique aurait divergé : on aurait
  corrigé le compteur d'essais à un endroit, et une des trois routes
  serait restée sans plafond. C'est exactement le genre d'écart qu'on
  ne découvre qu'après.
*/

import { MAX_CODE_ATTEMPTS, awaitsCode, codeMatches, text, MAX_NOTE, type DeliveryRow } from "./delivery-helpers";
import { DELIVERY_MODULE } from "../modules/delivery";
import { payoutStateAfterConfirmation } from "./payout-freeze";

type Service = {
  updateDeliveries: (data: Record<string, unknown>) => Promise<unknown>;
};

/*
  Le conteneur, et non le service déjà résolu.

  Confirmer une remise décide aussi du versement, et cette décision a
  besoin de lire le gel de la boutique. En recevant le conteneur, ce
  fichier reste le SEUL endroit qui tranche : une route ne peut pas
  libérer un versement sans passer par la règle. C'était le risque du
  service seul — trois routes, trois occasions d'oublier le gel, et
  c'est l'oubli que la fraude aurait emprunté.
*/
type Scope = { resolve: (key: string) => unknown };

export type ConfirmOutcome =
  | { ok: true; delivery: DeliveryRow }
  | { ok: false; status: number; message: string; attempts_left?: number };

export async function confirmDelivery(
  scope: Scope,
  delivery: DeliveryRow,
  body: { code?: unknown; note?: unknown },
  actor: "seller" | "agent" | "admin"
): Promise<ConfirmOutcome> {
  const service = scope.resolve(DELIVERY_MODULE) as Service;

  if (delivery.status === "delivered") {
    return { ok: false, status: 409, message: "Cette livraison est déjà confirmée." };
  }

  if (delivery.status === "cancelled") {
    return { ok: false, status: 409, message: "Cette livraison est annulée." };
  }

  /*
    Un transporteur extérieur ne saisit pas de code MACHÉ : il ne
    connaît pas MACHÉ. Laisser le vendeur en saisir un ici reviendrait
    à lui laisser confirmer seul une remise à laquelle il n'assistait
    pas — c'est-à-dire à fabriquer une preuve.
  */
  if (delivery.method === "carrier") {
    return {
      ok: false,
      status: 409,
      message:
        "Cette commande passe par un transporteur extérieur : la réception est constatée par l'acheteur, pas par un code MACHÉ.",
    };
  }

  if (!awaitsCode(delivery)) {
    return {
      ok: false,
      status: 409,
      message: "Cette livraison n'est pas encore en cours d'acheminement.",
    };
  }

  if (delivery.code_attempts >= MAX_CODE_ATTEMPTS) {
    return {
      ok: false,
      status: 429,
      message:
        "Trop de codes erronés. Cette livraison doit être débloquée par MACHÉ.",
      attempts_left: 0,
    };
  }

  if (!codeMatches(delivery.code, body.code)) {
    const attempts = delivery.code_attempts + 1;

    /*
      L'essai raté est enregistré AVANT de répondre. Compter après la
      réponse laisserait un appelant rapide dépasser le plafond en
      lançant ses tentatives en parallèle.
    */
    await service.updateDeliveries({ id: delivery.id, code_attempts: attempts });

    return {
      ok: false,
      status: 400,
      message: "Code incorrect.",
      attempts_left: Math.max(0, MAX_CODE_ATTEMPTS - attempts),
    };
  }

  const updated = (await service.updateDeliveries({
    id: delivery.id,
    status: "delivered",
    confirmed_by: actor,
    confirmed_at: new Date(),
    confirmation_note: text(body.note, MAX_NOTE),
    /*
      La preuve de remise et l'autorisation de payer sont la même
      décision : c'est ici, et nulle part ailleurs, que ce qui est dû au
      vendeur devient reversable.

      Sauf si la boutique est GELÉE. La remise reste alors enregistrée —
      elle a eu lieu, c'est un fait, et le nier punirait un acheteur qui
      n'y est pour rien — mais la somme reste retenue au lieu d'être
      portée comme due.
    */
    payout_state: await payoutStateAfterConfirmation(scope, delivery.seller_id),
  })) as DeliveryRow;

  return { ok: true, delivery: updated };
}
