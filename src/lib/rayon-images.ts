/*
  LES PHOTOS DES RAYONS, SUR LES TUILES « CATÉGORIES » DE L'ACCUEIL.

  Une photo par rayon ou sous-rayon, déposée dans
  `public/images/rayons/`, nommée d'après son adresse :

    telephones-accessoires.jpg   meubles.webp   huiles-essentielles.png

  Déposée : elle s'affiche. Absente : la tuile garde l'icône du rayon et
  son nom. Rien à déclarer ailleurs.

  Ce sont des illustrations du RAYON, pas des articles en vente : elles
  ne portent ni prix ni lien vers une fiche produit. Elles doivent être
  libres de droits pour un usage commercial (Unsplash, Pexels…) — jamais
  une image filigranée ni prise sur un site qui la vend.
*/

import { existsSync } from "node:fs";
import path from "node:path";

const FOLDER = path.join(process.cwd(), "public", "images", "rayons");
const EXTENSIONS = ["webp", "jpg", "jpeg", "png", "avif"];

/* Un nom de fichier sûr : pas de « ../ » qui sortirait du dossier. */
const SAFE = /^[a-z0-9-]+$/;

const cache = new Map<string, string | null>();

export function rayonImage(slug: string): string | null {
  if (!SAFE.test(slug)) return null;
  if (cache.has(slug)) return cache.get(slug)!;

  const found = EXTENSIONS.find((extension) => existsSync(path.join(FOLDER, `${slug}.${extension}`)));
  const url = found ? `/images/rayons/${slug}.${found}` : null;

  cache.set(slug, url);
  return url;
}
