"use client";

/*
  ÉDITEUR VISUEL DE VITRINE

  Le glisser-déposer annoncé par l'éditeur en formulaire. Il repose sur
  Puck, dont MACHÉ enregistrait déjà le format de données : aucune vitrine
  n'a eu à être reprise pour qu'il fonctionne.

  L'aperçu n'est pas une imitation

  Chaque bloc est rendu ici par `RenderBlock`, exactement le composant qui
  rend la page publique. Ce n'est pas un détail d'implémentation : un
  éditeur qui dessine sa propre approximation finit toujours par mentir —
  le vendeur compose une page, puis en découvre une autre en ligne. Les
  produits affichés sont ceux de la boutique, chargés par le serveur et
  passés ici tels quels.

  Ce que l'aperçu ne peut pas montrer

  Le bloc « compte à rebours » disparaît quand sa date est passée, et le
  bloc « promotions » quand aucun produit n'est remisé. Dans l'éditeur, un
  bloc qui se rend vide laisserait une zone invisible, impossible à
  sélectionner ou à déplacer. Ces blocs sont donc encadrés d'un repère
  quand ils ne rendent rien — le repère n'existe que dans l'éditeur.

  Ce qui est envoyé au serveur n'est pas cru

  `onPublish` poste la mise en page entière. Le serveur la repasse par
  `sanitizeLayout` avant de l'enregistrer : le navigateur propose, il ne
  décide pas.
*/

import { useState } from "react";
import { Puck, usePuck, type Config, type Data } from "@measured/puck";
/*
  La feuille « no-external » est la même que `puck.css`, moins un
  `@import` vers rsms.me qui téléchargeait une seconde copie d'Inter à
  chaque ouverture de l'éditeur : une requête vers un tiers depuis le
  navigateur du vendeur, pour une police que MACHÉ sert déjà.
*/
import "@measured/puck/no-external.css";

import { RenderBlock } from "@/components/storefront/blocks";
import {
  BLOCK_CATALOG,
  defaultLayout,
  type Block,
  type BlockField,
  type BlockType,
  type StorefrontLayout,
} from "@/lib/storefront/blocks";
import type { StoreProduct, StoreSeller } from "@/lib/medusa/catalog";

/* -------------------------------------------------------------------------- */
/* Champs                                                                     */
/* -------------------------------------------------------------------------- */

/*
  Traduction d'un champ MACHÉ en champ Puck.

  Puck n'a pas de champ « date » ; une date se saisit donc en texte, avec
  son format rappelé dans l'intitulé plutôt que laissé à deviner.
*/
function puckField(field: BlockField) {
  const label = field.hint ? `${field.label} — ${field.hint}` : field.label;

  switch (field.kind) {
    case "textarea":
      return { type: "textarea" as const, label };

    case "number":
      return {
        type: "number" as const,
        label,
        min: field.min,
        max: field.max,
      };

    case "select":
      return {
        type: "select" as const,
        label,
        options: (field.options ?? []).map((option) => ({
          label: option.label,
          value: option.value,
        })),
      };

    case "date":
      return { type: "text" as const, label: `${field.label} (AAAA-MM-JJ)` };

    case "faq":
      return {
        type: "array" as const,
        label,
        arrayFields: {
          question: { type: "text" as const, label: "Question" },
          answer: { type: "textarea" as const, label: "Réponse" },
        },
        defaultItemProps: { question: "", answer: "" },
        getItemSummary: (item: { question?: string }) =>
          item.question || "Question",
      };

    default:
      return { type: "text" as const, label };
  }
}

/* -------------------------------------------------------------------------- */
/* Aperçu                                                                     */
/* -------------------------------------------------------------------------- */

/*
  Les blocs qui peuvent légitimement ne rien rendre. Ils reçoivent un
  repère dans l'éditeur, et rien de plus sur la page publique.
*/
const CAN_RENDER_EMPTY: Partial<Record<BlockType, string>> = {
  countdown:
    "Ce compte à rebours n'apparaîtra pas : il lui manque un titre ou une date, ou l'échéance est passée.",
  products:
    "Aucun produit ne correspond à cette sélection pour l'instant. Le bloc restera masqué tant que ce sera le cas.",
  categories:
    "Vos produits ne sont rattachés à aucun rayon : le bloc restera masqué.",
  faq: "Ajoutez au moins une question complète — question et réponse — pour que le bloc apparaisse.",
  banner: "Saisissez un message pour que le bandeau apparaisse.",
  image: "Renseignez l'adresse d'une image en http:// ou https://.",
  text: "Saisissez un titre ou un texte.",
};

function Preview({
  type,
  props,
  seller,
  products,
}: {
  type: BlockType;
  props: Record<string, unknown>;
  seller: StoreSeller;
  products: StoreProduct[];
}) {
  const block: Block = { type, props };
  const rendered = RenderBlock({ block, context: { seller, products } });

  if (rendered === null && CAN_RENDER_EMPTY[type]) {
    return (
      <div className="mache-empty-block">{CAN_RENDER_EMPTY[type]}</div>
    );
  }

  return <>{rendered}</>;
}

/* -------------------------------------------------------------------------- */
/* Conversion                                                                 */
/* -------------------------------------------------------------------------- */

/*
  Puck identifie chaque bloc posé par un `id` qu'il range dans les
  propriétés. MACHÉ ne l'enregistre pas — c'est un détail d'éditeur, pas
  une donnée de boutique — et le régénère à l'ouverture.
*/
function toPuckData(layout: StorefrontLayout): Data {
  return {
    root: { props: {} },
    content: layout.content.map((block, index) => ({
      type: block.type,
      props: { ...block.props, id: `${block.type}-${index}` },
    })),
  } as Data;
}

function fromPuckData(data: Data): StorefrontLayout {
  return {
    root: {},
    content: (data.content ?? []).map((item) => {
      const { id: _id, ...props } = item.props as Record<string, unknown>;
      return { type: item.type as BlockType, props };
    }),
  };
}

/* -------------------------------------------------------------------------- */
/* En-tête                                                                    */
/* -------------------------------------------------------------------------- */

/*
  Puck s'affiche en anglais : « Publish », « Components », « Outline ».
  L'en-tête est le seul endroit que son API permet de remplacer
  entièrement, et c'est celui qui compte : c'est le bouton qui met la
  vitrine en ligne. Un vendeur qui compose sa page ne doit pas avoir à
  deviner lequel des boutons enregistre.

  Les deux titres de colonnes restent en anglais. Ils sont donc nommés
  ici, en français, avec ce qu'ils contiennent.
*/
function FrenchHeader({
  sellerName,
  sellerHandle,
  saving,
  status,
  onSave,
}: {
  sellerName: string;
  sellerHandle: string;
  saving: boolean;
  status: { ok: boolean; message: string } | null;
  onSave: (data: Data) => void;
}) {
  const { appState, history } = usePuck();

  return (
    <div className="mache-puck-header">
      <div className="mache-puck-header-row">
        <div>
          <p className="mache-puck-title">Vitrine de {sellerName}</p>
          <a href="/dashboard/seller/vitrine" className="mache-puck-link">
            ← Revenir à l&apos;éditeur en formulaire
          </a>
          {" · "}
          <a
            href={`/store/${sellerHandle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mache-puck-link"
          >
            Voir la page publique /store/{sellerHandle}
          </a>
        </div>

        <div className="mache-puck-actions">
          <button
            type="button"
            onClick={() => history.back()}
            disabled={!history.hasPast}
            className="mache-puck-ghost"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={() => history.forward()}
            disabled={!history.hasFuture}
            className="mache-puck-ghost"
          >
            Rétablir
          </button>

          <button
            type="button"
            onClick={() => onSave(appState.data as Data)}
            disabled={saving}
            className="mache-puck-save"
          >
            {saving ? "Enregistrement…" : "Enregistrer et publier"}
          </button>
        </div>
      </div>

      {status && (
        <p
          role="status"
          className={`mache-puck-message ${status.ok ? "is-ok" : "is-error"}`}
        >
          {status.message}
        </p>
      )}

      <p className="mache-puck-legend">
        À gauche, <strong>Components</strong> : les blocs à faire glisser dans
        la page, et <strong>Outline</strong> : leur ordre. À droite,{" "}
        <strong>Page</strong> : les réglages du bloc sélectionné. Ces trois
        intitulés sont ceux de l&apos;éditeur, qui n&apos;existe qu&apos;en
        anglais.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export function VitrineEditor({
  layout,
  seller,
  products,
  save,
}: {
  layout: StorefrontLayout;
  seller: StoreSeller;
  products: StoreProduct[];
  save: (layout: StorefrontLayout) => Promise<{ ok: boolean; message: string }>;
}) {
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(
    null
  );
  const [saving, setSaving] = useState(false);

  const components: Config["components"] = {};

  for (const entry of BLOCK_CATALOG) {
    const defaults = defaultProps(entry.type, seller.name);

    components[entry.type] = {
      label: entry.label,
      fields: Object.fromEntries(
        entry.fields.map((field) => [field.name, puckField(field)])
      ),
      defaultProps: defaults,
      render: (props: Record<string, unknown>) => (
        <Preview
          type={entry.type}
          props={props}
          seller={seller}
          products={products}
        />
      ),
    };
  }

  /*
    `root: { fields: {} }` retire le champ « title » que Puck propose par
    défaut sur la page. MACHÉ ne lit pas les propriétés de la racine : ce
    champ se serait rempli sans rien produire, ce qui est pire qu'un champ
    absent — le vendeur croit avoir donné un titre à sa vitrine.
  */
  const config = { components, root: { fields: {} } } as Config;

  async function publish(data: Data) {
    setSaving(true);
    setStatus(null);

    try {
      setStatus(await save(fromPuckData(data)));
    } catch {
      /*
        Une coupure réseau ne doit pas laisser croire que la vitrine est
        enregistrée : le vendeur fermerait l'onglet en perdant son travail.
      */
      setStatus({
        ok: false,
        message:
          "L'enregistrement n'a pas abouti. Vérifiez votre connexion, puis réessayez : rien n'a été modifié.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mache-puck">
      <Puck
        config={config}
        data={toPuckData(layout)}
        onPublish={publish}
        overrides={{
          header: () => (
            <FrenchHeader
              sellerName={seller.name}
              sellerHandle={seller.handle}
              saving={saving}
              status={status}
              onSave={publish}
            />
          ),
        }}
      />
    </div>
  );
}

/*
  Valeurs de départ d'un bloc fraîchement posé.

  Un bloc déposé vide ne se voit pas : le vendeur croit que le
  glisser-déposer n'a pas fonctionné. Celles-ci viennent de la mise en
  page par défaut, qui est déjà la présentation correcte d'une boutique.
*/
function defaultProps(type: BlockType, sellerName: string): Record<string, unknown> {
  const fromDefault = defaultLayout(sellerName).content.find(
    (block) => block.type === type
  );

  if (fromDefault) return fromDefault.props;

  switch (type) {
    case "banner":
      return { message: "Livraison offerte cette semaine" };
    case "text":
      return { title: "À propos de la boutique", body: "" };
    case "categories":
      return { title: "Nos rayons" };
    case "faq":
      return { title: "Questions fréquentes", items: [] };
    case "countdown":
      return { title: "Fin de la promotion", until: "" };
    default:
      return {};
  }
}
