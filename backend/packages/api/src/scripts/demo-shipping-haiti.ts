/*
  SCRIPT : rendre le catalogue de démonstration livrable en Haïti.

  Le problème qu'il règle

  Le catalogue de démonstration de Mercur crée, pour chaque boutique,
  une zone de livraison couvrant sept pays d'Europe, et deux modes
  d'expédition tarifés en euros et en dollars.

  MACHÉ livre en Haïti. Une adresse haïtienne ne tombe donc dans aucune
  zone : `/store/shipping-options` renvoie un objet vide, et le passage
  en caisse s'arrête sur « No shipping method selected but the cart
  contains seller items that require shipping ». Constaté en passant une
  vraie commande avant d'écrire ce script.

  Autrement dit : avec SEED_DEMO, on pouvait remplir un panier mais
  jamais commander. Une démonstration qui s'arrête à la caisse ne
  démontre pas grand-chose.

  Ce qu'il fait

  - il ajoute Haïti aux zones de livraison existantes, plutôt que d'en
    créer de nouvelles : les modes d'expédition y sont déjà rattachés ;
  - il ajoute un tarif en gourdes aux modes d'expédition qui n'en ont
    pas, en conservant les tarifs existants.

  Ce que ce tarif n'est pas

  Ce n'est pas un prix de transport étudié. Livrer à Jacmel ne coûte pas
  ce que coûte livrer à Delmas, et personne ici ne connaît ces coûts :
  les fixer pour de vraies boutiques serait une décision commerciale.
  Ce sont des boutiques fictives, et ce montant sert à ce qu'une
  commande de démonstration aille jusqu'au bout. Il se règle avec
  DEMO_SHIPPING_HTG.

  Sûreté

  - relancé, il constate ce qui est en place et ne fait rien ;
  - il n'enlève ni pays ni tarif : la démonstration reste livrable en
    Europe comme avant.
*/

import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import {
  updateServiceZonesWorkflow,
  updateShippingOptionsWorkflow,
} from "@medusajs/medusa/core-flows";

const HAITI = "ht";

/* Un montant qui permet d'aller au bout d'une commande, rien de plus. */
const DEFAULT_SHIPPING_HTG = 350;

export default async function demoShippingHaiti({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillment = container.resolve(Modules.FULFILLMENT);

  const amount = Number(process.env.DEMO_SHIPPING_HTG) || DEFAULT_SHIPPING_HTG;

  /* ------------------------------------------------------------------ */
  /* Les zones de livraison                                             */
  /* ------------------------------------------------------------------ */
  const zones = await fulfillment.listServiceZones(
    {},
    { relations: ["geo_zones"] }
  );

  let zonesUpdated = 0;

  for (const zone of zones) {
    const countries = (zone.geo_zones ?? [])
      .filter((geo) => geo.type === "country")
      .map((geo) => String(geo.country_code || "").toLowerCase());

    if (countries.includes(HAITI)) continue;

    /*
      Les zones géographiques se remplacent en bloc : on renvoie les
      pays existants, plus Haïti. En omettre un le retirerait, et la
      démonstration cesserait d'être livrable en Europe.
    */
    await updateServiceZonesWorkflow(container).run({
      input: {
        selector: { id: zone.id },
        update: {
          geo_zones: [
            ...countries.map((country_code) => ({
              country_code,
              type: "country" as const,
            })),
            { country_code: HAITI, type: "country" as const },
          ],
        },
      },
    });

    zonesUpdated += 1;
  }

  logger.info(
    zonesUpdated > 0
      ? `Livraison : Haïti ajoutée à ${zonesUpdated} zone(s).`
      : "Livraison : Haïti déjà couverte par toutes les zones."
  );

  /* ------------------------------------------------------------------ */
  /* Les tarifs d'expédition                                            */
  /* ------------------------------------------------------------------ */
  const { data: options } = await query.graph({
    entity: "shipping_option",
    fields: [
      "id",
      "name",
      "price_type",
      "prices.id",
      "prices.amount",
      "prices.currency_code",
    ],
  });

  let priced = 0;

  for (const option of options as {
    id: string;
    name: string;
    price_type: string;
    prices?: ({ id: string; amount: number; currency_code: string } | null)[];
  }[]) {
    /* Un tarif calculé n'a pas de grille à compléter. */
    if (option.price_type !== "flat") continue;

    const prices = (option.prices ?? []).filter(
      (price): price is { id: string; amount: number; currency_code: string } =>
        Boolean(price?.id)
    );

    if (prices.some((price) => price.currency_code?.toLowerCase() === "htg")) {
      continue;
    }

    await updateShippingOptionsWorkflow(container).run({
      input: [
        {
          id: option.id,
          price_type: "flat",
          prices: [
            ...prices.map((price) => ({
              id: price.id,
              amount: price.amount,
              currency_code: price.currency_code,
            })),
            { amount, currency_code: "htg" },
          ],
        },
      ] as never,
    });

    priced += 1;
  }

  logger.info(
    priced > 0
      ? `Livraison : tarif en gourdes ajouté à ${priced} mode(s) d'expédition (${amount} HTG).`
      : "Livraison : tous les modes d'expédition ont déjà un tarif en gourdes."
  );

  if (priced > 0) {
    logger.info(
      "Ce tarif n'est pas un coût de transport étudié : c'est un montant de démonstration, réglable avec DEMO_SHIPPING_HTG."
    );
  }
}
