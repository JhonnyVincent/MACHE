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
import { throttleLogin } from "./login-throttle";
import { normalizeAuthEmail } from "./email-case";
import { throttleResetRequests } from "./reset-throttle";

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/*",
      method: ["POST", "PUT", "PATCH", "DELETE"],
      middlewares: [refuseBlockedCustomer],
    },
    /*
      Les tentatives de connexion, toutes actrices confondues :
      administrateur, vendeur, client. C'est le chemin qu'emprunte
      quelqu'un qui essaie des mots de passe en boucle — de loin la
      façon la plus fréquente dont un compte tombe.

      Posé sur le backend et non sur le site, parce que le formulaire
      du site n'est pas le seul chemin : qui connaît l'adresse du
      backend appelle ces routes directement.
    */
    {
      matcher: "/auth/*",
      method: ["POST"],
      /*
        L'adresse d'abord, pour que le plafond de tentatives et Medusa
        voient la même : sinon « Jean@… » et « jean@… » compteraient
        comme deux comptes différents.
      */
      /*
        Les demandes de nouveau mot de passe ont leur propre plafond,
        avant celui des connexions : elles réussissent toujours, et
        celui-ci ne compte que les échecs.
      */
      middlewares: [normalizeAuthEmail, throttleResetRequests, throttleLogin],
    },
  ],
});
