import { MedusaService } from "@medusajs/framework/utils";
import { Partner } from "./models";

/* Le service par défaut suffit : les règles vivent dans les routes. */
class PartnerModuleService extends MedusaService({ Partner }) {}

export default PartnerModuleService;
