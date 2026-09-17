/*
  PAGE : Espace vendeur — statistiques d'une boutique

  Sert à :
  - comparer l'activité des 30 derniers jours aux 30 précédents ;
  - mesurer le taux de finalisation des commandes ;
  - situer la santé du catalogue.

  Ce qui n'est pas mesuré n'est pas affiché : les visites et le taux de
  conversion demandent un suivi d'audience qui n'est pas en place. Inventer
  ces chiffres tromperait le vendeur sur ses propres performances.
*/

import { requireStoreOwner, formatHTG, formatNumber, LOW_STOCK_THRESHOLD } from "@/lib/seller";
import {
  PageHeader, Panel, Stat, StatRow, Table, Row, Cell, Badge, Button, Notice, Meter,
} from "@/components/seller/ui";

export const dynamic = "force-dynamic";

const DAYS = 30;

export default async function StoreStatsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, store } = await requireStoreOwner(id);

  const since = new Date(); since.setDate(since.getDate() - DAYS);
  const previousSince = new Date(); previousSince.setDate(previousSince.getDate() - DAYS * 2);

  const [itemsResult, productsResult] = await Promise.all([
    supabase
      .from("order_items")
      .select("id, quantity, subtotal, seller_amount, created_at, order_id")
      .eq("store_id", store.id)
      .gte("created_at", previousSince.toISOString())
      .limit(2000),
    supabase
      .from("products")
      .select("id, status, stock, rating_average, rating_count")
      .eq("store_id", store.id)
      .limit(500),
  ]);

  const items = itemsResult.data ?? [];
  const products = productsResult.data ?? [];
  const sinceIso = since.toISOString();

  const current = items.filter((i) => typeof i.created_at === "string" && i.created_at >= sinceIso);
  const previous = items.filter((i) => typeof i.created_at === "string" && i.created_at < sinceIso);

  const sum = (list: typeof items) => list.reduce((s, i) => s + (i.subtotal ?? 0), 0);
  const currentRevenue = sum(current);
  const previousRevenue = sum(previous);

  const variation = previousRevenue > 0
    ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
    : null;

  const active = products.filter((p) => p.status === "active").length;
  const lowStock = products.filter((p) => (p.stock ?? 0) <= LOW_STOCK_THRESHOLD).length;
  const rated = products.filter((p) => (p.rating_count ?? 0) > 0);
  const averageRating = rated.length
    ? rated.reduce((s, p) => s + (p.rating_average ?? 0), 0) / rated.length
    : 0;

  return (
    <>
      <PageHeader
        title="Statistiques"
        subtitle={`${store.name?.trim() || "Boutique"} — ${DAYS} derniers jours`}
        actions={<Button href={`/dashboard/seller/stores/${store.id}/sales`} size="sm">Voir les ventes</Button>}
      />

      <div className="space-y-4">
        {(itemsResult.error || productsResult.error) && (
          <Notice tone="warning" title="Analyse partielle">
            {(itemsResult.error || productsResult.error)?.message}
          </Notice>
        )}

        <StatRow>
          <Stat label={`CA sur ${DAYS} jours`} value={formatHTG(currentRevenue)} />
          <Stat
            label="Évolution"
            value={variation === null ? "—" : `${variation >= 0 ? "+" : ""}${variation.toFixed(1)} %`}
            tone={variation === null ? "default" : variation >= 0 ? "success" : "danger"}
            hint={variation === null ? "pas d'historique comparable" : `contre ${formatHTG(previousRevenue)}`}
          />
          <Stat label="Articles vendus" value={formatNumber(current.reduce((s, i) => s + (i.quantity ?? 0), 0))} />
          <Stat label="Produits en ligne" value={formatNumber(active)} hint={`sur ${products.length}`} />
          <Stat
            label="Note moyenne"
            value={rated.length ? averageRating.toFixed(1) : "—"}
            hint={rated.length ? `${rated.length} produits notés` : "aucun avis"}
            tone={averageRating >= 4 ? "success" : averageRating > 0 && averageRating < 3 ? "danger" : "default"}
          />
        </StatRow>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Santé du catalogue">
            <dl className="space-y-3.5">
              <div>
                <div className="flex items-baseline justify-between text-[12.5px]">
                  <dt>Produits en ligne</dt>
                  <dd className="tnum text-[#565959]">{active} / {products.length}</dd>
                </div>
                <div className="mt-1.5"><Meter value={active} max={Math.max(1, products.length)} /></div>
              </div>

              <div className="flex items-baseline justify-between border-t border-[#e3e6e6] pt-3 text-[12.5px]">
                <dt>Produits à réapprovisionner</dt>
                <dd>
                  <Badge tone={lowStock ? "warning" : "success"}>
                    {lowStock > 0 ? `${lowStock} à traiter` : "aucun"}
                  </Badge>
                </dd>
              </div>

              <div className="flex items-baseline justify-between text-[12.5px]">
                <dt>Boutique vérifiée</dt>
                <dd>
                  <Badge tone={store.is_verified ? "success" : "warning"}>
                    {store.is_verified ? "oui" : "en attente"}
                  </Badge>
                </dd>
              </div>
            </dl>
          </Panel>

          <Panel title="Ce qui n'est pas encore mesuré">
            <p className="text-[12.5px] leading-relaxed text-[#565959]">
              Les visites, les sources de trafic et le taux d&apos;ajout au
              panier demandent un suivi d&apos;audience qui n&apos;est pas en
              place. Les chiffres ci-dessus proviennent uniquement de vos
              commandes et de votre catalogue.
            </p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-[#565959]">
              Ils seront ajoutés ici dès que la mesure sera raccordée, sans
              estimation entre-temps.
            </p>
          </Panel>
        </div>
      </div>
    </>
  );
}
