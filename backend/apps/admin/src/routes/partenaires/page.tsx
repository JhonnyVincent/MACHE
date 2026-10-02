/*
  PAGE : les partenaires de services (photographes, financement, graphisme…).

  Ils s'inscrivent seuls (« à examiner ») ou l'équipe les ajoute. Rien
  n'est public avant l'approbation.
*/
import { useState } from "react";
import { Badge, Btn, Empty, Feedback, Field, Flex, Grid, List, Loading, Muted, Page, Panel, Row, Select, api, useAction, useLoad, type Tone } from "../../lib/kit";

export const config = { label: "Partenaires de services", rank: 9, nested: "/mache" };

const CATEGORIES = ["Photographie", "Financement", "Transport et livraison", "Graphisme et marque", "Développement web", "Comptabilité et droit", "Formation", "Autre"];
const STATUS: Record<string, { label: string; tone: Tone }> = {
  pending: { label: "À examiner", tone: "warn" },
  approved: { label: "Public", tone: "ok" },
  suspended: { label: "Suspendu", tone: "neutral" },
  banned: { label: "Exclu", tone: "error" },
};
const FIELDS = ["name", "category", "description", "location", "logo", "banner", "website", "whatsapp", "phone", "facebook", "instagram", "contact_name", "contact_email"] as const;
const LABELS: Record<(typeof FIELDS)[number], string> = {
  name: "Nom", category: "Catégorie", description: "Présentation", location: "Adresse / ville", logo: "Logo (adresse de l'image)",
  banner: "Bannière (adresse de l'image)", website: "Site web", whatsapp: "WhatsApp", phone: "Téléphone", facebook: "Facebook",
  instagram: "Instagram", contact_name: "Nom du contact (non publié)", contact_email: "E-mail du contact (non publié)",
};

type Partner = Record<string, string | null> & { id: string; status: string; source: string };
type Values = Record<(typeof FIELDS)[number], string>;

const blank = (): Values => Object.fromEntries(FIELDS.map((f) => [f, ""])) as Values;
const from = (p: Partner): Values => Object.fromEntries(FIELDS.map((f) => [f, (p[f] as string) ?? ""])) as Values;

function Form({ values, onChange }: { values: Values; onChange: (v: Values) => void }) {
  return (
    <Grid>
      {FIELDS.map((f) =>
        f === "category" ? (
          <Select key={f} label={LABELS[f]} value={values[f]} onChange={(v) => onChange({ ...values, [f]: v })} options={[{ value: "", label: "Choisir…" }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]} />
        ) : (
          <Field key={f} label={LABELS[f]} multiline={f === "description"} value={values[f]} onChange={(v) => onChange({ ...values, [f]: v })} type={f === "contact_email" ? "email" : "text"} />
        ),
      )}
    </Grid>
  );
}

function Card({ partner, act, busy }: { partner: Partner; act: (id: string, body: Record<string, string>, ok: string) => void; busy: boolean }) {
  const [reason, setReason] = useState("");
  const [edit, setEdit] = useState<Values | null>(null);
  const st = STATUS[partner.status] ?? STATUS.pending;

  return (
    <Row>
      <Flex>
        <strong style={{ fontSize: 16 }}>{partner.name}</strong>
        <Badge tone={st.tone}>{st.label}</Badge>
        <Muted>{partner.category} · {partner.source === "self" ? "inscrit seul" : "ajouté par l'équipe"}</Muted>
      </Flex>
      <div><Muted>{partner.contact_name ?? "—"} — {partner.contact_email}{partner.location ? ` — ${partner.location}` : ""}</Muted></div>
      {partner.status_reason && <div style={{ color: "var(--fg-error)", fontSize: 13 }}>Motif : {partner.status_reason}</div>}
      {partner.description && <p style={{ margin: "8px 0" }}>{partner.description}</p>}
      <Flex>
        {partner.status !== "approved" && <Btn disabled={busy} onClick={() => act(partner.id, { action: "approve" }, "Partenaire approuvé (visible sur le site).")}>{partner.status === "pending" ? "Approuver" : "Rétablir"}</Btn>}
        {partner.status !== "banned" && (
          <>
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motif (pour suspendre / exclure)" style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--bg-field)", color: "var(--fg-base)", width: 220 }} />
            {partner.status === "approved" && <Btn variant="secondary" disabled={busy || reason.trim().length < 3} onClick={() => act(partner.id, { action: "suspend", reason }, "Partenaire suspendu.")}>Suspendre</Btn>}
            <Btn variant="danger" disabled={busy || reason.trim().length < 3} onClick={() => act(partner.id, { action: "ban", reason }, "Partenaire exclu.")}>Exclure</Btn>
            <Btn variant="secondary" disabled={busy} onClick={() => confirm("Supprimer ce partenaire ?") && act(partner.id, { action: "delete" }, "Partenaire supprimé.")}>Supprimer</Btn>
          </>
        )}
        <Btn variant="secondary" onClick={() => setEdit(edit ? null : from(partner))}>{edit ? "Fermer" : "Modifier la fiche"}</Btn>
      </Flex>
      {edit && (
        <div style={{ marginTop: 12 }}>
          <Form values={edit} onChange={setEdit} />
          <div style={{ marginTop: 10 }}><Btn disabled={busy} onClick={() => act(partner.id, { action: "update", ...edit }, "Fiche enregistrée.")}>Enregistrer</Btn></div>
        </div>
      )}
    </Row>
  );
}

export default function PartnersPage() {
  const { data, error, loading, reload } = useLoad<{ partners?: Partner[] }>("/admin/mache/partners");
  const action = useAction();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Values>(blank());

  const act = async (id: string, body: Record<string, string>, ok: string) => {
    if (await action.run(() => api(`/admin/mache/partners/${encodeURIComponent(id)}`, { method: "POST", body }), ok)) reload();
  };

  const create = async () => {
    if (!CATEGORIES.includes(values.category)) return action.run(async () => { throw new Error("Choisissez une catégorie."); }, "");
    if (await action.run(() => api("/admin/mache/partners", { method: "POST", body: values }), "Partenaire ajouté (visible sur le site).")) {
      setValues(blank());
      setOpen(false);
      reload();
    }
  };

  const partners = data?.partners ?? [];

  return (
    <Page title="Partenaires de services" subtitle="Photographes, financement, graphisme… Ils s'inscrivent seuls (à examiner) ou vous les ajoutez ici. Rien n'est public avant l'approbation.">
      <Feedback message={action.message} />
      <Loading error={error} loading={loading} />
      <Panel>
        <Btn variant="secondary" onClick={() => setOpen(!open)}>{open ? "Fermer" : "+ Ajouter un partenaire"}</Btn>
        {open && (
          <div style={{ marginTop: 14 }}>
            <Form values={values} onChange={setValues} />
            <div style={{ marginTop: 10 }}><Btn disabled={action.busy} onClick={create}>Ajouter (public tout de suite)</Btn></div>
          </div>
        )}
      </Panel>
      {data && (partners.length === 0 ? <Empty title="Aucun partenaire pour l'instant." /> : <List>{partners.map((p) => <Card key={p.id} partner={p} act={act} busy={action.busy} />)}</List>)}
    </Page>
  );
}
