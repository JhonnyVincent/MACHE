/*
  LES PLUS VENDUS — QUAND IL Y EN A.

  C'est le rayon qu'on invente le plus volontiers : quatre produits pris
  au hasard, personne ne peut vérifier, et l'accueil paraît plein. Sauf
  qu'il ment à deux personnes à la fois — l'acheteur, qui croit suivre
  le choix des autres, et le vendeur, qui se croit mis en avant par son
  mérite alors qu'il a été tiré au sort.

  Le backend compte de vraies commandes, sur 90 jours, hors annulations,
  et REFUSE de classer tant qu'il n'y en a pas assez (`ranked: false`).
  Ici, ce refus se traduit par une liste vide, donc par une carte qui ne
  s'affiche pas. MACHÉ démarre : ce rayon apparaîtra tout seul le jour
  où il aura quelque chose à dire.

  Un échec de lecture donne le même résultat qu'un refus : rien. Une
  carte d'accueil ne vaut pas la peine de casser la page.
*/

import { medusaFetch } from "./client";

export type BestSeller = {
  id: string;
  handle: string | null;
  title: string;
  thumbnail: string | null;
};

type Raw = Record<string, unknown>;

export async function fetchBestSellers(): Promise<BestSeller[]> {
  const result = await medusaFetch<{ products?: Raw[]; ranked?: boolean }>(
    "/store/bestsellers"
  );

  if (!result.ok) return [];

  /*
    Le backend dit lui-même qu'il n'y a pas de quoi classer. On ne
    contourne pas ce refus en affichant quand même ce qu'il a renvoyé.
  */
  if (result.data.ranked === false) return [];

  return (result.data.products ?? [])
    .map((raw) => ({
      id: typeof raw.id === "string" ? raw.id : "",
      handle: typeof raw.handle === "string" ? raw.handle : null,
      title: typeof raw.title === "string" ? raw.title.trim() : "",
      thumbnail: typeof raw.thumbnail === "string" ? raw.thumbnail : null,
    }))
    .filter((product) => product.id && product.title);
}
