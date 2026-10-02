/*
  PAGE : comptes professionnels (hôtels, écoles, restaurants, entreprises).

  Une fois validés, ils voient les grossistes et peuvent leur demander
  des devis, sans vendre sur MACHE. Les vendeurs y ont accès d'office.
*/
import { useState } from "react";
import { Btn, Empty, Feedback, Flex, List, Loading, Muted, Notice, Page, Panel, Row, api, formatDate, useAction, useLoad } from "../../lib/kit";

export const config = { label: "Comptes professionnels", rank: 7, nested: "/mache" };

const TYPES: Record<string, string> = { hotel: "Hôtel", restaurant: "Restaurant", ecole: "École", entreprise: "Entreprise", ong: "ONG / association", commerce: "Commerce", autre: "Autre" };

type Pro = { id: string; email?: string; name?: string; status?: string; refused_reason?: string | null; request?: { organisation?: string; type?: string; city?: string; phone?: string; note?: string; requested_at?: string } | null };

function Pending({ pro, decide, busy }: { pro: Pro; decide: (id: string, action: string, reason: string, ok: string) => void; busy: boolean }) {
  const [reason, setReason] = useState("");
  const r = pro.request ?? {};

  return (
    <Row>
      <strong>{r.organisation ?? "—"}</strong> <Muted>· {r.type ? TYPES[r.type] ?? r.type : "—"} · {r.city ?? "—"}</Muted>
      <div><Muted>{pro.name || "—"} — {pro.email} — {r.phone ?? "pas de téléphone"} — demande du {formatDate(r.requested_at)}</Muted></div>
      {r.note && <p style={{ margin: "8px 0", padding: "8px 10px", borderRadius: 8, background: "var(--bg-subtle)" }}>{r.note}</p>}
      <Flex>
        <Btn disabled={busy} onClick={() => decide(pro.id, "approve", "", "Compte professionnel accordé. Le client est prévenu par e-mail.")}>Accorder</Btn>
        <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} placeholder="Motif du refus (envoyé au client)" style={{ flex: 1, minWidth: 240, padding: "7px 10px", borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--bg-field)", color: "var(--fg-base)" }} />
        <Btn variant="danger" disabled={busy || reason.trim().length < 3} onClick={() => decide(pro.id, "refuse", reason.trim(), "Demande refusée. Le motif est envoyé au client par e-mail.")}>Refuser</Btn>
      </Flex>
    </Row>
  );
}

export default function ProsPage() {
  const { data, error, loading, reload } = useLoad<{ pros?: Pro[]; group_ready?: boolean }>("/admin/mache/pros");
  const action = useAction();

  const decide = async (id: string, act: string, reason: string, ok: string) => {
    if (await action.run(() => api(`/admin/mache/pros/${encodeURIComponent(id)}`, { method: "POST", body: { action: act, reason } }), ok)) reload();
  };

  const pros = data?.pros ?? [];
  const pending = pros.filter((p) => p.status === "pending");
  const approved = pros.filter((p) => p.status === "approved");
  const refused = pros.filter((p) => p.status === "refused");

  return (
    <Page title="Comptes professionnels" subtitle="Hôtels, écoles, restaurants, entreprises : une fois validés, ils voient les grossistes et peuvent leur demander des devis, sans vendre sur MACHE. Les vendeurs y ont accès d'office.">
      <Feedback message={action.message} />
      <Loading error={error} loading={loading} />
      {data && data.group_ready === false && <Notice tone="warn">Le groupe des acheteurs professionnels n&apos;existe pas encore : il est créé au démarrage du backend. Redémarrez-le (Render → Manual Deploy), puis revenez ici.</Notice>}
      {data && (
        <>
          <Panel title={`À décider${pending.length ? ` (${pending.length})` : ""}`}>
            {pending.length === 0 ? <Empty title="Aucune demande en attente." /> : <List>{pending.map((p) => <Pending key={p.id} pro={p} decide={decide} busy={action.busy} />)}</List>}
          </Panel>
          <Panel title={`Comptes actifs (${approved.length})`}>
            {approved.length === 0 ? <Empty title="Aucun compte professionnel actif." /> : (
              <List>
                {approved.map((p) => (
                  <Row key={p.id}>
                    <Flex between>
                      <div>
                        <strong>{p.request?.organisation ?? p.name}</strong>
                        <div><Muted>{p.request?.type ? TYPES[p.request.type] ?? p.request.type : ""}{p.request?.city ? ` · ${p.request.city}` : ""} — {p.email}{p.request?.phone ? ` — ${p.request.phone}` : ""}</Muted></div>
                      </div>
                      <Btn variant="secondary" disabled={action.busy} onClick={() => confirm(`Retirer le compte professionnel de ${p.email} ?`) && decide(p.id, "revoke", "", "Compte professionnel retiré. La personne reste cliente de MACHE.")}>Retirer</Btn>
                    </Flex>
                  </Row>
                ))}
              </List>
            )}
          </Panel>
          {refused.length > 0 && (
            <Panel title={`Refusées ou retirées (${refused.length})`}>
              <List>{refused.map((p) => <Row key={p.id}><strong>{p.request?.organisation ?? p.name}</strong> <Muted>— {p.email}{p.refused_reason ? ` — « ${p.refused_reason} »` : ""}</Muted></Row>)}</List>
            </Panel>
          )}
        </>
      )}
    </Page>
  );
}
