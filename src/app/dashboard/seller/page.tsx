/*
  PAGE : vue d'ensemble de l'espace vendeur

  Registre : tableau de bord de gestion. Les chiffres d'abord, les
  boutiques en tableau, les points bloquants listés — pas de vignettes
  décoratives.
*/

import {
  requireSeller,
  formatHTG,
  formatNumber,
  formatDate,
  LOW_STOCK_THRESHOLD,
} from "@/lib/seller";
import {
  PageHeader,
  Panel,
  Stat,
  StatRow,
  Table,
  Row,
  Cell,
  Badge,
  Button,
  EmptyState,
  Notice,
  Meter,
} from "@/components/seller/ui";

export const dynamic = "force-dynamic";

function startOfCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

export default async function SellerOverviewPage() {
  const { supabase, uid, firstName, limits } = await requireSeller();

  const { data: stores, error: storesError } = await supabase
    .from("stores")
    .select("id, slug, name, is_verified, category, legal_doc_url, created_at")
    .eq("owner_id", uid)
    .order("created_at", { ascending: true });

  if (storesError) {
    console.error("[seller/overview] stores:", storesError.message);
  }

  const storeList = stores ?? [];
  const storeIds = storeList.map((store) => store.id);

  const ordersResult = storeIds.length
    ? await supabase
        .from("orders")
        .select("id, status, total_price, created_at, store_id")
        .in("store_id", storeIds)
        .order("created_at", { ascending: false })
        .limit(2000)
    : { data: [], error: null };

  if (ordersResult.error) {
    console.error("[seller/overview] orders:", ordersResult.error.message);
  }

  const orders = ordersResult.data ?? [];
  const monthStart = startOfCurrentMonth();

  const pendingOrders = orders.filter((order) => order.status === "pending").length;

  const monthRevenue = orders
    .filter(
      (order) =>
        order.status === "completed" &&
        typeof order.created_at === "string" &&
        order.created_at >= monthStart
    )
    .reduce((sum, order) => sum + (order.total_price ?? 0), 0);

  const totalRevenue = orders
    .filter((order) => order.status === "completed")
    .reduce((sum, order) => sum + (order.total_price ?? 0), 0);

  const perStore = await Promise.all(
    storeList.map(async (store) => {
      const [products, lowStock] = await Promise.all([
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("store_id", store.id),
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("store_id", store.id)
          .lte("stock", LOW_STOCK_THRESHOLD),
      ]);

      const storeOrders = orders.filter((order) => order.store_id === store.id);

      return {
        store,
        products: products.count ?? 0,
        lowStock: lowStock.count ?? 0,
        orders: storeOrders.length,
        revenue: storeOrders
          .filter((order) => order.status === "completed")
          .reduce((sum, order) => sum + (order.total_price ?? 0), 0),
        error: products.error ?? lowStock.error ?? null,
      };
    })
  );

  const totalProducts = perStore.reduce((sum, entry) => sum + entry.products, 0);
  const lowStockCount = perStore.reduce((sum, entry) => sum + entry.lowStock, 0);
  const missingStoreDocs = storeList.filter((store) => !store.legal_doc_url).length;

  const dataError =
    storesError || ordersResult.error || perStore.find((entry) => entry.error)?.error || null;

  const alerts = [
    {
      label: "Commandes en attente de traitement",
      count: pendingOrders,
      href: "/dashboard/seller/orders",
      tone: "warning" as const,
    },
    {
      label: `Produits à ${LOW_STOCK_THRESHOLD} unités ou moins`,
      count: lowStockCount,
      href: "/dashboard/seller/stock",
      tone: "warning" as const,
    },
    {
      label: "Boutiques sans document légal",
      count: missingStoreDocs,
      href: "/dashboard/seller/documents",
      tone: "danger" as const,
    },
  ].filter((alert) => alert.count > 0);

  return (
    <>
      <PageHeader
        title={`Bonjour ${firstName}`}
        subtitle="Vue d'ensemble de votre activité sur MACHE."
        actions={
          storeList.length < limits.maxStores ? (
            <Button href="/dashboard/seller/stores/new" variant="primary">
              Créer une boutique
            </Button>
          ) : null
        }
      />

      <div className="space-y-4">
        {dataError && (
          <Notice tone="warning" title="Certaines données n'ont pas pu être chargées">
            Les totaux ci-dessous sont peut-être incomplets. Détail : {dataError.message}
          </Notice>
        )}

        <StatRow>
          <Stat
            label="Chiffre d'affaires du mois"
            value={formatHTG(monthRevenue)}
            hint="commandes réglées"
          />
          <Stat
            label="Total encaissé"
            value={formatHTG(totalRevenue)}
            hint="depuis l'ouverture"
          />
          <Stat
            label="Commandes à traiter"
            value={formatNumber(pendingOrders)}
            tone={pendingOrders > 0 ? "warning" : "default"}
            hint={`${formatNumber(orders.length)} au total`}
          />
          <Stat
            label="Produits en ligne"
            value={formatNumber(totalProducts)}
            hint={`${storeList.length} boutique${storeList.length > 1 ? "s" : ""}`}
          />
          <Stat
            label="Stock critique"
            value={formatNumber(lowStockCount)}
            tone={lowStockCount > 0 ? "danger" : "success"}
            hint={`seuil : ${LOW_STOCK_THRESHOLD} unités`}
          />
        </StatRow>

        {alerts.length > 0 && (
          <Panel title="À traiter" padded={false}>
            <ul>
              {alerts.map((alert) => (
                <li
                  key={alert.label}
                  className="flex items-center justify-between gap-3 border-b border-[#e3e6e6] px-4 py-2.5 last:border-0"
                >
                  <span className="flex items-center gap-2.5">
                    <Badge tone={alert.tone}>{formatNumber(alert.count)}</Badge>
                    <span className="text-[12.5px]">{alert.label}</span>
                  </span>
                  <Button href={alert.href} variant="ghost" size="sm">
                    Traiter →
                  </Button>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        <Panel
          title="Mes boutiques"
          description={`${storeList.length} sur ${limits.maxStores} autorisées par l'offre ${limits.planName}`}
          actions={<Button href="/dashboard/seller/stores" size="sm">Tout voir</Button>}
          padded={false}
        >
          {storeList.length === 0 ? (
            <EmptyState
              title="Aucune boutique"
              description="Créez votre première boutique pour publier des produits et recevoir des commandes."
              action={
                <Button href="/dashboard/seller/stores/new" variant="primary">
                  Créer une boutique
                </Button>
              }
            />
          ) : (
            <Table
              columns={[
                { key: "name", label: "Boutique" },
                { key: "status", label: "Statut" },
                { key: "products", label: "Produits", align: "right" },
                { key: "orders", label: "Commandes", align: "right" },
                { key: "revenue", label: "Encaissé", align: "right" },
                { key: "stock", label: "Stock bas", align: "right" },
                { key: "actions", label: "", align: "right", width: "90px" },
              ]}
            >
              {perStore.map(({ store, products, lowStock, orders: storeOrders, revenue }) => (
                <Row key={store.id}>
                  <Cell strong>
                    {store.name?.trim() || "Boutique sans nom"}
                    <span className="mt-0.5 block text-[11px] font-normal text-[#565959]">
                      /store/{store.slug} · créée le {formatDate(store.created_at)}
                    </span>
                  </Cell>
                  <Cell>
                    <Badge tone={store.is_verified ? "success" : "warning"}>
                      {store.is_verified ? "Vérifiée" : "En attente"}
                    </Badge>
                  </Cell>
                  <Cell align="right" numeric>
                    {formatNumber(products)}
                    <span className="block text-[10.5px] text-[#767676]">
                      / {formatNumber(limits.maxArticlesPerStore)}
                    </span>
                  </Cell>
                  <Cell align="right" numeric>
                    {formatNumber(storeOrders)}
                  </Cell>
                  <Cell align="right" numeric strong>
                    {formatHTG(revenue)}
                  </Cell>
                  <Cell align="right" numeric>
                    {lowStock > 0 ? (
                      <span className="font-semibold text-[#b45309]">{lowStock}</span>
                    ) : (
                      <span className="text-[#767676]">0</span>
                    )}
                  </Cell>
                  <Cell align="right">
                    <Button href={`/dashboard/seller/stores/${store.id}`} size="sm">
                      Ouvrir
                    </Button>
                  </Cell>
                </Row>
              ))}
            </Table>
          )}
        </Panel>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Utilisation de votre offre">
            <dl className="space-y-3.5">
              <div>
                <div className="flex items-baseline justify-between text-[12.5px]">
                  <dt>Boutiques</dt>
                  <dd className="tnum text-[#565959]">
                    {storeList.length} / {limits.maxStores}
                  </dd>
                </div>
                <div className="mt-1.5">
                  <Meter value={storeList.length} max={limits.maxStores} intent="capacity" />
                </div>
              </div>

              <div>
                <div className="flex items-baseline justify-between text-[12.5px]">
                  <dt>Produits (toutes boutiques)</dt>
                  <dd className="tnum text-[#565959]">
                    {formatNumber(totalProducts)} /{" "}
                    {formatNumber(limits.maxArticlesPerStore * Math.max(1, storeList.length))}
                  </dd>
                </div>
                <div className="mt-1.5">
                  <Meter
                    value={totalProducts}
                    max={limits.maxArticlesPerStore * Math.max(1, storeList.length)}
                    intent="capacity"
                  />
                </div>
              </div>

              <div className="flex items-baseline justify-between border-t border-[#e3e6e6] pt-3 text-[12.5px]">
                <dt>Commission par vente</dt>
                <dd className="font-semibold">{limits.commission}</dd>
              </div>
            </dl>
          </Panel>

          <Panel title="Dernières commandes" padded={false}>
            {orders.length === 0 ? (
              <EmptyState
                title="Aucune commande"
                description="Les commandes de vos boutiques apparaîtront ici."
              />
            ) : (
              <Table
                columns={[
                  { key: "ref", label: "Référence" },
                  { key: "date", label: "Date" },
                  { key: "status", label: "Statut" },
                  { key: "total", label: "Montant", align: "right" },
                ]}
              >
                {orders.slice(0, 6).map((order) => (
                  <Row key={order.id}>
                    <Cell muted>#{String(order.id).slice(0, 8)}</Cell>
                    <Cell muted>{formatDate(order.created_at)}</Cell>
                    <Cell>
                      <Badge
                        tone={
                          order.status === "completed"
                            ? "success"
                            : order.status === "pending"
                              ? "warning"
                              : "neutral"
                        }
                      >
                        {order.status || "—"}
                      </Badge>
                    </Cell>
                    <Cell align="right" numeric strong>
                      {formatHTG(order.total_price)}
                    </Cell>
                  </Row>
                ))}
              </Table>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
