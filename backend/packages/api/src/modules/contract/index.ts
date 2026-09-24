import { Module } from "@medusajs/framework/utils";
import ContractModuleService from "./service";

export const CONTRACT_MODULE = "mache_contract";

export default Module(CONTRACT_MODULE, { service: ContractModuleService });
