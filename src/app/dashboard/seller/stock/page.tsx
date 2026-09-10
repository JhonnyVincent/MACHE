import { requireSeller, formatHTG, formatNumber, LOW_STOCK_THRESHOLD } from "@/lib/seller";
import {
  PageHeader, Panel, Table, Row, Cell, Badge, Button, EmptyState, Stat, StatRow, Notice,
} from "@/components/seller/ui";

export const dynamic = "force-dynamic";

export default async function SellerStockPage() {
  const { supabase, uid } = await requireSeller("/dashboard/seller/stock");

  const { data: stores } = await supabase.from("stores").select("id, name").eq("owner_id", uid);

  const storeList = stores ?? [];
  const ids = storeList.map((store) => store.id);
  const storeNames = new Map(storeList.map((store) => [store.id, store.name]));

  const result = ids.length
    ? await supabase
        .from("products")
        .select("id, title, price, stock, status, store_id")
        .in("store_id", ids)
        .order("stock", { ascending: true })
        .limit(500)
    : { data: [], error: null };

  if (result.error) console.error("[seller/stock]", result.error.message);

  const products = result.data ?? [];
  const outOfStock = products.filter((product) => (product.stock ?? 0) <= 0);
  const low = products.filter(
    (product) => (product.stock ?? 0) > 0 && (product.stock ?? 0) <= LOW_STOCK_THRESHOLD
  );

  const stockValue = products.reduce(
    (sum, product) => sum + (product.price ?? 0) * (product.stock ?? 0),
    0
  );

  const attention = [...outOfStock, ...low];

  return (
    <>
      <PageHeader
        title="Stock"
        subtitle={`Produits triés par quantité croissante. Le seuil d'alerte est fixé à ${LOW_STOCK_THRESHOLD} unités.`}
      />

      <div className="space-y-4">
        {result.error && (
          <Notice tone="warning" title="Stock indisponible">{result.error.message}</Notice>
        )}

        <StatRow>
          <Stat label="Références" value={formatNumber(products.length)} />
          <Stat label="En rupture" value={formatNumber(outOfStock.length)} tone={outOfStock.length ? "danger" : "success"} />
          <Stat label="Stock bas" value={formatNumber(low.length)} tone={low.length ? "warning" : "success"} />
          <Stat label="Unités en stock" value={formatNumber(products.reduce((s, p) => s + (p.stock ?? 0), 0))} />
          <Stat label="Valeur du stock" value={formatHTG(stockValue)} hint="prix x quantité" />
        </StatRow>

        <Panel
          title="Produits à réapprovisionner"
          description={`${attention.length} référence${attention.length > 1 ? "s" : ""} concernée${attention.length > 1 ? "s" : ""}`}
          padded={false}
        >
          {attention.length === 0 ? (
            <EmptyState
              title="Aucun produit à réapprovisionner"
              description="Tous vos produits sont au-dessus du seuil d'alerte."
            />
          ) : (
            <Table
              columns={[
                { key: "title", label: "Produit" },
                { key: "store", label: "Boutique" },
                { key: "status", label: "État" },
                { key: "price", label: "Prix", align: "right" },
                { key: "stock", label: "Stock", align: "right" },
                { key: "actions", label: "", align: "right", width: "90px" },
              ]}
            >
              {attention.map((product) => {
                const stock = product.stock ?? 0;

                return (
                  <Row key={product.id}>
                    <Cell strong>{product.title || "Sans titre"}</Cell>
                    <Cell muted>{storeNames.get(product.store_id) || "—"}</Cell>
                    <Cell>
                      <Badge tone={stock <= 0 ? "danger" : "warning"}>
                        {stock <= 0 ? "Rupture" : "Stock bas"}
                      </Badge>
                    </Cell>
                    <Cell align="right" numeric>{formatHTG(product.price)}</Cell>
                    <Cell align="right" numeric strong>{formatNumber(stock)}</Cell>
                    <Cell align="right">
                      <Button href={`/dashboard/seller/stores/${product.store_id}/products/${product.id}`} size="sm">
                        Modifier
                      </Button>
                    </Cell>
                  </Row>
                );
              })}
            </Table>
          )}
        </Panel>

        <Panel title="Catalogue complet" padded={false}>
          {products.length === 0 ? (
            <EmptyState
              title="Aucun produit"
              description="Ajoutez des produits depuis une de vos boutiques."
              action={<Button href="/dashboard/seller/stores" variant="primary">Aller aux boutiques</Button>}
            />
          ) : (
            <Table
              columns={[
                { key: "title", label: "Produit" },
                { key: "store", label: "Boutique" },
                { key: "status", label: "Publication" },
                { key: "price", label: "Prix", align: "right" },
                { key: "stock", label: "Stock", align: "right" },
              ]}
            >
              {products.slice(0, 100).map((product) => (
                <Row key={product.id}>
                  <Cell strong>{product.title || "Sans titre"}</Cell>
                  <Cell muted>{storeNames.get(product.store_id) || "—"}</Cell>
                  <Cell>
                    <Badge tone={product.status === "active" ? "success" : "neutral"}>
                      {product.status || "—"}
                    </Badge>
                  </Cell>
                  <Cell align="right" numeric>{formatHTG(product.price)}</Cell>
                  <Cell align="right" numeric>{formatNumber(product.stock)}</Cell>
                </Row>
              ))}
            </Table>
          )}
        </Panel>
      </div>
    </>
  );
}
