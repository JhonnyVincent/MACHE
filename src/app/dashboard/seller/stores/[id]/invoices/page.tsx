/*
  PAGE : Espace vendeur — relevés et pièces comptables d'une boutique

  Sert à :
  - donner, mois par mois, ce que la boutique a vendu, ce que MACHÉ a
    retenu et ce qui revient au vendeur ;
  - retrouver la pièce correspondant à une commande précise.

  Les lignes ci-dessous ne sont pas des factures émises : ce sont les
  relevés calculés à partir des commandes réelles. Aucun document PDF
  n'est généré tant que les mentions légales d'une facture haïtienne
  (numéro fiscal, TCA, séquence légale) ne sont pas arrêtées — et elles
  relèvent d'une décision qui n'est pas technique.
*/

import { requireStoreOwner, formatHTG, formatNumber, formatDate } from "@/lib/seller";
import {
  PageHeader, Panel, Table, Row, Cell, Badge, Button, EmptyState, Stat, StatRow, Notice,
} from "@/components/seller/ui";

export const dynamic = "force-dynamic";

const MONTH_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric",
});

export default async function StoreInvoicesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, store, limits } = await requireStoreOwner(id);

  const { data: items, error } = await supabase
    .from("order_items")
    .select("id, order_id, title, quantity, subtotal, commission_amount, seller_amount")
    .eq("store_id", store.id)
    .limit(2000);

  const list = items ?? [];
  const orderIds = [...new Set(list.map((item) => String(item.order_id)))];

  const ordersResult = orderIds.length
    ? await supabase
        .from("orders")
        .select("id, reference, status, payment_status, created_at")
        .in("id", orderIds)
        .order("created_at", { ascending: false })
        .limit(500)
    : { data: [], error: null };

  const orders = ordersResult.data ?? [];
  const orderById = new Map(orders.map((order) => [String(order.id), order]));

  /*
    Une commande peut porter des lignes de plusieurs boutiques. Le relevé
    d'un vendeur n'agrège donc que ses propres lignes, jamais le total de
    la commande : ce total appartient à l'acheteur, pas à la boutique.
  */
  type Statement = {
    orderId: string;
    reference: string;
    status: string;
    paymentStatus: string;
    createdAt: string;
    lines: number;
    units: number;
    gross: number;
    commission: number;
    net: number;
  };

  const statements: Statement[] = orders.map((order) => {
    const own = list.filter((item) => String(item.order_id) === String(order.id));

    return {
      orderId: String(order.id),
      reference: order.reference || `#${String(order.id).slice(0, 8)}`,
      status: String(order.status || ""),
      paymentStatus: String(order.payment_status || ""),
      createdAt: String(order.created_at || ""),
      lines: own.length,
      units: own.reduce((sum, item) => sum + (item.quantity ?? 0), 0),
      gross: own.reduce((sum, item) => sum + (item.subtotal ?? 0), 0),
      commission: own.reduce((sum, item) => sum + (item.commission_amount ?? 0), 0),
      net: own.reduce((sum, item) => sum + (item.seller_amount ?? 0), 0),
    };
  });

  const byMonth = new Map<
    string,
    { label: string; orders: number; gross: number; commission: number; net: number }
  >();

  for (const statement of statements) {
    const date = new Date(statement.createdAt);

    if (Number.isNaN(date.getTime())) continue;

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const bucket = byMonth.get(key) ?? {
      label: MONTH_FORMATTER.format(date),
      orders: 0,
      gross: 0,
      commission: 0,
      net: 0,
    };

    bucket.orders += 1;
    bucket.gross += statement.gross;
    bucket.commission += statement.commission;
    bucket.net += statement.net;
    byMonth.set(key, bucket);
  }

  const months = [...byMonth.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, value]) => ({ key, ...value }));

  const totalGross = statements.reduce((sum, s) => sum + s.gross, 0);
  const totalCommission = statements.reduce((sum, s) => sum + s.commission, 0);
  const totalNet = statements.reduce((sum, s) => sum + s.net, 0);

  return (
    <>
      <PageHeader
        title="Relevés & comptabilité"
        subtitle={store.name?.trim() || "Boutique"}
        actions={
          <Button href={`/dashboard/seller/stores/${store.id}/payments`}>
            Argent et paiements
          </Button>
        }
      />

      <div className="space-y-4">
        {(error || ordersResult.error) && (
          <Notice tone="warning" title="Relevés indisponibles">
            {(error || ordersResult.error)?.message}. La migration 0001 doit
            être appliquée pour que les lignes de commande existent.
          </Notice>
        )}

        <StatRow>
          <Stat label="Commandes relevées" value={formatNumber(statements.length)} />
          <Stat label="Chiffre d'affaires" value={formatHTG(totalGross)} />
          <Stat
            label={`Commission (${limits.commission})`}
            value={formatHTG(totalCommission)}
            hint="Retenue par MACHÉ"
          />
          <Stat label="Net vendeur" value={formatHTG(totalNet)} tone="success" />
        </StatRow>

        <Notice tone="info" title="Ces relevés ne sont pas des factures fiscales">
          Ils reprennent fidèlement vos commandes réelles et servent à tenir
          vos comptes. Une facture opposable à l&apos;administration exige un
          numéro fiscal, une numérotation séquentielle et le traitement de la
          TCA : tant que ces règles ne sont pas arrêtées, MACHÉ ne produit pas
          de document qui en aurait l&apos;apparence sans en avoir la valeur.
        </Notice>

        <Panel
          title="Relevé mensuel"
          description="Vos lignes de commande uniquement, regroupées par mois."
          padded={false}
        >
          {months.length === 0 ? (
            <EmptyState
              title="Aucun relevé"
              description="Les relevés apparaissent dès la première commande passée sur cette boutique."
              action={
                <Button href={`/dashboard/seller/stores/${store.id}/products`} variant="primary">
                  Voir mes produits
                </Button>
              }
            />
          ) : (
            <Table
              columns={[
                { key: "m", label: "Mois" },
                { key: "o", label: "Commandes", align: "right" },
                { key: "g", label: "Chiffre d'affaires", align: "right" },
                { key: "c", label: "Commission", align: "right" },
                { key: "n", label: "Net vendeur", align: "right" },
              ]}
            >
              {months.map((month) => (
                <Row key={month.key}>
                  <Cell strong>{month.label}</Cell>
                  <Cell align="right" numeric muted>{formatNumber(month.orders)}</Cell>
                  <Cell align="right" numeric>{formatHTG(month.gross)}</Cell>
                  <Cell align="right" numeric muted>−{formatHTG(month.commission)}</Cell>
                  <Cell align="right" numeric strong>{formatHTG(month.net)}</Cell>
                </Row>
              ))}
            </Table>
          )}
        </Panel>

        <Panel
          title="Pièces par commande"
          description="Une ligne par commande contenant des produits de cette boutique."
          padded={false}
        >
          {statements.length === 0 ? (
            <EmptyState
              title="Aucune pièce"
              description="Chaque commande passée sur cette boutique produira sa pièce ici."
            />
          ) : (
            <Table
              columns={[
                { key: "r", label: "Référence" },
                { key: "d", label: "Date" },
                { key: "u", label: "Articles", align: "right" },
                { key: "p", label: "Paiement" },
                { key: "g", label: "Montant", align: "right" },
                { key: "n", label: "Net vendeur", align: "right" },
                { key: "a", label: "", align: "right", width: "90px" },
              ]}
            >
              {statements.map((statement) => (
                <Row key={statement.orderId}>
                  <Cell strong>{statement.reference}</Cell>
                  <Cell muted>{formatDate(statement.createdAt)}</Cell>
                  <Cell align="right" numeric muted>{formatNumber(statement.units)}</Cell>
                  <Cell>
                    <Badge
                      tone={
                        statement.paymentStatus === "paid"
                          ? "success"
                          : statement.paymentStatus === "failed"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {statement.paymentStatus === "paid"
                        ? "Encaissé"
                        : statement.paymentStatus === "cash_on_delivery"
                          ? "À la livraison"
                          : statement.paymentStatus || "En attente"}
                    </Badge>
                  </Cell>
                  <Cell align="right" numeric>{formatHTG(statement.gross)}</Cell>
                  <Cell align="right" numeric strong>{formatHTG(statement.net)}</Cell>
                  <Cell align="right">
                    <Button
                      href={`/dashboard/seller/stores/${store.id}/orders?order=${statement.orderId}`}
                      size="sm"
                    >
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
