/*
  PAGE : les points de retrait (lieux où un colis peut attendre son destinataire).

  Un LIEU, pas une personne : l'agent qui le tient peut changer sans que
  les colis deviennent introuvables. Il n'y a pas de suppression : un
  point fermé garde les livraisons qui y ont transité.
*/
import { useState } from "react";
import { Badge, Btn, Empty, Feedback, Field, Flex, Grid, Loading, Muted, Notice, Page, Panel, Stat, api, useAction, useLoad } from "../../lib/kit";

export const config = { label: "Points de retrait", rank: 11, nested: "/mache" };

type Point = {
  id: string; name: string; code: string; department: string; commune: string | null; address: string; landmark: string | null;
  phone_public: string | null; opening_hours: string | null; agent_customer_id: string | null; active: boolean; note: string | null;
};

const blank = { name: "", code: "", department: "", commune: "", address: "", landmark: "", opening_hours: "", phone_public: "", agent_customer_id: "", note: "" };

function PointCard({ point, act, busy }: { point: Point; act: (id: string, body: Record<string, unknown>, ok: string) => void; busy: boolean }) {
  const [keeper, setKeeper] = useState(point.agent_customer_id ?? "");

  return (
    <Panel title={`${point.name} — ${point.code}`} description={[point.commune, point.department].filter(Boolean).join(", ")}>
      <Flex>
        {point.active ? <Badge tone="ok">Ouvert</Badge> : <Badge>Fermé</Badge>}
        {point.agent_customer_id ? <Badge tone="info">Tenu par un agent</Badge> : <Badge tone="warn">Aucun tenant désigné</Badge>}
      </Flex>
      <p style={{ margin: "10px 0 0" }}><Muted>Adresse : </Muted>{point.address}</p>
      {point.landmark && <p style={{ margin: 0 }}><Muted>Repère : </Muted>{point.landmark}</p>}
      {point.opening_hours && <p style={{ margin: 0 }}><Muted>Horaires : </Muted>{point.opening_hours}</p>}
      {point.phone_public && <p style={{ margin: 0 }}><Muted>Téléphone publié : </Muted>{point.phone_public}</p>}
      {point.note && <p style={{ margin: 0 }}><Muted>Note interne : {point.note}</Muted></p>}
      <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
        <Field label="Agent qui tient le point" hint="Laisser vide retire le tenant. Le point reste ouvert et les colis qui y attendent ne bougent pas." value={keeper} onChange={setKeeper} placeholder="Identifiant client de l'agent" />
        <Flex>
          <Btn variant="secondary" disabled={busy} onClick={() => act(point.id, { agent_customer_id: keeper.trim() || null }, "Tenant enregistré.")}>Enregistrer le tenant</Btn>
          <Btn variant="secondary" disabled={busy} onClick={() => act(point.id, { active: !point.active }, point.active ? "Point fermé : il disparaît du choix, les livraisons passées restent lisibles." : "Point rouvert.")}>
            {point.active ? "Fermer ce point" : "Rouvrir ce point"}
          </Btn>
        </Flex>
      </div>
    </Panel>
  );
}

export default function RelayPointsPage() {
  const { data, error, loading, reload } = useLoad<{ relay_points?: Point[] }>("/admin/mache/relay-points");
  const action = useAction();
  const [form, setForm] = useState(blank);
  const set = (k: keyof typeof blank) => (v: string) => setForm({ ...form, [k]: v });

  const points = data?.relay_points ?? [];
  const open = points.filter((p) => p.active);
  const noKeeper = open.filter((p) => !p.agent_customer_id);
  const sorted = [...points].sort((a, b) => (a.active !== b.active ? (a.active ? -1 : 1) : a.department.localeCompare(b.department) || a.name.localeCompare(b.name)));

  const create = async () => {
    if (!form.name.trim() || !form.department.trim() || !form.address.trim()) return action.run(async () => { throw new Error("Un point de retrait a besoin d'un nom, d'un département et d'une adresse."); }, "");
    if (!form.code.trim()) return action.run(async () => { throw new Error("Le code court est obligatoire — par exemple PAP-DEL-02."); }, "");
    const body = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim() || null]));
    if (await action.run(() => api("/admin/mache/relay-points", { method: "POST", body }), `Point « ${form.name} » ouvert sous le code ${form.code}.`)) {
      setForm(blank);
      reload();
    }
  };

  const act = async (id: string, body: Record<string, unknown>, ok: string) => {
    if (await action.run(() => api(`/admin/mache/relay-points/${encodeURIComponent(id)}`, { method: "POST", body }), ok)) reload();
  };

  return (
    <Page title="Points de retrait" subtitle="Les adresses où un colis peut attendre son destinataire.">
      <Feedback message={action.message} />
      <Loading error={error} loading={loading} />
      {noKeeper.length > 0 && (
        <Notice tone="warn" title={`${noKeeper.length} point${noKeeper.length > 1 ? "s" : ""} ouvert${noKeeper.length > 1 ? "s" : ""} sans tenant désigné`}>
          Un vendeur peut y envoyer un colis alors que personne n&apos;est nommément chargé de le recevoir. Ce n&apos;est pas bloquant, mais il vaut mieux savoir lequel.
        </Notice>
      )}
      <Grid cols={3}>
        <Stat label="Points ouverts" value={open.length} />
        <Stat label="Points fermés" value={points.length - open.length} hint="Conservés : les livraisons qui y ont transité restent lisibles." />
        <Stat label="Sans tenant" value={noKeeper.length} />
      </Grid>
      <Panel title="Ouvrir un point de retrait" description="Le nom, le département et l'adresse sont ce qu'un client lit pour s'y rendre.">
        <Grid>
          <Field label="Nom du point *" value={form.name} onChange={set("name")} placeholder="Pharmacie Sainte-Anne" />
          <Field label="Code court *" hint="Lettres, chiffres et tirets. C'est ce que le client répète au téléphone ; il ne pourra plus être modifié." value={form.code} onChange={set("code")} placeholder="PAP-DEL-02" />
          <Field label="Département *" value={form.department} onChange={set("department")} placeholder="Ouest" />
          <Field label="Commune" value={form.commune} onChange={set("commune")} placeholder="Delmas" />
          <Field label="Adresse *" value={form.address} onChange={set("address")} placeholder="Rue Delmas 33, n° 12" />
          <Field label="Repère" hint="Ce qu'on dit vraiment pour trouver l'endroit." value={form.landmark} onChange={set("landmark")} placeholder="En face de la station" />
          <Field label="Horaires" value={form.opening_hours} onChange={set("opening_hours")} placeholder="Lun-sam 8h-17h" />
          <Field label="Téléphone à publier" hint="Publié sur la page du point. N'y mettez pas le numéro personnel du tenant." value={form.phone_public} onChange={set("phone_public")} />
          <Field label="Agent qui le tient" hint="Facultatif. Un point existe sans tenant désigné." value={form.agent_customer_id} onChange={set("agent_customer_id")} />
          <Field label="Note interne" hint="Visible ici seulement, jamais par les clients." value={form.note} onChange={set("note")} />
        </Grid>
        <div style={{ marginTop: 12 }}><Btn disabled={action.busy} onClick={create}>Ouvrir ce point</Btn></div>
      </Panel>
      {data && points.length === 0 && <Empty title="Aucun point de retrait">Tant qu&apos;il n&apos;y en a aucun, les vendeurs ne peuvent pas proposer le retrait en point relais.</Empty>}
      {sorted.map((p) => <PointCard key={p.id} point={p} act={act} busy={action.busy} />)}
    </Page>
  );
}
