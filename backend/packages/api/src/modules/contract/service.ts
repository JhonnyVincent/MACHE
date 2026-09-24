import { MedusaService } from "@medusajs/framework/utils";
import { Contract, ContractSignature, Policy } from "./models";

/*
  Le service par défaut, comme pour les devis et les livraisons.

  Les règles — un contrat publié ne se modifie plus, une signature fige
  l'empreinte du texte — vivent dans les routes, où l'on sait qui
  appelle et avec quelle intention. Les mettre ici les rendrait
  applicables à un appel interne qui n'a pas d'appelant, et donc
  contournables par mégarde.
*/
class ContractModuleService extends MedusaService({
  Contract,
  ContractSignature,
  Policy,
}) {}

export default ContractModuleService;
