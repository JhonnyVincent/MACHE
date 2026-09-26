import { MedusaService } from "@medusajs/framework/utils";
import { Delivery, RelayPoint, PayoutFreeze } from "./models";

/*
  Le service par défaut suffit, comme pour les devis : il donne les
  créations, lectures et mises à jour dont les routes ont besoin.

  Les règles — qui peut confirmer une livraison, avec quel code, et
  combien de fois il peut se tromper — vivent dans les routes, où l'on
  sait qui appelle. Les écrire ici les rendrait applicables à un appel
  interne qui n'a pas d'appelant.
*/
class DeliveryModuleService extends MedusaService({
  Delivery,
  RelayPoint,
  PayoutFreeze,
}) {}

export default DeliveryModuleService;
