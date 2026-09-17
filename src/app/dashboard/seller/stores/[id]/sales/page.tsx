/*
  PAGE : Espace vendeur — ventes d'une boutique

  Sert à :
  - suivre le chiffre d'affaires de la boutique, mois par mois ;
  - connaître la part reversée en commission ;
  - identifier les produits qui vendent.
*/

import { requireStoreOwner, formatHTG, formatNumber } from "@/lib/seller";
import {
  PageHeader, Panel, Table, Row, Cell, Button, EmptyState, Stat, StatRow, Notice,
} from "@/components/seller/ui";

export const dynamic = "force-dynamic";

const MONTHS = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];

export default async function StoreSalesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, store, limits } = await requireStoreOwner(id);

  const { data: items, error } = await supabase
    .from("order_items")
    .select("id, order_id, product_id, title, quantity, subtotal, commission_amount, seller_amount, created_at")
    .eq("store_id", store.id)
    .limit(2000);

  const list = items ?? [];

  const gross = list.reduce((s, i) => s + (i.subtotal ?? 0), 0);
  const commission = list.reduce((s, i) => s + (i.commission_amount ?? 0), 0);
  const net = list.reduce((s, i) => s + (i.seller_amount ?? 0), 0);
  const units = list.reduce((s, i) => s + (i.quantity ?? 0), 0);

  /* Regroupement par mois. */
  const byMonth = new Map<string, { label: string; units: number; gross: number; net: number }>();

  for (const item of list) {
    if (typeof item.created_at !== "string") continue;
    const date = new Date(item.created_at);
    if (Number.isNaN(date.getTime())) continue;

    const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, "0")}`;
    const entry = byMonth.get(key) ?? {
      label: `${MONTHS[date.getMonth()]} ${date.getFullYear()}`,
      units: 0, gross: 0, net: 0,
    };

    entry.units += item.quantity ?? 0;
    entry.gross += item.subtotal ?? 0;
    entry.net += item.seller_amount ?? 0;
    byMonth.set(key, entry);
  }

  const months = [...byMonth.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 12);

  /* Meilleures ventes par produit. */
  const byProduct = new Map<string, { title: string; units: number; gross: number }>();

  for (const item of list) {
    const key = String(item.product_id || item.title);
    const entry = byProduct.get(key) ?? { title: item.title || "Article", units: 0, gross: 0 };
    entry.units += item.quantity ?? 0;
    entry.gross += item.subtotal ?? 0;
    byProduct.set(key, entry);
  }

  const best = [...byProduct.values()].sort((a, b) => b.gross - a.gross).slice(0, 10);

  return (
    <>
      <PageHeader
        title="Mes ventes"
        subtitle={store.name?.trim() || "Boutique"}
        actions={<Button href={`/dashboard/seller/stores/${store.id}`} size="sm">Retour à la boutique</Button>}
      />

      <div className="space-y-4">
        {error && <Notice tone="warning" title="Ventes indisponibles">{error.message}</Notice>}

        <StatRow>
          <Stat label="Chiffre d'affaires" value={formatHTG(gross)} hint={`${formatNumber(units)} articles vendus`} />
          <Stat label={`Commission (${limits.commission})`} value={formatHTG(commission)} />
          <Stat label="Net vendeur" value={formatHTG(net)} tone="success" />
          <Stat label="Panier moyen" value={formatHTG(list.length ? gross / list.length : 0)} />
        </StatRow>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Par mois" padded={false}>
            {months.length === 0 ? (
              <EmptyState title="Aucune vente" description="Les ventes apparaîtront ici après la première commande." />
            ) : (
              <Table columns={[
                { key: "m", label: "Période" },
                { key: "u", label: "Articles", align: "right" },
                { key: "g", label: "Brut", align: "right" },
                { key: "n", label: "Net", align: "right" },
              ]}>
                {months.map(([key, entry]) => (
                  <Row key={key}>
                    <Cell strong>{entry.label}</Cell>
                    <Cell align="right" numeric>{formatNumber(entry.units)}</Cell>
                    <Cell align="right" numeric>{formatHTG(entry.gross)}</Cell>
                    <Cell align="right" numeric strong>{formatHTG(entry.net)}</Cell>
                  </Row>
                ))}
              </Table>
            )}
          </Panel>

          <Panel title="Meilleures ventes" padded={false}>
            {best.length === 0 ? (
              <EmptyState title="Aucune vente" description="Le classement apparaîtra après vos premières ventes." />
            ) : (
              <Table columns={[
                { key: "p", label: "Produit" },
                { key: "u", label: "Vendus", align: "right" },
                { key: "g", label: "Brut", align: "right" },
              ]}>
                {best.map((product, index) => (
                  <Row key={`${product.title}-${index}`}>
                    <Cell strong>{product.title}</Cell>
                    <Cell align="right" numeric>{formatNumber(product.units)}</Cell>
                    <Cell align="right" numeric strong>{formatHTG(product.gross)}</Cell>
                  </Row>
                ))}
              </Table>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
