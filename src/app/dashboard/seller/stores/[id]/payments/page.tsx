/*
  PAGE : Espace vendeur — paiements d'une boutique

  Sert à :
  - distinguer ce qui est encaissé de ce qui est en attente ;
  - détailler la commission retenue ;
  - suivre les versements déjà effectués.
*/

import { requireStoreOwner, formatHTG, formatNumber, formatDate } from "@/lib/seller";
import { PAYMENT_STATUS_LABELS } from "@/lib/buyer";
import {
  PageHeader, Panel, Table, Row, Cell, Badge, Button, EmptyState, Stat, StatRow, Notice,
} from "@/components/seller/ui";

export const dynamic = "force-dynamic";

export default async function StorePaymentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, store, uid, limits } = await requireStoreOwner(id);

  const { data: items, error } = await supabase
    .from("order_items")
    .select("id, order_id, subtotal, commission_amount, seller_amount")
    .eq("store_id", store.id)
    .limit(2000);

  const list = items ?? [];
  const orderIds = [...new Set(list.map((i) => String(i.order_id)))];

  const ordersResult = orderIds.length
    ? await supabase
        .from("orders")
        .select("id, reference, status, payment_status, created_at")
        .in("id", orderIds)
        .order("created_at", { ascending: false })
        .limit(500)
    : { data: [], error: null };

  const orders = ordersResult.data ?? [];
  const orderById = new Map(orders.map((o) => [String(o.id), o]));

  const settled = list.filter((i) => {
    const order = orderById.get(String(i.order_id));
    return order && ["completed", "delivered"].includes(String(order.status));
  });

  const gross = list.reduce((s, i) => s + (i.subtotal ?? 0), 0);
  const commission = list.reduce((s, i) => s + (i.commission_amount ?? 0), 0);
  const settledNet = settled.reduce((s, i) => s + (i.seller_amount ?? 0), 0);
  const pendingNet = list.reduce((s, i) => s + (i.seller_amount ?? 0), 0) - settledNet;

  const payoutsResult = await supabase
    .from("payouts")
    .select("id, amount, status, method, reference, period_start, period_end, processed_at, created_at")
    .eq("seller_id", uid)
    .order("created_at", { ascending: false })
    .limit(50);

  const payouts = payoutsResult.data ?? [];

  return (
    <>
      <PageHeader
        title="Argent et paiements"
        subtitle={store.name?.trim() || "Boutique"}
        actions={<Button href={`/dashboard/seller/stores/${store.id}/sales`} size="sm">Voir les ventes</Button>}
      />

      <div className="space-y-4">
        {(error || ordersResult.error) && (
          <Notice tone="warning" title="Données financières indisponibles">
            {(error || ordersResult.error)?.message}
          </Notice>
        )}

        <StatRow>
          <Stat label="Chiffre d'affaires" value={formatHTG(gross)} />
          <Stat label={`Commission (${limits.commission})`} value={formatHTG(commission)} />
          <Stat label="Acquis" value={formatHTG(settledNet)} tone="success" hint="commandes livrées" />
          <Stat label="En attente" value={formatHTG(pendingNet)} tone={pendingNet ? "warning" : "default"} hint="commandes en cours" />
        </StatRow>

        <Notice tone="info" title="Ce que ces montants recouvrent">
          Le net vendeur est calculé commission déduite. Les frais du
          prestataire de paiement et les remboursements éventuels ne sont pas
          pris en compte : ils dépendront du prestataire une fois raccordé.
        </Notice>

        <Panel title="Commandes et encaissements" padded={false}>
          {orders.length === 0 ? (
            <EmptyState title="Aucune commande" description="Les encaissements apparaîtront après votre première vente." />
          ) : (
            <Table columns={[
              { key: "ref", label: "Référence" },
              { key: "date", label: "Date" },
              { key: "pay", label: "Paiement" },
              { key: "gross", label: "Brut", align: "right" },
              { key: "net", label: "Net vendeur", align: "right" },
            ]}>
              {orders.map((order) => {
                const lines = list.filter((i) => String(i.order_id) === String(order.id));
                return (
                  <Row key={order.id}>
                    <Cell strong>{order.reference || `#${String(order.id).slice(0, 8)}`}</Cell>
                    <Cell muted>{formatDate(order.created_at)}</Cell>
                    <Cell muted>
                      {PAYMENT_STATUS_LABELS[String(order.payment_status)] || order.payment_status || "—"}
                    </Cell>
                    <Cell align="right" numeric>{formatHTG(lines.reduce((s, l) => s + (l.subtotal ?? 0), 0))}</Cell>
                    <Cell align="right" numeric strong>{formatHTG(lines.reduce((s, l) => s + (l.seller_amount ?? 0), 0))}</Cell>
                  </Row>
                );
              })}
            </Table>
          )}
        </Panel>

        <Panel title="Versements reçus" padded={false}>
          {payouts.length === 0 ? (
            <EmptyState
              title="Aucun versement"
              description="Les versements apparaîtront ici dès qu'un premier virement aura été effectué par MACHE."
            />
          ) : (
            <Table columns={[
              { key: "d", label: "Période" },
              { key: "m", label: "Méthode" },
              { key: "s", label: "État" },
              { key: "a", label: "Montant", align: "right" },
            ]}>
              {payouts.map((payout) => (
                <Row key={payout.id}>
                  <Cell muted>
                    {payout.period_start ? `${formatDate(payout.period_start)} → ${formatDate(payout.period_end)}` : formatDate(payout.created_at)}
                  </Cell>
                  <Cell muted>{payout.method || "—"}</Cell>
                  <Cell>
                    <Badge tone={payout.status === "paid" ? "success" : "warning"}>{payout.status}</Badge>
                  </Cell>
                  <Cell align="right" numeric strong>{formatHTG(payout.amount)}</Cell>
                </Row>
              ))}
            </Table>
          )}
        </Panel>
      </div>
    </>
  );
}
