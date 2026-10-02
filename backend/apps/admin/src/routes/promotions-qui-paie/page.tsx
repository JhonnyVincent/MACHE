/*
  PAGE : qui paie les promotions.

  Deux promotions identiques à l'écran peuvent coûter, l'une rien à
  MACHE, l'autre sa commission entière. Deux questions distinctes :
  QUI L'A CRÉÉE (une boutique, ou MACHE) et QUI LA PAIE (donnée séparée,
  c'est elle qui sort l'argent). Sans porteur déclaré, c'est le VENDEUR
  qui paie : défaut prudent.

  Les promotions elles-mêmes (code, remise, durée) se créent dans
  « Promotions » du menu de gauche : cette page ne décide que de qui les paie.
*/
import { useState } from "react";
import { Badge, Btn, Empty, Feedback, Field, Flex, Grid, List, Loading, Muted, Notice, Page, Panel, Row, Select, Stat, api, formatDate, useAction, useLoad } from "../../lib/kit";

export const config = { label: "Qui paie les promotions", rank: 3, nested: "/mache" };

type Promo = {
  id: string; code?: string; status?: string; is_automatic?: boolean; created_at?: string; campaign?: { name?: string }; seller?: { name?: string };
  owner?: string; cost_bearer?: string | null; shared_marketplace_percentage?: number | null; mache_share?: number; who_pays?: string; mache_spent?: number;
  application_method?: { value?: number | string; type?: string; currency_code?: string };
};

const STATUS: Record<string, string> = { draft: "Brouillon", active: "Active", inactive: "Inactive" };
const nf = (v: number) => Math.round(v).toLocaleString("fr-FR");

function Card({ p, save, busy }: { p: Promo; save: (id: string, bearer: string, pct: string) => void; busy: boolean }) {
  const [bearer, setBearer] = useState(p.cost_bearer ?? "store");
  const [pct, setPct] = useState(p.shared_marketplace_percentage != null ? String(p.shared_marketplace_percentage) : "");
  const m = p.application_method ?? {};
  const value = Number(m.value);
  const remise = Number.isFinite(value) ? (m.type === "percentage" ? `${value} %` : `${nf(value)} ${(m.currency_code ?? "").toUpperCase()}`.trim()) : "—";
  const share = p.mache_share ?? 0;

  return (
    <Panel title={p.code ?? "—"} description={p.owner === "mache" ? "Créée par MACHE" : `Créée par ${p.seller?.name ?? "une boutique"}`}>
      <Flex>
        {share >= 1 ? <Badge tone="error">Payée par MACHE</Badge> : share > 0 ? <Badge tone="warn">Partagée — MACHE {Math.round(share * 100)} %</Badge> : p.cost_bearer == null ? <Badge>Porteur non déclaré</Badge> : <Badge tone="ok">Payée par le vendeur</Badge>}
        <Badge tone={p.status === "active" ? "ok" : "neutral"}>{STATUS[p.status ?? ""] ?? p.status}</Badge>
        {p.is_automatic && <Badge tone="info">Automatique</Badge>}
        {p.campaign?.name && <Badge tone="info">{p.campaign.name}</Badge>}
      </Flex>
      <p>{p.who_pays}</p>
      <p style={{ margin: 0 }}><Muted>Remise : </Muted>{remise} · <Muted>Déjà déboursé par MACHE : </Muted>{(p.mache_spent ?? 0) > 0 ? nf(p.mache_spent ?? 0) : "Rien"}{p.created_at ? <> · <Muted>Créée le </Muted>{formatDate(p.created_at)}</> : null}</p>
      <div style={{ marginTop: 14, borderTop: "1px solid var(--border-base)", paddingTop: 14 }}>
        <Grid>
          <Select label="Qui paie cette promotion" value={bearer} onChange={setBearer} options={[{ value: "store", label: "Le vendeur" }, { value: "marketplace", label: "MACHE" }, { value: "shared", label: "Partagé" }]} />
          <Field label="Part de MACHE, en %" hint="Uniquement pour un partage. Sans pourcentage, MACHE ne porte rien." type="number" value={pct} onChange={setPct} placeholder="50" />
        </Grid>
        <div style={{ marginTop: 10 }}><Btn disabled={busy} onClick={() => save(p.id, bearer, pct)}>Enregistrer le porteur</Btn></div>
      </div>
    </Panel>
  );
}

export default function PromotionsCostPage() {
  const { data, error, loading, reload } = useLoad<{ promotions?: Promo[] }>("/admin/mache/promotions");
  const action = useAction();

  const save = async (id: string, bearer: string, pct: string) => {
    const percentage = Number(pct);
    if (bearer === "shared" && (!Number.isFinite(percentage) || percentage <= 0 || percentage > 100)) {
      return action.run(async () => { throw new Error("Un partage demande un pourcentage entre 1 et 100. Sans lui, MACHE ne porterait rien."); }, "");
    }
    if (await action.run(() => api(`/admin/promotions/${encodeURIComponent(id)}/cost`, { method: "POST", body: { cost_bearer: bearer, shared_marketplace_percentage: bearer === "shared" ? percentage : null } }), "Porteur enregistré. Il vaut pour les commandes à venir.")) reload();
  };

  const promos = [...(data?.promotions ?? [])].sort((a, b) => (b.mache_share ?? 0) - (a.mache_share ?? 0) || (b.mache_spent ?? 0) - (a.mache_spent ?? 0));
  const funded = promos.filter((p) => (p.mache_share ?? 0) > 0);
  const spent = funded.reduce((s, p) => s + (p.mache_spent ?? 0), 0);
  const unclear = promos.filter((p) => p.owner === "mache" && p.cost_bearer == null);

  return (
    <Page title="Qui paie les promotions" subtitle="Qui a créé la promotion, et surtout qui la paie.">
      <Feedback message={action.message} />
      <Loading error={error} loading={loading} />
      {unclear.length > 0 && (
        <Notice tone="warn" title={`${unclear.length} promotion${unclear.length > 1 ? "s" : ""} de MACHE sans porteur déclaré`}>
          Tant que le porteur n&apos;est pas déclaré, c&apos;est le VENDEUR qui paie la remise — même si MACHE l&apos;a créée.
        </Notice>
      )}
      <Grid cols={3}>
        <Stat label="Promotions" value={promos.length} hint="Toutes boutiques confondues." />
        <Stat label="Financées par MACHE" value={funded.length} hint="Celles dont la remise sort de la commission de MACHE." />
        <Stat label="Déjà déboursé" value={nf(spent)} hint="Toutes devises mêlées — à lire comme un ordre de grandeur." />
      </Grid>
      <Panel title="Ce que déclarer un porteur change" description="Le champ ne modifie ni le prix affiché ni ce que l'acheteur paie. Il décide de qui sort l'argent.">
        <List>
          <Row><strong>Le vendeur</strong> — la remise sort de son chiffre d&apos;affaires. MACHE garde sa commission entière.</Row>
          <Row><strong>MACHE</strong> — la remise est retirée de la commission. Le vendeur touche ce qu&apos;il aurait touché sans promotion. Si la remise dépasse la commission, celle-ci devient négative : MACHE verse la différence.</Row>
          <Row><strong>Partagé</strong> — MACHE porte le pourcentage indiqué, le vendeur le reste.</Row>
        </List>
        <p><Muted>Le changement ne vaut que pour les commandes À VENIR : les commissions déjà calculées ne sont pas recalculées.</Muted></p>
      </Panel>
      {data && promos.length === 0 && <Empty title="Aucune promotion">Les promotions créées par les boutiques et depuis le menu « Promotions » apparaîtront ici.</Empty>}
      {promos.map((p) => <Card key={p.id} p={p} save={save} busy={action.busy} />)}
    </Page>
  );
}
