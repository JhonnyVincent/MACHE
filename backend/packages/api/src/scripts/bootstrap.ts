/*
  SCRIPT : amorçage au démarrage du serveur.

  Il tourne à chaque démarrage, avant que le serveur n'accepte des
  requêtes. Il enchaîne deux choses, dans cet ordre, et cet ordre
  compte.

  1. Le catalogue de démonstration, si SEED_DEMO le demande ET si le
     catalogue est vide.
  2. La mise en place MACHÉ : région Haïti, canal de vente, clé publique
     du site.
  3. Les prix en gourdes du catalogue de démonstration, une fois la
     région Haïti créée, et sa livraison vers Haïti.

  Pourquoi cet ordre

  Le catalogue de démonstration de Mercur crée une région « Europe » en
  euros et la désigne comme région par défaut de la boutique. Lancé
  après la mise en place, il effacerait donc le choix d'Haïti. Lancé
  avant, c'est la mise en place qui a le dernier mot.

  Et les prix en gourdes viennent en dernier, parce qu'ils supposent les
  deux : un catalogue à compléter, et la devise dans laquelle le
  compléter. Sans cette troisième étape, la démonstration s'affichait
  avec « Prix indisponible » partout et rien ne pouvait entrer dans un
  panier — Medusa refuse de calculer un prix dans une devise pour
  laquelle aucun prix n'existe. Constaté sur le site avant d'ajouter
  cette étape.

  Pourquoi ce script existe

  Charger la démonstration demandait d'ouvrir un terminal sur le
  serveur. L'accès au terminal n'est pas offert sur tous les plans
  d'hébergement, et une plateforme qu'on ne peut pas remplir sans
  terminal n'est pas une plateforme qu'on peut montrer.

  Une seule variable suffit maintenant, et elle se pose depuis
  l'interface de l'hébergeur.

  Ce qu'il ne fait pas

  Il ne relance jamais la démonstration sur un catalogue déjà rempli.
  C'est la protection la plus importante de ce fichier : relancé sur une
  boutique en activité, le script de démonstration ajouterait une
  deuxième fois ses vendeurs et ses produits, au milieu de vrais
  produits et de vraies commandes.
*/

import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

import seedDemoData from "./seed";
import setupMache from "./setup-mache";
import demoPricesHtg from "./demo-prices-htg";
import demoShippingHaiti from "./demo-shipping-haiti";
import adminUser from "./admin-user";
import commissionRates from "./commission-rates";

/* « 1 », « true », « yes », « oui » — on ne chicane pas sur la forme. */
function asked(value: string | undefined): boolean {
  return ["1", "true", "yes", "oui", "on"].includes(
    String(value || "").trim().toLowerCase()
  );
}

export default async function bootstrap(args: ExecArgs) {
  const logger = args.container.resolve(ContainerRegistrationKeys.LOGGER);

  /*
    Le compte d'administration d'abord, et à part.

    Il ne dépend de rien — ni région, ni catalogue, ni canal de vente —
    et c'est justement ce qui compte : si la mise en place échoue, il
    faut pouvoir entrer dans le panneau pour réparer. Le créer en
    dernier reviendrait à laisser la clé à l'intérieur.

    Son échec n'interrompt rien d'autre : le serveur doit démarrer même
    sans lui.
  */
  try {
    await adminUser(args);
  } catch (error) {
    logger.error(
      `Compte d'administration : ${error instanceof Error ? error.message : String(error)}`
    );
  }

  if (asked(process.env.SEED_DEMO)) {
    await seedDemoIfEmpty(args, logger);
  }

  /*
    Une mise en place qui échoue ne doit pas empêcher le serveur de
    démarrer. Un serveur qui refuse de démarrer ne laisse rien réparer :
    ni panneau d'administration, ni panneau vendeur. L'erreur est écrite
    en clair, et le reste continue.
  */
  try {
    await setupMache(args);

    /*
      Les taux de commission. Après la mise en place : ils n'en
      dépendent pas, mais une base sans région ni canal de vente n'a
      de toute façon pas de commande sur laquelle appliquer un taux.

      Idempotent : un taux déjà posé n'est jamais réécrit.
    */
    await commissionRates(args);

    /*
      Après la mise en place seulement : la région Haïti doit exister
      pour que des prix en gourdes servent à quelque chose.
    */
    if (asked(process.env.SEED_DEMO)) {
      await demoPricesHtg(args);

      /*
        Et la livraison : les zones du catalogue de démonstration ne
        couvrent que l'Europe. Sans cette étape, on remplit un panier
        mais on ne peut jamais commander.
      */
      await demoShippingHaiti(args);
    }
  } catch (error) {
    logger.error(
      `Mise en place MACHÉ interrompue : ${error instanceof Error ? error.message : String(error)}`
    );
    logger.error(
      "Le serveur démarre quand même. La région Haïti et la clé publique du site sont peut-être absentes ; le panneau d'administration permet de les créer à la main."
    );
  }
}

async function seedDemoIfEmpty(
  args: ExecArgs,
  logger: { info: (m: string) => void; warn: (m: string) => void; error: (m: string) => void }
) {
  const productService = args.container.resolve(Modules.PRODUCT);

  const [, count] = await productService.listAndCountProducts(
    {},
    { take: 1 }
  );

  if (count > 0) {
    logger.info(
      `SEED_DEMO demandé, mais le catalogue contient déjà ${count} produit(s). Rien n'est chargé : la démonstration ne s'ajoute jamais à un catalogue existant.`
    );
    return;
  }

  logger.info("SEED_DEMO : chargement du catalogue de démonstration Mercur…");

  try {
    await seedDemoData(args);

    logger.warn(" ");
    logger.warn("========================================================");
    logger.warn("  CATALOGUE DE DÉMONSTRATION CHARGÉ");
    logger.warn("--------------------------------------------------------");
    logger.warn("  Ce sont des chaussures fictives, en euros, avec des");
    logger.warn("  vendeurs fictifs. Rien de tout cela n'est à MACHÉ.");
    logger.warn(" ");
    logger.warn("  À retirer avant d'ouvrir la boutique à de vrais");
    logger.warn("  clients : un catalogue inventé qui reste en ligne");
    logger.warn("  fait passer pour des offres ce qui n'en est pas.");
    logger.warn(" ");
    logger.warn("  Pour ne plus le recharger : retirer SEED_DEMO.");
    logger.warn("========================================================");
    logger.warn(" ");
  } catch (error) {
    logger.error(
      `Le catalogue de démonstration n'a pas pu être chargé : ${error instanceof Error ? error.message : String(error)}`
    );
    logger.error(
      "Le serveur démarre quand même, avec un catalogue vide ou partiel."
    );
  }
}
