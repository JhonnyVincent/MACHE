/*
  LE GARDE DE L'ÉQUIPE : chaque route d'administration vérifie le rôle de
  la personne connectée (voir lib/staff.ts).

  Un propriétaire passe partout. Un membre délégué ne passe que sur les
  routes de son espace, et en lecture seule là où c'est écrit.

  En cas de panne de lecture du compte, la requête est REFUSÉE : ici c'est
  une frontière de sécurité, pas une mesure de confort.
*/

import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import { staffMayCall, staffRole } from "../lib/staff";

type UserService = {
  retrieveUser: (id: string, config?: unknown) => Promise<{ metadata?: Record<string, unknown> | null }>;
};

export const STAFF_DENIED = "Cette action est réservée au propriétaire de MACHE.";

export async function staffGuard(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  const auth = (req as unknown as { auth_context?: { actor_type?: string; actor_id?: string } }).auth_context;

  /* Pas de compte administrateur identifié : l'authentification de Medusa décide. */
  if (!auth || auth.actor_type !== "user" || !auth.actor_id) return next();

  try {
    const users = req.scope.resolve(Modules.USER) as unknown as UserService;
    const user = await users.retrieveUser(auth.actor_id, { select: ["id", "metadata"] });
    const role = staffRole(user.metadata);

    if (staffMayCall(role, req.method, req.originalUrl || req.url)) return next();

    return res.status(403).json({ message: STAFF_DENIED });
  } catch {
    return res.status(503).json({ message: "Vérification des droits impossible pour le moment." });
  }
}
