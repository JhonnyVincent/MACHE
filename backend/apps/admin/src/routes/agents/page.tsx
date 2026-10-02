/*
  PAGE : les agents MACHE (points de relais, livreurs, commerciaux).

  Un agent est un CLIENT à qui s'ajoute une fonction. Ce qui en fait un
  agent : son appartenance à un GROUPE DE CLIENTS, que seule
  l'administration peut modifier (pas son champ libre, qu'un client
  écrit lui-même). Le code de la carte est tiré au hasard, jamais saisi :
  c'est ce qu'un client vérifie avant de remettre de l'argent liquide.

  Suspendre plutôt que retirer : un agent suspendu reste CONNU, la
  vérification publique répond « ne lui remettez rien ». Retiré, il
  devient « inconnu », ce qui se lit comme une faute de frappe.
*/
import { useState } from "react";
import { Badge, Btn, Empty, Feedback, Field, Flex, Grid, List, Loading, Muted, Notice, Page, Panel, Row, Select, api, useAction, useLoad } from "../../lib/kit";

export const config = { label: "Agents", rank: 10, nested: "/mache" };

/* Même étiquette que backend/packages/api/src/api/agent-identity.ts (un test les compare). */
const SUSPENDED_MARKER = "mache_agent_suspended";
const FUNCTIONS = [
  { slug: "mache-point-relais", label: "Point de relais" },
  { slug: "mache-livreur", label: "Livreur" },
  { slug: "mache-commercial", label: "Commercial" },
];
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

type R = Record<string, unknown>;
type Group = { id: string; metadata?: R; customers?: R[] };
type Agent = { customerId: string; email: string; name: string; code: string | null; slug: string; zone: string | null; suspended: boolean };

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

function newCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  const body = Array.from(bytes).map((b) => ALPHABET[b % ALPHABET.length]).join("");
  return `MCH-${body.slice(0, 3)}-${body.slice(3)}`;
}

const GROUPS = "/admin/customer-groups?fields=id,name,metadata,*customers&limit=50";

function agentsFrom(groups: Group[]): Agent[] {
  const suspended = new Set<string>();
  for (const g of groups) {
    if (g.metadata?.[SUSPENDED_MARKER] !== true) continue;
    for (const c of g.customers ?? []) if (c.id) suspended.add(String(c.id));
  }
  const out: Agent[] = [];
  for (const g of groups) {
    const slug = str(g.metadata?.mache_agent_group);
    if (!slug) continue;
    for (const c of g.customers ?? []) {
      const meta = (c.metadata as R) ?? {};
      out.push({
        customerId: String(c.id ?? ""),
        email: str(c.email) ?? "",
        name: [str(c.first_name), str(c.last_name)].filter(Boolean).join(" ") || "Sans nom",
        code: str(meta.agent_code),
        slug,
        zone: str(meta.agent_zone),
        suspended: suspended.has(String(c.id ?? "")) || meta.agent_suspended === true,
      });
    }
  }
  return out;
}

async function groupIds() {
  const { customer_groups } = await api<{ customer_groups?: Group[] }>("/admin/customer-groups?fields=id,metadata&limit=50");
  return customer_groups ?? [];
}

async function cleanMeta(customerId: string, drop: string[]) {
  const found = await api<{ customer?: { metadata?: R } }>(`/admin/customers/${encodeURIComponent(customerId)}`);
  const meta = { ...(found.customer?.metadata ?? {}) };
  if (!drop.some((k) => k in meta)) return;
  for (const k of drop) delete meta[k];
  await api(`/admin/customers/${encodeURIComponent(customerId)}`, { method: "POST", body: { metadata: meta } });
}

export default function AgentsPage() {
  const { data, error, loading, reload } = useLoad<{ customer_groups?: Group[] }>(GROUPS);
  const action = useAction();
  const [form, setForm] = useState({ email: "", fn: FUNCTIONS[0].slug, zone: "", phone: "" });
  const [created, setCreated] = useState<{ code: string; name: string } | null>(null);

  const agents = agentsFrom(data?.customer_groups ?? []);

  const make = async () => {
    const email = form.email.trim().toLowerCase();
    setCreated(null);
    if (!email.includes("@")) return action.run(async () => { throw new Error("Indiquez une adresse e-mail valide."); }, "");

    let result: { code: string; name: string } | null = null;
    const ok = await action.run(async () => {
      const found = await api<{ customers?: R[] }>(`/admin/customers?q=${encodeURIComponent(email)}&limit=10`);
      const customer = (found.customers ?? []).find((c) => str(c.email)?.toLowerCase() === email);
      if (!customer?.id) throw new Error("Aucun compte client avec cette adresse. La personne doit d'abord créer son compte sur MACHE, comme un acheteur.");
      const group = (await groupIds()).find((g) => str(g.metadata?.mache_agent_group) === form.fn);
      if (!group?.id) throw new Error("Le groupe correspondant n'existe pas encore. Il est créé au démarrage du backend.");

      const code = newCode();
      /* Le champ libre d'abord, le groupe ensuite : si la seconde étape échoue, le code reste sans effet. */
      const meta = { ...((customer.metadata as R) ?? {}) };
      delete meta.agent_suspended;
      await api(`/admin/customers/${customer.id}`, { method: "POST", body: { metadata: { ...meta, agent_code: code, agent_zone: form.zone.trim() || null, agent_phone_public: form.phone.trim() || null } } });
      await api(`/admin/customer-groups/${group.id}/customers`, { method: "POST", body: { add: [String(customer.id)] } });
      result = { code, name: [str(customer.first_name), str(customer.last_name)].filter(Boolean).join(" ") || email };
    }, "");
    if (ok && result) {
      setCreated(result);
      setForm({ email: "", fn: form.fn, zone: "", phone: "" });
      reload();
    }
  };

  const suspend = async (a: Agent, suspended: boolean) => {
    const done = await action.run(async () => {
      const group = (await groupIds()).find((g) => g.metadata?.[SUSPENDED_MARKER] === true);
      if (!group?.id) throw new Error("Le groupe « agents suspendus » n'existe pas encore : sans lui, une suspension ne tiendrait pas. Il est créé au démarrage du backend.");
      await api(`/admin/customer-groups/${group.id}/customers`, { method: "POST", body: suspended ? { add: [a.customerId] } : { remove: [a.customerId] } });
      if (!suspended) await cleanMeta(a.customerId, ["agent_suspended"]);
    }, suspended ? "Agent suspendu. La vérification publique répond désormais qu'il ne faut rien lui remettre." : "Agent réactivé.");
    if (done) reload();
  };

  const revoke = async (a: Agent) => {
    const done = await action.run(async () => {
      const group = (await groupIds()).find((g) => str(g.metadata?.mache_agent_group) === a.slug);
      if (!group?.id) throw new Error("Le groupe correspondant n'existe pas encore.");
      await api(`/admin/customer-groups/${group.id}/customers`, { method: "POST", body: { remove: [a.customerId] } });
      await cleanMeta(a.customerId, ["agent_code", "agent_zone", "agent_phone_public", "agent_suspended"]);
    }, "Fonction retirée. La personne reste cliente de MACHE ; son code ne vérifie plus rien.");
    if (done) reload();
  };

  return (
    <Page title="Agents" subtitle="Points de relais, livreurs et commerciaux. Ce sont des clients de MACHE à qui vous ajoutez une fonction.">
      <Feedback message={action.message} />
      <Loading error={error} loading={loading} />
      {created && (
        <Notice tone="ok" title={`${created.name} est maintenant agent MACHE.`}>
          Son code de carte, à lui transmettre :
          <div style={{ fontFamily: "monospace", fontSize: 26, fontWeight: 700, letterSpacing: 2, margin: "6px 0" }}>{created.code}</div>
          C&apos;est ce code qu&apos;un client saisira sur la page de vérification avant de lui remettre un colis ou de l&apos;argent. Notez-le : il ne sera plus affiché ici.
        </Notice>
      )}
      <Panel title="Nommer un agent" description="La personne doit déjà avoir un compte client sur MACHE. On n'en crée pas à sa place : ce serait un compte dont elle ne connaîtrait pas le mot de passe.">
        <Grid>
          <Field label="Adresse e-mail de son compte client" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <Select label="Fonction" value={form.fn} onChange={(v) => setForm({ ...form, fn: v })} options={FUNCTIONS.map((f) => ({ value: f.slug, label: f.label }))} />
          <Field label="Zone (facultatif)" value={form.zone} onChange={(v) => setForm({ ...form, zone: v })} placeholder="Delmas 33" />
          <Field label="Téléphone public (facultatif)" hint="Affiché à qui vérifie son code. Ne le renseignez qu'avec son accord." value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="+509 …" />
        </Grid>
        <div style={{ marginTop: 12 }}><Btn disabled={action.busy} onClick={make}>Nommer cet agent</Btn></div>
      </Panel>
      {data && (agents.length === 0 ? <Empty title="Aucun agent pour le moment.">Les agents apparaîtront ici dès la première nomination.</Empty> : (
        <Panel>
          <List>
            {agents.map((a) => (
              <Row key={a.customerId + a.slug}>
                <Flex between>
                  <div>
                    <strong>{a.name}</strong> {a.suspended && <Badge tone="warn">Suspendu</Badge>}
                    <div><Muted>{a.email} · {FUNCTIONS.find((f) => f.slug === a.slug)?.label ?? "Agent"} · zone : {a.zone ?? "—"}</Muted></div>
                    <div style={{ fontFamily: "monospace" }}>{a.code ?? "—"}</div>
                  </div>
                  <Flex>
                    <Btn variant="secondary" disabled={action.busy} onClick={() => suspend(a, !a.suspended)}>{a.suspended ? "Réactiver" : "Suspendre"}</Btn>
                    <Btn variant="danger" disabled={action.busy} onClick={() => confirm(`Retirer la fonction d'agent à ${a.name} ?`) && revoke(a)}>Retirer</Btn>
                  </Flex>
                </Flex>
              </Row>
            ))}
          </List>
        </Panel>
      ))}
      <Notice tone="neutral" title="Suspendre plutôt que retirer">
        Un agent suspendu reste connu : la page de vérification répond alors qu&apos;il ne faut rien lui remettre. Un agent retiré devient « inconnu », ce qui se lit comme une faute de frappe et pousse le client à réessayer — alors que la bonne réponse est de ne rien remettre.
      </Notice>
    </Page>
  );
}
