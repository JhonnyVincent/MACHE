import { requireSeller, formatHTG, formatNumber, formatDate } from "@/lib/seller";
import {
  PageHeader, Panel, Table, Row, Cell, Badge, Button, EmptyState, Stat, StatRow, Notice,
} from "@/components/seller/ui";

export const dynamic = "force-dynamic";

const STATUS_TONES: Record<string, "success" | "warning" | "danger" | "neutral" | "info"> = {
  completed: "success",
  paid: "success",
  pending: "warning",
  processing: "info",
  shipped: "info",
  cancelled: "danger",
  refunded: "danger",
};

const FILTERS = [
  { key: "all", label: "Toutes" },
  { key: "pending", label: "À traiter" },
  { key: "processing", label: "En cours" },
  { key: "completed", label: "Terminées" },
  { key: "cancelled", label: "Annulées" },
];

export default async function SellerOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const active = status && FILTERS.some((f) => f.key === status) ? status : "all";

  const { supabase, uid } = await requireSeller("/dashboard/seller/orders");

  const { data: stores } = await supabase.from("stores").select("id, name").eq("owner_id", uid);

  const storeList = stores ?? [];
  const ids = storeList.map((store) => store.id);
  const storeNames = new Map(storeList.map((store) => [store.id, store.name]));

  const result = ids.length
    ? await supabase
        .from("orders")
        .select("id, status, total_price, created_at, store_id")
        .in("store_id", ids)
        .order("created_at", { ascending: false })
        .limit(500)
    : { data: [], error: null };

  if (result.error) console.error("[seller/orders]", result.error.message);

  const all = result.data ?? [];
  const orders = active === "all" ? all : all.filter((order) => order.status === active);

  const revenue = all
    .filter((order) => order.status === "completed")
    .reduce((sum, order) => sum + (order.total_price ?? 0), 0);

  const averageBasket = all.length ? revenue / Math.max(1, all.filter((o) => o.status === "completed").length) : 0;

  return (
    <>
      <PageHeader
        title="Commandes"
        subtitle="Toutes les commandes de vos boutiques, de la plus récente à la plus ancienne."
      />

      <div className="space-y-4">
        {result.error && (
          <Notice tone="warning" title="Commandes indisponibles">
            {result.error.message}
          </Notice>
        )}

        <StatRow>
          <Stat label="Total" value={formatNumber(all.length)} />
          <Stat
            label="À traiter"
            value={formatNumber(all.filter((o) => o.status === "pending").length)}
            tone="warning"
          />
          <Stat
            label="Terminées"
            value={formatNumber(all.filter((o) => o.status === "completed").length)}
            tone="success"
          />
          <Stat label="Encaissé" value={formatHTG(revenue)} />
          <Stat label="Panier moyen" value={formatHTG(averageBasket)} hint="commandes réglées" />
        </StatRow>

        <Panel padded={false}>
          <div className="flex flex-wrap gap-1 border-b border-[#e3e6e6] px-3 py-2">
            {FILTERS.map((filter) => {
              const count =
                filter.key === "all"
                  ? all.length
                  : all.filter((order) => order.status === filter.key).length;

              return (
                <a
                  key={filter.key}
                  href={filter.key === "all" ? "?" : `?status=${filter.key}`}
                  className={`rounded-[3px] px-2.5 py-1 text-[12px] transition-colors ${
                    active === filter.key
                      ? "bg-[#0a0a0a] font-semibold text-white"
                      : "text-[#565959] hover:bg-[#f0f2f2]"
                  }`}
                >
                  {filter.label}
                  <span className="tnum ml-1.5 opacity-60">{count}</span>
                </a>
              );
            })}
          </div>

          {orders.length === 0 ? (
            <EmptyState
              title={active === "all" ? "Aucune commande" : "Aucune commande dans cet état"}
              description={
                active === "all"
                  ? "Les commandes passées sur vos boutiques apparaîtront ici dès la première vente."
                  : "Changez de filtre pour voir les autres commandes."
              }
            />
          ) : (
            <Table
              columns={[
                { key: "ref", label: "Référence" },
                { key: "store", label: "Boutique" },
                { key: "date", label: "Date" },
                { key: "status", label: "Statut" },
                { key: "total", label: "Montant", align: "right" },
                { key: "actions", label: "", align: "right", width: "90px" },
              ]}
            >
              {orders.map((order) => (
                <Row key={order.id}>
                  <Cell strong>#{String(order.id).slice(0, 8)}</Cell>
                  <Cell muted>{storeNames.get(order.store_id) || "—"}</Cell>
                  <Cell muted>{formatDate(order.created_at)}</Cell>
                  <Cell>
                    <Badge tone={STATUS_TONES[order.status] || "neutral"}>{order.status || "—"}</Badge>
                  </Cell>
                  <Cell align="right" numeric strong>{formatHTG(order.total_price)}</Cell>
                  <Cell align="right">
                    <Button href={`/dashboard/seller/stores/${order.store_id}/orders`} size="sm">
                      Détail
                    </Button>
                  </Cell>
                </Row>
              ))}
            </Table>
          )}
        </Panel>
      </div>
    </>
  );
}
