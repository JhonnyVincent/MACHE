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

export type ProductRail = {
  key: string;
  title: string;
  subtitle: string;
  href: string;
  products: StoreProduct[];
};

/*
  UNE TUILE DE RAYON, TELLE QU'UN ACCUEIL DE PLACE DE MARCHÉ EN MONTRE.

  Ce qui meuble l'accueil d'Amazon ou de Cdiscount n'est pas du texte :
  ce sont des PHOTOS de produits, rangées par rayon. MACHÉ n'a aucune
  photo à lui — les visuels de stock ont été retirés volontairement —
  mais les vendeurs, eux, en mettent sur leurs articles.

  Une tuile emprunte donc jusqu'à quatre vraies photos au rayon qu'elle
  annonce. Un rayon encore vide n'en a aucune : il s'affiche alors sans
  mentir, plutôt que de recevoir une image décorative qui lui
  promettrait un catalogue qu'il n'a pas.
*/
export type CategoryTile = {
  id: string;
  handle: string;
  name: string;
  /* Jusqu'à quatre vignettes réelles, prises aux produits du rayon. */
  thumbnails: string[];
  /* Combien d'articles le rayon contient en tout. */
  count: number;
};

export type HomeData = {
  /* Rayons de produits réellement alimentés. */
  rails: ProductRail[];
  newSellers: StoreSeller[];
  verifiedSellers: StoreSeller[];
  categories: StoreCategory[];
  /* Les rayons, illustrés par leurs propres produits. */
  categoryTiles: CategoryTile[];
  collections: StoreCollection[];
  /* Raisons de panne, écrites au journal du serveur. */
  problems: string[];
  /* Faux si le backend n'est pas configuré du tout. */
  configured: boolean;
};

export async function fetchHomeData(): Promise<HomeData> {
  const [latest, discounted, sellers, categories, collections] = await Promise.all([
    fetchProducts({ limit: 12, order: "-created_at" }),
    /*
      Les promotions ne se filtrent pas côté API : Medusa applique la
      remise au calcul du prix, sans exposer de drapeau « soldé ». On lit
      donc un lot plus large et on retient ceux dont le prix calculé est
      réellement inférieur au prix d'origine.
    */
    fetchProducts({ limit: 50, order: "-created_at" }),
    fetchSellers(12),
    fetchCategories(24),
    fetchCollections(12),
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
    LES TUILES DE RAYONS, ILLUSTRÉES PAR LEURS PROPRES PRODUITS.

    Une lecture par rayon, toutes lancées ensemble. C'est ce qui coûte
    le plus cher sur cette page, et c'est pour cela qu'on se limite aux
    premiers rayons : douze tuiles suffisent à meubler un accueil, et
    vingt-quatre lectures pour des cases qu'on ne voit qu'en faisant
    défiler seraient payées par tous les visiteurs.

    Un rayon qui échoue ou qui est vide ne fait pas tomber les autres :
    il sort avec zéro vignette, et la tuile le dit.
  */
  const topCategories = categories.ok ? categories.data.slice(0, 12) : [];

  const tiles = await Promise.all(
    topCategories.map(async (category) => {
      const found = await fetchProducts({ categoryId: category.id, limit: 4 });

      const products = found.ok ? found.data.products : [];

      return {
        id: category.id,
        handle: category.handle,
        name: category.name,
        thumbnails: products
          .map((product) => product.thumbnail)
          .filter((thumbnail): thumbnail is string => Boolean(thumbnail))
          .slice(0, 4),
        count: found.ok ? found.data.count : 0,
      };
    })
  );

  return {
    rails,
    newSellers: allSellers.slice(0, 8),
    verifiedSellers: allSellers.filter((seller) => seller.isPremium).slice(0, 6),
    categories: categories.ok ? categories.data : [],
    categoryTiles: tiles,
    collections: collections.ok ? collections.data : [],
    problems,
    configured,
  };
}
