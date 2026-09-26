/*
  PAGE : détail d'une commande

  Le contrôle d'accès est celui de Medusa : `/store/orders/:id` n'est servi
  qu'au client propriétaire de la commande, sur présentation de son jeton.
  Il n'y a donc pas de vérification à refaire ici — et surtout pas à
  déduire du fait que l'identifiant figure dans l'URL.
*/

import { Link } from "next-view-transitions";
import { notFound } from "next/navigation";
import { getCustomer, getCustomerOrder } from "@/lib/medusa/customer";
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
import { submitReviewAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function BuyerOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string; success?: string }>;
}) {
  const { id } = await params;
  const query = searchParams ? await searchParams : {};

  const customer = await getCustomer();

  if (!customer) {
    return (
      <>
        <PageHeader title="Commande" />
        <Panel padded={false}>
          <EmptyState
            title="Connectez-vous"
            description="Cette commande est rattachée à un compte client."
            action={
              <Button href={`/compte/connexion?next=/dashboard/buyer/orders/${id}`} variant="primary">
                Se connecter
              </Button>
            }
          />
        </Panel>
      </>
    );
  }

  const result = await getCustomerOrder(id);

  if (!result.ok) reportOutage("commande", result.reason);

  if (!result.ok) {
    return (
      <>
        <PageHeader title="Commande" />
        <Notice tone="warning" title="Commande indisponible">
          Cette commande ne peut pas être affichée pour le moment. Elle
          n'est pas perdue : réessayez dans quelques minutes.
        </Notice>
      </>
    );
  }

  const order = result.data;

  if (!order) notFound();

  return (
    <>
      <PageHeader
        title={`Commande #${order.displayId ?? String(order.id).slice(0, 8)}`}
        subtitle={`Passée le ${formatDate(order.createdAt)}`}
        actions={<Button href="/dashboard/buyer/orders">Toutes mes commandes</Button>}
      />

      <div className="space-y-4">
        <Panel title="État" padded={false}>
          <Table columns={[{ key: "k", label: "Élément" }, { key: "v", label: "Valeur" }]}>
            <Row>
              <Cell strong>Livraison</Cell>
              <Cell>
                <Badge tone={fulfillmentTone(order.fulfillmentStatus)}>
                  {FULFILLMENT_STATUS_LABELS[order.fulfillmentStatus] ?? order.fulfillmentStatus}
                </Badge>
              </Cell>
            </Row>
            <Row>
              <Cell strong>Paiement</Cell>
              <Cell>
                <Badge tone={paymentTone(order.paymentStatus)}>
                  {PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}
                </Badge>
              </Cell>
            </Row>
            <Row>
              <Cell strong>Total</Cell>
              <Cell numeric strong>{formatAmount(order.total, order.currency)}</Cell>
            </Row>
          </Table>
        </Panel>

        <Panel title="Articles" padded={false}>
          <Table
            columns={[
              { key: "p", label: "Produit" },
              { key: "q", label: "Quantité", align: "right" },
            ]}
          >
            {order.items.map((item) => (
              <Row key={item.id}>
                <Cell strong>
                  <span className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[3px] border border-[#e3e6e6] bg-[#f7f8f8]">
                      {item.thumbnail ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={item.thumbnail} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </span>
                    {item.title}
                  </span>
                </Cell>
                <Cell align="right" numeric muted>{item.quantity}</Cell>
              </Row>
            ))}
          </Table>
        </Panel>

        {/*
          Noter ce qu'on a reçu.

          Le formulaire n'apparaît qu'une fois la commande livrée : noter
          un colis qu'on n'a pas encore ouvert n'a pas de sens, et
          l'inviter à le faire produirait des avis sans rapport avec le
          produit.
        */}
        {order.fulfillmentStatus === "delivered" && (
          <Panel title="Donner mon avis">
            {query.error && (
              <Notice tone="warning" title="Avis non enregistré">
                {decodeURIComponent(query.error)}
              </Notice>
            )}

            {query.success && (
              <Notice tone="info" title="Avis reçu">
                {decodeURIComponent(query.success)}
              </Notice>
            )}

            <p className="text-base leading-relaxed text-[#565959]">
              Votre avis est relu par MACHÉ avant d&apos;être publié.
              Seuls les avis de clients qui ont réellement commandé
              l&apos;article peuvent être déposés.
            </p>

            <div className="mt-4 space-y-4">
              {order.items
                .filter((item) => item.productId)
                .map((item) => (
                  <form
                    key={item.id}
                    action={submitReviewAction}
                    className="rounded-[8px] border border-[#e3e6e6] p-4"
                  >
                    <input type="hidden" name="order_id" value={order.id} />
                    <input type="hidden" name="product_id" value={item.productId ?? ""} />

                    <p className="text-base font-bold text-[#0f1111]">
                      {item.title}
                    </p>

                    <div className="mt-2.5 flex flex-wrap items-center gap-3">
                      <label className="text-sm text-[#565959]">
                        Note
                        <select
                          name="rating"
                          defaultValue="5"
                          className="ml-2 rounded-[4px] border border-[#888c8c] px-2 py-1 text-base"
                        >
                          {[5, 4, 3, 2, 1].map((n) => (
                            <option key={n} value={n}>
                              {n} sur 5
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <textarea
                      name="note"
                      rows={2}
                      maxLength={300}
                      placeholder="Ce que vous avez pensé de l'article (facultatif, 300 caractères)"
                      className="mt-2.5 w-full rounded-[4px] border border-[#888c8c] px-3 py-2 text-base"
                    />

                    <button
                      type="submit"
                      className="mt-2.5 rounded-[4px] bg-[#0f1111] px-4 py-2 text-base font-bold text-white hover:bg-black"
                    >
                      Envoyer mon avis
                    </button>
                  </form>
                ))}
            </div>
          </Panel>
        )}

        {order.paymentStatus !== "captured" && (
          <Notice tone="info" title="Paiement à la livraison">
            Rien n&apos;a été prélevé. Vous réglerez en main propre à la
            réception, après avoir vérifié le colis.{" "}
            <Link href="/legal/returns" className="font-medium text-[#d2162c] hover:underline">
              En cas de problème
            </Link>
          </Notice>
        )}
      </div>
    </>
  );
}
