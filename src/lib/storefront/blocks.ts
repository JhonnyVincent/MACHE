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

import { safeLinkHref, safeImageSrc } from "@/lib/safe-url";

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
  Description des champs d'un bloc.

  Une seule déclaration sert trois usages : construire l'éditeur en
  formulaire, construire l'éditeur visuel, et valider côté serveur ce qui
  est enregistré. Les décrire trois fois aurait garanti qu'ils finissent
  par diverger — un champ accepté par l'éditeur visuel mais rejeté par le
  serveur, par exemple.
*/
export type FieldKind =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "date"
  /* Lien : chemin interne, ancre, http(s), mailto: ou tel:. */
  | "url"
  /* Adresse d'image : http(s) seulement. */
  | "image"
  | "faq";

export type BlockField = {
  name: string;
  label: string;
  kind: FieldKind;
  hint?: string;
  options?: { value: string; label: string }[];
  /* Bornes d'un champ numérique, appliquées par le serveur. */
  min?: number;
  max?: number;
};

const SELECTION_OPTIONS = (
  Object.entries(PRODUCT_SELECTION_LABELS) as [ProductSelection, string][]
).map(([value, label]) => ({ value, label }));

/*
  Catalogue des blocs disponibles.

  Il sert deux usages : décrire aux éditeurs ce qu'ils peuvent poser, et
  documenter ici ce que chaque bloc affiche réellement.
*/
export const BLOCK_CATALOG: {
  type: BlockType;
  label: string;
  description: string;
  fields: BlockField[];
}[] = [
  {
    type: "hero",
    label: "Bandeau principal",
    description: "Titre, accroche et bouton, sur l'image de couverture de la boutique.",
    fields: [
      { name: "title", label: "Titre", kind: "text" },
      { name: "subtitle", label: "Accroche", kind: "textarea" },
      { name: "ctaLabel", label: "Texte du bouton", kind: "text" },
      {
        name: "ctaHref",
        label: "Lien du bouton",
        kind: "url",
        hint: "#produits pour descendre à la grille de produits",
      },
    ],
  },
  {
    type: "banner",
    label: "Bandeau d'annonce",
    description: "Une ligne mise en avant : livraison offerte, horaires, message du moment.",
    fields: [{ name: "message", label: "Message", kind: "text" }],
  },
  {
    type: "text",
    label: "Texte",
    description: "Un paragraphe libre, avec un titre facultatif.",
    fields: [
      { name: "title", label: "Titre", kind: "text" },
      { name: "body", label: "Texte", kind: "textarea" },
    ],
  },
  {
    type: "image",
    label: "Image",
    description: "Une image pleine largeur, avec légende facultative.",
    fields: [
      {
        name: "url",
        label: "Adresse de l'image",
        kind: "image",
        hint: "http:// ou https://",
      },
      { name: "caption", label: "Légende", kind: "text" },
      {
        name: "alt",
        label: "Description pour les lecteurs d'écran",
        kind: "text",
        hint: "Ce que montre l'image, pour qui ne la voit pas.",
      },
    ],
  },
  {
    type: "products",
    label: "Grille de produits",
    description: "Les produits de la boutique, selon une sélection.",
    fields: [
      { name: "title", label: "Titre de la section", kind: "text" },
      {
        name: "selection",
        label: "Sélection",
        kind: "select",
        options: SELECTION_OPTIONS,
      },
      {
        name: "limit",
        label: "Nombre de produits",
        kind: "number",
        min: 1,
        max: 24,
      },
    ],
  },
  {
    type: "categories",
    label: "Catégories",
    description: "Les rayons dans lesquels la boutique vend.",
    fields: [{ name: "title", label: "Titre de la section", kind: "text" }],
  },
  {
    type: "faq",
    label: "Questions fréquentes",
    description: "Une liste de questions et de réponses.",
    fields: [
      { name: "title", label: "Titre de la section", kind: "text" },
      { name: "items", label: "Questions", kind: "faq" },
    ],
  },
  {
    type: "countdown",
    label: "Compte à rebours",
    description: "Une échéance affichée jusqu'à une date. Passée la date, le bloc disparaît de lui-même.",
    fields: [
      { name: "title", label: "Titre", kind: "text" },
      {
        name: "until",
        label: "Jusqu'au",
        kind: "date",
        hint: "Passée la date, le bloc disparaît de lui-même.",
      },
    ],
  },
];

export function blockDefinition(type: BlockType) {
  return BLOCK_CATALOG.find((entry) => entry.type === type);
}

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

/* -------------------------------------------------------------------------- */
/* Validation                                                                 */
/* -------------------------------------------------------------------------- */

/*
  Nettoyage des propriétés d'un bloc.

  Ce que le navigateur envoie n'est jamais pris tel quel. L'éditeur visuel
  poste une mise en page entière en JSON : sans ce passage, un vendeur — ou
  n'importe qui ayant sa session — écrirait des propriétés arbitraires dans
  la base, et elles ressortiraient telles quelles sur une page publique.

  La règle est donc l'inverse d'un filtrage : rien ne passe sauf ce qui est
  déclaré dans `BLOCK_CATALOG`, dans le type qui y est déclaré.

  Ce nettoyage ne remplace pas `safeLinkHref` et `safeImageSrc` au moment
  du rendu. Il les double : une donnée peut avoir été écrite avant cette
  fonction, ou par un autre chemin.
*/
export function sanitizeProps(
  type: BlockType,
  raw: unknown
): Record<string, unknown> {
  const definition = blockDefinition(type);

  if (!definition || typeof raw !== "object" || raw === null) return {};

  const source = raw as Record<string, unknown>;
  const clean: Record<string, unknown> = {};

  for (const field of definition.fields) {
    const value = source[field.name];

    if (value === undefined || value === null) continue;

    switch (field.kind) {
      case "number": {
        const amount = Math.round(Number(value));

        if (!Number.isFinite(amount)) break;

        const min = field.min ?? 0;
        const max = field.max ?? Number.MAX_SAFE_INTEGER;

        clean[field.name] = Math.min(max, Math.max(min, amount));
        break;
      }

      case "select": {
        const allowed = (field.options ?? []).map((option) => option.value);

        if (typeof value === "string" && allowed.includes(value)) {
          clean[field.name] = value;
        }
        break;
      }

      case "faq": {
        if (!Array.isArray(value)) break;

        /*
          Vingt questions au maximum : un tableau sans borne posté par le
          navigateur remplirait le champ `metadata` du vendeur, qui est
          stocké en base et relu à chaque affichage de la boutique.
        */
        const items = value
          .slice(0, 20)
          .map((entry) => {
            const item = entry as Record<string, unknown>;
            return {
              question: trimmed(item?.question, 200),
              answer: trimmed(item?.answer, 2000),
            };
          })
          .filter((item) => item.question && item.answer);

        if (items.length > 0) clean[field.name] = items;
        break;
      }

      /*
        Les adresses sont refusées à l'écriture, et non seulement
        neutralisées à l'affichage.

        `safeLinkHref` et `safeImageSrc` protègent déjà le rendu : un
        « javascript: » posé par un vendeur ne s'exécute pas. Mais il
        restait enregistré en base, prêt à ressortir le jour où un autre
        écran — un export, un e-mail, une future application — lirait la
        vitrine sans repasser par eux. Ce qui n'a pas le droit d'être
        affiché n'a pas de raison d'être conservé.
      */
      case "url": {
        const href = trimmed(value, 500);
        const safe = safeLinkHref(href, "");

        if (safe) clean[field.name] = safe;
        break;
      }

      case "image": {
        const safe = safeImageSrc(trimmed(value, 500));

        if (safe) clean[field.name] = safe;
        break;
      }

      /*
        Le texte est borné en longueur. Un champ « accroche » de dix mille
        caractères ne serait pas une accroche : ce serait une page que
        personne n'a validée, servie à tous les visiteurs de la boutique.
      */
      case "textarea": {
        const text = trimmed(value, 4000);
        if (text) clean[field.name] = text;
        break;
      }

      default: {
        const text = trimmed(value, 500);
        if (text) clean[field.name] = text;
      }
    }
  }

  return clean;
}

function trimmed(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/*
  Nettoyage d'une mise en page entière.

  Renvoie aussi ce qui a été écarté, pour que l'éditeur puisse le dire au
  vendeur plutôt que de le laisser croire que tout a été enregistré.

  `root` est volontairement remis à vide : aucun bloc ne le lit, et un
  champ que personne n'affiche mais que tout le monde peut écrire est une
  surface d'attaque sans contrepartie.
*/
export function sanitizeLayout(raw: unknown): {
  layout: StorefrontLayout;
  ignored: number;
} {
  const source = raw as StorefrontLayout | null;
  const content = Array.isArray(source?.content) ? source.content : [];

  const blocks: Block[] = [];
  let ignored = 0;

  /*
    Trente blocs au maximum. Au-delà, la page publique devient illisible et
    la requête d'enregistrement grossit sans fin.
  */
  for (const entry of content.slice(0, 30)) {
    const type = (entry as Block)?.type;

    if (!isBlockType(type)) {
      ignored += 1;
      continue;
    }

    blocks.push({ type, props: sanitizeProps(type, (entry as Block).props) });
  }

  ignored += Math.max(0, content.length - 30);

  return { layout: { root: {}, content: blocks }, ignored };
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

  const { layout, ignored } = sanitizeLayout(raw);

  if (layout.content.length === 0) {
    return { layout: defaultLayout(sellerName), isCustom: false, ignored };
  }

  return { layout, isCustom: true, ignored };
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
