/*
  ROUTE : délivrer un laissez-passer vers le panneau vendeur.

  Appelée par le SITE, côté serveur, avec la connexion du vendeur
  (jeton + boutique). Sous /vendor, elle passe par les contrôles de
  Mercur avant d'arriver ici : le jeton est valide, et le membre
  appartient bien à la boutique demandée. La boutique vient donc de
  `seller_context`, jamais de la requête brute.

  Voir src/lib/vendor-pass.ts pour ce que le laissez-passer contient,
  et pourquoi il ne vaut que 60 secondes et une seule fois.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { issuePass, type PassContext } from "../../../lib/vendor-pass";

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const auth = (req as unknown as { auth_context?: PassContext }).auth_context;
  const sellerId = (req as unknown as { seller_context?: { seller_id?: string } })
    .seller_context?.seller_id;

  if (!auth || auth.actor_type !== "member" || !auth.actor_id || !sellerId) {
    res.status(401).json({ message: "Connexion vendeur requise." });
    return;
  }

  const secret = req.scope.resolve(ContainerRegistrationKeys.CONFIG_MODULE).projectConfig.http
    .jwtSecret as string;

  res.setHeader("cache-control", "no-store");
  res.json({ pass: issuePass(auth, sellerId, secret) });
};
