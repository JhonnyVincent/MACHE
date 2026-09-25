/*
  PAGE : les promotions, et qui les paie.

  La confusion que cette page supprime

  Deux promotions peuvent être identiques à l'écran — même code, même
  remise, même durée — et coûter, l'une, rien du tout à MACHÉ, l'autre,
  sa commission entière. La différence ne se voit nulle part dans le
  panneau de Mercur. C'est exactement le genre d'invisible qui fait
  qu'on accorde, sans le savoir, une remise qu'on finance soi-même.

  DEUX QUESTIONS DIFFÉRENTES, ET IL FAUT LES DEUX

  1. QUI L'A CRÉÉE ? Une boutique, ou MACHÉ. C'est le lien que Mercur
     pose déjà quand un vendeur crée une promotion depuis son tableau
     de bord.

  2. QUI LA PAIE ? C'est une donnée séparée, et c'est elle qui sort
     l'argent. Une promotion créée par MACHÉ dont personne n'a déclaré
     le porteur reste à la charge du VENDEUR. La page le dit au lieu de
     le laisser supposer : c'est le défaut prudent, mais c'est
     rarement ce qu'on voulait.

  CE QUE « À LA CHARGE DE MACHÉ » FAIT RÉELLEMENT

  La remise est retirée de la commission de MACHÉ sur chaque commande
  concernée. Le vendeur, lui, touche exactement ce qu'il aurait touché
  sans promotion — son chiffre d'affaires n'est pas touché. Si la
  remise dépasse la commission, celle-ci devient négative : MACHÉ verse
  la différence. C'est un geste commercial, et il est assumé comme tel.

  LE CHANGEMENT NE VAUT QUE POUR L'AVENIR

  Les commissions déjà calculées sont enregistrées, pas recalculées.
  Déclarer aujourd'hui que MACHÉ porte une promotion ne rembourse pas
  les commandes d'hier. La page l'écrit là où l'on décide.
*/

import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getAdminUser,
  fetchMachePromotions,
  type MachePromotion,
} from "@/lib/medusa/admin";
import { formatNumber, formatDate } from "@/lib/seller";
import {
  PageHeader, Panel, Badge, Notice, EmptyState, Field, Input, Select, Stat, StatRow,
} from "@/components/seller/ui";
import { SubmitButton } from "@/components/submit-button";
import { setCostBearerAction } from "./actions";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  active: "Active",
  inactive: "Inactive",
};

function money(amount: number, currency: string | null) {
  return `${formatNumber(Math.round(amount))} ${currency?.toUpperCase() || ""}`.trim();
}

/*
  La remise annoncée par la promotion. « 15 % » et « 400 HTG » ne se
  lisent pas pareil, et afficher « 400 » pour un pourcentage ferait
  croire à une remise cinquante fois plus grosse qu'elle n'est.
*/
function remise(promotion: MachePromotion): string {
  if (promotion.value === null) return "—";

  if (promotion.valueType === "percentage") return `${promotion.value} %`;

  return money(promotion.value, promotion.currencyCode);
}

function bearerBadge(promotion: MachePromotion) {
  if (promotion.macheShare >= 1) {
    return <Badge tone="danger">Payée par MACHÉ</Badge>;
  }

  if (promotion.macheShare > 0) {
    return (
      <Badge tone="warning">
        Partagée — MACHÉ {Math.round(promotion.macheShare * 100)} %
      </Badge>
    );
  }

  if (promotion.costBearer === null) {
    return <Badge tone="neutral">Porteur non déclaré</Badge>;
  }

  return <Badge tone="success">Payée par le vendeur</Badge>;
}

export default async function AdminPromotionsPage({
  searchParams,
}: {
  searchParams?: Promise<{ fait?: string; erreur?: string }>;
}) {
  const user = await getAdminUser();

  if (!user) redirect("/dashboard/admin/connexion");

  const query = searchParams ? await searchParams : {};

  const result = await fetchMachePromotions();

  const promotions = result.ok ? result.data : [];

  /*
    Celles que MACHÉ finance d'abord : ce sont les seules qui lui
    coûtent de l'argent, donc les seules qui demandent une surveillance.
  */
  const sorted = [...promotions].sort((a, b) => {
    if (b.macheShare !== a.macheShare) return b.macheShare - a.macheShare;

    return b.macheSpent - a.macheSpent;
  });

  const financees = promotions.filter((promotion) => promotion.macheShare > 0);

  const totalDepense = financees.reduce(
    (sum, promotion) => sum + promotion.macheSpent,
    0
  );

  /*
    Les promotions de MACHÉ dont personne n'a déclaré le porteur : ce
    sont celles que MACHÉ croit offrir et que le vendeur paie. Le cas
    mérite d'être montré en haut, pas découvert en parcourant la liste.
  */
  const aClarifier = promotions.filter(
    (promotion) => promotion.owner === "mache" && promotion.costBearer === null
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Promotions"
        subtitle="Qui a créé la promotion, et surtout qui la paie."
      />

      {query.erreur && <Notice tone="danger" title="Rien n'a été changé">{query.erreur}</Notice>}
      {query.fait && <Notice tone="info" title="Enregistré">{query.fait}</Notice>}

      {!result.ok && (
        <Notice tone="danger" title="Liste indisponible">
          {result.reason}
        </Notice>
      )}

      {aClarifier.length > 0 && (
        <Notice
          tone="warning"
          title={`${aClarifier.length} promotion${aClarifier.length > 1 ? "s" : ""} de MACHÉ sans porteur déclaré`}
        >
          Tant que le porteur n&apos;est pas déclaré, c&apos;est le VENDEUR qui
          paie la remise — même si MACHÉ l&apos;a créée. C&apos;est le
          comportement prudent, mais c&apos;est rarement ce qu&apos;on voulait
          en lançant l&apos;opération.
        </Notice>
      )}

      <StatRow>
        <Stat
          label="Promotions"
          value={promotions.length}
          hint="Toutes boutiques confondues."
        />
        <Stat
          label="Financées par MACHÉ"
          value={financees.length}
          tone={financees.length > 0 ? "warning" : "default"}
          hint="Celles dont la remise sort de la commission de MACHÉ."
        />
        <Stat
          label="Déjà déboursé"
          value={formatNumber(Math.round(totalDepense))}
          tone={totalDepense > 0 ? "warning" : "default"}
          hint="Somme retirée des commissions, toutes devises mêlées — à lire comme un ordre de grandeur."
        />
      </StatRow>

      <Panel
        title="Ce que déclarer un porteur change"
        description="Le champ ne modifie ni le prix affiché ni ce que l'acheteur paie. Il décide de qui sort l'argent."
      >
        <ul className="space-y-2 text-sm leading-relaxed text-[#565959]">
          <li>
            <strong className="text-[#0f1111]">Le vendeur</strong> — la remise
            sort de son chiffre d&apos;affaires. MACHÉ garde sa commission
            entière et n&apos;y perd rien. C&apos;est le cas d&apos;une
            promotion qu&apos;une boutique décide seule.
          </li>
          <li>
            <strong className="text-[#0f1111]">MACHÉ</strong> — la remise est
            retirée de la commission. Le vendeur touche exactement ce
            qu&apos;il aurait touché sans promotion. Si la remise dépasse la
            commission, celle-ci devient négative : MACHÉ verse la différence.
          </li>
          <li>
            <strong className="text-[#0f1111]">Partagé</strong> — MACHÉ porte
            le pourcentage indiqué, le vendeur le reste.
          </li>
        </ul>

        <p className="mt-3 text-sm leading-relaxed text-[#767676]">
          Le changement ne vaut que pour les commandes À VENIR. Les commissions
          déjà calculées sont enregistrées, pas recalculées : déclarer
          aujourd&apos;hui que MACHÉ porte une promotion ne rembourse pas les
          commandes passées.
        </p>
      </Panel>

      {result.ok && sorted.length === 0 && (
        <EmptyState
          title="Aucune promotion"
          description="Les promotions créées par les boutiques et celles créées depuis le panneau de Mercur apparaîtront ici."
        />
      )}

      {sorted.map((promotion) => (
        <Panel
          key={promotion.id}
          title={promotion.code}
          description={
            promotion.owner === "mache"
              ? "Créée par MACHÉ"
              : `Créée par ${promotion.sellerName ?? "une boutique"}`
          }
        >
          <div className="flex flex-wrap items-center gap-2">
            {bearerBadge(promotion)}
            <Badge tone={promotion.status === "active" ? "success" : "neutral"}>
              {STATUS_LABELS[promotion.status] ?? promotion.status}
            </Badge>
            {promotion.isAutomatic && <Badge tone="info">Automatique</Badge>}
            {promotion.campaignName && (
              <Badge tone="info">{promotion.campaignName}</Badge>
            )}
          </div>

          <p className="mt-3 text-sm leading-relaxed text-[#0f1111]">
            {promotion.whoPays}
          </p>

          <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
            <div className="flex justify-between gap-4 sm:block">
              <dt className="text-[#767676]">Remise</dt>
              <dd className="tnum font-medium text-[#0f1111]">{remise(promotion)}</dd>
            </div>
            <div className="flex justify-between gap-4 sm:block">
              <dt className="text-[#767676]">Déjà déboursé par MACHÉ</dt>
              <dd className="tnum font-medium text-[#0f1111]">
                {promotion.macheSpent > 0
                  ? formatNumber(Math.round(promotion.macheSpent))
                  : "Rien"}
              </dd>
            </div>
            {promotion.createdAt && (
              <div className="flex justify-between gap-4 sm:block">
                <dt className="text-[#767676]">Créée le</dt>
                <dd className="font-medium text-[#0f1111]">
                  {formatDate(promotion.createdAt)}
                </dd>
              </div>
            )}
          </dl>

          <form action={setCostBearerAction} className="mt-4 space-y-3 border-t border-[#e7e7e7] pt-4">
            <input type="hidden" name="promotion_id" value={promotion.id} />

            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Qui paie cette promotion"
                htmlFor={`bearer-${promotion.id}`}
              >
                <Select
                  id={`bearer-${promotion.id}`}
                  name="cost_bearer"
                  defaultValue={promotion.costBearer ?? "store"}
                >
                  <option value="store">Le vendeur</option>
                  <option value="marketplace">MACHÉ</option>
                  <option value="shared">Partagé</option>
                </Select>
              </Field>

              <Field
                label="Part de MACHÉ, en %"
                htmlFor={`part-${promotion.id}`}
                hint="Uniquement pour un partage. Sans pourcentage, MACHÉ ne porte rien."
              >
                <Input
                  id={`part-${promotion.id}`}
                  name="shared_percentage"
                  type="number"
                  min={1}
                  max={100}
                  step={1}
                  defaultValue={promotion.sharedPercentage ?? ""}
                  placeholder="50"
                />
              </Field>
            </div>

            <SubmitButton pendingLabel="Enregistrement…">Enregistrer le porteur</SubmitButton>
          </form>
        </Panel>
      ))}

      <p className="text-sm text-[#767676]">
        Les promotions elles-mêmes — code, remise, durée, conditions — se
        créent dans{" "}
        <Link href="/dashboard/admin" className="underline">
          le panneau de Mercur
        </Link>
        . Cette page ne décide que de qui les paie.
      </p>
    </div>
  );
}
