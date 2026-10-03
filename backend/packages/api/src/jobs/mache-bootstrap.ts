/*
  TÂCHE PLANIFIÉE : l'amorçage MACHE, lancé par le serveur lui-même.

  Sur Render, l'amorçage (src/scripts/bootstrap.ts) est enchaîné dans la
  commande de démarrage : migrations, amorçage, puis serveur. Medusa
  Cloud choisit sa propre commande de démarrage et n'exécute pas la
  nôtre. Sans cet amorçage, la base resterait vide : pas de région
  Haïti, pas de clé publique pour le site, aucun des mille rayons, pas
  de compte d'administration.

  Medusa n'offre pas de « loader » au niveau du projet. Une tâche
  planifiée est le moyen le plus proche : elle reçoit le conteneur
  complet de l'application, et elle part dans la minute qui suit le
  démarrage.

  Elle ne fait RIEN par défaut. Il faut poser MACHE_AUTO_BOOTSTRAP=true,
  ce que l'on ne fait que sur un hébergeur qui n'exécute pas notre
  commande de démarrage. Sur Render, où elle est exécutée, ce serait un
  doublon inutile.

  Elle ne s'exécute qu'une fois par démarrage du serveur : le drapeau
  vit en mémoire, donc un redémarrage la relance. L'amorçage est
  idempotent : le relancer ne recrée rien. Une erreur est écrite dans
  les journaux ; elle sera retentée à la minute suivante.
*/

import type { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

import bootstrap from "../scripts/bootstrap";

let done = false;
let running = false;

export default async function macheBootstrapJob(container: MedusaContainer) {
  const wanted = ["1", "true", "yes", "oui", "on"].includes(
    String(process.env.MACHE_AUTO_BOOTSTRAP || "").trim().toLowerCase()
  );

  if (!wanted || done || running) return;

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  running = true;

  try {
    logger.info("Amorçage MACHE : démarrage.");
    await bootstrap({ container, args: [] });
    done = true;
    logger.info("Amorçage MACHE : terminé.");
  } catch (error) {
    logger.error(
      `Amorçage MACHE : ${error instanceof Error ? error.message : String(error)}`
    );
  } finally {
    running = false;
  }
}

export const config = {
  name: "mache-bootstrap",
  schedule: "* * * * *",
};
