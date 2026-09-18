/*
  Mise en page personnalisable d'une boutique.

  Format

  Le format de données est exactement celui de Puck — `{ root, content }`,
  chaque bloc étant `{ type, props }`. Ce n'est pas un hasard : l'éditeur
  visuel viendra s'y brancher sans conversion ni migration. Inventer un
  format « en attendant » aurait garanti une reprise de données le jour de
  son arrivée.

  Où c'est stocké

  Dans `seller.metadata.storefront`, un champ jsonb déjà exposé par l'API
  boutique. Pas de table parallèle : la mise en page appartient au vendeur,
  et elle voyage avec lui.

  Ce qui n'est pas proposé, et pourquoi

  Pas de bloc « meilleures ventes » : il demanderait un cumul des quantités
  vendues qui n'existe pas. Pas de bloc « avis » tant que les avis vendeur
  ne sont pas lus par le storefront. Un bloc qu'on pose et qui reste vide
  est pire qu'un bloc absent — le vendeur croit avoir configuré quelque
  chose.
*/

export type BlockType =
  | "hero"
  | "banner"
  | "text"
  | "image"
  | "products"
  | "categories"
  | "faq"
  | "countdown";

export type Block = {
  type: BlockType;
  props: Record<string, unknown>;
};

export type StorefrontLayout = {
  root: { props?: Record<string, unknown> };
  content: Block[];
};

/* Ce qu'un bloc « produits » sait sélectionner, sans rien inventer. */
export type ProductSelection = "latest" | "discounted" | "all";

export const PRODUCT_SELECTION_LABELS: Record<ProductSelection, string> = {
  latest: "Derniers produits ajoutés",
  discounted: "Produits en promotion",
  all: "Tout le catalogue de la boutique",
};

/*
  Catalogue des blocs disponibles.

  Il sert deux usages : décrire à l'éditeur ce qu'il peut poser, et
  documenter ici ce que chaque bloc affiche réellement.
*/
export const BLOCK_CATALOG: {
  type: BlockType;
  label: string;
  description: string;
}[] = [
  {
    type: "hero",
    label: "Bandeau principal",
    description: "Titre, accroche et bouton, sur l'image de couverture de la boutique.",
  },
  {
    type: "banner",
    label: "Bandeau d'annonce",
    description: "Une ligne mise en avant : livraison offerte, horaires, message du moment.",
  },
  {
    type: "text",
    label: "Texte",
    description: "Un paragraphe libre, avec un titre facultatif.",
  },
  {
    type: "image",
    label: "Image",
    description: "Une image pleine largeur, avec légende facultative.",
  },
  {
    type: "products",
    label: "Grille de produits",
    description: "Les produits de la boutique, selon une sélection.",
  },
  {
    type: "categories",
    label: "Catégories",
    description: "Les rayons dans lesquels la boutique vend.",
  },
  {
    type: "faq",
    label: "Questions fréquentes",
    description: "Une liste de questions et de réponses.",
  },
  {
    type: "countdown",
    label: "Compte à rebours",
    description: "Une échéance affichée jusqu'à une date. Passée la date, le bloc disparaît de lui-même.",
  },
];

/*
  Mise en page par défaut.

  Une boutique qui n'a rien configuré ne doit pas être une page blanche :
  elle reçoit une présentation correcte, que le vendeur peut ensuite
  modifier. C'est aussi ce qui permet d'ouvrir l'éditeur sur quelque chose
  plutôt que sur le vide.
*/
export function defaultLayout(sellerName: string): StorefrontLayout {
  return {
    root: {},
    content: [
      {
        type: "hero",
        props: {
          title: sellerName,
          subtitle: "",
          ctaLabel: "Voir les produits",
          ctaHref: "#produits",
        },
      },
      {
        type: "products",
        props: {
          title: "Nos produits",
          selection: "latest" satisfies ProductSelection,
          limit: 12,
        },
      },
    ],
  };
}

function isBlockType(value: unknown): value is BlockType {
  return BLOCK_CATALOG.some((entry) => entry.type === value);
}

/*
  Lecture défensive de ce qui vient de la base.

  `metadata` est un champ libre : rien ne garantit sa forme. Un bloc dont
  le type est inconnu — supprimé d'une version à l'autre, ou saisi à la
  main — est ignoré plutôt que de faire échouer toute la page. Une
  boutique ne doit pas devenir inaccessible à cause d'une clé mal écrite.
*/
export function parseLayout(
  metadata: unknown,
  sellerName: string
): { layout: StorefrontLayout; isCustom: boolean; ignored: number } {
  const raw = (metadata as Record<string, unknown> | null)?.storefront;

  if (!raw || typeof raw !== "object") {
    return { layout: defaultLayout(sellerName), isCustom: false, ignored: 0 };
  }

  const content = (raw as StorefrontLayout).content;

  if (!Array.isArray(content)) {
    return { layout: defaultLayout(sellerName), isCustom: false, ignored: 0 };
  }

  const blocks: Block[] = [];
  let ignored = 0;

  for (const entry of content) {
    const type = (entry as Block)?.type;

    if (!isBlockType(type)) {
      ignored += 1;
      continue;
    }

    blocks.push({
      type,
      props:
        typeof (entry as Block).props === "object" && (entry as Block).props
          ? (entry as Block).props
          : {},
    });
  }

  if (blocks.length === 0) {
    return { layout: defaultLayout(sellerName), isCustom: false, ignored };
  }

  return {
    layout: { root: (raw as StorefrontLayout).root ?? {}, content: blocks },
    isCustom: true,
    ignored,
  };
}

/* Lecture d'une propriété de bloc, sans jamais laisser passer autre chose. */
export function propString(props: Record<string, unknown>, key: string, fallback = "") {
  const value = props[key];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function propNumber(props: Record<string, unknown>, key: string, fallback: number) {
  const value = Number(props[key]);
  return Number.isFinite(value) ? value : fallback;
}

export function propList(props: Record<string, unknown>, key: string) {
  const value = props[key];
  return Array.isArray(value) ? value : [];
}
