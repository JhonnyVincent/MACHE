import MacheCommissionProvider from "./service";

/*
  L'enveloppe attendue par le chargeur de fournisseurs de Medusa : un
  export par défaut portant `services`. Sans lui, le chargeur refuse le
  module avec « doesn't seem to have a main service exported ».
*/
export default {
  services: [MacheCommissionProvider],
};

export { MacheCommissionProvider, MACHE_FUNDING_KEY } from "./service";
