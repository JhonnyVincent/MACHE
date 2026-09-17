/*
  PAGE : Espace vendeur — commandes d'une boutique

  Sert à :
  - lister les commandes qui concernent cette boutique ;
  - filtrer par état ;
  - ouvrir le détail des articles commandés.

  Sur une marketplace, une commande peut concerner plusieurs boutiques : ce
  sont donc les lignes (order_items) qui font foi, pas la commande entière.
*/

import Link from "next/link";
import { requireStoreOwner, formatHTG, formatNumber, formatDate } from "@/lib/seller";
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONES } from "@/lib/buyer";
import {
  PageHeader, Panel, Table, Row, Cell, Badge, Button, EmptyState, Stat, StatRow, Notice,
} from "@/components/seller/ui";

export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "all", label: "Toutes", statuses: [] as string[] },
  { key: "todo", label: "À traiter", statuses: ["pending"] },
  { key: "progress", label: "En cours", statuses: ["processing", "shipped"] },
  { key: "done", label: "Terminées", statuses: ["delivered", "completed"] },
  { key: "cancelled", label: "Annulées", statuses: ["cancelled", "refunded", "failed"] },
];

export default async function StoreOrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ filter?: string; order?: string }>;
}) {
  const { id } = await params;
  const { filter, order: focusedOrder } = await searchParams;
  const active = FILTERS.some((f) => f.key === filter) ? filter! : "all";

  const { supabase, store } = await requireStoreOwner(id);

  /* Les lignes de cette boutique donnent les commandes concernées. */
  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("id, order_id, title, quantity, subtotal, seller_amount")
    .eq("store_id", store.id)
    .limit(2000);

  const itemList = items ?? [];
  const orderIds = [...new Set(itemList.map((i) => String(i.order_id)))];

  const ordersResult = orderIds.length
    ? await supabase
        .from("orders")
        .select("id, reference, status, payment_status, created_at, contact_phone")
        .in("id", orderIds)
        .order("created_at", { ascending: false })
        .limit(500)
    : { data: [], error: null };

  const orders = ordersResult.data ?? [];
  const selected = FILTERS.find((f) => f.key === active)!;

  /*
    `?order=` vient des relevés comptables : on y clique pour retrouver une
    commande précise. On restreint alors la liste à celle-là, sans toucher
    aux compteurs des filtres qui, eux, décrivent toujours l'ensemble.
  */
  const focused = focusedOrder
    ? orders.find((o) => String(o.id) === focusedOrder)
    : undefined;

  const list = focused
    ? [focused]
    : selected.statuses.length === 0
      ? orders
      : orders.filter((o) => selected.statuses.includes(String(o.status)));

  const byOrder = new Map<string, typeof itemList>();
  for (const item of itemList) {
    const key = String(item.order_id);
    byOrder.set(key, [...(byOrder.get(key) ?? []), item]);
  }

  const revenue = itemList.reduce((sum, i) => sum + (i.seller_amount ?? 0), 0);
  const pending = orders.filter((o) => String(o.status) === "pending").length;

  const error = itemsError || ordersResult.error;

  return (
    <>
      <PageHeader
        title="Commandes"
        subtitle={store.name?.trim() || "Boutique"}
        actions={<Button href={`/dashboard/seller/stores/${store.id}`} size="sm">Retour à la boutique</Button>}
      />

      <div className="space-y-4">
        {error && (
          <Notice tone="warning" title="Commandes indisponibles">
            {error.message}. Les migrations 0001 et 0003 doivent être appliquées.
          </Notice>
        )}

        <StatRow>
          <Stat label="Commandes" value={formatNumber(orders.length)} />
          <Stat label="À traiter" value={formatNumber(pending)} tone={pending ? "warning" : "success"} />
          <Stat label="Articles vendus" value={formatNumber(itemList.reduce((s, i) => s + (i.quantity ?? 0), 0))} />
          <Stat label="Net vendeur" value={formatHTG(revenue)} hint="commission déduite" />
        </StatRow>

        {focusedOrder && (
          <Notice
            tone="info"
            title={focused ? "Une seule commande affichée" : "Commande introuvable"}
          >
            {focused
              ? `Filtré sur la commande ${focused.reference || `#${String(focused.id).slice(0, 8)}`}.`
              : "Cette commande ne concerne pas cette boutique, ou elle n'existe plus."}{" "}
            <Link
              href={`/dashboard/seller/stores/${store.id}/orders`}
              className="font-medium text-[#d2162c] hover:underline"
            >
              Voir toutes les commandes
            </Link>
          </Notice>
        )}

        <Panel padded={false}>
          <div className="flex flex-wrap gap-1 border-b border-[#e3e6e6] px-3 py-2">
            {FILTERS.map((f) => {
              const count =
                f.statuses.length === 0
                  ? orders.length
                  : orders.filter((o) => f.statuses.includes(String(o.status))).length;

              return (
                <Link
                  key={f.key}
                  href={f.key === "all" ? `/dashboard/seller/stores/${store.id}/orders` : `?filter=${f.key}`}
                  className={`rounded-[3px] px-2.5 py-1 text-[12px] transition-colors ${
                    active === f.key ? "bg-[#0a0a0a] font-semibold text-white" : "text-[#565959] hover:bg-[#f0f2f2]"
                  }`}
                >
                  {f.label}
                  <span className="tnum ml-1.5 opacity-60">{count}</span>
                </Link>
              );
            })}
          </div>

          {list.length === 0 ? (
            <EmptyState
              title={
                focusedOrder
                  ? "Commande introuvable"
                  : orders.length === 0
                    ? "Aucune commande"
                    : "Aucune commande dans cet état"
              }
              description={
                orders.length === 0
                  ? "Les commandes passées sur cette boutique apparaîtront ici."
                  : "Changez de filtre pour voir les autres commandes."
              }
            />
          ) : (
            <Table
              columns={[
                { key: "ref", label: "Référence" },
                { key: "date", label: "Date" },
                { key: "items", label: "Articles" },
                { key: "status", label: "État" },
                { key: "total", label: "Net vendeur", align: "right" },
              ]}
            >
              {list.map((order) => {
                const lines = byOrder.get(String(order.id)) ?? [];
                const net = lines.reduce((s, l) => s + (l.seller_amount ?? 0), 0);

                return (
                  <Row key={order.id}>
                    <Cell strong>
                      {order.reference || `#${String(order.id).slice(0, 8)}`}
                      {order.contact_phone && (
                        <span className="mt-0.5 block text-[11px] font-normal text-[#565959]">
                          {order.contact_phone}
                        </span>
                      )}
                    </Cell>
                    <Cell muted>{formatDate(order.created_at)}</Cell>
                    <Cell muted>
                      {lines.map((line) => (
                        <span key={line.id} className="block">
                          {line.quantity} × {line.title}
                        </span>
                      ))}
                    </Cell>
                    <Cell>
                      <Badge tone={ORDER_STATUS_TONES[String(order.status)] || "neutral"}>
                        {ORDER_STATUS_LABELS[String(order.status)] || order.status}
                      </Badge>
                    </Cell>
                    <Cell align="right" numeric strong>{formatHTG(net)}</Cell>
                  </Row>
                );
              })}
            </Table>
          )}
        </Panel>
      </div>
    </>
  );
}
