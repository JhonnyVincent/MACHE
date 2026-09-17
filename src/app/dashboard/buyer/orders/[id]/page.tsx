/*
  PAGE : Espace client — détail d'une commande

  Sert à :
  - afficher les articles commandés, regroupés par boutique ;
  - afficher l'état de la commande, du paiement et des expéditions ;
  - rappeler l'adresse de livraison.

  Le regroupement par boutique est essentiel sur une marketplace : une
  commande peut concerner plusieurs vendeurs, chacun préparant sa part
  indépendamment. Le client doit voir qui expédie quoi.

  Sécurité : la commande n'est lue que si elle appartient au compte connecté.
  Le filtre sur buyer_id est appliqué dans la requête, sans se fier au RLS
  seul.
*/

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  requireBuyer, ORDER_STATUS_LABELS, ORDER_STATUS_TONES, PAYMENT_STATUS_LABELS,
} from "@/lib/buyer";
import { formatHTG, formatNumber, formatDate } from "@/lib/seller";
import {
  PageHeader, Panel, Table, Row, Cell, Badge, Button, Notice,
} from "@/components/seller/ui";

export const dynamic = "force-dynamic";

const SHIPMENT_LABELS: Record<string, string> = {
  pending: "À préparer",
  assigned: "Assignée à un livreur",
  picked_up: "Récupérée",
  in_transit: "En transit",
  delivered: "Livrée",
  failed: "Échec de livraison",
  cancelled: "Annulée",
};

export default async function BuyerOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { supabase, uid } = await requireBuyer(`/dashboard/buyer/orders/${id}`);

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, reference, status, payment_status, currency, subtotal, shipping_total, total_price, contact_phone, contact_email, notes, created_at, placed_at, shipping_address_id"
    )
    .eq("id", id)
    .eq("buyer_id", uid)
    .maybeSingle();

  if (error) {
    console.error("[buyer/order]", error.message);

    return (
      <>
        <PageHeader title="Commande" subtitle="Détail de la commande." />
        <Notice tone="warning" title="Commande indisponible">{error.message}</Notice>
      </>
    );
  }

  if (!order) notFound();

  const [itemsResult, shipmentsResult, addressResult] = await Promise.all([
    supabase
      .from("order_items")
      .select("id, title, image_url, unit_price, quantity, subtotal, status, store_id, product_id")
      .eq("order_id", order.id),
    supabase
      .from("shipments")
      .select("id, status, carrier, tracking_number, zone, store_id, delivered_at")
      .eq("order_id", order.id),
    order.shipping_address_id
      ? supabase
          .from("addresses")
          .select("full_name, phone, line1, line2, city, department, instructions")
          .eq("id", order.shipping_address_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const items = itemsResult.data ?? [];
  const shipments = shipmentsResult.data ?? [];
  const address = addressResult.data ?? null;

  /* Noms des boutiques concernées, pour le regroupement. */
  const storeIds = [...new Set(items.map((i) => i.store_id).filter(Boolean))] as string[];

  const storeNames = new Map<string, string>();

  if (storeIds.length > 0) {
    const { data: stores } = await supabase
      .from("stores")
      .select("id, name, slug")
      .in("id", storeIds);

    for (const store of stores ?? []) {
      storeNames.set(String(store.id), String(store.name || "Boutique"));
    }
  }

  const groups = storeIds.map((storeId) => ({
    storeId,
    name: storeNames.get(storeId) || "Boutique",
    items: items.filter((i) => i.store_id === storeId),
    shipment: shipments.find((s) => s.store_id === storeId),
  }));

  const orphans = items.filter((i) => !i.store_id);

  if (orphans.length > 0) {
    groups.push({ storeId: "", name: "Boutique non identifiée", items: orphans, shipment: undefined });
  }

  return (
    <>
      <PageHeader
        title={order.reference || `Commande #${String(order.id).slice(0, 8)}`}
        subtitle={`Passée le ${formatDate(order.placed_at || order.created_at)}`}
        actions={<Button href="/dashboard/buyer/orders" size="sm">Retour aux commandes</Button>}
      />

      <div className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            {itemsResult.error && (
              <Notice tone="warning" title="Articles indisponibles">
                {itemsResult.error.message}
              </Notice>
            )}

            {groups.length === 0 ? (
              <Panel>
                <p className="text-[12.5px] text-[#565959]">
                  Aucune ligne n&apos;est rattachée à cette commande.
                </p>
              </Panel>
            ) : (
              groups.map((group) => (
                <Panel
                  key={group.storeId || "orphans"}
                  title={group.name}
                  description={
                    groups.length > 1
                      ? "Cette boutique prépare et expédie sa part indépendamment."
                      : undefined
                  }
                  actions={
                    group.shipment ? (
                      <Badge
                        tone={
                          group.shipment.status === "delivered"
                            ? "success"
                            : group.shipment.status === "failed"
                              ? "danger"
                              : "info"
                        }
                      >
                        {SHIPMENT_LABELS[String(group.shipment.status)] || group.shipment.status}
                      </Badge>
                    ) : undefined
                  }
                  padded={false}
                >
                  <Table
                    columns={[
                      { key: "title", label: "Article" },
                      { key: "unit", label: "Prix unitaire", align: "right" },
                      { key: "qty", label: "Qté", align: "right" },
                      { key: "sub", label: "Total", align: "right" },
                    ]}
                  >
                    {group.items.map((item) => (
                      <Row key={item.id}>
                        <Cell strong>
                          {item.product_id ? (
                            <Link
                              href={`/product/${item.product_id}`}
                              className="hover:underline"
                            >
                              {item.title}
                            </Link>
                          ) : (
                            item.title
                          )}
                        </Cell>
                        <Cell align="right" numeric>{formatHTG(item.unit_price)}</Cell>
                        <Cell align="right" numeric>{formatNumber(item.quantity)}</Cell>
                        <Cell align="right" numeric strong>{formatHTG(item.subtotal)}</Cell>
                      </Row>
                    ))}
                  </Table>

                  {group.shipment?.tracking_number && (
                    <div className="border-t border-[#e3e6e6] px-4 py-2.5 text-[12px] text-[#565959]">
                      Suivi : <span className="font-medium">{group.shipment.carrier || "transporteur"}</span>{" "}
                      — {group.shipment.tracking_number}
                    </div>
                  )}
                </Panel>
              ))
            )}
          </div>

          <div className="space-y-4">
            <Panel title="État">
              <dl className="space-y-2.5 text-[12.5px]">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[#565959]">Commande</dt>
                  <dd>
                    <Badge tone={ORDER_STATUS_TONES[String(order.status)] || "neutral"}>
                      {ORDER_STATUS_LABELS[String(order.status)] || order.status}
                    </Badge>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[#565959]">Paiement</dt>
                  <dd className="font-medium">
                    {PAYMENT_STATUS_LABELS[String(order.payment_status)] || order.payment_status || "—"}
                  </dd>
                </div>
              </dl>
            </Panel>

            <Panel title="Montants">
              <dl className="space-y-2 text-[12.5px]">
                <div className="flex justify-between">
                  <dt className="text-[#565959]">Sous-total</dt>
                  <dd className="tnum">{formatHTG(order.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#565959]">Livraison</dt>
                  <dd className="tnum">
                    {Number(order.shipping_total) > 0 ? formatHTG(order.shipping_total) : "à confirmer"}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-[#e3e6e6] pt-2 text-[15px] font-semibold">
                  <dt>Total</dt>
                  <dd className="tnum">{formatHTG(order.total_price)}</dd>
                </div>
              </dl>
            </Panel>

            <Panel title="Livraison">
              {address ? (
                <address className="text-[12.5px] not-italic leading-relaxed">
                  <strong>{address.full_name}</strong>
                  <br />
                  {address.phone}
                  <br />
                  {address.line1}
                  {address.line2 ? <>, {address.line2}</> : null}
                  <br />
                  {address.city}
                  {address.department ? ` — ${address.department}` : ""}
                  {address.instructions && (
                    <span className="mt-2 block text-[11.5px] text-[#565959]">
                      {address.instructions}
                    </span>
                  )}
                </address>
              ) : (
                <p className="text-[12.5px] leading-relaxed text-[#565959]">
                  L&apos;adresse n&apos;a pas été enregistrée avec la commande.
                  Contact : {order.contact_phone || order.contact_email || "non renseigné"}.
                </p>
              )}
            </Panel>
          </div>
        </div>
      </div>
    </>
  );
}
