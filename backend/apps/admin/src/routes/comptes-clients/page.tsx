/*
  PAGE : bloquer un compte client.

  Le panneau de Mercur ne propose que de SUPPRIMER un client, ce qui
  emporterait ses commandes et les commissions à facturer. Le blocage
  empêche ce COMPTE d'agir (commander connecté, déposer un avis, écrire
  à MACHE, utiliser l'espace agent) ; il n'empêche pas la PERSONNE de
  revenir. L'appartenance au groupe « comptes bloqués » ne peut être
  modifiée que par l'administration.
*/
import { useState } from "react";
import { Badge, Btn, Empty, Feedback, Field, Flex, List, Muted, Notice, Page, Panel, Row, api, formatDate, useAction } from "../../lib/kit";

export const config = { label: "Bloquer un compte client", rank: 12, nested: "/mache" };

/* Même étiquette que backend/packages/api/src/api/agent-identity.ts (un test les compare). */
const BLOCKED_MARKER = "mache_customer_blocked";

type R = Record<string, unknown>;
type Customer = { id: string; email: string; name: string; blocked: boolean; createdAt: string | null };

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

export default function CustomersPage() {
  const action = useAction();
  const [term, setTerm] = useState("");
  const [found, setFound] = useState<Customer[] | null>(null);

  const search = async (q: string) => {
    if (!q) return setFound([]);
    await action.run(async () => {
      const r = await api<{ customers?: R[] }>(`/admin/customers?q=${encodeURIComponent(q)}&fields=id,email,first_name,last_name,created_at,groups.metadata&limit=20`);
      setFound((r.customers ?? []).map((c) => ({
        id: str(c.id) ?? "",
        email: str(c.email) ?? "",
        name: [str(c.first_name), str(c.last_name)].filter(Boolean).join(" ") || "Sans nom",
        blocked: ((c.groups as R[]) ?? []).some((g) => (g?.metadata as R)?.[BLOCKED_MARKER] === true),
        createdAt: str(c.created_at),
      })));
    }, "");
  };

  const toggle = async (c: Customer) => {
    const block = !c.blocked;
    const ok = await action.run(async () => {
      const { customer_groups } = await api<{ customer_groups?: { id: string; metadata?: R }[] }>("/admin/customer-groups?fields=id,metadata&limit=50");
      const group = (customer_groups ?? []).find((g) => g.metadata?.[BLOCKED_MARKER] === true);
      if (!group?.id) throw new Error("Le groupe « comptes bloqués » n'existe pas encore : sans lui, un blocage ne tiendrait pas. Il est créé au démarrage du backend.");
      await api(`/admin/customer-groups/${group.id}/customers`, { method: "POST", body: block ? { add: [c.id] } : { remove: [c.id] } });
    }, block ? "Compte bloqué. Il ne peut plus commander, déposer d'avis ni écrire à MACHE. Son historique reste lisible." : "Compte débloqué. Il peut de nouveau commander et écrire.");
    if (ok) await search(term.trim());
  };

  return (
    <Page title="Bloquer un compte client" subtitle="Le panneau de Mercur ne propose que de supprimer — ce qui emporterait les commandes, et les commissions qui restent à facturer.">
      <Feedback message={action.message} />
      <Notice tone="warn" title="Ce qu'un blocage ne fait pas">
        Il empêche ce COMPTE d&apos;agir : commander en étant connecté, déposer un avis, écrire à MACHE, se servir de l&apos;espace agent. Il n&apos;empêche pas la PERSONNE de revenir — on peut acheter sans compte, et rien n&apos;interdit d&apos;en créer un autre. Un compte bloqué peut encore lire son historique, ce qui compte pour régler un litige en cours.
      </Notice>
      <Panel title="Chercher un compte">
        <Field label="Adresse e-mail ou nom" hint="La liste n'est pas déroulée : on bloque un compte précis, pas au hasard." value={term} onChange={setTerm} placeholder="adresse@exemple.com" />
        <div style={{ marginTop: 10 }}><Btn disabled={action.busy} onClick={() => search(term.trim())}>Chercher</Btn></div>
        {found && found.length === 0 && <div style={{ marginTop: 12 }}><Empty title="Aucun compte ne correspond">Vérifiez l&apos;adresse. Un acheteur sans compte n&apos;apparaît pas ici : il n&apos;en a pas.</Empty></div>}
        {found && found.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <List>
              {found.map((c) => (
                <Row key={c.id}>
                  <Flex between>
                    <div>
                      <strong>{c.name}</strong> {c.blocked ? <Badge tone="error">Bloqué</Badge> : <Badge tone="ok">Actif</Badge>}
                      <div><Muted>{c.email}{c.createdAt ? ` · inscrit le ${formatDate(c.createdAt)}` : ""}</Muted></div>
                    </div>
                    <Btn variant={c.blocked ? "secondary" : "danger"} disabled={action.busy} onClick={() => toggle(c)}>{c.blocked ? "Débloquer" : "Bloquer ce compte"}</Btn>
                  </Flex>
                </Row>
              ))}
            </List>
          </div>
        )}
      </Panel>
    </Page>
  );
}
