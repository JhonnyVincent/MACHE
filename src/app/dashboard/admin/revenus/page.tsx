/*
  PAGE : ce que MACHÉ gagne.

  Pourquoi cette page n'existait pas

  Le panneau de Mercur montre les commandes, les vendeurs, les
  versements — tout sauf ce que la place de marché encaisse pour
  elle-même. Le dirigeant de MACHÉ n'avait aucun écran pour savoir
  combien l'entreprise avait gagné ce mois-ci.

  Le mot qui gouverne toute la page : DÛ

  MACHÉ ne perçoit pas les paiements. L'acheteur règle le vendeur en
  main propre, et la commission est ensuite facturée. Ces montants sont
  donc des CRÉANCES, pas de la trésorerie. La page le répète là où le
  chiffre s'affiche, pas en note de bas de page : sur un écran de
  pilotage, confondre « gagné » et « reçu », c'est se croire riche d'un
  argent qu'il reste à réclamer.

  Les devises restent séparées

  1 400 HTG et 12 € ne font pas 1 412. Additionner deux devises produit
  un nombre qui ne correspond à aucune somme d'argent — et c'est
  précisément sur cet écran qu'un tel nombre serait pris pour argent
  comptant.

  Ce que la page n'invente pas

  Les abonnements des marques : ils ne sont pas facturés, donc ils
  valent zéro, et la page dit pourquoi plutôt que de taire la ligne.
*/

import { Link } from "next-view-transitions";
import { redirect } from "next/navigation";
import { getAdminUser, fetchMacheRevenue, type RevenueBucket } from "@/lib/medusa/admin";
import { formatNumber } from "@/lib/seller";
import { PageHeader, Panel, Notice, Button, EmptyState } from "@/components/seller/ui";

export const dynamic = "force-dynamic";

const PERIODS = [
  { days: 7, label: "7 jours" },
  { days: 30, label: "30 jours" },
  { days: 90, label: "90 jours" },
  { days: 365, label: "1 an" },
];

function money(amount: number, currency: string) {
  return `${formatNumber(Math.round(amount))} ${currency}`;
}

/*
  L'évolution par rapport à la période précédente de même longueur.

  `null` quand la période précédente est vide : « +100 % » à partir de
  zéro ne veut rien dire, et « la première vente » mérite mieux qu'un
  pourcentage.
*/
function change(now: number, before: number): number | null {
  if (before <= 0) return null;

  return Math.round(((now - before) / before) * 100);
}

function CurrencyCard({
  bucket,
  before,
}: {
  bucket: RevenueBucket;
  before: RevenueBucket | undefined;
}) {
  const delta = before ? change(bucket.commission, before.commission) : null;

  return (
    <div className="rounded-[10px] border border-[#d5d9d9] bg-white p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-[#565959]">
          {bucket.currencyCode}
        </h3>
        <span className="text-xs text-[#767676]">
          {formatNumber(bucket.orders)} commande{bucket.orders > 1 ? "s" : ""}
        </span>
      </div>

      <p className="mt-3 text-3xl font-black leading-none text-[#0f1111]">
        {money(bucket.commission, bucket.currencyCode)}
      </p>

      <p className="mt-1.5 text-sm text-[#565959]">
        dû à MACHÉ sur cette période
      </p>

      {delta !== null && (
        <p
          className={`mt-2 text-sm font-semibold ${
            delta >= 0 ? "text-[#046c4e]" : "text-[#b01124]"
          }`}
        >
          {delta >= 0 ? "+" : ""}
          {delta} % par rapport à la période précédente
        </p>
      )}

      <dl className="mt-4 space-y-1.5 border-t border-[#d5d9d9] pt-3 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-[#565959]">Volume vendu</dt>
          <dd className="font-medium text-[#0f1111]">
            {money(bucket.volume, bucket.currencyCode)}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[#565959]">Taux réellement constaté</dt>
          <dd className="font-medium text-[#0f1111]">
            {bucket.effectiveRate === null ? "—" : `${bucket.effectiveRate} %`}
          </dd>
        </div>

        {/*
          Ce que les promotions de MACHÉ lui ont coûté.

          La ligne n'apparaît que lorsqu'il y a quelque chose à dire :
          un « 0 » permanent finirait par ne plus être lu, et le jour
          où il cesse d'être zéro personne ne le remarquerait.

          Elle est montrée À CÔTÉ de la commission, pas fondue dedans.
          Une commission en baisse parce qu'on a offert une remise est
          une décision, pas un problème ; confondre les deux ferait
          chercher une panne là où il y a eu un choix.
        */}
        {bucket.promotionsFunded > 0 && (
          <>
            <div className="flex justify-between gap-3">
              <dt className="text-[#565959]">Promotions offertes par MACHÉ</dt>
              <dd className="font-medium text-[#b01124]">
                −{money(bucket.promotionsFunded, bucket.currencyCode)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[#565959]">Commission avant ces promotions</dt>
              <dd className="font-medium text-[#0f1111]">
                {money(bucket.commissionBeforePromotions, bucket.currencyCode)}
              </dd>
            </div>
          </>
        )}
      </dl>

      {bucket.promotionsFunded > 0 && (
        <p className="mt-3 text-xs leading-snug text-[#767676]">
          Les vendeurs concernés ont été payés comme s&apos;il n&apos;y avait
          pas eu de promotion : cette somme est sortie du chiffre
          d&apos;affaires de MACHÉ, pas du leur.
        </p>
      )}
    </div>
  );
}

export default async function AdminRevenuePage({
  searchParams,
}: {
  searchParams?: Promise<{ days?: string }>;
}) {
  const user = await getAdminUser();

  if (!user) redirect("/dashboard/admin/connexion");

  const query = searchParams ? await searchParams : {};

  const requested = Number(query.days);

  const days = PERIODS.some((period) => period.days === requested) ? requested : 30;

  const result = await fetchMacheRevenue(days);

  const previousOf = (currency: string) =>
    result.ok
      ? result.data.previous.find((item) => item.currencyCode === currency)
      : undefined;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Ce que MACHÉ gagne"
        subtitle="Les commissions enregistrées sur les commandes, par devise."
        actions={
          <div className="flex flex-wrap gap-1.5">
            {PERIODS.map((period) => (
              <Button
                key={period.days}
                href={`/dashboard/admin/revenus?days=${period.days}`}
                variant={period.days === days ? "primary" : "secondary"}
              >
                {period.label}
              </Button>
            ))}
          </div>
        }
      />

      {/*
        L'avertissement est EN HAUT, avant les chiffres. Placé dessous,
        il serait lu après que la décision est prise.
      */}
      <Notice tone="warning" title="Ces montants sont dus, pas encaissés">
        MACHÉ ne perçoit pas les paiements : l&apos;acheteur règle le vendeur en
        main propre. Ces commissions restent à facturer aux boutiques — ce
        n&apos;est pas de la trésorerie.
      </Notice>

      {!result.ok ? (
        <Notice tone="danger" title="Les chiffres ne s'affichent pas">
          {result.reason}
        </Notice>
      ) : result.data.current.length === 0 ? (
        <EmptyState
          title="Aucune commande sur cette période"
          description="Rien n'a été vendu sur les derniers jours choisis. Ce n'est pas une panne : il n'y a simplement rien à compter."
        />
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {result.data.current.map((item) => (
              <CurrencyCard
                key={item.currencyCode}
                bucket={item}
                before={previousOf(item.currencyCode)}
              />
            ))}
          </div>

          {/*
            Pourquoi on n'affiche pas un total unique : il faudrait
            convertir, donc choisir un taux, donc produire un chiffre qui
            dépend d'une hypothèse invisible.
          */}
          {result.data.current.length > 1 && (
            <p className="text-sm leading-relaxed text-[#565959]">
              Les devises ne sont pas additionnées. Un total unique
              supposerait un taux de change, et ce taux ferait varier le
              chiffre d&apos;affaires de MACHÉ sans qu&apos;aucune vente
              n&apos;ait changé.
            </p>
          )}

          {result.data.unattributed > 0 && (
            <Notice tone="info" title="Commissions non rattachées">
              {formatNumber(Math.round(result.data.unattributed))} en commissions
              portent sur des frais de port et ne sont rattachables à aucune
              devise par ce calcul. Elles sont comptées ici à part plutôt que
              réparties au hasard — un écart avec la comptabilité doit pouvoir
              s&apos;expliquer.
            </Notice>
          )}

          {result.data.truncated && (
            <Notice tone="warning" title="Lecture tronquée">
              Le volume de commandes dépasse ce que cet écran sait lire ligne à
              ligne. Les totaux affichés sont donc incomplets, et il faut
              passer à un calcul agrégé en base.
            </Notice>
          )}
        </>
      )}

      <Panel
        title="Les abonnements"
        description="Marques officielles — 120 à 300 € par mois selon la grille."
      >
        <p className="text-sm leading-relaxed text-[#565959]">
          {result.ok && result.data.subscriptionsNote
            ? result.data.subscriptionsNote
            : "Les abonnements des marques ne sont pas encore facturés : rien n'est prélevé, donc rien n'est compté."}
        </p>

        <p className="mt-2 text-sm leading-relaxed text-[#565959]">
          Cette ligne vaut zéro et le dit. La remplir à partir de la{" "}
          <Link
            href="/sell/tarifs"
            className="font-medium text-[var(--mache-primary)] underline"
          >
            grille tarifaire
          </Link>{" "}
          afficherait comme gagné un argent que personne n&apos;a versé.
        </p>
      </Panel>
    </div>
  );
}
