/*
  MIDDLEWARES DU BACKEND MACHÉ.

  Un seul pour l'instant : refuser les écritures faites avec la session
  d'un compte bloqué.

  POURQUOI SEULEMENT LES ÉCRITURES

  Un compte bloqué peut encore LIRE ses anciennes commandes et la page
  d'un produit. L'empêcher de lire ne protégerait personne et rendrait
  seulement son historique inaccessible — y compris pour lui régler un
  litige en cours.

  POURQUOI CE FILTRE ET PAS UN AUTRE

  `/store/*` couvre tout ce qu'un client peut faire : commander,
  déposer un avis, écrire à MACHÉ, se servir de l'espace agent. Les
  requêtes d'invité n'ont pas de session client et passent sans la
  moindre lecture — un panier anonyme n'est pas ralenti.
*/

import { defineMiddlewares } from "@medusajs/medusa";
import { refuseBlockedCustomer } from "./blocked-customers";

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/*",
      method: ["POST", "PUT", "PATCH", "DELETE"],
      middlewares: [refuseBlockedCustomer],
    },
  ],
});
