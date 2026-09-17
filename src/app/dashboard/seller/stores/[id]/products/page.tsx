/*
  PAGE : Espace vendeur — catalogue d'une boutique

  Sert à :
  - lister les produits de la boutique, filtrables par état ;
  - repérer d'un coup d'œil ce qui est en ligne, en rupture ou en attente
    d'examen ;
  - ouvrir la fiche de chacun.
*/

import Link from "next/link";
import { requireStoreOwner, formatHTG, formatNumber, formatDate, LOW_STOCK_THRESHOLD } from "@/lib/seller";
import { categoryLabel } from "@/lib/categories";
import { PRODUCT_STATUS_LABELS, PRODUCT_STATUS_TONES } from "@/lib/products";
import {
  PageHeader, Panel, Table, Row, Cell, Badge, Button, EmptyState, Stat, StatRow,
  Notice, FormFeedback,
} from "@/components/seller/ui";

export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "all", label: "Tous", statuses: [] as string[] },
  { key: "online", label: "En ligne", statuses: ["active", "auto_approved"] },
  { key: "review", label: "En examen", statuses: ["manual_review", "submitted"] },
  { key: "off", label: "Hors ligne", statuses: ["draft", "paused", "archived"] },
  { key: "rejected", label: "Refusés", statuses: ["rejected"] },
];

export default async function StoreProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ filter?: string; success?: string; error?: string }>;
}) {
  const { id } = await params;
  const query = searchParams ? await searchParams : {};
  const active = FILTERS.some((f) => f.key === query.filter) ? query.filter! : "all";

  const { supabase, store, limits } = await requireStoreOwner(id);

  const { data: products, error } = await supabase
    .from("products")
    .select("id, title, slug, price, stock, status, image_urls, image_url, category, created_at")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false })
    .limit(500);

  const all = products ?? [];
  const selected = FILTERS.find((f) => f.key === active)!;

  const list =
    selected.statuses.length === 0
      ? all
      : all.filter((product) => selected.statuses.includes(String(product.status)));

  const online = all.filter((p) => ["active", "auto_approved"].includes(String(p.status))).length;
  const inReview = all.filter((p) => ["manual_review", "submitted"].includes(String(p.status))).length;
  const outOfStock = all.filter((p) => (p.stock ?? 0) <= 0).length;
  const lowStock = all.filter((p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= LOW_STOCK_THRESHOLD).length;

  const atLimit = all.length >= limits.maxArticlesPerStore;

  return (
    <>
      <PageHeader
        title="Produits"
        subtitle={store.name?.trim() || "Boutique"}
        actions={
          <>
            <Button href={`/dashboard/seller/stores/${store.id}/stock`}>Stock</Button>
            <Button
              href={atLimit ? `/dashboard/seller/stores/${store.id}/subscription` : `/dashboard/seller/stores/${store.id}/products/new`}
              variant="primary"
            >
              {atLimit ? "Limite atteinte" : "Ajouter un produit"}
            </Button>
          </>
        }
      />

      <div className="space-y-4">
        <FormFeedback
          success={query.success}
          error={query.error}
          successMessages={{
            deleted: "Le produit a été supprimé.",
            archived: "Le produit a été archivé : il avait déjà été commandé, son historique est conservé.",
          }}
        />

        {error && (
          <Notice tone="warning" title="Catalogue indisponible">
            {error.message}
          </Notice>
        )}

        {atLimit && (
          <Notice tone="warning" title="Limite de votre plan atteinte">
            Votre plan {limits.planName} autorise{" "}
            {formatNumber(limits.maxArticlesPerStore)} produits par boutique.
            Retirez un produit ou changez de plan pour en ajouter un autre.
          </Notice>
        )}

        <StatRow>
          <Stat
            label="Produits"
            value={`${formatNumber(all.length)} / ${formatNumber(limits.maxArticlesPerStore)}`}
          />
          <Stat label="En ligne" value={formatNumber(online)} tone={online ? "success" : "warning"} />
          <Stat label="En examen" value={formatNumber(inReview)} tone={inReview ? "warning" : "default"} />
          <Stat label="En rupture" value={formatNumber(outOfStock)} tone={outOfStock ? "danger" : "default"} />
          <Stat label="Stock faible" value={formatNumber(lowStock)} tone={lowStock ? "warning" : "default"} />
        </StatRow>

        <Panel padded={false}>
          <div className="flex flex-wrap gap-1 border-b border-[#e3e6e6] px-3 py-2">
            {FILTERS.map((filter) => {
              const count =
                filter.statuses.length === 0
                  ? all.length
                  : all.filter((p) => filter.statuses.includes(String(p.status))).length;

              return (
                <Link
                  key={filter.key}
                  href={
                    filter.key === "all"
                      ? `/dashboard/seller/stores/${store.id}/products`
                      : `?filter=${filter.key}`
                  }
                  className={`rounded-[3px] px-2.5 py-1 text-[12px] transition-colors ${
                    active === filter.key
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

          {list.length === 0 ? (
            <EmptyState
              title={all.length === 0 ? "Aucun produit" : "Aucun produit dans cet état"}
              description={
                all.length === 0
                  ? "Une boutique sans produit n'apparaît dans aucune recherche."
                  : "Changez de filtre pour voir les autres produits."
              }
              action={
                all.length === 0 ? (
                  <Button href={`/dashboard/seller/stores/${store.id}/products/new`} variant="primary">
                    Ajouter un produit
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <Table
              columns={[
                { key: "p", label: "Produit" },
                { key: "c", label: "Catégorie" },
                { key: "s", label: "Stock", align: "right" },
                { key: "e", label: "État" },
                { key: "x", label: "Prix", align: "right" },
                { key: "a", label: "", align: "right", width: "95px" },
              ]}
            >
              {list.map((product) => {
                const image =
                  (Array.isArray(product.image_urls) && product.image_urls[0]) ||
                  product.image_url ||
                  null;

                const stock = product.stock ?? 0;

                return (
                  <Row key={product.id}>
                    <Cell strong>
                      <span className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[3px] border border-[#e3e6e6] bg-[#f7f8f8] text-[10px] text-[#9a9a9a]">
                          {image ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            "—"
                          )}
                        </span>
                        <span className="min-w-0">
                          <Link
                            href={`/dashboard/seller/stores/${store.id}/products/${product.id}`}
                            className="block truncate hover:underline"
                          >
                            {product.title}
                          </Link>
                          <span className="block text-[10.5px] font-normal text-[#767676]">
                            Ajouté le {formatDate(product.created_at)}
                          </span>
                        </span>
                      </span>
                    </Cell>
                    <Cell muted>{product.category ? categoryLabel(product.category) : "—"}</Cell>
                    <Cell
                      align="right"
                      numeric
                      muted={stock > LOW_STOCK_THRESHOLD}
                    >
                      {stock <= 0 ? (
                        <span className="font-semibold text-[#b01124]">Rupture</span>
                      ) : (
                        formatNumber(stock)
                      )}
                    </Cell>
                    <Cell>
                      <Badge tone={PRODUCT_STATUS_TONES[String(product.status)] || "neutral"}>
                        {PRODUCT_STATUS_LABELS[String(product.status)] || product.status}
                      </Badge>
                    </Cell>
                    <Cell align="right" numeric>{formatHTG(product.price ?? 0)}</Cell>
                    <Cell align="right">
                      <Button
                        href={`/dashboard/seller/stores/${store.id}/products/${product.id}`}
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
