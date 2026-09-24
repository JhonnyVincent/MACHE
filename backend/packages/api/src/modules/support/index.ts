import { Module } from "@medusajs/framework/utils";
import SupportModuleService from "./service";

export const SUPPORT_MODULE = "mache_support";

export default Module(SUPPORT_MODULE, { service: SupportModuleService });
