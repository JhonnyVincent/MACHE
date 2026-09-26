/*
  ABONNÉ : envoyer le lien « nouveau mot de passe ».

  Medusa sait fabriquer un jeton de réinitialisation, mais n'envoie
  rien : il émet l'événement `auth.password_reset` et s'arrête là. Sans
  cet abonné, « mot de passe oublié » répondait « e-mail envoyé » à
  tout le monde — y compris dans le panneau vendeur de Mercur — et
  aucun e-mail ne partait jamais.

  Il sert les trois espaces : client, vendeur (y compris depuis le lien
  « Reset » du panneau Mercur, qui passe par le même compte), et
  administration.

  Ce qu'il n'écrit JAMAIS dans les journaux

  Le lien. Il ouvre le compte pendant 15 minutes : quiconque lit les
  journaux de l'hébergeur pourrait s'en servir. Ni l'adresse du
  destinataire, pour la même raison qu'ailleurs — les journaux se
  consultent, se copient et se conservent.

  Seule exception : en développement, sans service d'envoi configuré,
  le lien est affiché pour pouvoir tester. Jamais en production.
*/

import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { sendEmail } from "../lib/mailer";
import { isResetActor, resetEmail, resetLink } from "../lib/password-reset-email";

type Payload = {
  entity_id?: string;
  actor_type?: string;
  token?: string;
};

export default async function passwordResetHandler({
  event,
  container,
}: SubscriberArgs<Payload>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const { entity_id, actor_type, token } = event.data ?? {};

  if (!isResetActor(actor_type)) {
    logger.warn(
      `Nouveau mot de passe : type de compte « ${String(actor_type)} » sans page de réinitialisation, rien n'est envoyé.`
    );
    return;
  }

  const link = resetLink(actor_type, token);

  if (!link || !entity_id) {
    logger.error(
      "Nouveau mot de passe : lien impossible à construire — STOREFRONT_URL est absente ou invalide. Aucun e-mail n'est parti."
    );
    return;
  }

  const result = await sendEmail({ to: entity_id, ...resetEmail(actor_type, link) });

  if (result.sent) {
    logger.info(`Nouveau mot de passe : lien envoyé (espace ${actor_type}).`);
    return;
  }

  if (!result.configured && process.env.NODE_ENV !== "production") {
    logger.warn(
      `Nouveau mot de passe : ${result.reason} Lien, affiché parce qu'on est en développement : ${link}`
    );
    return;
  }

  logger.error(`Nouveau mot de passe : e-mail NON envoyé. ${result.reason}`);
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
};
