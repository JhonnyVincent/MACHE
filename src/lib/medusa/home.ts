/*
  Les données de la page d'accueil.

  Tout ce qui est affiché ici vient du backend, jamais d'une liste
  écrite à la main, et une section n'existe que si la donnée qui la
  justifie existe :

  - « Nouvelles boutiques » et les nouveautés reposent sur une date de
    création, que le backend fournit ;
  - « Promotions » : des prix réellement inférieurs au tarif habituel,
    ou des codes promotionnels réellement actifs ;
  - « Sur MACHÉ en ce moment » : une sélection qui TOURNE entre les
    vendeurs (voir src/lib/rotation.ts) — pas un classement ;
  - « Nos marques » : les boutiques qui se DÉCLARENT marque officielle.
    C'est leur déclaration, pas un contrôle de MACHÉ ;
  - « Nos suggestions pour vous » part des FAVORIS d'un client connecté
    — quelque chose qu'il a choisi de nous dire. Pas d'un historique de
    navigation : il faudrait un cookie de suivi, et la page de
    confidentialité promet qu'il n'y en a pas. Sans favoris, la section
    s'appelle honnêtement « À découvrir ».

  Tolérance aux pannes : les lectures partent en parallèle et
  indépendamment. Une section qui échoue n'emporte pas les autres.
*/

import {
  fetchProducts, fetchSellers, fetchCategories, fetchProductSellerMap,
  type StoreProduct, type StoreSeller, type StoreCategory,
} from "./catalog";
import { fetchSitePromotions } from "./promotions";
import { PARTNERS, type Partner } from "../partners";
import { CATEGORY_TREE } from "../categories";
import { readSellerProfile } from "../seller-profile";
import { hourSeed, rotateFairly, seededRandom } from "../rotation";

/* Une vignette du grand bandeau : une vraie photo de produit, jamais une image de stock. */
export type SlideProduct = { title: string; href: string; image: string };

/*
  LES DIAPOSITIVES DU GRAND BANDEAU, après la carte d'Haïti — qui ouvre
  toujours le défilement et vit dans la page elle-même.
*/
export type HeroSlide =
  | { kind: "shops"; key: string; sellers: StoreSeller[] }
  | {
      kind: "promotions";
      key: string;
      /* Les codes et remises de MACHÉ réellement actifs. */
      labels: string[];
      products: SlideProduct[];
    }
  | { kind: "partners"; key: string; partners: Partner[] };

export type CategoryTile = {
  handle: string;
  name: string;
  icon: string | null;
  href: string;
  /* Jusqu'à quatre vraies photos d'articles du rayon ; aucune s'il est vide. */
  images: string[];
  /* Ses sous-rayons (Vêtements femme, Chaussures…), pour une tuile encore vide. */
  subs: string[];
};

export type ProductSection = {
  title: string;
  subtitle: string;
  href?: string;
  products: StoreProduct[];
};

export type HomeData = {
  slides: HeroSlide[];
  /* Sélection tournante : chaque vendeur à son tour. */
  spotlight: StoreProduct[];
  categoryTiles: CategoryTile[];
  /* Vrai si les rayons proposés viennent des favoris du client. */
  tilesFromFavorites: boolean;
  newSellers: StoreSeller[];
  /* Boutiques qui se déclarent marque officielle. */
  brands: StoreSeller[];
  /* « Nos suggestions pour vous » (d'après les favoris) ou « À découvrir ». */
  forYou: ProductSection | null;
  newestCount: number;
  mainRayons: StoreCategory[];
  problems: string[];
  configured: boolean;
};

/*
  Les rayons proposés à qui n'a encore rien dit de ses goûts. Ce ne sont
  pas « les plus demandés » — MACHÉ ne mesure pas cela — et la section ne
  le prétend pas.
*/
export const DEFAULT_TILES = ["maison", "mode", "electronique", "bio", "fait-a-la-main"] as const;

const TILE_COUNT = 5;
const SPOTLIGHT_COUNT = 12;

const productHref = (product: StoreProduct) => `/product/${product.handle ?? product.id}`;

function thumbnails(products: StoreProduct[], max = 4): SlideProduct[] {
  return products
    .filter((product) => Boolean(product.thumbnail))
    .slice(0, max)
    .map((product) => ({
      title: product.title,
      href: productHref(product),
      image: product.thumbnail as string,
    }));
}

export async function fetchHomeData({
  favoriteHandles = [],
  now = new Date(),
}: { favoriteHandles?: string[]; now?: Date } = {}): Promise<HomeData> {
  const [latest, discounted, sellers, categories, favorites, sellerMap, promotions] =
    await Promise.all([
      fetchProducts({ limit: 16, order: "-created_at" }),
      /*
        Les promotions ne se filtrent pas côté API : Medusa applique la
        remise au calcul du prix. On lit donc un lot plus large et on
        retient ceux dont le prix calculé est réellement inférieur au
        prix d'origine.
      */
      fetchProducts({ limit: 50, order: "-created_at" }),
      fetchSellers(24),
      fetchCategories(300),
      fetchProducts({ handles: favoriteHandles.slice(0, 20), limit: 20, withCategories: true }),
      fetchProductSellerMap(),
      fetchSitePromotions(),
    ]);

  const problems: string[] = [];
  let configured = true;

  for (const result of [latest, discounted, sellers, categories]) {
    if (!result.ok) {
      if (!result.configured) configured = false;
      if (!problems.includes(result.reason)) problems.push(result.reason);
    }
  }

  const newest = latest.ok ? latest.data.products : [];
  const total = latest.ok ? latest.data.count : 0;
  const allSellers = sellers.ok ? sellers.data.sellers : [];
  const seed = hourSeed(now);

  /* ------------------------------------------------------------------ */
  /* Le grand bandeau                                                    */
  /* ------------------------------------------------------------------ */

  const slides: HeroSlide[] = [];

  if (allSellers.length > 0) {
    slides.push({ kind: "shops", key: "shops", sellers: allSellers.slice(0, 8) });
  }

  const deals = discounted.ok
    ? discounted.data.products.filter(
        (product) =>
          product.originalPrice !== null &&
          product.price !== null &&
          product.originalPrice > product.price
      )
    : [];

  /* Aucune remise réelle, aucun code actif : pas de diapositive « Promotions ». */
  if (deals.length > 0 || promotions.length > 0) {
    slides.push({
      kind: "promotions",
      key: "promotions",
      labels: promotions.map((promotion) => promotion.label).slice(0, 4),
      products: thumbnails(deals),
    });
  }

  /* Aucun partenaire signé : pas de diapositive, plutôt qu'un réseau imaginaire. */
  if (PARTNERS.length > 0) {
    slides.push({ kind: "partners", key: "partners", partners: PARTNERS });
  }

  /* ------------------------------------------------------------------ */
  /* Sur MACHÉ en ce moment                                              */
  /* ------------------------------------------------------------------ */

  /*
    Des nouveautés ET des articles plus anciens : un lot récent, plus un
    lot pris plus loin dans le catalogue, à un endroit tiré au sort qui
    change toutes les heures. Sans lui, un article vieux d'un mois ne
    reparaîtrait jamais.
  */
  let older: StoreProduct[] = [];

  if (total > newest.length) {
    const span = Math.max(0, total - newest.length - 24);
    const offset = newest.length + Math.floor(seededRandom(seed)() * (span + 1));
    const found = await fetchProducts({ limit: 24, offset, order: "-created_at" });
    older = found.ok ? found.data.products : [];
  }

  const pool = [...newest, ...older.filter((product) => !newest.some((n) => n.id === product.id))];
  const map = sellerMap.ok ? sellerMap.data : new Map<string, string>();

  const spotlight = rotateFairly(pool, (product) => map.get(product.id) ?? null, seed, SPOTLIGHT_COUNT);

  /* ------------------------------------------------------------------ */
  /* Les rayons proposés                                                 */
  /* ------------------------------------------------------------------ */

  const all = categories.ok ? categories.data : [];
  const byId = new Map(all.map((category) => [category.id, category]));
  const macheOrder = new Map(CATEGORY_TREE.map((node, index) => [node.slug, index]));

  const mainRayons = all
    .filter((category) => category.parentId === null && macheOrder.has(category.handle))
    .sort((a, b) => macheOrder.get(a.handle)! - macheOrder.get(b.handle)!);

  /* Le rayon principal d'un rayon quelconque. */
  const mainOf = (id: string): StoreCategory | null => {
    let current = byId.get(id) ?? null;
    let guard = 0;
    while (current && current.parentId && guard < 6) {
      current = byId.get(current.parentId) ?? null;
      guard += 1;
    }
    return current && macheOrder.has(current.handle) ? current : null;
  };

  /* Les goûts que le client a exprimés : les rayons de ses favoris, du plus fréquent au moins fréquent. */
  const favoriteProducts = favorites.ok ? favorites.data.products : [];
  const frequency = new Map<string, number>();

  for (const product of favoriteProducts) {
    const seen = new Set<string>();
    for (const categoryId of product.categoryIds) {
      const main = mainOf(categoryId);
      if (main && !seen.has(main.handle)) {
        seen.add(main.handle);
        frequency.set(main.handle, (frequency.get(main.handle) ?? 0) + 1);
      }
    }
  }

  const preferred = [...frequency.entries()].sort((a, b) => b[1] - a[1]).map(([handle]) => handle);
  const tilesFromFavorites = preferred.length > 0;

  const tileHandles = [...new Set([...preferred, ...DEFAULT_TILES])]
    .filter((handle) => mainRayons.some((rayon) => rayon.handle === handle))
    .slice(0, TILE_COUNT);

  const categoryTiles = await Promise.all(
    tileHandles.map(async (handle): Promise<CategoryTile> => {
      const rayon = mainRayons.find((category) => category.handle === handle)!;
      const children = all.filter((category) => category.parentId === rayon.id);

      const found = await fetchProducts({
        categoryId: [rayon.id, ...children.map((child) => child.id)],
        limit: 8,
      });

      return {
        handle,
        name: rayon.name,
        icon: CATEGORY_TREE.find((node) => node.slug === handle)?.icon ?? null,
        href: `/shop?category=${encodeURIComponent(handle)}`,
        images: thumbnails(found.ok ? found.data.products : []).map((thumb) => thumb.image),
        subs: children.map((child) => child.name).slice(0, 4),
      };
    })
  );

  /* ------------------------------------------------------------------ */
  /* Suggestions                                                         */
  /* ------------------------------------------------------------------ */

  let forYou: ProductSection | null = null;

  const favoriteCategoryIds = [
    ...new Set(favoriteProducts.flatMap((product) => product.categoryIds)),
  ].slice(0, 8);

  if (favoriteCategoryIds.length > 0) {
    const neighbours = await fetchProducts({ categoryId: favoriteCategoryIds, limit: 24 });
    const favoriteHandleSet = new Set(favoriteHandles);

    const picks = (neighbours.ok ? neighbours.data.products : [])
      .filter((product) => !favoriteHandleSet.has(product.handle))
      .slice(0, 12);

    if (picks.length > 0) {
      forYou = {
        title: "Nos suggestions pour vous",
        subtitle: "D'après les articles que vous avez mis en favoris",
        href: "/favorites",
        products: picks,
      };
    }
  }

  /*
    Pas de favoris : « À découvrir », et pas « pour vous ». Sans rien
    savoir des goûts du visiteur, prétendre deviner ce qu'il aimera
    serait un mensonge. Ce sont d'autres articles, ceux que la section
    tournante ne montre pas déjà.
  */
  if (!forYou) {
    const shown = new Set(spotlight.map((product) => product.id));
    const more = pool.filter((product) => !shown.has(product.id)).slice(0, 12);

    if (more.length > 0) {
      forYou = {
        title: "À découvrir",
        subtitle: "D'autres articles en ligne sur MACHÉ",
        href: "/shop",
        products: more,
      };
    }
  }

  return {
    slides,
    spotlight,
    categoryTiles,
    tilesFromFavorites,
    newSellers: allSellers.slice(0, 12),
    brands: allSellers.filter((seller) => readSellerProfile(seller.metadata) === "marque"),
    forYou,
    newestCount: Math.min(newest.length, 12),
    mainRayons,
    problems,
    configured,
  };
}
