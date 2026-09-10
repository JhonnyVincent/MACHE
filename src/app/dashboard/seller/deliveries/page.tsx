import { requireSeller, formatHTG, formatNumber, formatDate } from "@/lib/seller";
import {
  PageHeader, Panel, Table, Row, Cell, Badge, Button, EmptyState, Stat, StatRow, Notice,
} from "@/components/seller/ui";

export const dynamic = "force-dynamic";

/* Étapes considérées comme relevant de la logistique. */
const SHIPPING_STATUSES = ["pending", "processing", "shipped", "delivered"];

export default async function SellerDeliveriesPage() {
  const { supabase, uid } = await requireSeller("/dashboard/seller/deliveries");

  const { data: stores } = await supabase.from("stores").select("id, name").eq("owner_id", uid);

  const storeList = stores ?? [];
  const ids = storeList.map((store) => store.id);
  const storeNames = new Map(storeList.map((store) => [store.id, store.name]));

  const result = ids.length
    ? await supabase
        .from("orders")
        .select("id, status, total_price, created_at, store_id")
        .in("store_id", ids)
        .in("status", SHIPPING_STATUSES)
        .order("created_at", { ascending: false })
        .limit(300)
    : { data: [], error: null };

  if (result.error) console.error("[seller/deliveries]", result.error.message);

  const shipments = result.data ?? [];

  const byStatus = (status: string) => shipments.filter((s) => s.status === status).length;

  return (
    <>
      <PageHeader
        title="Livraisons"
        subtitle="Commandes en cours d'acheminement, de la préparation à la remise au client."
      />

      <div className="space-y-4">
        {result.error && (
          <Notice tone="warning" title="Livraisons indisponibles">{result.error.message}</Notice>
        )}

        <StatRow>
          <Stat label="À préparer" value={formatNumber(byStatus("pending"))} tone={byStatus("pending") ? "warning" : "default"} />
          <Stat label="En préparation" value={formatNumber(byStatus("processing"))} />
          <Stat label="Expédiées" value={formatNumber(byStatus("shipped"))} />
          <Stat label="Livrées" value={formatNumber(byStatus("delivered"))} tone="success" />
          <Stat label="Total suivi" value={formatNumber(shipments.length)} />
        </StatRow>

        <Notice tone="info" title="Suivi transporteur">
          Le suivi colis n&apos;est pas encore raccordé : les statuts affichés proviennent de
          l&apos;état de la commande. Le numéro de suivi apparaîtra ici dès qu&apos;un
          transporteur sera intégré.
        </Notice>

        <Panel title="Expéditions en cours" padded={false}>
          {shipments.length === 0 ? (
            <EmptyState
              title="Aucune livraison en cours"
              description="Les commandes à préparer et à expédier apparaîtront ici."
              action={<Button href="/dashboard/seller/orders" variant="primary">Voir les commandes</Button>}
            />
          ) : (
            <Table
              columns={[
                { key: "ref", label: "Commande" },
                { key: "store", label: "Boutique" },
                { key: "date", label: "Commandée le" },
                { key: "status", label: "Étape" },
                { key: "total", label: "Montant", align: "right" },
              ]}
            >
              {shipments.map((shipment) => (
                <Row key={shipment.id}>
                  <Cell strong>#{String(shipment.id).slice(0, 8)}</Cell>
                  <Cell muted>{storeNames.get(shipment.store_id) || "—"}</Cell>
                  <Cell muted>{formatDate(shipment.created_at)}</Cell>
                  <Cell>
                    <Badge
                      tone={
                        shipment.status === "delivered" ? "success"
                        : shipment.status === "shipped" ? "info"
                        : "warning"
                      }
                    >
                      {shipment.status}
                    </Badge>
                  </Cell>
                  <Cell align="right" numeric>{formatHTG(shipment.total_price)}</Cell>
                </Row>
              ))}
            </Table>
          )}
        </Panel>
      </div>
    </>
  );
}
