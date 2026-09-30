/*
  TÂCHE : toutes les heures, donner le mode « expédition internationale
  sur confirmation » aux boutiques qui viennent de configurer leur
  livraison. Voir scripts/livraison-internationale.ts.
*/

import type { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import livraisonInternationale from "../scripts/livraison-internationale";

export default async function livraisonInternationaleJob(container: MedusaContainer) {
  try {
    await livraisonInternationale({ container, args: [] } as never);
  } catch (error) {
    container
      .resolve(ContainerRegistrationKeys.LOGGER)
      .error(`Livraison internationale (tâche) : ${error instanceof Error ? error.message : String(error)}`);
  }
}

export const config = {
  name: "mache-livraison-internationale",
  schedule: "17 * * * *",
};
