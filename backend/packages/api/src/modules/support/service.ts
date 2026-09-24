import { MedusaService } from "@medusajs/framework/utils";
import { Thread, ThreadMessage } from "./models";

/*
  Le service par défaut, comme les autres modules de MACHÉ.

  La règle qui compte — un message interne ne sort jamais vers le
  demandeur — vit dans les routes, où l'on sait qui appelle. Ici, on ne
  saurait pas distinguer une lecture par l'administration d'une lecture
  par la personne qui a écrit.
*/
class SupportModuleService extends MedusaService({ Thread, ThreadMessage }) {}

export default SupportModuleService;
