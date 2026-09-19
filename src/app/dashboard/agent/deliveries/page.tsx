/*
  PAGE : Espace agent — historique des courses

  Sert à :
  - retrouver toutes les courses passées par cet agent, filtrables ;
  - constater ce qui a été livré et ce qui a échoué, avec la raison.

  Aucune note ni classement d'agent n'est affiché : MACHÉ n'évalue pas
  encore ses agents, et inventer un score sur la base du nombre de
  livraisons serait une notation déguisée.
*/

import Link from "next/link";
import {
  requireAgent, SHIPMENT_STATUS_LABELS, SHIPMENT_STATUS_TONES,
} from "@/lib/agents";
import { formatNumber, formatDate } from "@/lib/seller";
import {
  PageHeader, Panel, Table, Row, Cell, Badge, Button, EmptyState, Stat, StatRow, Notice,
} from "@/components/seller/ui";
import { supabaseConfigured } from "@/lib/supabase/env";
import { StaffUnavailable } from "@/components/staff-unavailable";

export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "all", label: "Toutes", statuses: [] as string[] },
  { key: "open", label: "En cours", statuses: ["assigned", "picked_up", "in_transit"] },
  { key: "done", label: "Livrées", statuses: ["delivered"] },
  { key: "failed", label: "Échecs", statuses: ["failed", "cancelled"] },
];

export default async function AgentDeliveriesPage({
  searchParams,
}: {
  searchParams?: Promise<{ filter?: string }>;
}) {
  /*
    La garde du layout ne suffit pas : Next rend la page et la mise en
    page en parallèle, donc `require*` s'exécute et lève même quand le
    layout a déjà décidé de ne pas afficher la page. L'écran était
    correct, mais les journaux se remplissaient de traces d'erreur pour
    une situation connue — et du rouge attendu finit par cacher du rouge
    inattendu.
  */
  if (!supabaseConfigured()) return <StaffUnavailable area="Tournée" />;

  const query = searchParams ? await searchParams : {};
  const active = FILTERS.some((f) => f.key === query.filter) ? query.filter! : "all";

  const { supabase, uid } = await requireAgent("/dashboard/agent/deliveries");

  const { data: shipments, error } = await supabase
    .from("shipments")
    .select("id, order_id, status, zone, failure_reason, assigned_at, picked_up_at, delivered_at, created_at")
    .eq("agent_id", uid)
    .order("created_at", { ascending: false })
    .limit(300);

  const all = shipments ?? [];
  const selected = FILTERS.find((f) => f.key === active)!;

  const list =
    selected.statuses.length === 0
      ? all
      : all.filter((item) => selected.statuses.includes(String(item.status)));

  const orderIds = [...new Set(all.map((item) => String(item.order_id)))];

  const ordersResult = orderIds.length
    ? await supabase.from("orders").select("id, reference").in("id", orderIds)
    : { data: [], error: null };

  const referenceById = new Map(
    (ordersResult.data ?? []).map((order) => [String(order.id), order.reference])
  );

  const delivered = all.filter((item) => String(item.status) === "delivered").length;
  const failed = all.filter((item) => String(item.status) === "failed").length;

  return (
    <>
      <PageHeader
        title="Historique"
        subtitle="Toutes les courses qui vous ont été assignées."
        actions={<Button href="/dashboard/agent">Courses du jour</Button>}
      />

      <div className="space-y-4">
        {error && (
          <Notice tone="warning" title="Historique indisponible">
            {error.message}. La migration 0001 doit être appliquée.
          </Notice>
        )}

        <StatRow>
          <Stat label="Courses au total" value={formatNumber(all.length)} />
          <Stat label="Livrées" value={formatNumber(delivered)} tone="success" />
          <Stat label="Échecs" value={formatNumber(failed)} tone={failed ? "warning" : "default"} />
        </StatRow>

        <Panel padded={false}>
          <div className="flex flex-wrap gap-1 border-b border-[#e3e6e6] px-3 py-2">
            {FILTERS.map((filter) => {
              const count =
                filter.statuses.length === 0
                  ? all.length
                  : all.filter((item) => filter.statuses.includes(String(item.status))).length;

              return (
                <Link
                  key={filter.key}
                  href={
                    filter.key === "all"
                      ? "/dashboard/agent/deliveries"
                      : `?filter=${filter.key}`
                  }
                  className={`rounded-[3px] px-2.5 py-1 text-sm transition-colors ${
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
              title={all.length === 0 ? "Aucune course" : "Aucune course dans cet état"}
              description={
                all.length === 0
                  ? "Les expéditions qui vous seront assignées apparaîtront ici."
                  : "Changez de filtre pour voir les autres courses."
              }
            />
          ) : (
            <Table
              columns={[
                { key: "r", label: "Commande" },
                { key: "z", label: "Zone" },
                { key: "s", label: "État" },
                { key: "d", label: "Assignée le" },
                { key: "l", label: "Livrée le" },
              ]}
            >
              {list.map((shipment) => (
                <Row key={shipment.id}>
                  <Cell strong>
                    {referenceById.get(String(shipment.order_id)) ||
                      `#${String(shipment.order_id).slice(0, 8)}`}
                  </Cell>
                  <Cell muted>{shipment.zone || "—"}</Cell>
                  <Cell>
                    <Badge tone={SHIPMENT_STATUS_TONES[String(shipment.status)] || "neutral"}>
                      {SHIPMENT_STATUS_LABELS[String(shipment.status)] || shipment.status}
                    </Badge>
                    {shipment.failure_reason && (
                      <span className="mt-0.5 block text-xs text-[#b01124]">
                        {shipment.failure_reason}
                      </span>
                    )}
                  </Cell>
                  <Cell muted>{formatDate(shipment.assigned_at || shipment.created_at)}</Cell>
                  <Cell muted>{formatDate(shipment.delivered_at)}</Cell>
                </Row>
              ))}
            </Table>
          )}
        </Panel>
      </div>
    </>
  );
}
