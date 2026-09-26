/*
  LES PROMOTIONS EN COURS, POUR LE BANDEAU.

  Le bandeau rouge qui défile en haut du site annonçait un texte écrit
  en dur, identique depuis des mois. Un bandeau qui ne change jamais
  cesse d'être lu : on apprend en trois visites qu'il ne dit rien de
  neuf, et le jour où il annonce une vraie remise, plus personne ne le
  regarde.

  QUAND IL N'Y A RIEN, IL N'Y A RIEN

  Aucune promotion en cours : le bandeau ne s'affiche pas du tout.
  Plutôt qu'une remise inventée pour meubler — qui serait un faux — ou
  qu'une bande rouge vide, qui est du bruit. Et cela lui rend son sens :
  s'il apparaît, c'est qu'il y a quelque chose.

  UN ÉCHEC NE DOIT PAS EMPÊCHER LE SITE DE S'AFFICHER

  Le bandeau est un ornement ; le catalogue est le métier. Backend muet,
  configuration absente, réponse inattendue : on rend une liste vide, et
  la page s'affiche comme si de rien n'était.
*/

import { medusaFetch } from "./client";

export type SitePromotion = {
  id: string;
  /* Déjà mise en phrase par le backend : « −15 % », « −10 % avec le code X ». */
  label: string;
  code: string | null;
};

type Raw = Record<string, unknown>;

export async function fetchSitePromotions(): Promise<SitePromotion[]> {
  const result = await medusaFetch<{ promotions?: Raw[] }>("/store/promotions");

  if (!result.ok) return [];

  return (result.data.promotions ?? [])
    .map((raw) => ({
      id: typeof raw.id === "string" ? raw.id : "",
      label: typeof raw.label === "string" ? raw.label.trim() : "",
      code: typeof raw.code === "string" ? raw.code : null,
    }))
    .filter((promotion) => promotion.id && promotion.label);
}
