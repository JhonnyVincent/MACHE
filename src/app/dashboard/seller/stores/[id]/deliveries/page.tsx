/*
  PAGE : Espace vendeur — livraisons d'une boutique

  Sert à :
  - suivre les expéditions de cette boutique, étape par étape ;
  - repérer les commandes à préparer.
*/

import { requireStoreOwner, formatNumber, formatDate } from "@/lib/seller";
import {
  PageHeader, Panel, Table, Row, Cell, Badge, Button, EmptyState, Stat, StatRow, Notice,
} from "@/components/seller/ui";

export const dynamic = "force-dynamic";

const LABELS: Record<string, string> = {
  pending: "À préparer",
  assigned: "Assignée à un livreur",
  picked_up: "Récupérée",
  in_transit: "En transit",
  delivered: "Livrée",
  failed: "Échec",
  cancelled: "Annulée",
};

export default async function StoreDeliveriesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, store } = await requireStoreOwner(id);

  const { data: shipments, error } = await supabase
    .from("shipments")
    .select("id, order_id, status, carrier, tracking_number, zone, assigned_at, delivered_at, created_at")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false })
    .limit(300);

  const list = shipments ?? [];
  const count = (status: string) => list.filter((s) => s.status === status).length;

  return (
    <>
      <PageHeader
        title="Livraisons"
        subtitle={store.name?.trim() || "Boutique"}
        actions={<Button href={`/dashboard/seller/stores/${store.id}/orders`} size="sm">Voir les commandes</Button>}
      />

      <div className="space-y-4">
        {error && (
          <Notice tone="warning" title="Livraisons indisponibles">
            {error.message}. La migration 0001 doit être appliquée.
          </Notice>
        )}

        <StatRow>
          <Stat label="À préparer" value={formatNumber(count("pending"))} tone={count("pending") ? "warning" : "default"} />
          <Stat label="En transit" value={formatNumber(count("in_transit") + count("picked_up"))} />
          <Stat label="Livrées" value={formatNumber(count("delivered"))} tone="success" />
          <Stat label="Échecs" value={formatNumber(count("failed"))} tone={count("failed") ? "danger" : "default"} />
        </StatRow>

        <Notice tone="info" title="Suivi transporteur">
          Aucun transporteur n&apos;est encore intégré : le numéro de suivi et
          les délais apparaîtront ici dès qu&apos;un partenaire logistique sera
          raccordé.
        </Notice>

        <Panel title="Expéditions" padded={false}>
          {list.length === 0 ? (
            <EmptyState
              title="Aucune expédition"
              description="Les expéditions sont créées à partir des commandes de cette boutique."
            />
          ) : (
            <Table columns={[
              { key: "o", label: "Commande" },
              { key: "z", label: "Zone" },
              { key: "s", label: "Étape" },
              { key: "t", label: "Suivi" },
              { key: "d", label: "Créée le" },
            ]}>
              {list.map((shipment) => (
                <Row key={shipment.id}>
                  <Cell strong>#{String(shipment.order_id).slice(0, 8)}</Cell>
                  <Cell muted>{shipment.zone || "—"}</Cell>
                  <Cell>
                    <Badge tone={
                      shipment.status === "delivered" ? "success"
                      : shipment.status === "failed" ? "danger"
                      : shipment.status === "pending" ? "warning" : "info"
                    }>
                      {LABELS[String(shipment.status)] || shipment.status}
                    </Badge>
                  </Cell>
                  <Cell muted>{shipment.tracking_number || "—"}</Cell>
                  <Cell muted>{formatDate(shipment.created_at)}</Cell>
                </Row>
              ))}
            </Table>
          )}
        </Panel>
      </div>
    </>
  );
}
