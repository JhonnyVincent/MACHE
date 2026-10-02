/*
  PAGE : ce que MACHE gagne.

  Le mot qui gouverne la page : DÛ. MACHE ne perçoit pas les paiements ;
  ces montants sont des créances, pas de la trésorerie. Les devises ne
  sont jamais additionnées (1 400 HTG et 12 € ne font pas 1 412).
*/
import { useState } from "react";
import { Btn, Empty, Flex, Grid, Loading, Muted, Notice, Page, Panel, useLoad } from "../../lib/kit";

export const config = { label: "Ce que MACHE gagne", rank: 2, nested: "/mache" };

const PERIODS = [{ days: 7, label: "7 jours" }, { days: 30, label: "30 jours" }, { days: 90, label: "90 jours" }, { days: 365, label: "1 an" }];

type Bucket = { currency_code?: string; volume?: number; commission?: number; promotions_funded?: number; commission_before_promotions?: number; orders?: number; effective_rate?: number | null };
type Data = { currencies?: Bucket[]; previous?: Bucket[]; unattributed_commission?: number; subscriptions?: { note?: string }; truncated?: boolean };

const nf = (v: number) => Math.round(v).toLocaleString("fr-FR");
const money = (v: number, c: string) => `${nf(v)} ${c}`;

function Card({ b, before }: { b: Bucket; before?: Bucket }) {
  const code = b.currency_code ?? "—";
  const commission = Number(b.commission) || 0;
  const prev = before ? Number(before.commission) || 0 : 0;
  const delta = before && prev > 0 ? Math.round(((commission - prev) / prev) * 100) : null;
  const funded = Number(b.promotions_funded) || 0;

  return (
    <Panel>
      <Flex between><strong style={{ letterSpacing: 1 }}>{code}</strong><Muted>{nf(b.orders ?? 0)} commande{(b.orders ?? 0) > 1 ? "s" : ""}</Muted></Flex>
      <p style={{ fontSize: 28, fontWeight: 800, margin: "10px 0 0" }}>{money(commission, code)}</p>
      <Muted>dû à MACHE sur cette période</Muted>
      {delta !== null && <p style={{ margin: "6px 0 0", fontWeight: 600, color: delta >= 0 ? "var(--tag-green-text)" : "var(--fg-error)" }}>{delta >= 0 ? "+" : ""}{delta} % par rapport à la période précédente</p>}
      <div style={{ marginTop: 12, borderTop: "1px solid var(--border-base)", paddingTop: 10, display: "grid", gap: 6, fontSize: 14 }}>
        <Flex between><Muted>Volume vendu</Muted><span>{money(Number(b.volume) || 0, code)}</span></Flex>
        <Flex between><Muted>Taux réellement constaté</Muted><span>{typeof b.effective_rate === "number" ? `${b.effective_rate} %` : "—"}</span></Flex>
        {funded > 0 && (
          <>
            <Flex between><Muted>Promotions offertes par MACHE</Muted><span style={{ color: "var(--fg-error)" }}>−{money(funded, code)}</span></Flex>
            <Flex between><Muted>Commission avant ces promotions</Muted><span>{money(Number(b.commission_before_promotions) || commission, code)}</span></Flex>
          </>
        )}
      </div>
      {funded > 0 && <p><Muted>Les vendeurs concernés ont été payés comme s&apos;il n&apos;y avait pas eu de promotion : cette somme est sortie du chiffre d&apos;affaires de MACHE, pas du leur.</Muted></p>}
    </Panel>
  );
}

export default function RevenuePage() {
  const [days, setDays] = useState(30);
  const { data, error, loading } = useLoad<Data>(`/admin/mache/revenue?days=${days}`);
  const current = data?.currencies ?? [];

  return (
    <Page
      title="Ce que MACHE gagne"
      subtitle="Les commissions enregistrées sur les commandes, par devise."
      actions={<Flex gap={6}>{PERIODS.map((p) => <Btn key={p.days} variant={p.days === days ? "primary" : "secondary"} onClick={() => setDays(p.days)}>{p.label}</Btn>)}</Flex>}
    >
      <Notice tone="warn" title="Ces montants sont dus, pas encaissés">
        MACHE ne perçoit pas les paiements : l&apos;acheteur règle le vendeur en main propre. Ces commissions restent à facturer aux boutiques — ce n&apos;est pas de la trésorerie.
      </Notice>
      <Loading error={error} loading={loading} />
      {data && (current.length === 0 ? (
        <Empty title="Aucune commande sur cette période">Rien n&apos;a été vendu sur les derniers jours choisis. Ce n&apos;est pas une panne : il n&apos;y a simplement rien à compter.</Empty>
      ) : (
        <>
          <Grid>{current.map((b) => <Card key={b.currency_code} b={b} before={(data.previous ?? []).find((x) => x.currency_code === b.currency_code)} />)}</Grid>
          {current.length > 1 && <Muted>Les devises ne sont pas additionnées : un total unique supposerait un taux de change, et ce taux ferait varier le chiffre d&apos;affaires sans qu&apos;aucune vente n&apos;ait changé.</Muted>}
          {(Number(data.unattributed_commission) || 0) > 0 && (
            <Notice tone="info" title="Commissions non rattachées">
              {nf(Number(data.unattributed_commission))} en commissions portent sur des frais de port et ne sont rattachables à aucune devise par ce calcul. Elles sont comptées ici à part plutôt que réparties au hasard.
            </Notice>
          )}
          {data.truncated && <Notice tone="warn" title="Lecture tronquée">Le volume de commandes dépasse ce que cet écran sait lire ligne à ligne : les totaux affichés sont incomplets.</Notice>}
        </>
      ))}
      <Panel title="Les abonnements" description="Marques officielles — 120 à 300 € par mois selon la grille.">
        <p style={{ margin: 0 }}><Muted>{data?.subscriptions?.note || "Les abonnements des marques ne sont pas encore facturés : rien n'est prélevé, donc rien n'est compté."}</Muted></p>
        <p style={{ margin: "8px 0 0" }}><Muted>Cette ligne vaut zéro et le dit : la remplir à partir de la grille tarifaire afficherait comme gagné un argent que personne n&apos;a versé.</Muted></p>
      </Panel>
    </Page>
  );
}
