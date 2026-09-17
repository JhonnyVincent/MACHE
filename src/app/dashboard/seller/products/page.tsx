/*
  PAGE : Espace vendeur — Mes produits

  Sert à :
  - lister les produits de toutes les boutiques du vendeur ;
  - filtrer par état de publication ;
  - repérer les produits sans image, sans catégorie ou en rupture ;
  - ouvrir un produit pour le modifier.

  Cette route était liée depuis le dashboard mais n'existait pas : le lien
  menait à une 404.
*/

import Link from "next/link";
import { requireSeller, formatHTG, formatNumber, LOW_STOCK_THRESHOLD } from "@/lib/seller";
import { categoryLabel } from "@/lib/categories";
import {
  PageHeader, Panel, Table, Row, Cell, Badge, Button, EmptyState, Stat, StatRow, Notice,
} from "@/components/seller/ui";

export const dynamic = "force-dynamic";

const STATUS_FILTERS = [
  { key: "all", label: "Tous" },
  { key: "active", label: "En ligne" },
  { key: "draft", label: "Brouillons" },
  { key: "submitted", label: "En attente de validation" },
  { key: "paused", label: "En pause" },
  { key: "rejected", label: "Refusés" },
  { key: "archived", label: "Archivés" },
];

const STATUS_TONES: Record<string, "success" | "warning" | "danger" | "neutral" | "info"> = {
  active: "success",
  auto_approved: "success",
  draft: "neutral",
  submitted: "info",
  manual_review: "info",
  paused: "warning",
  rejected: "danger",
  archived: "neutral",
};

export default async function SellerProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; store?: string }>;
}) {
  const { status, store } = await searchParams;
  const activeStatus = STATUS_FILTERS.some((f) => f.key === status) ? status! : "all";

  const { supabase, uid, limits } = await requireSeller("/dashboard/seller/products");

  const { data: stores } = await supabase
    .from("stores")
    .select("id, name")
    .eq("owner_id", uid)
    .order("created_at", { ascending: true });

  const storeList = stores ?? [];
  const storeNames = new Map(storeList.map((s) => [s.id, s.name]));
  const ids = storeList.map((s) => s.id);

  const activeStore = store && ids.includes(store) ? store : null;
  const scopedIds = activeStore ? [activeStore] : ids;

  const result = scopedIds.length
    ? await supabase
        .from("products")
        .select("id, title, price, stock, status, category, image_url, store_id, created_at")
        .in("store_id", scopedIds)
        .order("created_at", { ascending: false })
        .limit(500)
    : { data: [], error: null };

  if (result.error) console.error("[seller/products]", result.error.message);

  const all = result.data ?? [];

  const products =
    activeStatus === "all" ? all : all.filter((p) => p.status === activeStatus);

  const online = all.filter((p) => p.status === "active").length;
  const withoutImage = all.filter((p) => !p.image_url).length;
  const withoutCategory = all.filter((p) => !p.category?.trim()).length;
  const outOfStock = all.filter((p) => (p.stock ?? 0) <= 0).length;

  return (
    <>
      <PageHeader
        title="Mes produits"
        subtitle="Tous les produits de vos boutiques, du plus récent au plus ancien."
        actions={
          storeList.length > 0 ? (
            <Button href={`/dashboard/seller/stores/${storeList[0].id}/products/new`} variant="primary">
              Ajouter un produit
            </Button>
          ) : (
            <Button href="/dashboard/seller/stores/new" variant="primary">
              Créer une boutique
            </Button>
          )
        }
      />

      <div className="space-y-4">
        {result.error && (
          <Notice tone="warning" title="Catalogue indisponible">{result.error.message}</Notice>
        )}

        <StatRow>
          <Stat label="Références" value={formatNumber(all.length)} hint={`limite : ${formatNumber(limits.maxArticlesPerStore)} par boutique`} />
          <Stat label="En ligne" value={formatNumber(online)} tone={online ? "success" : "default"} />
          <Stat label="Sans photo" value={formatNumber(withoutImage)} tone={withoutImage ? "warning" : "success"} hint="une photo double les ventes" />
          <Stat label="Sans catégorie" value={formatNumber(withoutCategory)} tone={withoutCategory ? "warning" : "success"} hint="introuvables au filtre" />
          <Stat label="En rupture" value={formatNumber(outOfStock)} tone={outOfStock ? "danger" : "success"} />
        </StatRow>

        {(withoutImage > 0 || withoutCategory > 0) && (
          <Notice tone="warning" title="Des produits sont mal référencés">
            {withoutCategory > 0 && (
              <p>
                {formatNumber(withoutCategory)} produit{withoutCategory > 1 ? "s" : ""} sans
                catégorie : ils n&apos;apparaissent dans aucun filtre du catalogue public.
              </p>
            )}
            {withoutImage > 0 && (
              <p>
                {formatNumber(withoutImage)} produit{withoutImage > 1 ? "s" : ""} sans photo :
                ils s&apos;affichent avec un visuel de remplacement.
              </p>
            )}
          </Notice>
        )}

        <Panel padded={false}>
          <div className="flex flex-wrap gap-1 border-b border-[#e3e6e6] px-3 py-2">
            {STATUS_FILTERS.map((filter) => {
              const count =
                filter.key === "all" ? all.length : all.filter((p) => p.status === filter.key).length;

              if (count === 0 && filter.key !== "all" && filter.key !== activeStatus) return null;

              const params = new URLSearchParams();
              if (filter.key !== "all") params.set("status", filter.key);
              if (activeStore) params.set("store", activeStore);
              const query = params.toString();

              return (
                <Link
                  key={filter.key}
                  href={query ? `?${query}` : "/dashboard/seller/products"}
                  className={`rounded-[3px] px-2.5 py-1 text-[12px] transition-colors ${
                    activeStatus === filter.key
                      ? "bg-[#0a0a0a] font-semibold text-white"
                      : "text-[#565959] hover:bg-[#f0f2f2]"
                  }`}
                >
                  {filter.label}
                  <span className="tnum ml-1.5 opacity-60">{count}</span>
                </Link>
              );
            })}
          </div>

          {storeList.length > 1 && (
            <div className="flex flex-wrap items-center gap-1 border-b border-[#e3e6e6] px-3 py-2">
              <span className="mr-1 text-[11px] font-medium uppercase tracking-[0.06em] text-[#565959]">
                Boutique
              </span>
              {[{ id: "", name: "Toutes" }, ...storeList].map((s) => {
                const params = new URLSearchParams();
                if (activeStatus !== "all") params.set("status", activeStatus);
                if (s.id) params.set("store", s.id);
                const query = params.toString();
                const isActive = (activeStore ?? "") === s.id;

                return (
                  <Link
                    key={s.id || "all"}
                    href={query ? `?${query}` : "/dashboard/seller/products"}
                    className={`rounded-[3px] px-2.5 py-1 text-[12px] transition-colors ${
                      isActive
                        ? "bg-[#f0f2f2] font-semibold text-[#0f1111]"
                        : "text-[#565959] hover:bg-[#f7f8f8]"
                    }`}
                  >
                    {s.name?.trim() || "Sans nom"}
                  </Link>
                );
              })}
            </div>
          )}

          {products.length === 0 ? (
            <EmptyState
              title={all.length === 0 ? "Aucun produit" : "Aucun produit dans cet état"}
              description={
                all.length === 0
                  ? "Ajoutez votre premier produit depuis une de vos boutiques pour le rendre visible au catalogue."
                  : "Changez de filtre pour voir les autres produits."
              }
              action={
                all.length === 0 && storeList.length > 0 ? (
                  <Button href={`/dashboard/seller/stores/${storeList[0].id}/products/new`} variant="primary">
                    Ajouter un produit
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <Table
              columns={[
                { key: "title", label: "Produit" },
                { key: "store", label: "Boutique" },
                { key: "category", label: "Catégorie" },
                { key: "status", label: "Publication" },
                { key: "price", label: "Prix", align: "right" },
                { key: "stock", label: "Stock", align: "right" },
                { key: "actions", label: "", align: "right", width: "90px" },
              ]}
            >
              {products.map((product) => {
                const stock = product.stock ?? 0;

                return (
                  <Row key={product.id}>
                    <Cell strong>
                      {product.title?.trim() || "Sans titre"}
                      {!product.image_url && (
                        <span className="mt-0.5 block text-[10.5px] font-normal text-[#b45309]">
                          sans photo
                        </span>
                      )}
                    </Cell>
                    <Cell muted>{storeNames.get(product.store_id) || "—"}</Cell>
                    <Cell muted>
                      {product.category?.trim() ? (
                        categoryLabel(product.category)
                      ) : (
                        <span className="text-[#b45309]">à renseigner</span>
                      )}
                    </Cell>
                    <Cell>
                      <Badge tone={STATUS_TONES[product.status] || "neutral"}>
                        {product.status || "—"}
                      </Badge>
                    </Cell>
                    <Cell align="right" numeric>{formatHTG(product.price)}</Cell>
                    <Cell align="right" numeric strong>
                      {stock <= 0 ? (
                        <span className="text-[#b01124]">0</span>
                      ) : stock <= LOW_STOCK_THRESHOLD ? (
                        <span className="text-[#b45309]">{formatNumber(stock)}</span>
                      ) : (
                        formatNumber(stock)
                      )}
                    </Cell>
                    <Cell align="right">
                      <Button
                        href={`/dashboard/seller/stores/${product.store_id}/products/${product.id}`}
                        size="sm"
                      >
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
