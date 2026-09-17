/*
  PAGE : Espace client — mes commandes

  Sert à :
  - lister toutes les commandes du compte ;
  - filtrer par état ;
  - ouvrir le détail d'une commande.
*/

import Link from "next/link";
import { requireBuyer, ORDER_STATUS_LABELS, ORDER_STATUS_TONES, PAYMENT_STATUS_LABELS } from "@/lib/buyer";
import { formatHTG, formatNumber, formatDate } from "@/lib/seller";
import {
  PageHeader, Panel, Table, Row, Cell, Badge, Button, EmptyState, Notice,
} from "@/components/seller/ui";

export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "all", label: "Toutes", statuses: [] as string[] },
  { key: "open", label: "En cours", statuses: ["pending", "processing", "shipped"] },
  { key: "done", label: "Livrées", statuses: ["delivered", "completed"] },
  { key: "cancelled", label: "Annulées", statuses: ["cancelled", "refunded", "failed"] },
];

export default async function BuyerOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const active = FILTERS.some((f) => f.key === filter) ? filter! : "all";

  const { supabase, uid } = await requireBuyer("/dashboard/buyer/orders");

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, reference, status, payment_status, total_price, shipping_total, created_at")
    .eq("buyer_id", uid)
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) console.error("[buyer/orders]", error.message);

  const all = orders ?? [];
  const selected = FILTERS.find((f) => f.key === active)!;
  const list =
    selected.statuses.length === 0
      ? all
      : all.filter((o) => selected.statuses.includes(String(o.status)));

  return (
    <>
      <PageHeader
        title="Mes commandes"
        subtitle="Toutes vos commandes, de la plus récente à la plus ancienne."
      />

      <div className="space-y-4">
        {error && (
          <Notice tone="warning" title="Commandes indisponibles">{error.message}</Notice>
        )}

        <Panel padded={false}>
          <div className="flex flex-wrap gap-1 border-b border-[#e3e6e6] px-3 py-2">
            {FILTERS.map((f) => {
              const count =
                f.statuses.length === 0
                  ? all.length
                  : all.filter((o) => f.statuses.includes(String(o.status))).length;

              return (
                <Link
                  key={f.key}
                  href={f.key === "all" ? "/dashboard/buyer/orders" : `?filter=${f.key}`}
                  className={`rounded-[3px] px-2.5 py-1 text-[12px] transition-colors ${
                    active === f.key
                      ? "bg-[#0a0a0a] font-semibold text-white"
                      : "text-[#565959] hover:bg-[#f0f2f2]"
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
              title={all.length === 0 ? "Aucune commande" : "Aucune commande dans cet état"}
              description={
                all.length === 0
                  ? "Vos commandes apparaîtront ici dès votre premier achat."
                  : "Changez de filtre pour voir les autres commandes."
              }
              action={
                all.length === 0 ? (
                  <Button href="/shop" variant="primary">Parcourir le catalogue</Button>
                ) : undefined
              }
            />
          ) : (
            <Table
              columns={[
                { key: "ref", label: "Référence" },
                { key: "date", label: "Date" },
                { key: "status", label: "État" },
                { key: "payment", label: "Paiement" },
                { key: "total", label: "Montant", align: "right" },
                { key: "actions", label: "", align: "right", width: "90px" },
              ]}
            >
              {list.map((order) => (
                <Row key={order.id}>
                  <Cell strong>{order.reference || `#${String(order.id).slice(0, 8)}`}</Cell>
                  <Cell muted>{formatDate(order.created_at)}</Cell>
                  <Cell>
                    <Badge tone={ORDER_STATUS_TONES[String(order.status)] || "neutral"}>
                      {ORDER_STATUS_LABELS[String(order.status)] || order.status}
                    </Badge>
                  </Cell>
                  <Cell muted>
                    {PAYMENT_STATUS_LABELS[String(order.payment_status)] || order.payment_status || "—"}
                  </Cell>
                  <Cell align="right" numeric strong>{formatHTG(order.total_price)}</Cell>
                  <Cell align="right">
                    <Button href={`/dashboard/buyer/orders/${order.id}`} size="sm">Détail</Button>
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
