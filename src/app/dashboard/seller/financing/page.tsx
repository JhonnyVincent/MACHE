import { requireSeller, formatHTG, formatNumber } from "@/lib/seller";
import { PageHeader, Panel, Stat, StatRow, Button, Notice, Table, Row, Cell } from "@/components/seller/ui";

export const dynamic = "force-dynamic";

export default async function SellerFinancingPage() {
  const { supabase, uid } = await requireSeller("/dashboard/seller/financing");

  const { data: stores } = await supabase.from("stores").select("id, created_at").eq("owner_id", uid);

  const storeList = stores ?? [];
  const ids = storeList.map((store) => store.id);

  const orders = ids.length
    ? (
        await supabase
          .from("orders")
          .select("status, total_price, created_at")
          .in("store_id", ids)
          .limit(2000)
      ).data ?? []
    : [];

  const settled = orders.filter((order) => order.status === "completed");
  const revenue = settled.reduce((sum, order) => sum + (order.total_price ?? 0), 0);

  const monthsActive = storeList.length
    ? Math.max(
        1,
        Math.round(
          (Date.now() - new Date(storeList[0].created_at).getTime()) / (1000 * 60 * 60 * 24 * 30)
        )
      )
    : 0;

  const monthlyAverage = monthsActive ? revenue / monthsActive : 0;

  /*
    Critères d'éligibilité annoncés publiquement. Aucun montant n'est
    « pré-accordé » ici : seul le partenaire financier décide.
  */
  const criteria = [
    { label: "Boutique active", met: storeList.length > 0, detail: "Au moins une boutique ouverte" },
    { label: "Ancienneté", met: monthsActive >= 3, detail: "3 mois d'activité minimum" },
    { label: "Ventes réalisées", met: settled.length >= 10, detail: "10 commandes réglées minimum" },
    { label: "Chiffre d'affaires", met: monthlyAverage >= 10000, detail: "10 000 HTG de moyenne mensuelle" },
  ];

  const eligible = criteria.every((criterion) => criterion.met);

  return (
    <>
      <PageHeader
        title="Financement"
        subtitle="Avance de trésorerie et financement de stock, en partenariat avec des organismes locaux."
      />

      <div className="space-y-4">
        <StatRow>
          <Stat label="CA cumulé" value={formatHTG(revenue)} />
          <Stat label="Moyenne mensuelle" value={formatHTG(monthlyAverage)} />
          <Stat label="Commandes réglées" value={formatNumber(settled.length)} />
          <Stat label="Ancienneté" value={`${monthsActive} mois`} />
        </StatRow>

        <Panel title="Critères d'éligibilité" padded={false}>
          <Table
            columns={[
              { key: "criterion", label: "Critère" },
              { key: "detail", label: "Exigence" },
              { key: "status", label: "Votre situation", align: "right" },
            ]}
          >
            {criteria.map((criterion) => (
              <Row key={criterion.label}>
                <Cell strong>{criterion.label}</Cell>
                <Cell muted>{criterion.detail}</Cell>
                <Cell align="right">
                  <span className={criterion.met ? "font-semibold text-[#046c4e]" : "font-semibold text-[#b45309]"}>
                    {criterion.met ? "Rempli" : "Non rempli"}
                  </span>
                </Cell>
              </Row>
            ))}
          </Table>
        </Panel>

        <Notice tone={eligible ? "info" : "warning"} title={eligible ? "Vous remplissez les critères d'entrée" : "Critères non encore réunis"}>
          {eligible
            ? "Vous pouvez déposer une demande. La décision, le montant et le taux relèvent du partenaire financier, pas de MACHE : remplir ces critères ne garantit pas l'obtention d'un financement."
            : "Continuez à développer votre activité : ces critères sont réévalués à chaque visite de cette page."}
        </Notice>

        <div className="grid gap-4 md:grid-cols-3">
          <Panel title="Avance de trésorerie">
            <p className="text-[12px] leading-relaxed text-[#565959]">
              Une avance sur vos ventes à venir, remboursée par prélèvement sur vos
              encaissements.
            </p>
          </Panel>
          <Panel title="Financement de stock">
            <p className="text-[12px] leading-relaxed text-[#565959]">
              Le fournisseur est payé directement, vous remboursez à mesure des ventes.
            </p>
          </Panel>
          <Panel title="Budget publicitaire">
            <p className="text-[12px] leading-relaxed text-[#565959]">
              Une enveloppe dédiée à la mise en avant de vos produits sur MACHE.
            </p>
          </Panel>
        </div>

        <Panel title="Déposer une demande">
          <p className="text-[12.5px] leading-relaxed text-[#565959]">
            Le dépôt de dossier en ligne n&apos;est pas encore ouvert. En attendant, l&apos;équipe
            MACHE transmet votre demande au partenaire adapté.
          </p>
          <div className="mt-3">
            <Button href="/contact" variant="primary">Demander à être rappelé</Button>
          </div>
        </Panel>
      </div>
    </>
  );
}
