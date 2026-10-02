/*
  RANGÉES D'ACCUEIL PAR FÊTE.

  Quand un habillage de fête est actif (à la main ou par le calendrier),
  l'accueil ajoute une rangée dédiée : idées cadeaux pour Noël, vraies
  promotions pour le Black Friday, etc.

  Règle d'honnêteté : on ne montre que des produits RÉELS du catalogue
  qui correspondent. Aucun produit trouvé = aucune rangée, jamais un
  rayon inventé. Le Black Friday ne montre que des articles dont le prix
  barré est réellement supérieur au prix payé.
*/

import type { StoreProduct } from "@/lib/medusa/catalog";

export type SeasonRail = {
  title: string;
  subtitle: string;
  /* Mots (sans accents, minuscules) cherchés dans titre, description, rayon. */
  keywords: string[];
  /* Vrai : seulement les articles réellement en promotion. */
  onlyDeals?: boolean;
};

export const SEASON_RAILS: Record<string, SeasonRail> = {
  noel: {
    title: "Idées cadeaux de Noël",
    subtitle: "Des cadeaux et de quoi décorer, choisis chez nos vendeurs.",
    keywords: ["noel", "cadeau", "decoration", "sapin", "bougie", "jouet", "coffret", "guirlande", "bijou"],
  },
  "black-friday": {
    title: "Black Friday : les vraies promotions",
    subtitle: "Uniquement des articles dont le prix a réellement baissé.",
    keywords: [],
    onlyDeals: true,
  },
  "fete-des-meres": {
    title: "Pour les mamans",
    subtitle: "Des idées cadeaux pour la fête des mères.",
    keywords: ["maman", "mere", "femme", "bijou", "parfum", "sac", "foulard", "robe", "bouquet", "cadeau", "soin"],
  },
  "fete-des-peres": {
    title: "Pour les papas",
    subtitle: "Des idées cadeaux pour la fête des pères.",
    keywords: ["papa", "pere", "homme", "montre", "chemise", "cravate", "ceinture", "parfum", "outil", "cadeau"],
  },
  ete: {
    title: "C'est l'été : maillots, plage et soleil",
    subtitle: "Maillots de bain, bikinis, lunettes et tout pour la plage.",
    keywords: ["maillot", "bikini", "bain", "plage", "short", "sandale", "lunette", "chapeau", "creme solaire", "paréo", "pareo", "ete"],
  },
  "saint-valentin": {
    title: "Idées cadeaux Saint-Valentin",
    subtitle: "De quoi dire « je t'aime » à quelqu'un.",
    keywords: ["amour", "coeur", "rose", "bijou", "parfum", "chocolat", "couple", "cadeau", "bougie"],
  },
  paques: {
    title: "Pour Pâques",
    subtitle: "Chocolats, paniers et idées pour la table.",
    keywords: ["paques", "chocolat", "panier", "oeuf", "lapin", "gateau"],
  },
  "semaine-sainte": {
    title: "Pour la Semaine sainte",
    subtitle: "Pour préparer les repas et les réunions de famille.",
    keywords: ["poisson", "legume", "epice", "panier", "famille", "cuisine"],
  },
  rentree: {
    title: "C'est la rentrée",
    subtitle: "Sacs, fournitures et uniformes.",
    keywords: ["ecole", "sac", "cahier", "stylo", "uniforme", "fourniture", "cartable", "ordinateur"],
  },
  halloween: {
    title: "Halloween et Gede",
    subtitle: "Déguisements et décorations.",
    keywords: ["halloween", "deguisement", "costume", "citrouille", "masque", "gede", "bougie"],
  },
  carnaval: {
    title: "Carnaval",
    subtitle: "Costumes, masques et couleurs de fête.",
    keywords: ["carnaval", "costume", "masque", "deguisement", "perruque", "plume"],
  },
  drapeau: {
    title: "Fête du Drapeau",
    subtitle: "Aux couleurs d'Haïti.",
    keywords: ["drapeau", "haiti", "ayiti", "bleu", "rouge", "casquette", "t-shirt"],
  },
  independance: {
    title: "Fête de l'Indépendance",
    subtitle: "Des articles aux couleurs d'Haïti.",
    keywords: ["haiti", "ayiti", "drapeau", "independance", "joumou"],
  },
  vertieres: {
    title: "Vertières",
    subtitle: "Des articles aux couleurs d'Haïti.",
    keywords: ["haiti", "ayiti", "drapeau", "vertieres", "histoire", "livre"],
  },
  "journee-creole": {
    title: "Journée du créole",
    subtitle: "Livres, musique et créations en créole.",
    keywords: ["creole", "kreyol", "ayiti", "haiti", "livre", "musique"],
  },
  "toussaint-gede": {
    title: "Toussaint et Gede",
    subtitle: "Bougies et fleurs pour se souvenir.",
    keywords: ["bougie", "fleur", "gede", "toussaint"],
  },
  "octobre-rose": {
    title: "Octobre rose",
    subtitle: "Des articles roses pour soutenir la cause.",
    keywords: ["rose", "ruban"],
  },
  "bonne-annee": {
    title: "Pour bien commencer l'année",
    subtitle: "Cadeaux, agendas et bonnes résolutions.",
    keywords: ["agenda", "cadeau", "calendrier", "joumou", "cahier"],
  },
};

function fold(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function isRealDeal(p: StoreProduct): boolean {
  return p.price !== null && p.originalPrice !== null && p.originalPrice > p.price;
}

/* Les produits à montrer pour une fête, [] si rien ne correspond. */
export function seasonProducts(key: string, products: StoreProduct[]): StoreProduct[] {
  const rail = SEASON_RAILS[key];

  if (!rail) return [];

  if (rail.onlyDeals) return products.filter(isRealDeal);

  return products.filter((p) => {
    const hay = fold([p.title, p.description ?? "", p.collectionTitle ?? ""].join(" "));

    return rail.keywords.some((k) => hay.includes(fold(k)));
  });
}
