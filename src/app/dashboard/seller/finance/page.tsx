import { requireSeller, formatHTG, formatNumber } from "@/lib/seller";
import {
  PageHeader, Panel, Table, Row, Cell, Button, EmptyState, Stat, StatRow, Notice,
} from "@/components/seller/ui";

export const dynamic = "force-dynamic";

const MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

export default async function SellerFinancePage() {
  const { supabase, uid, limits } = await requireSeller("/dashboard/seller/finance");

  const { data: stores } = await supabase.from("stores").select("id, name").eq("owner_id", uid);

  const storeList = stores ?? [];
  const ids = storeList.map((store) => store.id);
  const storeNames = new Map(storeList.map((store) => [store.id, store.name]));

  const result = ids.length
    ? await supabase
        .from("orders")
        .select("id, status, total_price, created_at, store_id")
        .in("store_id", ids)
        .order("created_at", { ascending: false })
        .limit(2000)
    : { data: [], error: null };

  if (result.error) console.error("[seller/finance]", result.error.message);

  const orders = result.data ?? [];
  const settled = orders.filter((order) => order.status === "completed");

  const gross = settled.reduce((sum, order) => sum + (order.total_price ?? 0), 0);
  const rate = Number(limits.commission.replace(/[^\d.]/g, "")) / 100;
  const commission = gross * rate;
  const net = gross - commission;

  const pending = orders
    .filter((order) => order.status === "pending" || order.status === "processing")
    .reduce((sum, order) => sum + (order.total_price ?? 0), 0);

  /* Regroupement par mois, à partir des commandes réglées. */
  const byMonth = new Map<string, { label: string; count: number; gross: number }>();

  for (const order of settled) {
    if (typeof order.created_at !== "string") continue;

    const date = new Date(order.created_at);
    if (Number.isNaN(date.getTime())) continue;

    const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, "0")}`;
    const label = `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
    const entry = byMonth.get(key) ?? { label, count: 0, gross: 0 };

    entry.count += 1;
    entry.gross += order.total_price ?? 0;
    byMonth.set(key, entry);
  }

  const months = [...byMonth.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 12);

  const byStore = storeList.map((store) => {
    const storeSettled = settled.filter((order) => order.store_id === store.id);

    return {
      id: store.id,
      name: store.name,
      count: storeSettled.length,
      gross: storeSettled.reduce((sum, order) => sum + (order.total_price ?? 0), 0),
    };
  }).sort((a, b) => b.gross - a.gross);

  return (
    <>
      <PageHeader
        title="Paiements"
        subtitle={`Revenus issus des commandes réglées. Commission MACHE : ${limits.commission} de l'offre ${limits.planName}.`}
      />

      <div className="space-y-4">
        {result.error && (
          <Notice tone="warning" title="Données financières indisponibles">{result.error.message}</Notice>
        )}

        <StatRow>
          <Stat label="Chiffre d'affaires brut" value={formatHTG(gross)} hint={`${formatNumber(settled.length)} commandes réglées`} />
          <Stat label={`Commission (${limits.commission})`} value={formatHTG(commission)} />
          <Stat label="Net vendeur" value={formatHTG(net)} tone="success" hint="avant frais bancaires" />
          <Stat label="En attente d'encaissement" value={formatHTG(pending)} tone={pending ? "warning" : "default"} />
          <Stat label="Panier moyen" value={formatHTG(settled.length ? gross / settled.length : 0)} />
        </StatRow>

        <Notice tone="info" title="Calcul indicatif">
          La commission est calculée à partir du taux de votre offre. Les frais du prestataire
          de paiement et les éventuels remboursements ne sont pas déduits ici : le décompte
          définitif figure sur vos relevés.
        </Notice>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Par mois" padded={false}>
            {months.length === 0 ? (
              <EmptyState title="Aucun encaissement" description="Les revenus apparaîtront ici après votre première vente réglée." />
            ) : (
              <Table
                columns={[
                  { key: "month", label: "Période" },
                  { key: "count", label: "Commandes", align: "right" },
                  { key: "gross", label: "Brut", align: "right" },
                  { key: "net", label: "Net", align: "right" },
                ]}
              >
                {months.map(([key, entry]) => (
                  <Row key={key}>
                    <Cell strong>{entry.label}</Cell>
                    <Cell align="right" numeric>{formatNumber(entry.count)}</Cell>
                    <Cell align="right" numeric>{formatHTG(entry.gross)}</Cell>
                    <Cell align="right" numeric strong>{formatHTG(entry.gross * (1 - rate))}</Cell>
                  </Row>
                ))}
              </Table>
            )}
          </Panel>

          <Panel title="Par boutique" padded={false}>
            {byStore.length === 0 ? (
              <EmptyState title="Aucune boutique" description="Créez une boutique pour suivre vos revenus." action={<Button href="/dashboard/seller/stores/new" variant="primary">Créer une boutique</Button>} />
            ) : (
              <Table
                columns={[
                  { key: "store", label: "Boutique" },
                  { key: "count", label: "Commandes", align: "right" },
                  { key: "gross", label: "Brut", align: "right" },
                  { key: "net", label: "Net", align: "right" },
                ]}
              >
                {byStore.map((store) => (
                  <Row key={store.id}>
                    <Cell strong>{store.name?.trim() || "Sans nom"}</Cell>
                    <Cell align="right" numeric>{formatNumber(store.count)}</Cell>
                    <Cell align="right" numeric>{formatHTG(store.gross)}</Cell>
                    <Cell align="right" numeric strong>{formatHTG(store.gross * (1 - rate))}</Cell>
                  </Row>
                ))}
              </Table>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
