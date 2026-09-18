/*
  PAGE : Espace agent — courses du jour

  Sert à :
  - lister les expéditions assignées à cet agent et encore ouvertes ;
  - les faire avancer étape par étape.

  Les courses sont des fiches plutôt qu'un tableau : un agent consulte
  cette page sur un téléphone, une main occupée par un colis.
*/

import { requireAgent, SHIPMENT_STATUS_LABELS, SHIPMENT_STATUS_TONES, AGENT_NEXT_STATUS, AGENT_ACTION_LABELS, AGENT_STATUS_LABELS } from "@/lib/agents";
import { formatHTG, formatNumber, formatDate } from "@/lib/seller";
import {
  PageHeader, Panel, Stat, StatRow, Badge, Button, EmptyState, Notice, FormFeedback,
} from "@/components/seller/ui";
import { advanceShipmentAction } from "./actions";

export const dynamic = "force-dynamic";

const OPEN_STATUSES = ["assigned", "picked_up", "in_transit"];

export default async function AgentHomePage({
  searchParams,
}: {
  searchParams?: Promise<{ success?: string; error?: string }>;
}) {
  const query = searchParams ? await searchParams : {};
  const { supabase, uid, agent, firstName } = await requireAgent();

  const { data: shipments, error } = await supabase
    .from("shipments")
    .select("id, order_id, store_id, status, zone, fee, carrier, tracking_number, assigned_at, picked_up_at, created_at")
    .eq("agent_id", uid)
    .in("status", OPEN_STATUSES)
    .order("assigned_at", { ascending: true })
    .limit(100);

  const list = shipments ?? [];

  /*
    Adresse et téléphone du destinataire : lus depuis la commande, et
    seulement pour les courses réellement assignées à cet agent. Un agent
    n'a pas d'accès général aux commandes.
  */
  const orderIds = [...new Set(list.map((item) => String(item.order_id)))];

  const ordersResult = orderIds.length
    ? await supabase
        .from("orders")
        .select("id, reference, contact_phone, shipping_address_id, total_price, payment_status")
        .in("id", orderIds)
    : { data: [], error: null };

  const orders = ordersResult.data ?? [];
  const orderById = new Map(orders.map((order) => [String(order.id), order]));

  /*
    L'adresse est dans une table à part. La politique ajoutée par la
    migration 0006 n'ouvre que celles des courses en cours de cet agent :
    une course close ne donne plus accès à l'adresse du client.
  */
  const addressIds = [
    ...new Set(
      orders
        .map((order) => order.shipping_address_id)
        .filter((value): value is string => Boolean(value))
    ),
  ];

  const addressesResult = addressIds.length
    ? await supabase
        .from("addresses")
        .select("id, full_name, phone, line1, line2, city, department, instructions")
        .in("id", addressIds)
    : { data: [], error: null };

  const addressById = new Map(
    (addressesResult.data ?? []).map((address) => [String(address.id), address])
  );

  function addressLines(orderId: string) {
    const order = orderById.get(orderId);
    const address = order?.shipping_address_id
      ? addressById.get(String(order.shipping_address_id))
      : undefined;

    if (!address) return null;

    return {
      name: address.full_name,
      phone: address.phone,
      street: [address.line1, address.line2].filter(Boolean).join(", "),
      city: [address.city, address.department].filter(Boolean).join(", "),
      instructions: address.instructions,
    };
  }

  const count = (status: string) => list.filter((item) => item.status === status).length;

  const { count: deliveredTotal } = await supabase
    .from("shipments")
    .select("id", { count: "exact", head: true })
    .eq("agent_id", uid)
    .eq("status", "delivered");

  return (
    <>
      <PageHeader
        title={`Bonjour ${firstName}`}
        subtitle={
          agent
            ? `${AGENT_STATUS_LABELS[agent.status as "active"]} · code ${agent.code}${agent.zone ? ` · ${agent.zone}` : ""}`
            : "Compte agent sans carte enregistrée."
        }
        actions={<Button href="/dashboard/agent/deliveries">Historique</Button>}
      />

      <div className="space-y-4">
        <FormFeedback
          success={query.success}
          error={query.error}
          successMessages={{ "Course mise à jour.": "Course mise à jour." }}
        />

        {error && (
          <Notice tone="warning" title="Courses indisponibles">
            {error.message}. La migration 0001 doit être appliquée.
          </Notice>
        )}

        {!agent && (
          <Notice tone="warning" title="Carte d'agent non enregistrée">
            Votre compte a le rôle agent, mais aucune carte n&apos;a encore été
            créée à votre nom. Les clients ne pourront pas vérifier votre
            identité sur la page publique tant que l&apos;équipe MACHÉ ne
            l&apos;aura pas enregistrée.
          </Notice>
        )}

        {agent && agent.status !== "active" && (
          <Notice tone="danger" title="Habilitation non active">
            Votre carte est au statut «&nbsp;{AGENT_STATUS_LABELS[agent.status as "pending"]}&nbsp;».
            Un client qui vérifie votre code verra qu&apos;il ne doit rien vous
            remettre. Contactez l&apos;équipe MACHÉ.
          </Notice>
        )}

        <StatRow>
          <Stat label="Courses ouvertes" value={formatNumber(list.length)} tone={list.length ? "warning" : "success"} />
          <Stat label="À récupérer" value={formatNumber(count("assigned"))} />
          <Stat label="En main" value={formatNumber(count("picked_up"))} />
          <Stat label="En route" value={formatNumber(count("in_transit"))} />
          <Stat label="Livrées au total" value={formatNumber(deliveredTotal || 0)} tone="success" />
        </StatRow>

        {list.length === 0 ? (
          <Panel padded={false}>
            <EmptyState
              title="Aucune course en cours"
              description="Les expéditions qui vous seront assignées apparaîtront ici."
            />
          </Panel>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {list.map((shipment) => {
              const order = orderById.get(String(shipment.order_id));
              const address = addressLines(String(shipment.order_id));
              const steps = AGENT_NEXT_STATUS[String(shipment.status)] ?? [];

              return (
                <Panel
                  key={shipment.id}
                  title={order?.reference || `Course #${String(shipment.id).slice(0, 8)}`}
                  actions={
                    <Badge tone={SHIPMENT_STATUS_TONES[String(shipment.status)] || "neutral"}>
                      {SHIPMENT_STATUS_LABELS[String(shipment.status)] || shipment.status}
                    </Badge>
                  }
                >
                  <dl className="space-y-1.5 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-[#565959]">Destinataire</dt>
                      <dd className="max-w-[60%] text-right font-medium">
                        {address?.name || "Non renseigné"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-[#565959]">Adresse</dt>
                      <dd className="max-w-[60%] text-right font-medium">
                        {address ? (
                          <>
                            <span className="block">{address.street}</span>
                            <span className="block text-[#565959]">{address.city}</span>
                          </>
                        ) : (
                          "Non renseignée"
                        )}
                      </dd>
                    </div>
                    {address?.instructions && (
                      <div className="flex justify-between gap-3">
                        <dt className="text-[#565959]">Consignes</dt>
                        <dd className="max-w-[60%] text-right font-medium">
                          {address.instructions}
                        </dd>
                      </div>
                    )}
                    <div className="flex justify-between gap-3">
                      <dt className="text-[#565959]">Téléphone</dt>
                      <dd className="font-medium">
                        {address?.phone || order?.contact_phone ? (
                          <a
                            href={`tel:${address?.phone || order?.contact_phone}`}
                            className="text-[#d2162c] hover:underline"
                          >
                            {address?.phone || order?.contact_phone}
                          </a>
                        ) : (
                          "—"
                        )}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-[#565959]">Zone</dt>
                      <dd className="font-medium">{shipment.zone || "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-[#565959]">Assignée le</dt>
                      <dd className="font-medium">{formatDate(shipment.assigned_at || shipment.created_at)}</dd>
                    </div>
                    {order?.payment_status === "cash_on_delivery" && (
                      <div className="flex justify-between gap-3 border-t border-[#e3e6e6] pt-1.5">
                        <dt className="font-semibold text-[#b45309]">À encaisser</dt>
                        <dd className="tnum font-semibold text-[#b45309]">
                          {formatHTG(Number(order.total_price) || 0)}
                        </dd>
                      </div>
                    )}
                  </dl>

                  {steps.length > 0 && (
                    <div className="mt-4 space-y-2 border-t border-[#e3e6e6] pt-3">
                      {steps
                        .filter((step) => step !== "failed")
                        .map((step) => (
                          <form key={step} action={advanceShipmentAction}>
                            <input type="hidden" name="shipment_id" value={shipment.id} />
                            <input type="hidden" name="next_status" value={step} />
                            <Button type="submit" variant="primary">
                              {AGENT_ACTION_LABELS[step]}
                            </Button>
                          </form>
                        ))}

                      {steps.includes("failed") && (
                        <details className="mt-1">
                          <summary className="cursor-pointer text-xs text-[#565959] hover:text-[#0f1111]">
                            Livraison impossible
                          </summary>
                          <form action={advanceShipmentAction} className="mt-2 space-y-2">
                            <input type="hidden" name="shipment_id" value={shipment.id} />
                            <input type="hidden" name="next_status" value="failed" />
                            <input
                              name="reason"
                              required
                              placeholder="Raison : absent, adresse introuvable, refus…"
                              className="w-full rounded-[3px] border border-[#8d9096] px-2.5 py-1.5 text-sm outline-none focus:border-[#d2162c]"
                            />
                            <Button type="submit">Signaler l&apos;échec</Button>
                          </form>
                        </details>
                      )}
                    </div>
                  )}
                </Panel>
              );
            })}
          </div>
        )}

        <Notice tone="info" title="Ce que MACHÉ ne suit pas encore">
          Aucun itinéraire, aucune position en temps réel et aucune preuve de
          livraison photographiée : ces fonctions demandent une application
          mobile et un suivi de localisation qui ne sont pas en place. Les
          étapes ci-dessus sont déclarées par vous, et horodatées.
        </Notice>
      </div>
    </>
  );
}
