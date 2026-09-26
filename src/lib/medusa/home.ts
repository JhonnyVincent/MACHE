/*
  Les données de la page d'accueil.

  L'accueil doit donner l'impression que la marketplace est vivante : ce
  qui vient d'arriver, qui vient d'ouvrir, ce qui est en promotion. Tout
  ce qui est affiché ici vient donc du backend, jamais d'une liste écrite
  à la main.

  Ce qui justifie chaque section

  Une section n'existe que si la donnée qui la justifie existe :

  - « Nouveautés » et « Nouvelles boutiques » reposent sur une date de
    création, que le backend fournit ;
  - « Promotions » compare le prix calculé au prix d'origine, tous deux
    renvoyés par Medusa. Une remise affichée ici est une remise réelle ;
  - « Les plus vendus » compte de vraies commandes, et le backend refuse
    de classer tant qu'il n'y en a pas assez (voir bestsellers.ts). Un
    classement tiré au hasard tromperait à la fois les acheteurs et les
    vendeurs qui s'y croiraient mis en avant ;
  - « Vous aimerez » part des FAVORIS d'un client connecté — quelque
    chose qu'il a choisi de nous dire. Pas d'un historique de
    navigation : il faudrait un cookie qui suive ce que chacun regarde,
    et la page de confidentialité promet qu'il n'y en a pas. Sans
    favoris, la section s'appelle honnêtement « À découvrir ».

  Tolérance aux pannes

  Les lectures partent en parallèle et indépendamment. Si l'une échoue,
  les autres s'affichent : une marketplace dont l'accueil s'effondre
  parce qu'une section ne répond pas est pire qu'une section manquante.
*/

import {
  fetchProducts, fetchSellers, fetchCategories,
  type StoreProduct, type StoreSeller, type StoreCategory,
} from "./catalog";
import { fetchBestSellers } from "./bestsellers";
import { PARTNERS, type Partner } from "../partners";
import { CATEGORY_TREE } from "../categories";

/* Une vignette du grand bandeau : une vraie photo de produit, jamais une image de stock. */
export type SlideProduct = { title: string; href: string; image: string };

/*
  LES DIAPOSITIVES DU GRAND BANDEAU (après la carte d'Haïti, qui ouvre
  toujours le défilement et vit dans la page elle-même).

  Trois formes, et chacune ne dit que ce qui est vrai :

  - « products » : de vraies vignettes, prises aux articles réellement
    en ligne ;
  - « partners » : les partenaires réellement signés, nommés, sans logo
    — MACHÉ n'a l'accord écrit de personne pour en afficher ;
  - « invite » : un rayon qui existe mais n'a encore aucun article. Il
    ne prétend pas en avoir : il s'adresse aux vendeurs qui pourraient
    le remplir. Un bandeau vide promettrait un catalogue absent ; un
    bandeau d'invitation dit vrai, et sert à quelque chose.
*/
export type HeroSlide =
  | {
      kind: "products";
      key: string;
      eyebrow: string;
      title: string;
      text: string;
      href: string;
      cta: string;
      products: SlideProduct[];
    }
  | { kind: "partners"; key: string; partners: Partner[] }
  | {
      kind: "invite";
      key: string;
      eyebrow: string;
      /* L'icône du rayon, celle des menus du site. */
      icon: string | null;
      title: string;
      text: string;
      rayonHref: string;
      subLinks: { label: string; href: string }[];
    };

export type ProductSection = {
  title: string;
  subtitle: string;
  href?: string;
  products: StoreProduct[];
};

export type HomeData = {
  slides: HeroSlide[];
  /* Les articles les plus récents. */
  newest: StoreProduct[];
  /* Prix réellement inférieurs au tarif habituel. */
  deals: StoreProduct[];
  /* Classés sur de vraies commandes ; vide tant qu'il n'y en a pas assez. */
  bestSellers: StoreProduct[];
  /* « Vous aimerez » (d'après les favoris) ou « À découvrir ». */
  forYou: ProductSection | null;
  newSellers: StoreSeller[];
  /* Les rayons principaux de MACHÉ présents au catalogue. */
  mainRayons: StoreCategory[];
  /* Raisons de panne, écrites au journal du serveur. */
  problems: string[];
  /* Faux si le backend n'est pas configuré du tout. */
  configured: boolean;
};

/*
  Les rayons du grand bandeau : ce que ce marché a de particulier —
  ce qui est fait à la main, fait maison, naturel. Ailleurs on vend de
  l'usine ; ici, beaucoup de vendeurs fabriquent.
*/
const SLIDE_RAYONS = ["fait-a-la-main", "fait-maison", "bio"] as const;

/* Ce qu'une diapositive d'invitation dit aux vendeurs, rayon par rayon. */
const INVITE: Record<string, string> = {
  "fait-a-la-main": "Vous fabriquez vous-même ? Ce rayon attend vos créations.",
  "fait-maison": "Vous cuisinez, vous préparez chez vous ? Ce rayon attend vos produits.",
  bio: "Vous produisez naturel ? Ce rayon attend vos articles.",
};

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
}: { favoriteHandles?: string[] } = {}): Promise<HomeData> {
  const [latest, discounted, sellers, categories, ranked, favorites] = await Promise.all([
    fetchProducts({ limit: 16, order: "-created_at" }),
    /*
      Les promotions ne se filtrent pas côté API : Medusa applique la
      remise au calcul du prix, sans exposer de drapeau « soldé ». On lit
      donc un lot plus large et on retient ceux dont le prix calculé est
      réellement inférieur au prix d'origine.
    */
    fetchProducts({ limit: 50, order: "-created_at" }),
    fetchSellers(12),
    /*
      Tout l'arbre des rayons : il faut les sous-rayons pour remplir un
      rayon principal, et l'ordre par défaut du catalogue place d'abord
      les rayons de la démonstration Mercur.
    */
    fetchCategories(300),
    /*
      Le backend refuse de classer tant qu'il n'y a pas assez de vraies
      commandes : on reçoit alors une liste vide.
    */
    fetchBestSellers(),
    /* Les favoris du client connecté, avec leurs rayons. Aucun : aucune lecture. */
    fetchProducts({ handles: favoriteHandles.slice(0, 20), limit: 20, withCategories: true }),
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

  const deals = discounted.ok
    ? discounted.data.products
        .filter(
          (product) =>
            product.originalPrice !== null &&
            product.price !== null &&
            product.originalPrice > product.price
        )
        .slice(0, 12)
    : [];

  /*
    LES PLUS VENDUS, AVEC LEURS PRIX.

    Le classement ne donne que l'ordre ; les fiches complètes (prix,
    photos) se lisent ensuite, et l'ordre du classement est rétabli —
    le catalogue, lui, les rendrait dans un ordre quelconque.
  */
  let bestSellers: StoreProduct[] = [];

  if (ranked.length > 0) {
    const found = await fetchProducts({ ids: ranked.map((item) => item.id), limit: ranked.length });

    if (found.ok) {
      const position = new Map(ranked.map((item, index) => [item.id, index]));
      bestSellers = [...found.data.products].sort(
        (a, b) => (position.get(a.id) ?? 99) - (position.get(b.id) ?? 99)
      );
    }
  }

  /* Les rayons principaux de MACHÉ, dans l'ordre du site. */
  const all = categories.ok ? categories.data : [];
  const macheOrder = new Map(CATEGORY_TREE.map((node, index) => [node.slug, index]));

  const mainRayons = all
    .filter((category) => category.parentId === null && macheOrder.has(category.handle))
    .sort((a, b) => macheOrder.get(a.handle)! - macheOrder.get(b.handle)!);

  const childOrder = new Map(
    CATEGORY_TREE.flatMap((node) =>
      (node.children ?? []).map((child, index) => [child.slug, index] as const)
    )
  );

  const childrenOf = (parentId: string) =>
    all
      .filter((category) => category.parentId === parentId)
      .sort(
        (a, b) =>
          (childOrder.get(a.handle) ?? Number.MAX_SAFE_INTEGER) -
          (childOrder.get(b.handle) ?? Number.MAX_SAFE_INTEGER)
      );

  /* ------------------------------------------------------------------ */
  /* Le grand bandeau                                                    */
  /* ------------------------------------------------------------------ */

  const slides: HeroSlide[] = [];

  const newestThumbs = thumbnails(newest);

  if (newestThumbs.length > 0) {
    slides.push({
      kind: "products",
      key: "new",
      eyebrow: "Nouveautés",
      title: "Ce qui vient d'arriver",
      text: "Les derniers articles mis en ligne par les vendeurs de MACHÉ.",
      href: "/shop?sort=new",
      cta: "Voir les nouveautés",
      products: newestThumbs,
    });
  }

  /* Aucun partenaire signé : pas de diapositive, plutôt qu'un réseau imaginaire. */
  if (PARTNERS.length > 0) {
    slides.push({ kind: "partners", key: "partners", partners: PARTNERS });
  }

  const bestThumbs = thumbnails(bestSellers);

  if (bestThumbs.length > 0) {
    slides.push({
      kind: "products",
      key: "best",
      eyebrow: "Les plus vendus",
      title: "Ce que les acheteurs choisissent",
      text: "Classement des 90 derniers jours, établi sur de vraies commandes.",
      href: "/shop",
      cta: "Voir le catalogue",
      products: bestThumbs,
    });
  }

  /*
    Les rayons du bandeau. Chaque rayon se remplit avec ses articles ET
    ceux de ses sous-rayons : un vendeur range sa poupée dans « Crochet
    et tricot », pas dans « Fait à la main ».

    Un rayon qui n'existe pas encore au catalogue n'a pas de
    diapositive : on n'enverrait personne vers une page vide.
  */
  const rayonSlides = await Promise.all(
    SLIDE_RAYONS.map(async (handle): Promise<HeroSlide | null> => {
      const rayon = mainRayons.find((category) => category.handle === handle);

      if (!rayon) return null;

      const children = childrenOf(rayon.id);
      const rayonHref = `/shop?category=${encodeURIComponent(rayon.handle)}`;
      const names = children.map((child) => child.name.toLowerCase());

      const found = await fetchProducts({
        categoryId: [rayon.id, ...children.map((child) => child.id)],
        limit: 8,
      });

      const thumbs = thumbnails(found.ok ? found.data.products : []);

      if (thumbs.length > 0) {
        return {
          kind: "products",
          key: `rayon-${handle}`,
          eyebrow: rayon.name,
          title: rayon.name,
          /*
            « Rangés par les vendeurs » : c'est le vendeur qui classe son
            article. MACHÉ ne certifie ni le « fait main » ni le « bio ».
          */
          text: names.length
            ? `Les articles que les vendeurs ont rangés ici : ${names.slice(0, 4).join(", ")}…`
            : "Les articles que les vendeurs ont rangés dans ce rayon.",
          href: rayonHref,
          cta: "Voir le rayon",
          products: thumbs,
        };
      }

      return {
        kind: "invite",
        key: `rayon-${handle}`,
        eyebrow: "Appel aux vendeurs",
        icon: CATEGORY_TREE.find((node) => node.slug === handle)?.icon ?? null,
        title: rayon.name,
        text: `${names.length ? `${names.slice(0, 4).join(", ")}… ` : ""}${
          INVITE[handle] ?? "Ce rayon attend ses premiers articles."
        }`,
        rayonHref,
        subLinks: children.slice(0, 6).map((child) => ({
          label: child.name,
          href: `/shop?category=${encodeURIComponent(child.handle)}`,
        })),
      };
    })
  );

  slides.push(...rayonSlides.filter((slide): slide is HeroSlide => slide !== null));

  /* ------------------------------------------------------------------ */
  /* « Vous aimerez », ou « À découvrir »                                */
  /* ------------------------------------------------------------------ */

  let forYou: ProductSection | null = null;

  const favoriteProducts = favorites.ok ? favorites.data.products : [];
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
        title: "Vous aimerez",
        subtitle: "D'après les articles que vous avez mis en favoris",
        href: "/favorites",
        products: picks,
      };
    }
  }

  /*
    Pas de favoris : « À découvrir », et pas « Vous aimerez ». Sans rien
    savoir des goûts du visiteur, prétendre deviner ce qu'il aimera
    serait un mensonge. Ce sont d'autres articles récents — ceux que le
    bandeau ne montre pas déjà.
  */
  if (!forYou) {
    const shown = new Set(newestThumbs.map((thumb) => thumb.href));
    const more = newest.filter((product) => !shown.has(productHref(product))).slice(0, 12);

    if (more.length > 0) {
      forYou = {
        title: "À découvrir",
        subtitle: "D'autres articles mis en ligne récemment",
        href: "/shop?sort=new",
        products: more,
      };
    }
  }

  return {
    slides,
    newest,
    deals,
    bestSellers,
    forYou,
    newSellers: sellers.ok ? sellers.data.sellers.slice(0, 12) : [],
    mainRayons,
    problems,
    configured,
  };
}
