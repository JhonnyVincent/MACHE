import { Module } from "@medusajs/framework/utils";
import QuoteModuleService from "./service";

export const QUOTE_MODULE = "mache_quote";

export default Module(QUOTE_MODULE, { service: QuoteModuleService });
