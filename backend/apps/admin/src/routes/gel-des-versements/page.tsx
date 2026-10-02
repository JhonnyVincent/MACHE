/*
  PAGE : gel des versements.

  Arrêter l'argent d'une boutique sans forcément arrêter sa vente.
  MACHE n'encaisse pas : geler ne reprend RIEN à un vendeur qui a déjà
  l'argent. Le gel fait deux choses réelles : une livraison confirmée
  cesse de porter sa somme comme due, et les versements déjà autorisés
  sont repris. Les gels levés sont conservés (un gel a retenu de
  l'argent : l'effacer rendrait l'écart inexplicable).
*/
import { useState } from "react";
import { Badge, Btn, Empty, Feedback, Field, Flex, Grid, List, Loading, Muted, Notice, Page, Panel, Row, Select, Stat, api, formatDate, useAction, useLoad } from "../../lib/kit";

export const config = { label: "Gel des versements", rank: 6, nested: "/mache" };

type Freeze = { id: string; seller_id: string; reason: string; active?: boolean; lifted_reason?: string | null; lifted_at?: string | null; created_at?: string | null; deliveries_held?: number };
type Seller = { id: string; name?: string; handle?: string };

function Lift({ freeze, seller, run, busy }: { freeze: Freeze; seller?: Seller; run: (body: Record<string, string>, ok: string) => void; busy: boolean }) {
  const [reason, setReason] = useState("");
  const held = freeze.deliveries_held ?? 0;

  return (
    <Panel title={seller?.name ?? freeze.seller_id} description={seller ? `/store/${seller.handle}` : "Boutique introuvable dans la liste"}>
      <Flex>
        <Badge tone="error">Versements gelés</Badge>
        {held > 0 && <Badge tone="warn">{held} livraison{held > 1 ? "s" : ""} retenue{held > 1 ? "s" : ""}</Badge>}
      </Flex>
      <p><Muted>Motif : </Muted>{freeze.reason}</p>
      {freeze.created_at && <p style={{ margin: 0 }}><Muted>Gelé le : </Muted>{formatDate(freeze.created_at)}</p>}
      <div style={{ marginTop: 14, borderTop: "1px solid var(--border-base)", paddingTop: 14 }}>
        <Field label="Pourquoi levez-vous le gel *" hint="Ce que la vérification a donné. Sans cela, personne ne saura pourquoi l'argent est reparti." multiline value={reason} onChange={setReason} />
        <div style={{ marginTop: 10 }}><Btn disabled={busy || !reason.trim()} onClick={() => run({ seller_id: freeze.seller_id, action: "lift", reason: reason.trim() }, "Gel levé.")}>Lever le gel</Btn></div>
      </div>
    </Panel>
  );
}

export default function FreezePage() {
  const freezes = useLoad<{ freezes?: Freeze[] }>("/admin/mache/payout-freezes");
  const sellers = useLoad<{ sellers?: Seller[] }>("/admin/sellers?limit=200");
  const action = useAction();
  const [sellerId, setSellerId] = useState("");
  const [reason, setReason] = useState("");

  const list = sellers.data?.sellers ?? [];
  const all = freezes.data?.freezes ?? [];
  const active = all.filter((f) => f.active !== false);
  const lifted = all.filter((f) => f.active === false);
  const byId = new Map(list.map((s) => [s.id, s]));
  const frozen = new Set(active.map((f) => f.seller_id));
  const freezable = list.filter((s) => !frozen.has(s.id));
  const totalHeld = active.reduce((n, f) => n + (f.deliveries_held ?? 0), 0);

  const run = async (body: Record<string, string>, ok: string) => {
    if (await action.run(() => api("/admin/mache/payout-freezes", { method: "POST", body }), ok)) {
      freezes.reload();
      return true;
    }
    return false;
  };

  const freeze = async () => {
    if (!sellerId || !reason.trim()) return action.run(async () => { throw new Error("Choisissez une boutique et dites ce que vous lui reprochez : un gel sans motif ne se défend pas."); }, "");
    if (await run({ seller_id: sellerId, action: "freeze", reason: reason.trim() }, "Versements gelés.")) { setSellerId(""); setReason(""); }
  };

  return (
    <Page title="Gel des versements" subtitle="Arrêter l'argent d'une boutique, sans forcément arrêter sa vente.">
      <Feedback message={action.message} />
      <Loading error={freezes.error} loading={freezes.loading} />
      <Notice tone="warn" title="Ce qu'un gel ne fait pas">
        MACHE n&apos;encaisse pas : l&apos;acheteur règle le vendeur en main propre. Geler ne reprend donc <strong>rien</strong> à un vendeur qui a déjà l&apos;argent. Ce que le gel fait : une livraison confirmée cesse de porter sa somme comme due, et les versements déjà autorisés sont repris. Pour l&apos;argent déjà encaissé, il faut le réclamer.
      </Notice>
      <Grid cols={3}>
        <Stat label="Boutiques gelées" value={active.length} />
        <Stat label="Livraisons retenues" value={totalHeld} hint="Leur somme n'est pas portée comme due au vendeur." />
        <Stat label="Gels levés" value={lifted.length} hint="Conservés : un gel a retenu de l'argent, l'effacer rendrait l'écart inexplicable." />
      </Grid>
      <Panel title="Geler une boutique" description="Suspendre l'arrête de vendre ; geler retient son argent. Les deux se décident séparément.">
        {sellers.data && freezable.length === 0 ? (
          <Empty title={list.length === 0 ? "Aucune boutique" : "Toutes les boutiques sont déjà gelées"}>Rien à geler pour le moment.</Empty>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            <Select label="Boutique *" value={sellerId} onChange={setSellerId} options={[{ value: "", label: "Choisissez une boutique" }, ...freezable.map((s) => ({ value: s.id, label: `${s.name} — /store/${s.handle}` }))]} />
            <Field label="Ce que vous reprochez à cette boutique *" hint="Écrit maintenant, pendant que vous l'avez en tête. Dans six mois, un gel sans motif ne se défend pas et ne se lève pas." multiline value={reason} onChange={setReason} />
            <div><Btn disabled={action.busy} onClick={freeze}>Geler les versements</Btn></div>
          </div>
        )}
      </Panel>
      {active.map((f) => <Lift key={f.id} freeze={f} seller={byId.get(f.seller_id)} run={run} busy={action.busy} />)}
      {lifted.length > 0 && (
        <Panel title="Gels levés" description="Conservés : chacun a retenu de l'argent pendant un temps.">
          <List>
            {lifted.map((f) => (
              <Row key={f.id}>
                <strong>{byId.get(f.seller_id)?.name ?? f.seller_id}</strong>
                <div><Muted>Gelé{f.created_at ? ` le ${formatDate(f.created_at)}` : ""} — {f.reason}</Muted></div>
                <div><Muted>Levé{f.lifted_at ? ` le ${formatDate(f.lifted_at)}` : ""}{f.lifted_reason ? ` — ${f.lifted_reason}` : ""}</Muted></div>
              </Row>
            ))}
          </List>
        </Panel>
      )}
    </Page>
  );
}
