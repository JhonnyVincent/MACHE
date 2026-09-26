/*
  ROUTE : entrer dans le panneau vendeur avec un laissez-passer.

  Le navigateur du vendeur arrive ici depuis le site MACHÉ. Le
  laissez-passer est vérifié (signature, expiration, usage unique), puis
  la session du panneau est ouverte exactement comme le fait son propre
  écran de connexion — l'identité dans `auth_context`, la boutique dans
  `seller_id` — et le vendeur arrive sur son tableau de bord.

  - La session est RÉGÉNÉRÉE avant d'y écrire l'identité : un
    identifiant de session posé à l'avance par un tiers ne devient pas
    une session connectée.
  - La destination est fixe (/seller). Aucun paramètre ne la choisit :
    pas de redirection ouverte.
  - Laissez-passer refusé : on arrive quand même sur le panneau, à son
    écran de connexion. C'est l'ancien chemin, pas une impasse.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { readPass, consumePass } from "../../../lib/vendor-pass";

const PANEL = "/seller";

type Session = {
  regenerate: (cb: (err?: unknown) => void) => void;
  save: (cb: (err?: unknown) => void) => void;
  auth_context?: unknown;
  seller_id?: string;
};

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
  const secret = req.scope.resolve(ContainerRegistrationKeys.CONFIG_MODULE).projectConfig.http
    .jwtSecret as string;

  res.setHeader("cache-control", "no-store");
  /* Le laissez-passer est dans l'adresse : on ne la transmet à personne. */
  res.setHeader("referrer-policy", "no-referrer");

  const payload = readPass((req.query as Record<string, unknown>).jeton, secret);

  if (!payload || !consumePass(payload)) {
    logger.warn("Panneau vendeur : laissez-passer refusé (invalide, expiré ou déjà utilisé).");
    res.redirect(303, PANEL);
    return;
  }

  const session = (req as unknown as { session: Session }).session;

  try {
    await new Promise<void>((resolve, reject) =>
      session.regenerate((err) => (err ? reject(err) : resolve()))
    );

    const fresh = (req as unknown as { session: Session }).session;
    fresh.auth_context = payload.ctx;
    fresh.seller_id = payload.seller_id;

    await new Promise<void>((resolve, reject) =>
      fresh.save((err) => (err ? reject(err) : resolve()))
    );
  } catch (error) {
    logger.error(
      `Panneau vendeur : session impossible à ouvrir — ${error instanceof Error ? error.message : String(error)}`
    );
  }

  res.redirect(303, PANEL);
};
