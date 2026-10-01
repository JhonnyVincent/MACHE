import { Module } from "@medusajs/framework/utils";
import BrandRequestModuleService from "./service";

export const BRAND_REQUEST_MODULE = "mache_brand_request";

export default Module(BRAND_REQUEST_MODULE, { service: BrandRequestModuleService });
