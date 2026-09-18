/*
  PAGE : Espace client — vue d'ensemble

  Les commandes viennent de Medusa. Cette page lisait la table Supabase
  `orders`, qui n'est plus alimentée : un client venant de commander y
  voyait zéro.
*/

import Link from "next/link";
import { getCustomer, getCustomerOrders } from "@/lib/medusa/customer";
import { formatAmount } from "@/lib/medusa/catalog";
import { formatNumber, formatDate } from "@/lib/seller";
import {
  FULFILLMENT_STATUS_LABELS, fulfillmentTone,
} from "@/lib/medusa/order-labels";
import {
  PageHeader, Panel, Stat, StatRow, Table, Row, Cell, Badge, Button, EmptyState, Notice,
} from "@/components/seller/ui";

export const dynamic = "force-dynamic";

export default async function BuyerOverviewPage() {
  const customer = await getCustomer();

  if (!customer) {
    return (
      <>
        <PageHeader
          title="Espace client"
          subtitle="Vos commandes, vos adresses et votre profil."
        />
        <Panel padded={false}>
          <EmptyState
            title="Connectez-vous"
            description="Un compte MACHÉ vous permet de suivre vos commandes et de garder vos adresses."
            action={
              <span className="flex flex-wrap justify-center gap-2">
                <Button href="/compte/connexion" variant="primary">Se connecter</Button>
                <Button href="/compte/inscription">Créer un compte</Button>
              </span>
            }
          />
        </Panel>

        <div className="mt-4">
          <Notice tone="info" title="Commander sans compte">
            MACHÉ n&apos;exige pas de compte pour passer commande. Sans
            compte en revanche, vous ne pourrez pas revenir consulter le
            suivi depuis ce site.
          </Notice>
        </div>
      </>
    );
  }

  const result = await getCustomerOrders();
  const orders = result.ok ? result.data : [];

  const inProgress = orders.filter(
    (order) => order.fulfillmentStatus !== "delivered" && order.status !== "canceled"
  );

  const spent = orders.reduce((sum, order) => sum + order.total, 0);
  const currency = orders[0]?.currency ?? null;

  return (
    <>
      <PageHeader
        title={`Bonjour ${customer.firstName ?? ""}`.trim()}
        subtitle={customer.email}
        actions={<Button href="/shop" variant="primary">Continuer mes achats</Button>}
      />

      <div className="space-y-4">
        {!result.ok && (
          <Notice tone="warning" title="Commandes indisponibles">
            {result.reason}
          </Notice>
        )}

        <StatRow>
          <Stat label="Commandes" value={formatNumber(orders.length)} />
          <Stat
            label="En cours"
            value={formatNumber(inProgress.length)}
            tone={inProgress.length ? "warning" : "success"}
          />
          <Stat label="Total commandé" value={formatAmount(spent, currency)} />
        </StatRow>

        <Panel
          title="Dernières commandes"
          actions={<Button href="/dashboard/buyer/orders" size="sm">Tout voir</Button>}
          padded={false}
        >
          {orders.length === 0 ? (
            <EmptyState
              title="Aucune commande"
              description="Vos achats apparaîtront ici."
              action={<Button href="/shop" variant="primary">Voir le catalogue</Button>}
            />
          ) : (
            <Table
              columns={[
                { key: "r", label: "Commande" },
                { key: "d", label: "Date" },
                { key: "l", label: "Livraison" },
                { key: "t", label: "Total", align: "right" },
              ]}
            >
              {orders.slice(0, 6).map((order) => (
                <Row key={order.id}>
                  <Cell strong>
                    <Link
                      href={`/dashboard/buyer/orders/${order.id}`}
                      className="hover:underline"
                    >
                      #{order.displayId ?? String(order.id).slice(0, 8)}
                    </Link>
                  </Cell>
                  <Cell muted>{formatDate(order.createdAt)}</Cell>
                  <Cell>
                    <Badge tone={fulfillmentTone(order.fulfillmentStatus)}>
                      {FULFILLMENT_STATUS_LABELS[order.fulfillmentStatus] ?? order.fulfillmentStatus}
                    </Badge>
                  </Cell>
                  <Cell align="right" numeric strong>
                    {formatAmount(order.total, order.currency)}
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
