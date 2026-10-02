/*
  PAGE : l'équipe d'administration (réservée au propriétaire).

  Le propriétaire détient tout et délègue par espace. La vraie barrière
  est dans le backend : toute route refuse un rôle qui n'y a pas droit.
*/
import { useState } from "react";
import { Badge, Btn, Feedback, Field, Flex, Grid, List, Loading, Muted, Page, Panel, Row, Select, api, useAction, useLoad } from "../../lib/kit";

export const config = { label: "Équipe", rank: 16, nested: "/mache" };

const LABELS: Record<string, string> = { owner: "Propriétaire", support: "Suivi des clients", contenu: "Site et mises à jour" };
const HELP: Record<string, string> = {
  support: "Messages, comptes professionnels, avis signalés, clients bloqués. Voit les chiffres en lecture seule.",
  contenu: "Apparence, textes, promotions, partenaires. Voit les chiffres en lecture seule.",
};

type Member = { id: string; email: string; first_name: string | null; last_name: string | null; role: string };

export default function TeamPage() {
  const { data, error, loading, reload } = useLoad<{ team?: Member[] }>("/admin/mache/team");
  const action = useAction();
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", role: "" });
  const [roles, setRoles] = useState<Record<string, string>>({});

  const create = async () => {
    if (!form.first_name.trim() || !form.email.trim() || !form.role) {
      return action.run(async () => { throw new Error("Prénom, e-mail et espace confié sont obligatoires."); }, "");
    }
    if (await action.run(() => api("/admin/mache/team", { method: "POST", body: form }), "Membre créé. Il reçoit un e-mail pour choisir son mot de passe.")) {
      setForm({ first_name: "", last_name: "", email: "", role: "" });
      reload();
    }
  };

  const act = async (id: string, body: Record<string, string>, success: string) => {
    if (await action.run(() => api(`/admin/mache/team/${encodeURIComponent(id)}`, { method: "POST", body }), success)) reload();
  };

  return (
    <Page title="Équipe" subtitle="Vous détenez tout. Vous pouvez confier des tâches à des membres, qui ont chacun leur espace et ne voient que ce qui les concerne.">
      <Feedback message={action.message} />
      <Loading error={error} loading={loading} />
      <Panel title="Ajouter un membre">
        <Grid>
          <Field label="Prénom" value={form.first_name} onChange={(v) => setForm({ ...form, first_name: v })} />
          <Field label="Nom" value={form.last_name} onChange={(v) => setForm({ ...form, last_name: v })} />
          <Field label="E-mail" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <Select
            label="Espace confié"
            value={form.role}
            onChange={(v) => setForm({ ...form, role: v })}
            options={[{ value: "", label: "Choisir…" }, { value: "support", label: LABELS.support }, { value: "contenu", label: LABELS.contenu }]}
          />
        </Grid>
        <p><Muted><strong>{LABELS.support}</strong> : {HELP.support}<br /><strong>{LABELS.contenu}</strong> : {HELP.contenu}<br />Le membre reçoit un e-mail pour choisir son mot de passe. Vous ne le connaissez jamais.</Muted></p>
        <Btn disabled={action.busy} onClick={create}>Créer le membre</Btn>
      </Panel>

      {data && (
        <Panel title="Comptes">
          <List>
            {(data.team ?? []).map((m) => (
              <Row key={m.id}>
                <strong>{[m.first_name, m.last_name].filter(Boolean).join(" ") || m.email}</strong>{" "}
                <Badge>{LABELS[m.role] ?? m.role}</Badge>
                <div><Muted>{m.email}</Muted></div>
                {m.role !== "owner" && (
                  <div style={{ marginTop: 10 }}>
                    <Flex>
                      <select
                        value={roles[m.id] ?? m.role}
                        onChange={(e) => setRoles({ ...roles, [m.id]: e.target.value })}
                        style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--bg-field)", color: "var(--fg-base)" }}
                      >
                        <option value="support">{LABELS.support}</option>
                        <option value="contenu">{LABELS.contenu}</option>
                      </select>
                      <Btn variant="secondary" disabled={action.busy} onClick={() => act(m.id, { action: "role", role: roles[m.id] ?? m.role }, "Rôle modifié.")}>Changer</Btn>
                      <Btn variant="danger" disabled={action.busy} onClick={() => confirm(`Retirer ${m.email} de l'équipe ?`) && act(m.id, { action: "remove", role: "" }, "Membre retiré.")}>Retirer</Btn>
                    </Flex>
                  </div>
                )}
              </Row>
            ))}
          </List>
        </Panel>
      )}
    </Page>
  );
}
