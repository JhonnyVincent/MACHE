import {
  requireSeller,
  formatHTG,
  formatNumber,
  formatDate,
  LOW_STOCK_THRESHOLD,
} from "@/lib/seller";
import {
  PageHeader, Panel, Table, Row, Cell, Badge, Button, EmptyState, Notice,
} from "@/components/seller/ui";

export const dynamic = "force-dynamic";

export default async function SellerStoresPage() {
  const { supabase, uid, limits } = await requireSeller("/dashboard/seller/stores");

  const { data: stores, error } = await supabase
    .from("stores")
    .select("id, slug, name, is_verified, category, legal_doc_url, created_at")
    .eq("owner_id", uid)
    .order("created_at", { ascending: true });

  if (error) console.error("[seller/stores]", error.message);

  const list = stores ?? [];
  const ids = list.map((store) => store.id);

  const orders = ids.length
    ? (
        await supabase
          .from("orders")
          .select("status, total_price, store_id")
          .in("store_id", ids)
          .limit(2000)
      ).data ?? []
    : [];

  const counts = await Promise.all(
    list.map(async (store) => {
      const [products, lowStock] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }).eq("store_id", store.id),
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("store_id", store.id)
          .lte("stock", LOW_STOCK_THRESHOLD),
      ]);

      const storeOrders = orders.filter((order) => order.store_id === store.id);

      return {
        store,
        products: products.count ?? 0,
        lowStock: lowStock.count ?? 0,
        orders: storeOrders.length,
        revenue: storeOrders
          .filter((order) => order.status === "completed")
          .reduce((sum, order) => sum + (order.total_price ?? 0), 0),
      };
    })
  );

  const remaining = limits.maxStores - list.length;

  return (
    <>
      <PageHeader
        title="Mes boutiques"
        subtitle={`${list.length} boutique${list.length > 1 ? "s" : ""} sur ${limits.maxStores} autorisées par l'offre ${limits.planName}.`}
        actions={
          remaining > 0 ? (
            <Button href="/dashboard/seller/stores/new" variant="primary">Créer une boutique</Button>
          ) : null
        }
      />

      <div className="space-y-4">
        {remaining <= 0 && (
          <Notice tone="info" title="Limite de boutiques atteinte">
            Votre offre {limits.planName} autorise {limits.maxStores} boutique
            {limits.maxStores > 1 ? "s" : ""}. Pour en ouvrir davantage, changez d&apos;offre
            depuis les paramètres du compte.
          </Notice>
        )}

        <Panel padded={false}>
          {list.length === 0 ? (
            <EmptyState
              title="Aucune boutique"
              description="Une boutique regroupe vos produits, vos commandes et vos documents. C'est le point de départ de votre activité."
              action={<Button href="/dashboard/seller/stores/new" variant="primary">Créer ma première boutique</Button>}
            />
          ) : (
            <Table
              columns={[
                { key: "name", label: "Boutique" },
                { key: "category", label: "Catégorie" },
                { key: "status", label: "Statut" },
                { key: "docs", label: "Documents" },
                { key: "products", label: "Produits", align: "right" },
                { key: "orders", label: "Commandes", align: "right" },
                { key: "revenue", label: "Encaissé", align: "right" },
                { key: "actions", label: "", align: "right", width: "150px" },
              ]}
            >
              {counts.map(({ store, products, lowStock, orders: storeOrders, revenue }) => (
                <Row key={store.id}>
                  <Cell strong>
                    {store.name?.trim() || "Boutique sans nom"}
                    <span className="mt-0.5 block text-[11px] font-normal text-[#565959]">
                      /store/{store.slug} · {formatDate(store.created_at)}
                    </span>
                  </Cell>
                  <Cell muted>{store.category || "—"}</Cell>
                  <Cell>
                    <Badge tone={store.is_verified ? "success" : "warning"}>
                      {store.is_verified ? "Vérifiée" : "En attente"}
                    </Badge>
                  </Cell>
                  <Cell>
                    <Badge tone={store.legal_doc_url ? "success" : "danger"}>
                      {store.legal_doc_url ? "Complets" : "Manquants"}
                    </Badge>
                  </Cell>
                  <Cell align="right" numeric>
                    {formatNumber(products)}
                    {lowStock > 0 && (
                      <span className="block text-[10.5px] text-[#b45309]">{lowStock} en stock bas</span>
                    )}
                  </Cell>
                  <Cell align="right" numeric>{formatNumber(storeOrders)}</Cell>
                  <Cell align="right" numeric strong>{formatHTG(revenue)}</Cell>
                  <Cell align="right">
                    <span className="flex justify-end gap-1.5">
                      <Button href={`/dashboard/seller/stores/${store.id}`} size="sm">Ouvrir</Button>
                      <Button href={`/dashboard/seller/stores/${store.id}/settings`} size="sm">Réglages</Button>
                    </span>
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
