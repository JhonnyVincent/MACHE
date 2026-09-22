/*
  SCRIPT : le compte d'administration MACHÉ, créé au démarrage.

  Pourquoi ce fichier existe

  Créer un compte d'administration demandait d'ouvrir un terminal sur le
  serveur — `medusa user -e ... -p ...`. Or l'accès au terminal n'est pas
  offert sur tous les plans d'hébergement : sur le plan gratuit de
  Render, il n'existe pas. Une plateforme dont on ne peut pas ouvrir
  l'administration sans terminal n'est pas une plateforme qu'on peut
  exploiter.

  C'est le même problème que pour le catalogue de démonstration, et il
  reçoit la même réponse : deux variables d'environnement, posées depuis
  l'interface de l'hébergeur.

  Ce qu'il ne fait JAMAIS

  Il ne touche pas au mot de passe d'un compte existant. C'est la
  protection la plus importante de ce fichier. Les variables restent en
  place après le premier démarrage, et le script tourne à chaque
  redéploiement : s'il réécrivait le mot de passe, il annulerait
  silencieusement tout changement fait depuis — y compris celui qu'on
  vient de faire après une fuite.

  Il n'écrit jamais le mot de passe dans les journaux. Les journaux d'un
  hébergeur se consultent, se copient et se conservent.
*/

import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { createUserAccountWorkflow } from "@medusajs/core-flows";

/*
  Huit caractères. Ce n'est pas beaucoup, mais c'est le seuil en dessous
  duquel un mot de passe ne protège plus rien — et ce compte donne accès
  à la marketplace entière.
*/
const MIN_PASSWORD = 8;

export default async function adminUser({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);

  const email = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD || "");

  /* Rien n'est demandé : rien n'est fait, et sans bruit. */
  if (!email && !password) return;

  if (!email || !password) {
    logger.error(
      "ADMIN_EMAIL et ADMIN_PASSWORD vont ensemble : l'une est renseignée sans l'autre, aucun compte n'est créé."
    );
    return;
  }

  if (!email.includes("@")) {
    logger.error(`ADMIN_EMAIL ne ressemble pas à une adresse : « ${email} ».`);
    return;
  }

  if (password.length < MIN_PASSWORD) {
    logger.error(
      `ADMIN_PASSWORD fait moins de ${MIN_PASSWORD} caractères. Aucun compte n'est créé : ce compte ouvre la marketplace entière.`
    );
    return;
  }

  const userModule = container.resolve(Modules.USER);

  /*
    Le compte existe-t-il déjà ? On ne se fie pas à une tentative de
    création qui échouerait : on regarde d'abord, pour pouvoir dire
    clairement qu'il n'y a rien à faire.
  */
  const [existing] = await userModule.listUsers({ email });

  if (existing) {
    logger.info(
      `Compte d'administration « ${email} » déjà présent. Son mot de passe n'est pas touché.`
    );
    return;
  }

  const authModule = container.resolve(Modules.AUTH);

  /*
    Deux temps, comme Medusa le prévoit : une identité
    d'authentification d'abord, le compte ensuite, rattaché à elle. La
    première porte le mot de passe, le second porte l'identité.
  */
  const registered = await authModule.register("emailpass", {
    body: { email, password },
  } as never);

  if (!registered.success || !registered.authIdentity?.id) {
    /*
      Le cas le plus courant : une identité existe déjà pour cette
      adresse, sans compte rattaché — un démarrage précédent
      interrompu entre les deux temps. On le dit plutôt que de laisser
      chercher.
    */
    logger.error(
      `L'identité d'authentification n'a pas pu être créée pour « ${email} » : ${
        registered.error ?? "raison inconnue"
      }`
    );
    logger.error(
      "Si une identité existe déjà pour cette adresse sans compte rattaché, choisissez une autre adresse dans ADMIN_EMAIL."
    );
    return;
  }

  await createUserAccountWorkflow(container).run({
    input: {
      authIdentityId: registered.authIdentity.id,
      userData: { email },
    },
  });

  logger.warn(" ");
  logger.warn("========================================================");
  logger.warn("  COMPTE D'ADMINISTRATION CRÉÉ");
  logger.warn("--------------------------------------------------------");
  logger.warn(`  ${email}`);
  logger.warn(" ");
  logger.warn("  Il ouvre l'administration du site et le panneau");
  logger.warn("  complet du backend, avec le même identifiant.");
  logger.warn(" ");
  logger.warn("  RETIREZ MAINTENANT ADMIN_EMAIL et ADMIN_PASSWORD des");
  logger.warn("  variables d'environnement. Un mot de passe qui reste");
  logger.warn("  dans une variable est un mot de passe que lit toute");
  logger.warn("  personne ayant accès au tableau de bord de");
  logger.warn("  l'hébergeur. Le compte, lui, reste.");
  logger.warn("========================================================");
  logger.warn(" ");
}
