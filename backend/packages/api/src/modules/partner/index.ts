import { Module } from "@medusajs/framework/utils";
import PartnerModuleService from "./service";

export const PARTNER_MODULE = "mache_partner";

export default Module(PARTNER_MODULE, { service: PartnerModuleService });
