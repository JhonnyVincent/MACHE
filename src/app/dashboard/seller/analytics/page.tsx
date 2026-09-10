import { requireSeller, formatHTG, formatNumber, LOW_STOCK_THRESHOLD } from "@/lib/seller";
import {
  PageHeader, Panel, Table, Row, Cell, Button, EmptyState, Stat, StatRow, Notice, Meter, Badge,
} from "@/components/seller/ui";

export const dynamic = "force-dynamic";

const DAYS = 30;

export default async function SellerAnalyticsPage() {
  const { supabase, uid } = await requireSeller("/dashboard/seller/analytics");

  const { data: stores } = await supabase.from("stores").select("id, name").eq("owner_id", uid);

  const storeList = stores ?? [];
  const ids = storeList.map((store) => store.id);

  const since = new Date();
  since.setDate(since.getDate() - DAYS);
  const sinceIso = since.toISOString();

  const previousSince = new Date();
  previousSince.setDate(previousSince.getDate() - DAYS * 2);

  const ordersResult = ids.length
    ? await supabase
        .from("orders")
        .select("id, status, total_price, created_at, store_id")
        .in("store_id", ids)
        .gte("created_at", previousSince.toISOString())
        .limit(2000)
    : { data: [], error: null };

  const productsResult = ids.length
    ? await supabase
        .from("products")
        .select("id, title, price, stock, status, store_id")
        .in("store_id", ids)
        .limit(500)
    : { data: [], error: null };

  const orders = ordersResult.data ?? [];
  const products = productsResult.data ?? [];

  const current = orders.filter((o) => typeof o.created_at === "string" && o.created_at >= sinceIso);
  const previous = orders.filter((o) => typeof o.created_at === "string" && o.created_at < sinceIso);

  const revenueOf = (list: typeof orders) =>
    list.filter((o) => o.status === "completed").reduce((s, o) => s + (o.total_price ?? 0), 0);

  const currentRevenue = revenueOf(current);
  const previousRevenue = revenueOf(previous);

  const variation =
    previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : null;

  const completed = current.filter((o) => o.status === "completed").length;
  const cancelled = current.filter((o) => o.status === "cancelled").length;
  const conversion = current.length ? (completed / current.length) * 100 : 0;

  const byStore = storeList
    .map((store) => {
      const storeOrders = current.filter((o) => o.store_id === store.id);
      const storeProducts = products.filter((p) => p.store_id === store.id);

      return {
        id: store.id,
        name: store.name,
        orders: storeOrders.length,
        revenue: revenueOf(storeOrders),
        products: storeProducts.length,
        lowStock: storeProducts.filter((p) => (p.stock ?? 0) <= LOW_STOCK_THRESHOLD).length,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  const maxRevenue = Math.max(1, ...byStore.map((store) => store.revenue));

  return (
    <>
      <PageHeader
        title="Analyses"
        subtitle={`Activité des ${DAYS} derniers jours, comparée aux ${DAYS} jours précédents.`}
      />

      <div className="space-y-4">
        {(ordersResult.error || productsResult.error) && (
          <Notice tone="warning" title="Analyse partielle">
            {(ordersResult.error || productsResult.error)?.message}
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
          <Stat label="Commandes" value={formatNumber(current.length)} hint={`${completed} réglées`} />
          <Stat
            label="Taux de finalisation"
            value={`${conversion.toFixed(0)} %`}
            tone={conversion >= 70 ? "success" : conversion >= 40 ? "warning" : "danger"}
            hint={`${cancelled} annulée${cancelled > 1 ? "s" : ""}`}
          />
          <Stat label="Références actives" value={formatNumber(products.filter((p) => p.status === "active").length)} hint={`sur ${products.length}`} />
        </StatRow>

        <Panel title="Performance par boutique" description={`Sur les ${DAYS} derniers jours`} padded={false}>
          {byStore.length === 0 ? (
            <EmptyState title="Aucune boutique" description="Créez une boutique pour obtenir des analyses." action={<Button href="/dashboard/seller/stores/new" variant="primary">Créer une boutique</Button>} />
          ) : (
            <Table
              columns={[
                { key: "store", label: "Boutique" },
                { key: "share", label: "Part du CA", width: "180px" },
                { key: "revenue", label: "CA", align: "right" },
                { key: "orders", label: "Commandes", align: "right" },
                { key: "products", label: "Produits", align: "right" },
                { key: "health", label: "Stock" },
              ]}
            >
              {byStore.map((store) => (
                <Row key={store.id}>
                  <Cell strong>{store.name?.trim() || "Sans nom"}</Cell>
                  <Cell>
                    <Meter value={store.revenue} max={maxRevenue} />
                  </Cell>
                  <Cell align="right" numeric strong>{formatHTG(store.revenue)}</Cell>
                  <Cell align="right" numeric>{formatNumber(store.orders)}</Cell>
                  <Cell align="right" numeric>{formatNumber(store.products)}</Cell>
                  <Cell>
                    <Badge tone={store.lowStock > 0 ? "warning" : "success"}>
                      {store.lowStock > 0 ? `${store.lowStock} à réappro.` : "Sain"}
                    </Badge>
                  </Cell>
                </Row>
              ))}
            </Table>
          )}
        </Panel>

        <Notice tone="info" title="Ce qui n'est pas encore mesuré">
          Les visites, les sources de trafic et le taux d&apos;ajout au panier demandent un
          suivi d&apos;audience qui n&apos;est pas encore en place. Les chiffres ci-dessus
          proviennent uniquement des commandes et du catalogue.
        </Notice>
      </div>
    </>
  );
}
