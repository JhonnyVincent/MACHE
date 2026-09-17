/*
  PAGE : Espace client — vue d'ensemble

  Sert à :
  - résumer l'activité d'achat du compte ;
  - afficher les commandes récentes et leur état ;
  - signaler ce qui attend une action du client.
*/

import { requireBuyer, ORDER_STATUS_LABELS, ORDER_STATUS_TONES } from "@/lib/buyer";
import { formatHTG, formatNumber, formatDate } from "@/lib/seller";
import {
  PageHeader, Panel, Stat, StatRow, Table, Row, Cell, Badge, Button, EmptyState, Notice,
} from "@/components/seller/ui";

export const dynamic = "force-dynamic";

export default async function BuyerOverviewPage() {
  const { supabase, uid, firstName } = await requireBuyer();

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, reference, status, payment_status, total_price, created_at")
    .eq("buyer_id", uid)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) console.error("[buyer/overview]", error.message);

  const list = orders ?? [];
  const spent = list
    .filter((o) => !["cancelled", "refunded", "failed"].includes(String(o.status)))
    .reduce((sum, o) => sum + (o.total_price ?? 0), 0);

  const inProgress = list.filter((o) =>
    ["pending", "processing", "shipped"].includes(String(o.status))
  ).length;

  const delivered = list.filter((o) =>
    ["delivered", "completed"].includes(String(o.status))
  ).length;

  return (
    <>
      <PageHeader
        title={`Bonjour ${firstName}`}
        subtitle="Vos commandes et le suivi de vos achats sur MACHE."
        actions={<Button href="/shop" variant="primary">Voir le catalogue</Button>}
      />

      <div className="space-y-4">
        {error && (
          <Notice tone="warning" title="Commandes indisponibles">
            {error.message}. Les migrations 0001 et 0003 doivent être appliquées
            à la base.
          </Notice>
        )}

        <StatRow>
          <Stat label="Commandes" value={formatNumber(list.length)} />
          <Stat label="En cours" value={formatNumber(inProgress)} tone={inProgress ? "warning" : "default"} />
          <Stat label="Livrées" value={formatNumber(delivered)} tone={delivered ? "success" : "default"} />
          <Stat label="Total dépensé" value={formatHTG(spent)} hint="hors commandes annulées" />
        </StatRow>

        <Panel
          title="Commandes récentes"
          actions={list.length > 0 ? <Button href="/dashboard/buyer/orders" size="sm">Tout voir</Button> : undefined}
          padded={false}
        >
          {list.length === 0 ? (
            <EmptyState
              title="Aucune commande"
              description="Vos commandes apparaîtront ici avec leur suivi dès votre premier achat."
              action={<Button href="/shop" variant="primary">Parcourir le catalogue</Button>}
            />
          ) : (
            <Table
              columns={[
                { key: "ref", label: "Référence" },
                { key: "date", label: "Date" },
                { key: "status", label: "État" },
                { key: "total", label: "Montant", align: "right" },
                { key: "actions", label: "", align: "right", width: "90px" },
              ]}
            >
              {list.slice(0, 8).map((order) => (
                <Row key={order.id}>
                  <Cell strong>{order.reference || `#${String(order.id).slice(0, 8)}`}</Cell>
                  <Cell muted>{formatDate(order.created_at)}</Cell>
                  <Cell>
                    <Badge tone={ORDER_STATUS_TONES[String(order.status)] || "neutral"}>
                      {ORDER_STATUS_LABELS[String(order.status)] || order.status}
                    </Badge>
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
