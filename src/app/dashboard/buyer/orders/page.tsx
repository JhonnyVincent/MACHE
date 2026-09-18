/*
  PAGE : mes commandes

  Lit les commandes du client dans Medusa. Elle lisait auparavant la table
  Supabase `orders`, qui n'est plus alimentée depuis que le tunnel de
  commande passe par le backend commerce : un client venant de commander
  n'y trouvait rien.
*/

import Link from "next/link";
import { getCustomer, getCustomerOrders } from "@/lib/medusa/customer";
import { formatAmount } from "@/lib/medusa/catalog";
import { formatDate } from "@/lib/seller";
import {
  FULFILLMENT_STATUS_LABELS, PAYMENT_STATUS_LABELS,
  fulfillmentTone, paymentTone,
} from "@/lib/medusa/order-labels";
import {
  PageHeader, Panel, Table, Row, Cell, Badge, Button, EmptyState, Notice,
} from "@/components/seller/ui";
import { reportOutage } from "@/lib/medusa/outage";

export const dynamic = "force-dynamic";

export default async function BuyerOrdersPage() {
  const customer = await getCustomer();

  if (!customer) {
    return (
      <>
        <PageHeader title="Mes commandes" />
        <Panel padded={false}>
          <EmptyState
            title="Connectez-vous"
            description="Vos commandes sont rattachées à votre compte client."
            action={
              <Button href="/compte/connexion?next=/dashboard/buyer/orders" variant="primary">
                Se connecter
              </Button>
            }
          />
        </Panel>
      </>
    );
  }

  const result = await getCustomerOrders();

  if (!result.ok) reportOutage("commandes", result.reason);

  const orders = result.ok ? result.data : [];

  return (
    <>
      <PageHeader
        title="Mes commandes"
        subtitle="Suivi de vos achats sur MACHÉ."
        actions={<Button href="/shop">Continuer mes achats</Button>}
      />

      <div className="space-y-4">
        {!result.ok && (
          <Notice tone="warning" title="Commandes indisponibles">
            Vos commandes ne peuvent pas être affichées pour le moment.
            Rien n'est perdu : réessayez dans quelques minutes.
          </Notice>
        )}

        <Panel padded={false}>
          {orders.length === 0 ? (
            <EmptyState
              title="Aucune commande"
              description="Vos achats apparaîtront ici dès votre première commande."
              action={<Button href="/shop" variant="primary">Voir le catalogue</Button>}
            />
          ) : (
            <Table
              columns={[
                { key: "r", label: "Commande" },
                { key: "d", label: "Date" },
                { key: "a", label: "Articles", align: "right" },
                { key: "l", label: "Livraison" },
                { key: "p", label: "Paiement" },
                { key: "t", label: "Total", align: "right" },
                { key: "x", label: "", align: "right", width: "80px" },
              ]}
            >
              {orders.map((order) => (
                <Row key={order.id}>
                  <Cell strong>
                    #{order.displayId ?? String(order.id).slice(0, 8)}
                  </Cell>
                  <Cell muted>{formatDate(order.createdAt)}</Cell>
                  <Cell align="right" numeric muted>{order.itemCount}</Cell>
                  <Cell>
                    <Badge tone={fulfillmentTone(order.fulfillmentStatus)}>
                      {FULFILLMENT_STATUS_LABELS[order.fulfillmentStatus] ?? order.fulfillmentStatus}
                    </Badge>
                  </Cell>
                  <Cell>
                    <Badge tone={paymentTone(order.paymentStatus)}>
                      {PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}
                    </Badge>
                  </Cell>
                  <Cell align="right" numeric strong>
                    {formatAmount(order.total, order.currency)}
                  </Cell>
                  <Cell align="right">
                    <Button href={`/dashboard/buyer/orders/${order.id}`} size="sm">
                      Détail
                    </Button>
                  </Cell>
                </Row>
              ))}
            </Table>
          )}
        </Panel>

        <Notice tone="info" title="Une commande par boutique">
          Un panier contenant les articles de plusieurs boutiques produit
          une commande par vendeur : chacune est préparée, expédiée et
          réglée séparément.{" "}
          <Link href="/legal/shipping" className="font-medium text-[#d2162c] hover:underline">
            Comment se passe la livraison
          </Link>
        </Notice>
      </div>
    </>
  );
}
