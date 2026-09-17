/*
  PAGE : Espace vendeur — tableau de bord d'une boutique

  Sert à :
  - donner en un écran l'état réel d'une boutique : catalogue, commandes,
    argent, stock, avis ;
  - tracer le chiffre d'affaires mois par mois à partir des ventes réelles ;
  - ouvrir chacune des sections de la boutique.

  Aucun chiffre n'est décoratif. Une variation n'est affichée que si les
  deux périodes comparées existent réellement ; un indicateur qu'on ne sait
  pas mesurer n'est pas affiché du tout. C'est la différence entre un
  tableau de bord et une maquette.
*/

import Link from "next/link";
import {
  requireStoreOwner, formatHTG, formatNumber, formatDate, LOW_STOCK_THRESHOLD,
} from "@/lib/seller";
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONES } from "@/lib/buyer";
import {
  PageHeader, Panel, Stat, StatRow, Table, Row, Cell, Badge, Button, EmptyState, Notice,
} from "@/components/seller/ui";

export const dynamic = "force-dynamic";

const MONTH_SHORT = new Intl.DateTimeFormat("fr-FR", { month: "short" });

/*
  Index des sections d'une boutique. Défini ici parce que c'est le
  tableau de bord qui sert de point d'entrée : sans lui, plusieurs écrans
  existants n'étaient atteignables par aucun lien.
*/
function sectionsOf(storeId: string) {
  const base = `/dashboard/seller/stores/${storeId}`;

  return [
    {
      group: "Vendre",
      items: [
        { label: "Produits", href: `${base}/products`, hint: "Ajouter et modifier le catalogue" },
        { label: "Commandes", href: `${base}/orders`, hint: "Traiter ce qui a été acheté" },
        { label: "Stock", href: `${base}/stock`, hint: "Ruptures et réassort" },
        { label: "Livraisons", href: `${base}/deliveries`, hint: "Suivre les expéditions" },
        { label: "Fournisseurs", href: `${base}/suppliers`, hint: "Marques et fournisseurs sur MACHÉ" },
      ],
    },
    {
      group: "Argent",
      items: [
        { label: "Ventes", href: `${base}/sales`, hint: "Chiffre d'affaires et meilleurs produits" },
        { label: "Paiements", href: `${base}/payments`, hint: "Encaissé, en attente, versements" },
        { label: "Relevés", href: `${base}/invoices`, hint: "Comptabilité mois par mois" },
        { label: "Abonnement", href: `${base}/subscription`, hint: "Plan, limites et commission" },
      ],
    },
    {
      group: "Boutique",
      items: [
        { label: "Ma boutique", href: `${base}/store`, hint: "Nom, catégorie, description" },
        { label: "Apparence", href: `${base}/customization`, hint: "Logo et bannière" },
        { label: "Avis", href: `${base}/reviews`, hint: "Lire et répondre aux clients" },
        { label: "Visibilité", href: `${base}/ads`, hint: "Ce qui fait remonter vos produits" },
        { label: "Statistiques", href: `${base}/stats`, hint: "Évolution sur 30 jours" },
        { label: "Documents", href: `${base}/documents`, hint: "Vérification de la boutique" },
        { label: "Paramètres", href: `${base}/settings`, hint: "Adresse publique et ouverture" },
      ],
    },
  ];
}

export default async function StoreDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, store, limits, roleLabel } = await requireStoreOwner(id);

  /* ---------------------------------------------------------------- */
  /* Catalogue                                                        */
  /* ---------------------------------------------------------------- */
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, title, price, stock, status, image_urls, created_at")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false })
    .limit(500);

  const productList = products ?? [];
  const activeProducts = productList.filter((p) => String(p.status) === "active").length;
  const outOfStock = productList.filter((p) => (p.stock ?? 0) <= 0).length;
  const lowStock = productList.filter(
    (p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= LOW_STOCK_THRESHOLD
  ).length;

  /* ---------------------------------------------------------------- */
  /* Ventes : les lignes de commande font foi, pas la commande entière */
  /* ---------------------------------------------------------------- */
  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("id, order_id, quantity, subtotal, commission_amount, seller_amount")
    .eq("store_id", store.id)
    .limit(2000);

  const itemList = items ?? [];
  const orderIds = [...new Set(itemList.map((item) => String(item.order_id)))];

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

  const gross = itemList.reduce((sum, item) => sum + (item.subtotal ?? 0), 0);
  const net = itemList.reduce((sum, item) => sum + (item.seller_amount ?? 0), 0);
  const unitsSold = itemList.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
  const pendingOrders = orders.filter((order) => String(order.status) === "pending").length;

  const settledNet = itemList.reduce((sum, item) => {
    const order = orderById.get(String(item.order_id));
    const done = order && ["completed", "delivered"].includes(String(order.status));
    return done ? sum + (item.seller_amount ?? 0) : sum;
  }, 0);

  /*
    Chiffre d'affaires sur douze mois glissants. Les mois sans vente sont
    présents et valent zéro : sans eux, le graphique tasserait le temps et
    laisserait croire à une activité continue.
  */
  const now = new Date();
  const months: { key: string; label: string; total: number }[] = [];

  for (let offset = 11; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    months.push({
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: MONTH_SHORT.format(date).replace(".", ""),
      total: 0,
    });
  }

  const monthIndex = new Map(months.map((month, index) => [month.key, index]));

  for (const item of itemList) {
    const order = orderById.get(String(item.order_id));

    if (!order?.created_at) continue;

    const date = new Date(order.created_at);

    if (Number.isNaN(date.getTime())) continue;

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const index = monthIndex.get(key);

    if (index !== undefined) months[index].total += item.subtotal ?? 0;
  }

  const peak = Math.max(...months.map((month) => month.total), 0);
  const currentMonth = months[months.length - 1].total;
  const previousMonth = months.length > 1 ? months[months.length - 2].total : 0;

  /* Une variation ne se calcule que si le mois précédent a existé. */
  const variation =
    previousMonth > 0
      ? Math.round(((currentMonth - previousMonth) / previousMonth) * 100)
      : null;

  const sections = sectionsOf(store.id);
  const error = productsError || itemsError || ordersResult.error;

  const todo = [
    !store.legal_doc_url && {
      label: "Document légal manquant",
      href: `/dashboard/seller/stores/${store.id}/documents`,
      action: "Fournir",
    },
    productList.length === 0 && {
      label: "Aucun produit dans cette boutique",
      href: `/dashboard/seller/stores/${store.id}/products/new`,
      action: "Ajouter",
    },
    outOfStock > 0 && {
      label: `${formatNumber(outOfStock)} produit(s) en rupture`,
      href: `/dashboard/seller/stores/${store.id}/stock`,
      action: "Réapprovisionner",
    },
    pendingOrders > 0 && {
      label: `${formatNumber(pendingOrders)} commande(s) à traiter`,
      href: `/dashboard/seller/stores/${store.id}/orders?filter=todo`,
      action: "Traiter",
    },
    store.is_active === false && {
      label: "Boutique fermée au public",
      href: `/dashboard/seller/stores/${store.id}/settings`,
      action: "Rouvrir",
    },
  ].filter(Boolean) as { label: string; href: string; action: string }[];

  return (
    <>
      <PageHeader
        title={store.name?.trim() || "Boutique"}
        subtitle={`${roleLabel} · plan ${limits.planName} · commission ${limits.commission}`}
        actions={
          <>
            <Button href={`/store/${store.slug || store.id}`}>Voir la vitrine</Button>
            <Button href={`/dashboard/seller/stores/${store.id}/products/new`} variant="primary">
              Ajouter un produit
            </Button>
          </>
        }
      />

      <div className="space-y-4">
        {error && (
          <Notice tone="warning" title="Certaines données sont indisponibles">
            {error.message}. Les migrations 0001 à 0005 doivent être appliquées.
          </Notice>
        )}

        <StatRow>
          <Stat
            label="Produits en ligne"
            value={`${formatNumber(activeProducts)} / ${formatNumber(productList.length)}`}
            tone={activeProducts === 0 && productList.length > 0 ? "warning" : "default"}
          />
          <Stat
            label="Commandes à traiter"
            value={formatNumber(pendingOrders)}
            tone={pendingOrders ? "warning" : "success"}
          />
          <Stat label="Chiffre d'affaires" value={formatHTG(gross)} hint={`${formatNumber(unitsSold)} article(s) vendus`} />
          <Stat label="Net acquis" value={formatHTG(settledNet)} tone="success" hint="commandes livrées, commission déduite" />
          <Stat
            label="Note de la boutique"
            value={store.rating_count ? `${Number(store.rating_average).toFixed(1)} / 5` : "—"}
            hint={store.rating_count ? `${formatNumber(store.rating_count)} avis` : "Aucun avis encore"}
          />
        </StatRow>

        {todo.length > 0 && (
          <Panel title="À faire" description="Points qui bloquent ou freinent les ventes de cette boutique." padded={false}>
            <Table
              columns={[
                { key: "l", label: "Point" },
                { key: "a", label: "", align: "right", width: "150px" },
              ]}
            >
              {todo.map((task) => (
                <Row key={task.label}>
                  <Cell strong>{task.label}</Cell>
                  <Cell align="right">
                    <Button href={task.href} size="sm">{task.action}</Button>
                  </Cell>
                </Row>
              ))}
            </Table>
          </Panel>
        )}

        <Panel
          title="Chiffre d'affaires sur douze mois"
          description={
            variation === null
              ? "Montants réellement facturés, mois par mois."
              : `Ce mois-ci : ${formatHTG(currentMonth)} (${variation >= 0 ? "+" : ""}${variation} % par rapport au mois précédent).`
          }
        >
          {peak === 0 ? (
            <p className="py-6 text-center text-[12.5px] text-[#565959]">
              Aucune vente enregistrée sur les douze derniers mois.
            </p>
          ) : (
            <div className="flex h-44 items-end gap-1.5">
              {months.map((month) => (
                <div key={month.key} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className="tnum text-[9.5px] text-[#767676]">
                    {month.total > 0 ? formatNumber(Math.round(month.total / 1000)) + "k" : ""}
                  </span>
                  <div
                    className="w-full rounded-t-[2px] bg-[#0f1111]"
                    style={{ height: `${Math.max(2, (month.total / peak) * 100)}%` }}
                    title={`${month.label} : ${formatHTG(month.total)}`}
                  />
                  <span className="text-[10px] text-[#565959]">{month.label}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <div className="grid gap-4 xl:grid-cols-2">
          <Panel
            title="Dernières commandes"
            actions={<Button href={`/dashboard/seller/stores/${store.id}/orders`} size="sm">Tout voir</Button>}
            padded={false}
          >
            {orders.length === 0 ? (
              <EmptyState
                title="Aucune commande"
                description="Les commandes contenant vos produits apparaîtront ici."
              />
            ) : (
              <Table
                columns={[
                  { key: "r", label: "Référence" },
                  { key: "d", label: "Date" },
                  { key: "s", label: "État" },
                  { key: "n", label: "Net vendeur", align: "right" },
                ]}
              >
                {orders.slice(0, 6).map((order) => {
                  const lines = itemList.filter((item) => String(item.order_id) === String(order.id));
                  const lineNet = lines.reduce((sum, line) => sum + (line.seller_amount ?? 0), 0);

                  return (
                    <Row key={order.id}>
                      <Cell strong>{order.reference || `#${String(order.id).slice(0, 8)}`}</Cell>
                      <Cell muted>{formatDate(order.created_at)}</Cell>
                      <Cell>
                        <Badge tone={ORDER_STATUS_TONES[String(order.status)] || "neutral"}>
                          {ORDER_STATUS_LABELS[String(order.status)] || order.status}
                        </Badge>
                      </Cell>
                      <Cell align="right" numeric strong>{formatHTG(lineNet)}</Cell>
                    </Row>
                  );
                })}
              </Table>
            )}
          </Panel>

          <Panel
            title="Produits récents"
            actions={<Button href={`/dashboard/seller/stores/${store.id}/products`} size="sm">Tout voir</Button>}
            padded={false}
          >
            {productList.length === 0 ? (
              <EmptyState
                title="Aucun produit"
                description="Une boutique sans produit n'apparaît pas dans la recherche."
                action={
                  <Button href={`/dashboard/seller/stores/${store.id}/products/new`} variant="primary">
                    Ajouter un produit
                  </Button>
                }
              />
            ) : (
              <Table
                columns={[
                  { key: "t", label: "Produit" },
                  { key: "s", label: "Stock", align: "right" },
                  { key: "e", label: "État" },
                  { key: "p", label: "Prix", align: "right" },
                ]}
              >
                {productList.slice(0, 6).map((product) => (
                  <Row key={product.id}>
                    <Cell strong>
                      <Link
                        href={`/dashboard/seller/stores/${store.id}/products/${product.id}`}
                        className="hover:underline"
                      >
                        {product.title}
                      </Link>
                    </Cell>
                    <Cell
                      align="right"
                      numeric
                      muted={(product.stock ?? 0) > LOW_STOCK_THRESHOLD}
                    >
                      {formatNumber(product.stock ?? 0)}
                    </Cell>
                    <Cell>
                      <Badge tone={String(product.status) === "active" ? "success" : "neutral"}>
                        {String(product.status) === "active" ? "En ligne" : "Hors ligne"}
                      </Badge>
                    </Cell>
                    <Cell align="right" numeric>{formatHTG(product.price ?? 0)}</Cell>
                  </Row>
                ))}
              </Table>
            )}
          </Panel>
        </div>

        {lowStock > 0 && (
          <Notice tone="warning" title={`${formatNumber(lowStock)} produit(s) en stock faible`}>
            En dessous de {LOW_STOCK_THRESHOLD} unités, une vente peut vous
            mettre en rupture sans prévenir.{" "}
            <Link
              href={`/dashboard/seller/stores/${store.id}/stock`}
              className="font-medium text-[#d2162c] hover:underline"
            >
              Voir le stock
            </Link>
          </Notice>
        )}

        <Panel title="Toutes les sections de cette boutique">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {sections.map((section) => (
              <div key={section.group}>
                <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[#565959]">
                  {section.group}
                </p>
                <ul className="space-y-1.5">
                  {section.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="block rounded-[3px] border border-transparent px-2 py-1.5 transition-colors hover:border-[#e3e6e6] hover:bg-[#f7fafa]"
                      >
                        <span className="block text-[12.5px] font-medium text-[#0f1111]">
                          {item.label}
                        </span>
                        <span className="block text-[11px] leading-snug text-[#565959]">
                          {item.hint}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Panel>

        <Notice tone="info" title="Ce qui n'est pas mesuré ici">
          Les visites, le taux de conversion et les sources de trafic
          demandent un suivi d&apos;audience qui n&apos;est pas installé sur
          MACHÉ. Ils ne sont donc pas affichés : un chiffre inventé vaut moins
          qu&apos;une case vide. Le solde à recevoir dépendra, lui, du
          prestataire de paiement une fois raccordé.
        </Notice>
      </div>
    </>
  );
}
