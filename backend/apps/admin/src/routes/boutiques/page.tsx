/*
  PAGE : les boutiques — décisions et invitations.

  Approuver ET vérifier sont deux décisions distinctes : approuver ouvre
  la boutique à la vente ; vérifier affirme aux acheteurs que MACHE a
  contrôlé les documents (champ `is_premium`, que le vendeur ne peut pas
  s'attribuer). Suspendre et résilier passent par les routes dédiées de
  Mercur (elles exécutent leur workflow) et exigent un motif écrit :
  rien n'est supprimé, les commandes et commissions dues sont conservées.
*/
import { useState } from "react";
import { Badge, Btn, Empty, Feedback, Field, Flex, List, Loading, Muted, Notice, Page, Panel, Row, api, formatDate, useAction, useLoad, type Tone } from "../../lib/kit";

export const config = { label: "Boutiques : décisions", rank: 4, nested: "/mache" };

const STATUS: Record<string, { label: string; tone: Tone }> = {
  pending_approval: { label: "Attend votre décision", tone: "warn" },
  open: { label: "Ouverte", tone: "ok" },
  active: { label: "Ouverte", tone: "ok" },
  suspended: { label: "Suspendue", tone: "neutral" },
  terminated: { label: "Résiliée", tone: "neutral" },
  rejected: { label: "Refusée", tone: "error" },
};

type Seller = { id: string; name?: string; handle?: string; email?: string; status?: string; is_premium?: boolean; created_at?: string };

export default function StoresPage() {
  const { data, error, loading, reload } = useLoad<{ sellers?: Seller[] }>("/admin/sellers?limit=200");
  const action = useAction();
  const [invite, setInvite] = useState({ email: "", name: "", note: "" });
  const [openInvite, setOpenInvite] = useState(false);
  const [target, setTarget] = useState<Seller | null>(null);
  const [reason, setReason] = useState("");

  const sellers = [...(data?.sellers ?? [])].sort((a, b) => (a.status === "pending_approval" ? 0 : 1) - (b.status === "pending_approval" ? 0 : 1));

  const post = async (path: string, body: unknown, ok: string) => {
    if (await action.run(() => api(path, { method: "POST", body }), ok)) {
      reload();
      return true;
    }
    return false;
  };

  const sendInvite = async () => {
    if (!invite.email.trim()) return action.run(async () => { throw new Error("Indiquez l'e-mail du vendeur."); }, "");
    if (await post("/admin/mache/seller-invites", { email: invite.email.trim(), name: invite.name.trim(), note: invite.note.trim() }, "Invitation envoyée. Le vendeur crée lui-même son compte ; sa boutique reste soumise à votre approbation.")) setInvite({ email: "", name: "", note: "" });
  };

  const stop = async (mode: "suspend" | "terminate") => {
    if (!target) return;
    if (reason.trim().length < 5) return action.run(async () => { throw new Error("Dites en une phrase pourquoi. Sans motif, cette décision sera indéfendable dans six mois."); }, "");
    if (await post(`/admin/sellers/${encodeURIComponent(target.id)}/${mode}`, { reason: reason.trim() }, mode === "suspend" ? "Boutique suspendue." : "Boutique résiliée.")) { setTarget(null); setReason(""); }
  };

  return (
    <Page title="Boutiques : décisions" subtitle={data ? `${sellers.length} inscrite${sellers.length > 1 ? "s" : ""} sur la marketplace.` : undefined}>
      <Feedback message={action.message} />
      <Loading error={error} loading={loading} />

      <Panel>
        <Btn variant="secondary" onClick={() => setOpenInvite(!openInvite)}>{openInvite ? "Fermer" : "+ Inviter un vendeur"}</Btn>
        {openInvite && (
          <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
            <Field label="E-mail du vendeur" type="email" value={invite.email} onChange={(v) => setInvite({ ...invite, email: v })} />
            <Field label="Son nom (facultatif)" value={invite.name} onChange={(v) => setInvite({ ...invite, name: v })} />
            <Field label="Message personnel (facultatif)" multiline value={invite.note} onChange={(v) => setInvite({ ...invite, note: v.slice(0, 600) })} />
            <Muted>Il reçoit un e-mail avec le lien d&apos;inscription et crée lui-même son compte. Sa boutique reste soumise à votre approbation.</Muted>
            <div><Btn disabled={action.busy} onClick={sendInvite}>Envoyer l&apos;invitation</Btn></div>
          </div>
        )}
      </Panel>

      {target && (
        <Panel title={`Suspendre « ${target.name} »`}>
          <p style={{ marginTop: 0 }}>La boutique disparaît du site et ne peut plus vendre. Ses commandes passées et les commissions qu&apos;elle doit à MACHE sont conservées — rien n&apos;est supprimé, et la décision se revient.</p>
          <Field label="Pourquoi ?" hint="Le motif est enregistré. Dans six mois, une suspension sans raison écrite est indéfendable si le vendeur la conteste." multiline value={reason} onChange={setReason} />
          <div style={{ marginTop: 10 }}>
            <Flex>
              <Btn variant="danger" disabled={action.busy} onClick={() => stop("suspend")}>Suspendre</Btn>
              <Btn variant="secondary" disabled={action.busy} onClick={() => stop("terminate")}>Résilier définitivement</Btn>
              <Btn variant="secondary" onClick={() => { setTarget(null); setReason(""); }}>Annuler</Btn>
            </Flex>
          </div>
        </Panel>
      )}

      {data && (sellers.length === 0 ? <Empty title="Aucune boutique inscrite." /> : (
        <Panel>
          <List>
            {sellers.map((s) => {
              const st = STATUS[s.status ?? ""] ?? { label: s.status ?? "—", tone: "neutral" as Tone };
              const stopped = s.status === "suspended" || s.status === "terminated";

              return (
                <Row key={s.id} highlight={s.status === "pending_approval"}>
                  <Flex between>
                    <div>
                      <strong>{s.name}</strong> <Badge tone={st.tone}>{st.label}</Badge> {s.is_premium && <Badge tone="ok">✓ Vérifiée</Badge>}
                      <div><Muted>{s.email ?? "—"}{s.handle ? ` · /store/${s.handle}` : ""} · inscrite le {formatDate(s.created_at)}</Muted></div>
                    </div>
                    <Flex>
                      {s.status === "pending_approval" && <Btn disabled={action.busy} onClick={() => post(`/admin/sellers/${encodeURIComponent(s.id)}/approve`, {}, "Boutique approuvée. Ses produits entrent dans le catalogue.")}>Approuver</Btn>}
                      <Btn variant="secondary" disabled={action.busy} onClick={() => post(`/admin/sellers/${encodeURIComponent(s.id)}`, { is_premium: !s.is_premium }, s.is_premium ? "Vérification retirée. Le badge n'apparaît plus." : "Boutique vérifiée. Le badge apparaît sur sa page et ses fiches produit.")}>{s.is_premium ? "Retirer la vérification" : "Marquer vérifiée"}</Btn>
                      {stopped ? (
                        <Btn variant="secondary" disabled={action.busy} onClick={() => post(`/admin/sellers/${encodeURIComponent(s.id)}/${s.status === "terminated" ? "unterminate" : "unsuspend"}`, {}, "Boutique rétablie.")}>Rétablir</Btn>
                      ) : (
                        <Btn variant="secondary" onClick={() => { setTarget(s); setReason(""); }}>Suspendre</Btn>
                      )}
                    </Flex>
                  </Flex>
                </Row>
              );
            })}
          </List>
        </Panel>
      ))}
      <Notice tone="neutral" title="Approuver, suspendre, vérifier">
        Approuver ouvre la boutique à la vente ; vérifier affirme aux acheteurs que vous avez contrôlé les documents de l&apos;entreprise. Une boutique peut vendre sans être vérifiée. Suspendre et résilier exigent un motif et ne suppriment rien. Les changements touchent le site en moins de cinq minutes.
      </Notice>
    </Page>
  );
}
