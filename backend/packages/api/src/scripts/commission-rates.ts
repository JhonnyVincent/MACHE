/*
  SCRIPT : les taux de commission de MACHÉ.

  Pourquoi ce fichier existe

  Une commission affichée sur une page de tarifs et nulle part ailleurs
  n'est qu'une phrase. Mercur sait calculer et enregistrer la commission
  due sur chaque commande — encore faut-il qu'un taux existe. Sans taux
  par défaut, chaque vente était enregistrée sans commission, et le jour
  où l'on aurait voulu facturer, il n'y aurait rien eu à facturer.

  Ce script pose le taux par défaut au démarrage, comme le reste de la
  mise en place MACHÉ, et sans terminal.

  Ce qu'il ne fait JAMAIS

  Il ne modifie pas un taux existant. Un taux est un engagement pris
  envers des vendeurs : le réécrire à chaque redémarrage changerait
  leurs conditions sans que personne ne l'ait décidé — et sans que
  personne ne le sache. Si le taux doit changer, cela se fait depuis le
  panneau d'administration, délibérément, et s'annonce aux vendeurs
  avant de s'appliquer.

  Le taux réduit

  Mercur permet d'attacher un taux à une boutique précise, par une
  règle. Le taux réduit est donc créé, mais RATTACHÉ À PERSONNE : c'est
  une décision au cas par cas, prise dans le panneau, quand une boutique
  se révèle être un grossiste ou une marque. L'attribuer
  automatiquement sur la foi d'un profil que le vendeur déclare
  lui-même reviendrait à laisser chacun choisir son propre tarif.

  POURQUOI ON MODIFIE LE TAUX EXISTANT AU LIEU D'EN CRÉER UN

  Mercur sème lui-même un taux par défaut à 0 %, nommé « Default ».
  Ce n'est pas une offre faite à quelqu'un : c'est l'emplacement que
  l'exploitant est censé remplir.

  Et il ne peut y en avoir qu'un qui compte. Le calculateur de Mercur
  charge les taux du plus ancien au plus récent, puis prend LE PREMIER
  marqué par défaut. Créer un second taux par défaut ne l'aurait donc
  jamais fait appliquer : le 0 % semé au premier démarrage serait resté
  devant, et chaque vente aurait été enregistrée sans commission —
  sans la moindre erreur pour le signaler. Vérifié dans le code du
  fournisseur de commission avant d'écrire ce script.

  On renseigne donc l'emplacement. Et s'il porte déjà une valeur non
  nulle, on n'y touche pas : quelqu'un l'a décidée.
*/

import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/*
  Les mêmes valeurs que la page de tarifs du site. Elles sont écrites
  deux fois — ici et dans `src/lib/tarifs.ts` du storefront — parce que
  les deux projets ne partagent pas de code. Le commentaire vaut
  rappel : changer l'une sans l'autre ferait afficher un taux et en
  appliquer un autre.
*/
const STANDARD = 8;

const REDUCED = {
  code: "mache-reduit",
  name: "MACHÉ — taux réduit (grossistes et marques)",
  value: 5,
};

export default async function commissionRates({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const { createCommissionRatesWorkflow, updateCommissionRatesWorkflow } =
    await import("@mercurjs/core/workflows");

  /* ---- Le taux qui s'applique à tout le monde ---------------------- */

  const { data: defaults } = await query.graph({
    entity: "commission_rate",
    fields: ["id", "code", "value", "is_default"],
    filters: { is_default: true },
  });

  const globalRate = defaults?.[0];

  if (!globalRate) {
    /*
      Mercur le sème au démarrage ; son absence signale que le module
      de commission n'a pas fini de se charger. On le dit plutôt que
      d'en créer un second qui entrerait en concurrence avec lui.
    */
    logger.warn(
      "Aucun taux de commission par défaut trouvé. Rien n'est posé : MACHÉ ne crée pas de second taux par défaut, qui ne serait de toute façon jamais appliqué."
    );
  } else if (Number(globalRate.value) === 0) {
    await updateCommissionRatesWorkflow(container).run({
      input: [{ id: globalRate.id, value: STANDARD }],
    });

    logger.info(
      `Taux de commission par défaut renseigné : ${STANDARD} % (il valait 0 %, c'est-à-dire aucune commission enregistrée sur aucune vente).`
    );
  } else {
    logger.info(
      `Taux de commission par défaut déjà réglé à ${globalRate.value} %. Inchangé.`
    );
  }

  /* ---- Le taux réduit, à rattacher au cas par cas ------------------- */

  const { data: reduced } = await query.graph({
    entity: "commission_rate",
    fields: ["id", "code", "value"],
    filters: { code: REDUCED.code },
  });

  if (reduced?.length) {
    logger.info(
      `Taux réduit « ${REDUCED.code} » déjà en place (${reduced[0].value} %). Inchangé.`
    );
    return;
  }

  await createCommissionRatesWorkflow(container).run({
    input: [
      {
        name: REDUCED.name,
        code: REDUCED.code,
        type: "percentage",
        value: REDUCED.value,
        is_default: false,
        is_enabled: true,
        /*
          La commission porte sur la vente, pas sur le transport : la
          livraison est encaissée pour le compte de qui livre, et en
          prélever une part reviendrait à taxer un service que MACHÉ ne
          rend pas.
        */
        include_shipping: false,
        include_tax: false,
      },
    ],
  });

  logger.info(
    `Taux réduit « ${REDUCED.code} » créé : ${REDUCED.value} %. Il ne s'applique à personne tant qu'une boutique n'y est pas rattachée depuis le panneau.`
  );
}
