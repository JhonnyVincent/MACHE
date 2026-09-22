import { MedusaService } from "@medusajs/framework/utils";
import { Quote } from "./models";

/*
  Le service par défaut de Medusa suffit : il fournit les créations,
  lectures, filtres et mises à jour dont les routes ont besoin. Toute
  règle écrite ici — qui peut lire quoi, ce qu'un vendeur a le droit de
  modifier — appartient aux routes, où l'on sait qui appelle.
*/
class QuoteModuleService extends MedusaService({ Quote }) {}

export default QuoteModuleService;
