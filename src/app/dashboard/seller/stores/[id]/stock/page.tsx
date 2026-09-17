/*
  PAGE : Espace vendeur — stock d'une boutique

  Sert à :
  - repérer les ruptures et les stocks bas de cette boutique ;
  - connaître la valeur immobilisée ;
  - ouvrir un produit pour corriger sa quantité.
*/

import { requireStoreOwner, formatHTG, formatNumber, LOW_STOCK_THRESHOLD } from "@/lib/seller";
import { categoryLabel } from "@/lib/categories";
import {
  PageHeader, Panel, Table, Row, Cell, Badge, Button, EmptyState, Stat, StatRow, Notice,
} from "@/components/seller/ui";

export const dynamic = "force-dynamic";

export default async function StoreStockPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, store, limits } = await requireStoreOwner(id);

  const { data: products, error } = await supabase
    .from("products")
    .select("id, title, price, stock, status, category")
    .eq("store_id", store.id)
    .order("stock", { ascending: true })
    .limit(500);

  const list = products ?? [];
  const out = list.filter((p) => (p.stock ?? 0) <= 0);
  const low = list.filter((p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= LOW_STOCK_THRESHOLD);
  const value = list.reduce((sum, p) => sum + (p.price ?? 0) * (p.stock ?? 0), 0);
  const attention = [...out, ...low];

  return (
    <>
      <PageHeader
        title="Stock et inventaire"
        subtitle={store.name?.trim() || "Boutique"}
        actions={<Button href={`/dashboard/seller/stores/${store.id}/products`} size="sm">Tous les produits</Button>}
      />

      <div className="space-y-4">
        {error && <Notice tone="warning" title="Stock indisponible">{error.message}</Notice>}

        <StatRow>
          <Stat label="Références" value={formatNumber(list.length)} hint={`limite : ${formatNumber(limits.maxArticlesPerStore)}`} />
          <Stat label="En rupture" value={formatNumber(out.length)} tone={out.length ? "danger" : "success"} />
          <Stat label="Stock bas" value={formatNumber(low.length)} tone={low.length ? "warning" : "success"} hint={`≤ ${LOW_STOCK_THRESHOLD} unités`} />
          <Stat label="Unités" value={formatNumber(list.reduce((s, p) => s + (p.stock ?? 0), 0))} />
          <Stat label="Valeur immobilisée" value={formatHTG(value)} hint="prix × quantité" />
        </StatRow>

        <Panel title="À réapprovisionner" padded={false}>
          {attention.length === 0 ? (
            <EmptyState
              title="Aucun produit à réapprovisionner"
              description="Tous vos produits sont au-dessus du seuil d'alerte."
            />
          ) : (
            <Table
              columns={[
                { key: "title", label: "Produit" },
                { key: "cat", label: "Catégorie" },
                { key: "state", label: "État" },
                { key: "price", label: "Prix", align: "right" },
                { key: "stock", label: "Stock", align: "right" },
                { key: "act", label: "", align: "right", width: "90px" },
              ]}
            >
              {attention.map((product) => {
                const stock = product.stock ?? 0;
                return (
                  <Row key={product.id}>
                    <Cell strong>{product.title || "Sans titre"}</Cell>
                    <Cell muted>{product.category ? categoryLabel(product.category) : "—"}</Cell>
                    <Cell>
                      <Badge tone={stock <= 0 ? "danger" : "warning"}>
                        {stock <= 0 ? "Rupture" : "Stock bas"}
                      </Badge>
                    </Cell>
                    <Cell align="right" numeric>{formatHTG(product.price)}</Cell>
                    <Cell align="right" numeric strong>{formatNumber(stock)}</Cell>
                    <Cell align="right">
                      <Button href={`/dashboard/seller/stores/${store.id}/products/${product.id}`} size="sm">
                        Modifier
                      </Button>
                    </Cell>
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
