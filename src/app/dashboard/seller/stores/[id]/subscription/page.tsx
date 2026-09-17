/*
  PAGE : Espace vendeur — abonnement

  Sert à :
  - afficher le plan réellement attaché au compte et ses limites ;
  - mesurer la consommation de ces limites (boutiques, produits) ;
  - comparer les plans tels qu'ils existent en base.

  L'abonnement est attaché au compte, pas à une boutique : on l'atteint
  depuis une boutique, mais les chiffres ci-dessous couvrent tout le compte.

  Aucun tarif n'est inventé. Les prix viennent de `subscription_plans` ;
  tant qu'ils n'y sont pas renseignés, la page dit qu'ils ne sont pas
  fixés plutôt que d'afficher un montant imaginaire.
*/

import { requireStoreOwner, formatNumber, formatHTG, formatDate } from "@/lib/seller";
import {
  PageHeader, Panel, Stat, StatRow, Table, Row, Cell, Badge, Button, Notice, Meter,
} from "@/components/seller/ui";

export const dynamic = "force-dynamic";

/* Correspondance entre le rôle du compte et le code de plan en base. */
const PLAN_CODE_BY_ROLE: Record<string, string> = {
  seller_individual: "free",
  seller_business: "business",
  supplier: "supplier",
  official_brand: "official_brand",
};

export default async function StoreSubscriptionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, uid, store, role, roleLabel, limits } = await requireStoreOwner(id);

  const { count: storeCount } = await supabase
    .from("stores")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", uid);

  const { count: storeProducts } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("store_id", store.id);

  const { count: allProducts } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("seller_id", uid);

  const { data: plans, error: plansError } = await supabase
    .from("subscription_plans")
    .select("code, label, max_stores, max_products_per_store, commission_rate, price_amount, price_currency, billing_period, is_active, position")
    .eq("is_active", true)
    .order("position", { ascending: true });

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status, started_at, renews_at, expires_at, subscription_plans(code, label)")
    .eq("user_id", uid)
    .eq("status", "active")
    .order("started_at", { ascending: false })
    .maybeSingle();

  const currentCode = PLAN_CODE_BY_ROLE[role] || "";
  const planList = plans ?? [];
  const pricesDefined = planList.some((plan) => plan.price_amount !== null);

  const usedStores = storeCount || 0;
  const usedInStore = storeProducts || 0;

  return (
    <>
      <PageHeader
        title="Mon abonnement"
        subtitle={`Compte ${roleLabel} — les limites ci-dessous valent pour toutes vos boutiques.`}
        actions={<Button href="/dashboard/seller/stores">Mes boutiques</Button>}
      />

      <div className="space-y-4">
        {plansError && (
          <Notice tone="warning" title="Catalogue des plans indisponible">
            {plansError.message}. La migration 0001 doit être appliquée pour que
            la table des plans existe.
          </Notice>
        )}

        <StatRow>
          <Stat label="Plan" value={limits.planName} hint={roleLabel} />
          <Stat label="Commission MACHÉ" value={limits.commission} hint="Prélevée sur chaque vente" />
          <Stat
            label="Boutiques"
            value={`${formatNumber(usedStores)} / ${formatNumber(limits.maxStores)}`}
            tone={usedStores >= limits.maxStores ? "warning" : "default"}
          />
          <Stat
            label="Produits (cette boutique)"
            value={`${formatNumber(usedInStore)} / ${formatNumber(limits.maxArticlesPerStore)}`}
            tone={usedInStore >= limits.maxArticlesPerStore ? "warning" : "default"}
          />
          <Stat label="Produits (tout le compte)" value={formatNumber(allProducts || 0)} />
        </StatRow>

        <Panel title="Consommation des limites">
          <div className="max-w-2xl space-y-4">
            <div>
              <div className="mb-1.5 flex items-baseline justify-between text-[12px]">
                <span className="font-semibold text-[#0f1111]">Boutiques</span>
                <span className="tnum text-[#565959]">
                  {formatNumber(usedStores)} sur {formatNumber(limits.maxStores)}
                </span>
              </div>
              <Meter value={usedStores} max={limits.maxStores} intent="capacity" />
              {usedStores >= limits.maxStores && (
                <p className="mt-1.5 text-[11.5px] text-[#946200]">
                  Limite atteinte : la création d&apos;une nouvelle boutique est bloquée.
                </p>
              )}
            </div>

            <div>
              <div className="mb-1.5 flex items-baseline justify-between text-[12px]">
                <span className="font-semibold text-[#0f1111]">
                  Produits dans « {store.name?.trim() || "cette boutique"} »
                </span>
                <span className="tnum text-[#565959]">
                  {formatNumber(usedInStore)} sur {formatNumber(limits.maxArticlesPerStore)}
                </span>
              </div>
              <Meter value={usedInStore} max={limits.maxArticlesPerStore} intent="capacity" />
            </div>
          </div>
        </Panel>

        <Panel title="Abonnement enregistré">
          {subscription ? (
            <div className="space-y-1.5 text-[12.5px] text-[#565959]">
              <p>
                <span className="font-semibold text-[#0f1111]">Statut :</span>{" "}
                <Badge tone="success">{subscription.status}</Badge>
              </p>
              <p>Débuté le {formatDate(subscription.started_at)}.</p>
              {subscription.renews_at && (
                <p>Renouvellement prévu le {formatDate(subscription.renews_at)}.</p>
              )}
              {subscription.expires_at && (
                <p>Expire le {formatDate(subscription.expires_at)}.</p>
              )}
            </div>
          ) : (
            <p className="text-[12.5px] leading-relaxed text-[#565959]">
              Aucune ligne d&apos;abonnement payant n&apos;est enregistrée pour ce
              compte. Vos limites viennent donc du type de compte
              («&nbsp;{roleLabel}&nbsp;») et s&apos;appliquent sans échéance.
            </p>
          )}
        </Panel>

        <Panel
          title="Plans disponibles"
          description="Limites et commissions telles qu'elles sont enregistrées en base."
          padded={false}
        >
          {planList.length === 0 ? (
            <div className="px-4 py-8 text-center text-[12.5px] text-[#565959]">
              Aucun plan n&apos;est enregistré.
            </div>
          ) : (
            <Table
              columns={[
                { key: "p", label: "Plan" },
                { key: "s", label: "Boutiques", align: "right" },
                { key: "a", label: "Produits / boutique", align: "right" },
                { key: "c", label: "Commission", align: "right" },
                { key: "t", label: "Tarif", align: "right" },
              ]}
            >
              {planList.map((plan) => (
                <Row key={plan.code}>
                  <Cell strong>
                    {plan.label}
                    {plan.code === currentCode && (
                      <span className="ml-2">
                        <Badge tone="info">Plan actuel</Badge>
                      </span>
                    )}
                  </Cell>
                  <Cell align="right" numeric muted>
                    {formatNumber(plan.max_stores)}
                  </Cell>
                  <Cell align="right" numeric muted>
                    {formatNumber(plan.max_products_per_store)}
                  </Cell>
                  <Cell align="right" numeric muted>
                    {(Number(plan.commission_rate) * 100).toFixed(1).replace(".0", "")} %
                  </Cell>
                  <Cell align="right" numeric muted>
                    {plan.price_amount === null
                      ? "Non fixé"
                      : plan.price_currency === "HTG"
                        ? formatHTG(Number(plan.price_amount))
                        : `${formatNumber(Number(plan.price_amount))} ${plan.price_currency}`}
                  </Cell>
                </Row>
              ))}
            </Table>
          )}
        </Panel>

        {!pricesDefined && planList.length > 0 && (
          <Notice tone="info" title="Tarifs non fixés">
            Les montants des plans payants ne sont pas encore décidés, et aucun
            prestataire de paiement n&apos;est raccordé : le changement de plan ne
            peut donc pas être souscrit en ligne. Les limites d&apos;un compte se
            modifient pour l&apos;instant côté MACHÉ.
          </Notice>
        )}

        <Panel title="Pour changer de plan">
          <p className="max-w-2xl text-[12.5px] leading-relaxed text-[#565959]">
            Votre plan découle du type de votre compte. Pour passer à un compte
            Business, Fournisseur ou Marque officielle, la demande se fait
            auprès de l&apos;équipe MACHÉ : elle vérifie les documents de la
            boutique avant de relever les limites. Les plans du tableau
            ci-dessus sont ceux effectivement appliqués par le code.
          </p>
          <div className="mt-3">
            <Button href={`/dashboard/seller/stores/${store.id}/documents`}>
              Compléter mes documents
            </Button>
          </div>
        </Panel>
      </div>
    </>
  );
}
