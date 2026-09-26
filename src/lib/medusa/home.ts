/*
  Rayons de la page d'accueil.

  L'accueil doit donner l'impression que la marketplace est vivante : ce
  qui vient d'arriver, qui vient d'ouvrir, ce qui est en promotion. Tout
  ce qui est affiché ici vient donc du backend, jamais d'une liste écrite
  à la main.

  Ce que MACHÉ sait classer aujourd'hui, et ce qu'elle ne sait pas encore

  Un rayon n'existe que si la donnée qui le justifie existe :

  - « nouveautés » et « nouvelles boutiques » reposent sur une date de
    création, que le backend fournit ;
  - « promotions » compare le prix calculé au prix d'origine, tous deux
    renvoyés par Medusa. Une remise affichée ici est une remise réelle ;
  - « catégories » et « collections » sont des données de catalogue.

  En revanche, « meilleures ventes », « tendances » et « recommandé pour
  vous » supposent respectivement un cumul des ventes, une mesure du
  trafic et un historique par visiteur. Aucun des trois n'est en place.
  Ils ne sont donc pas inventés : ces rayons n'apparaissent simplement
  pas. Un classement « meilleures ventes » tiré au hasard tromperait à la
  fois les clients et les vendeurs qui s'y croiraient mis en avant. Ils
  reviendront quand les commandes, l'audience et l'historique existeront.

  Tolérance aux pannes

  Les rayons sont chargés en parallèle et indépendamment. Si l'un échoue,
  les autres s'affichent : une marketplace dont l'accueil s'effondre parce
  qu'un rayon ne répond pas est pire qu'un rayon manquant.
*/

import {
  fetchProducts, fetchSellers, fetchCategories, fetchCollections,
  type StoreProduct, type StoreSeller, type StoreCategory, type StoreCollection,
} from "./catalog";
import { fetchBestSellers } from "./bestsellers";
import { PARTNERS } from "../partners";
import { CATEGORY_TREE, FEATURED_CATEGORY_SLUGS } from "../categories";

export type ProductRail = {
  key: string;
  title: string;
  subtitle: string;
  href: string;
  products: StoreProduct[];
};

/*
  LE DAMIER DE L'ACCUEIL, TEL QU'UNE PLACE DE MARCHÉ EN MONTRE UN.

  Ce qui meuble l'accueil d'Amazon ou de Cdiscount n'est pas du texte :
  ce sont des cartes, chacune coiffée d'un titre et remplie de quatre
  vignettes nommées, chaque vignette menant quelque part.

  MACHÉ n'a aucune photo à lui — les visuels de stock ont été retirés
  volontairement — mais les vendeurs, eux, en mettent sur leurs
  articles. Chaque carte emprunte donc jusqu'à quatre VRAIES vignettes
  à ce qu'elle annonce, et les nomme. Une carte sans rien à montrer le
  dit, plutôt que de recevoir une image décorative qui lui promettrait
  un catalogue qu'elle n'a pas.

  TOUTES LES CARTES SORTENT DE LA MÊME FABRIQUE

  Rayons, nouveautés, meilleures ventes, partenaires : même forme, même
  règle. Une seule chose les distingue, et c'est une donnée — ce
  qu'elles ont réellement à montrer. Une carte spéciale pour chaque
  sujet aurait fini par en laisser une mentir pendant que les autres
  disaient vrai.
*/
export type BoardTile = {
  label: string;
  href: string;
  /* Une vraie photo de produit, ou rien. Jamais une image de stock. */
  image: string | null;
  /* Le lien quitte-t-il MACHÉ ? */
  external?: boolean;
};

export type BoardCard = {
  key: string;
  title: string;
  /* Où mène le titre de la carte. */
  href: string;
  external?: boolean;
  tiles: BoardTile[];
  /* Ce que la carte dit quand elle n'a rien à montrer. Sinon, rien. */
  emptyNote: string | null;
  /*
    Les sous-rayons d'un rayon, pour qu'une carte encore vide montre au
    moins ce qu'on y trouvera — des rayons qui existent vraiment, pas
    des produits imaginés.
  */
  subLinks?: { label: string; href: string }[];
  /* Combien d'articles derrière, quand ce chiffre existe vraiment. */
  count: number;
};

export type HomeData = {
  /* Rayons de produits réellement alimentés. */
  rails: ProductRail[];
  newSellers: StoreSeller[];
  verifiedSellers: StoreSeller[];
  categories: StoreCategory[];
  /* Le damier : rayons, nouveautés, meilleures ventes, partenaires. */
  boards: BoardCard[];
  collections: StoreCollection[];
  /* Raisons de panne, écrites au journal du serveur. */
  problems: string[];
  /* Faux si le backend n'est pas configuré du tout. */
  configured: boolean;
};

export async function fetchHomeData(): Promise<HomeData> {
  const [latest, discounted, sellers, categories, collections, bestSellers] = await Promise.all([
    fetchProducts({ limit: 12, order: "-created_at" }),
    /*
      Les promotions ne se filtrent pas côté API : Medusa applique la
      remise au calcul du prix, sans exposer de drapeau « soldé ». On lit
      donc un lot plus large et on retient ceux dont le prix calculé est
      réellement inférieur au prix d'origine.
    */
    fetchProducts({ limit: 50, order: "-created_at" }),
    fetchSellers(12),
    /*
      Tout l'arbre des rayons, pas les vingt-quatre premiers : il faut
      les sous-rayons pour remplir chaque rayon principal, et l'ordre
      par défaut du catalogue place d'abord les rayons de la
      démonstration.
    */
    fetchCategories(300),
    fetchCollections(12),
    /*
      Les meilleures ventes viennent de vraies commandes. Le backend
      refuse de classer tant qu'il n'y en a pas assez : on reçoit alors
      une liste vide, et la carte ne s'affiche pas.
    */
    fetchBestSellers(),
  ]);

  const problems: string[] = [];
  let configured = true;

  for (const result of [latest, discounted, sellers, categories, collections]) {
    if (!result.ok) {
      if (!result.configured) configured = false;
      if (!problems.includes(result.reason)) problems.push(result.reason);
    }
  }

  const rails: ProductRail[] = [];

  if (latest.ok && latest.data.products.length > 0) {
    rails.push({
      key: "new",
      title: "Nouveautés",
      subtitle: "Les derniers produits mis en ligne par les vendeurs",
      href: "/shop?sort=new",
      products: latest.data.products,
    });
  }

  if (discounted.ok) {
    const onSale = discounted.data.products.filter(
      (product) =>
        product.originalPrice !== null &&
        product.price !== null &&
        product.originalPrice > product.price
    );

    if (onSale.length > 0) {
      rails.push({
        key: "deals",
        title: "Offres du moment",
        subtitle: "Prix réellement inférieurs au tarif habituel",
        href: "/shop?sort=deals",
        products: onSale.slice(0, 12),
      });
    }
  }

  const allSellers = sellers.ok ? sellers.data.sellers : [];

  /*
    LE DAMIER, CARTE PAR CARTE.

    L'ordre n'est pas décoratif. Les partenaires d'abord : ce sont des
    engagements pris, et ils tiennent en une carte qui ne dépend
    d'aucun catalogue. Puis ce qui bouge — les nouveautés, les
    meilleures ventes — puis les rayons.
  */
  const boards: BoardCard[] = [];

  /*
    LES PARTENAIRES.

    Pas de vignettes : afficher un logo demande un accord écrit, et
    MACHÉ n'en a aucun. Des noms, et l'adresse derrière. Aucun
    partenaire signé : pas de carte — une carte « Partenaires » vide
    annoncerait un réseau qui n'existe pas.
  */
  if (PARTNERS.length > 0) {
    boards.push({
      key: "partners",
      title: "Partenaires",
      href: "/partenaires",
      tiles: PARTNERS.map((partner) => ({
        label: partner.name,
        href: partner.href,
        image: null,
        external: true,
      })),
      emptyNote: null,
      count: 0,
    });
  }

  /*
    LES NOUVEAUTÉS, sur la même date de création que le rayon plus bas.
    C'est la carte qui rend l'accueil différent d'une visite à l'autre
    sans que personne n'ait rien à faire.
  */
  const newest = latest.ok ? latest.data.products.slice(0, 4) : [];

  if (newest.length > 0) {
    boards.push({
      key: "new",
      title: "Nouveautés",
      href: "/shop?sort=new",
      tiles: newest.map((product) => ({
        label: product.title,
        href: `/product/${product.handle ?? product.id}`,
        image: product.thumbnail ?? null,
      })),
      emptyNote: null,
      count: latest.ok ? latest.data.count : 0,
    });
  }

  /*
    LES PLUS VENDUS.

    Absents tant que le backend refuse de classer, c'est-à-dire tant
    qu'il n'y a pas assez de commandes réelles pour que le mot veuille
    dire quelque chose. Ce rayon apparaîtra tout seul le jour venu.
  */
  if (bestSellers.length > 0) {
    boards.push({
      key: "best",
      title: "Les plus vendus",
      href: "/shop",
      tiles: bestSellers.slice(0, 4).map((product) => ({
        label: product.title,
        href: `/product/${product.handle ?? product.id}`,
        image: product.thumbnail,
      })),
      emptyNote: null,
      count: 0,
    });
  }

  /*
    LES RAYONS DE MACHÉ, ILLUSTRÉS PAR LEURS PROPRES PRODUITS.

    Les rayons PRINCIPAUX seulement — « Fait à la main », pas « Crochet
    et tricot » en carte séparée — et ceux de MACHÉ seulement. Le
    catalogue contient aussi les rayons de la démonstration Mercur
    (chaussures fictives, en anglais), que son ordre par défaut place
    en tête : l'accueil n'a pas à s'ouvrir sur eux.

    Chaque carte se remplit avec les articles du rayon ET de ses
    sous-rayons : un vendeur range sa poupée dans « Crochet et tricot »,
    pas dans « Fait à la main ». Lire le seul rayon principal aurait
    laissé toutes les cartes vides alors que les sous-rayons se
    remplissent.

    L'ordre : les rayons qui ont des articles d'abord, puis ceux mis en
    avant (fait main, fait maison, bio…), puis les autres.

    Une lecture par rayon, toutes lancées ensemble et mises en cache.
    Un rayon qui échoue ou qui est vide ne fait pas tomber les autres :
    sa carte le dit, et montre ses sous-rayons.
  */
  const all = categories.ok ? categories.data : [];

  const macheOrder = new Map(CATEGORY_TREE.map((node, index) => [node.slug, index]));
  const featured = new Map<string, number>(
    FEATURED_CATEGORY_SLUGS.map((slug, index) => [slug, index])
  );

  const mainRayons = all
    .filter((category) => category.parentId === null && macheOrder.has(category.handle))
    .sort((a, b) => macheOrder.get(a.handle)! - macheOrder.get(b.handle)!);

  /* L'ordre des sous-rayons est celui du site, pas celui, arbitraire, de la base. */
  const childOrder = new Map(
    CATEGORY_TREE.flatMap((node) => (node.children ?? []).map((child, index) => [child.slug, index] as const))
  );

  const childrenOf = (parentId: string) =>
    all
      .filter((category) => category.parentId === parentId)
      .sort(
        (a, b) =>
          (childOrder.get(a.handle) ?? Number.MAX_SAFE_INTEGER) -
          (childOrder.get(b.handle) ?? Number.MAX_SAFE_INTEGER)
      );

  const categoryCards = await Promise.all(
    mainRayons.map(async (category): Promise<BoardCard> => {
      const children = childrenOf(category.id);

      const found = await fetchProducts({
        categoryId: [category.id, ...children.map((child) => child.id)],
        limit: 4,
      });

      const products = found.ok ? found.data.products : [];

      return {
        key: `cat-${category.id}`,
        title: category.name,
        href: `/shop?category=${encodeURIComponent(category.handle)}`,
        tiles: products
          .filter((product) => Boolean(product.thumbnail))
          .slice(0, 4)
          .map((product) => ({
            label: product.title,
            href: `/product/${product.handle ?? product.id}`,
            image: product.thumbnail as string,
          })),
        emptyNote:
          "Aucun article pour l'instant. Ce rayon se remplira dès qu'un vendeur y déposera le sien.",
        subLinks: children.slice(0, 6).map((child) => ({
          label: child.name,
          href: `/shop?category=${encodeURIComponent(child.handle)}`,
        })),
        count: found.ok ? found.data.count : 0,
      };
    })
  );

  /* Promise.all garde l'ordre : la carte n°i est celle du rayon n°i. */
  const ranked = categoryCards.map((card, index) => ({
    card,
    featured: featured.get(mainRayons[index].handle) ?? FEATURED_CATEGORY_SLUGS.length,
  }));

  boards.push(
    ...ranked
      .sort(
        (a, b) =>
          Number(b.card.tiles.length > 0) - Number(a.card.tiles.length > 0) ||
          a.featured - b.featured ||
          b.card.count - a.card.count
      )
      .map(({ card }) => card)
  );

  return {
    rails,
    newSellers: allSellers.slice(0, 8),
    verifiedSellers: allSellers.filter((seller) => seller.isPremium).slice(0, 6),
    /*
      Les rayons principaux de MACHÉ : c'est ce que compte « Rayons »
      en haut de l'accueil. Le total brut mêlait sous-rayons et rayons
      de démonstration.
    */
    categories: mainRayons,
    boards,
    collections: collections.ok ? collections.data : [],
    problems,
    configured,
  };
}
