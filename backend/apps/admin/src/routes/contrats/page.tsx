/*
  PAGE : les contrats que MACHE fait accepter à ses marchands.

  Cycle de vie : brouillon (modifiable) → publié (texte FIGÉ, empreinte
  SHA-256) → archivé. Une correction est une version suivante ; les
  signatures déjà recueillies restent attachées à la version signée, mot
  pour mot. Le backend décide si l'état permet le geste demandé.

  « Document à imprimer » : une page propre (blocs de signature, empreinte)
  qui s'ouvre dans une nouvelle fenêtre ; « Enregistrer au format PDF »
  dans la boîte d'impression donne le fichier à envoyer à un service de
  signature.
*/
import { useState } from "react";
import { Badge, Btn, Empty, Feedback, Field, Flex, Grid, List, Loading, Muted, Notice, Page, Panel, Row, Stat, api, formatDate, useAction, useLoad, type Tone } from "../../lib/kit";

export const config = { label: "Contrats", rank: 14, nested: "/mache" };

const STATUS: Record<string, { label: string; tone: Tone }> = { draft: { label: "Brouillon", tone: "warn" }, published: { label: "Publié", tone: "ok" }, archived: { label: "Archivé", tone: "neutral" } };
const SIGN: Record<string, { label: string; tone: Tone }> = { sent: { label: "Envoyé, non lu", tone: "warn" }, viewed: { label: "Lu, sans réponse", tone: "warn" }, signed: { label: "Signé", tone: "ok" }, declined: { label: "Refusé", tone: "error" }, revoked: { label: "Retiré", tone: "neutral" } };

type Contract = { id: string; display_id?: number; title: string; summary?: string | null; body: string; version: number; content_hash?: string | null; status: string; published_at?: string | null; created_at?: string | null };
type Signature = { id: string; seller_id: string; status: string; sent_at?: string; viewed_at?: string; signed_at?: string; declined_at?: string; signer_name?: string; signer_role?: string; signer_ip?: string; decline_reason?: string; proof_hash?: string };
type Seller = { id: string; name?: string; handle?: string; email?: string };

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

function printable(c: Contract, seller?: Seller) {
  const block = (role: string, sub: string) => `<div style="flex:1"><b style="text-transform:uppercase">${role}</b><div style="font-size:12px;color:#555">${sub}</div>${["Nom et prénom", "Qualité", "Date"].map((l) => `<div style="margin-top:14px;font-size:12px;color:#555">${l}<div style="border-bottom:1px solid #000;height:18px"></div></div>`).join("")}<div style="margin-top:14px;font-size:12px;color:#555">Signature (précédée de la mention « lu et approuvé »)<div style="border-bottom:1px solid #000;height:60px"></div></div></div>`;
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${esc(c.title)} — version ${c.version}</title><style>body{font-family:Georgia,serif;max-width:780px;margin:30px auto;padding:0 20px;color:#000;line-height:1.55}h1{text-align:center;text-transform:uppercase}h2{font-size:14px;text-transform:uppercase;margin-top:28px}.k{break-inside:avoid}@media print{.no{display:none}}</style></head><body>
<div class="no" style="background:#eef;padding:10px;border-radius:6px;margin-bottom:16px;font-family:sans-serif;font-size:14px">Imprimez cette page, ou choisissez « Enregistrer au format PDF » dans la boîte d'impression. <button onclick="print()">Imprimer</button></div>
${c.status === "draft" ? `<div class="no" style="background:#fff3cd;padding:10px;border-radius:6px;font-family:sans-serif;font-size:14px">Ce contrat est encore un brouillon : publiez-le avant de le faire signer.</div>` : ""}
<header class="k" style="border-bottom:2px solid #000;display:flex;justify-content:space-between"><b style="font-size:22px;letter-spacing:3px">MACHE</b><span style="font-size:12px">Place de marché haïtienne</span></header>
<h1>${esc(c.title)}</h1><p style="text-align:center;font-size:14px">Version ${c.version}${c.published_at ? ` — établie le ${esc(formatDate(c.published_at))}` : " — brouillon"}</p>
<h2>Entre les soussignés</h2><p><b>MACHE</b>, place de marché en ligne, ci-après désignée « MACHE », d'une part,</p>
<p>${seller ? `<b>${esc(seller.name ?? "")}</b>${seller.email ? ` (${esc(seller.email)})` : ""}, boutique enregistrée sur MACHE sous la référence <code>${esc(seller.handle ?? "")}</code>` : `<span style="display:inline-block;min-width:280px;border-bottom:1px solid #000"></span>, boutique enregistrée sur MACHE`}, ci-après désignée « le Marchand », d'autre part.</p>
${["Forme juridique et siège du Marchand", "Numéro d'immatriculation", "Représenté par (nom et qualité)"].map((l) => `<div style="margin-top:12px;font-size:12px;color:#555">${l}<div style="border-bottom:1px solid #000;height:18px"></div></div>`).join("")}
${c.summary ? `<h2>Objet</h2><p>${esc(c.summary)}</p>` : ""}
<h2>Il a été convenu ce qui suit</h2><div style="white-space:pre-wrap">${esc(c.body)}</div>
<div class="k" style="margin-top:36px;border-top:1px solid #999;padding-top:10px;font-size:12px"><b style="text-transform:uppercase">Référence d'intégrité</b><br>Empreinte numérique du texte ci-dessus (SHA-256) :<br><code style="word-break:break-all">${esc(c.content_hash ?? "— (brouillon non publié)")}</code><br>Recalculée sur le texte conservé par MACHE, elle doit être identique. Toute modification, fût-elle d'un seul caractère, produirait une empreinte différente.</div>
<div class="k" style="margin-top:36px"><h2>Signatures</h2><p style="font-size:12px">Fait en deux exemplaires originaux.</p><div style="display:flex;gap:40px;margin-top:20px">${block("Pour MACHE", "Représentant habilité")}${block("Pour le Marchand", esc(seller?.name ?? "Nom de la boutique"))}</div></div>
<footer class="k" style="margin-top:36px;border-top:1px solid #999;padding-top:8px;font-size:11px;color:#555">Document établi par MACHE. Contrat n° ${c.display_id ?? ""}, version ${c.version}.</footer></body></html>`);
  w.document.close();
  return true;
}

function Detail({ id, back }: { id: string; back: () => void }) {
  const { data, error, loading, reload } = useLoad<{ contract?: Contract }>(`/admin/mache/contracts/${encodeURIComponent(id)}`);
  const contract = data?.contract;
  const published = contract?.status === "published";
  const sigs = useLoad<{ signatures?: Signature[]; tally?: Record<string, number> }>(published ? `/admin/mache/contracts/${encodeURIComponent(id)}/signatures` : null);
  const sellers = useLoad<{ sellers?: Seller[] }>(published ? "/admin/sellers?limit=200" : null);
  const action = useAction();
  const [draft, setDraft] = useState<{ title: string; summary: string; body: string } | null>(null);
  const [next, setNext] = useState<{ title: string; body: string } | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [due, setDue] = useState("");

  const send = async (body: Record<string, unknown>, ok: string, after?: () => void) => {
    if (await action.run(() => api(`/admin/mache/contracts/${encodeURIComponent(id)}`, { method: "POST", body }), ok)) { after?.(); reload(); sigs.reload(); }
  };

  const d = draft ?? (contract ? { title: contract.title, summary: contract.summary ?? "", body: contract.body } : null);
  const n = next ?? (contract ? { title: "", body: contract.body } : null);
  const list = sellers.data?.sellers ?? [];
  const signatures = sigs.data?.signatures ?? [];
  const sellerOf = (sid: string) => list.find((s) => s.id === sid);
  const sent = new Set(signatures.map((s) => s.seller_id));
  const candidates = list.filter((s) => !sent.has(s.id));
  const tally = sigs.data?.tally ?? {};

  return (
    <Page title={contract?.title ?? "Contrat"} subtitle={contract ? `Version ${contract.version} · ${STATUS[contract.status]?.label}` : undefined} actions={<Flex>{contract && <Btn variant="secondary" onClick={() => printable(contract)}>Document à imprimer</Btn>}<Btn variant="secondary" onClick={back}>Tous les contrats</Btn></Flex>}>
      <Feedback message={action.message} />
      <Loading error={error} loading={loading} />
      {contract && d && n && (
        <>
          {contract.status === "draft" ? (
            <Panel title="Brouillon" description="Modifiable tant qu'il n'est pas publié.">
              <div style={{ display: "grid", gap: 12 }}>
                <Field label="Titre" value={d.title} onChange={(v) => setDraft({ ...d, title: v })} />
                <Field label="En une phrase" value={d.summary} onChange={(v) => setDraft({ ...d, summary: v })} />
                <Field label="Texte du contrat" multiline value={d.body} onChange={(v) => setDraft({ ...d, body: v })} />
                <div><Btn disabled={action.busy} onClick={() => send({ action: "edit", ...d }, "Brouillon enregistré.", () => setDraft(null))}>Enregistrer le brouillon</Btn></div>
              </div>
              <div style={{ marginTop: 18, borderTop: "1px solid var(--border-base)", paddingTop: 14 }}>
                <Notice tone="warn" title="Publier fige ce texte définitivement">Après publication, plus personne ne pourra le modifier — pas même depuis la base. Le corriger demandera de créer une version suivante et de la renvoyer. C&apos;est ce qui permet de prouver quel texte un marchand a signé.</Notice>
                <div style={{ marginTop: 10 }}><Btn disabled={action.busy} onClick={() => confirm("Publier et figer ce texte ?") && send({ action: "publish" }, "Contrat publié. Son texte est désormais figé et peut être envoyé.")}>Publier et figer le texte</Btn></div>
              </div>
            </Panel>
          ) : (
            <Panel title="Texte" description={contract.published_at ? `Figé le ${formatDate(contract.published_at)}.` : undefined}>
              <article style={{ whiteSpace: "pre-wrap", padding: 14, borderRadius: 8, background: "var(--bg-subtle)", border: "1px solid var(--border-base)" }}>{contract.body}</article>
              <p><Muted>Empreinte (SHA-256) : {contract.content_hash ?? "—"}</Muted></p>
            </Panel>
          )}

          {published && (
            <>
              <Panel title="Envoyer à des boutiques" description={candidates.length === 0 ? "Toutes les boutiques connues ont déjà reçu ce contrat." : `${candidates.length} boutique(s) ne l'ont pas encore reçu.`}>
                {candidates.length > 0 && (
                  <div style={{ display: "grid", gap: 12 }}>
                    <div style={{ maxHeight: 260, overflowY: "auto", border: "1px solid var(--border-base)", borderRadius: 8 }}>
                      {candidates.map((s) => (
                        <label key={s.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 12px", borderBottom: "1px solid var(--border-base)" }}>
                          <input type="checkbox" checked={picked.includes(s.id)} onChange={(e) => setPicked(e.target.checked ? [...picked, s.id] : picked.filter((x) => x !== s.id))} />
                          <span><strong>{s.name}</strong><br /><Muted>{s.email ?? s.handle}</Muted></span>
                        </label>
                      ))}
                    </div>
                    <Field label="Date limite de réponse" hint="Facultative. Elle s'affiche chez le marchand ; rien ne se déclenche automatiquement à l'échéance." type="date" value={due} onChange={setDue} />
                    <div><Btn disabled={action.busy || picked.length === 0} onClick={async () => { if (await action.run(() => api(`/admin/mache/contracts/${encodeURIComponent(id)}/send`, { method: "POST", body: { seller_ids: picked, due_at: due || undefined } }), `Contrat envoyé à ${picked.length} boutique(s).`)) { setPicked([]); setDue(""); sigs.reload(); } }}>Envoyer aux boutiques cochées</Btn></div>
                  </div>
                )}
              </Panel>

              <Panel title="Réponses">
                {signatures.length === 0 ? <Muted>Ce contrat n&apos;a encore été envoyé à personne.</Muted> : (
                  <>
                    <Grid cols={3}>
                      <Stat label="Signés" value={tally.signed ?? 0} />
                      <Stat label="Lus, sans réponse" value={tally.viewed ?? 0} />
                      <Stat label="Non lus" value={tally.sent ?? 0} />
                      <Stat label="Refusés" value={tally.declined ?? 0} />
                    </Grid>
                    <div style={{ marginTop: 14 }}>
                      <List>
                        {signatures.map((s) => {
                          const st = SIGN[s.status] ?? { label: s.status, tone: "neutral" as Tone };

                          return (
                            <Row key={s.id}>
                              <Flex between>
                                <div>
                                  <strong>{sellerOf(s.seller_id)?.name ?? s.seller_id}</strong>
                                  <div><Muted>{s.signed_at ? `Signé le ${formatDate(s.signed_at)} par ${s.signer_name ?? "—"}${s.signer_role ? ` (${s.signer_role})` : ""}` : s.declined_at ? `Refusé le ${formatDate(s.declined_at)}` : s.viewed_at ? `Lu le ${formatDate(s.viewed_at)}, sans réponse` : `Envoyé le ${formatDate(s.sent_at)}, pas encore ouvert`}</Muted></div>
                                  {s.decline_reason && <div style={{ color: "var(--fg-error)" }}>« {s.decline_reason} »</div>}
                                  {s.proof_hash && <div><Muted>Sceau : {s.proof_hash}{s.signer_ip ? ` · depuis ${s.signer_ip}` : ""}</Muted></div>}
                                </div>
                                <Flex>
                                  <Badge tone={st.tone}>{st.label}</Badge>
                                  <Btn variant="secondary" onClick={() => printable(contract, sellerOf(s.seller_id))}>Document</Btn>
                                  {["sent", "viewed"].includes(s.status) && <Btn variant="secondary" disabled={action.busy} onClick={async () => { if (await action.run(() => api(`/admin/mache/contracts/${encodeURIComponent(id)}/signatures`, { method: "POST", body: { signature_id: s.id } }), "Envoi retiré.")) sigs.reload(); }}>Retirer</Btn>}
                                </Flex>
                              </Flex>
                            </Row>
                          );
                        })}
                      </List>
                    </div>
                  </>
                )}
              </Panel>

              <Panel title="Corriger ce contrat" description="Le texte publié ne bouge plus. Une correction prend la forme d'une version suivante.">
                <div style={{ display: "grid", gap: 12 }}>
                  <Field label="Titre de la nouvelle version" hint="Vide = le même titre." value={n.title} onChange={(v) => setNext({ ...n, title: v })} />
                  <Field label="Nouveau texte" multiline value={n.body} onChange={(v) => setNext({ ...n, body: v })} />
                  <Muted>La nouvelle version naîtra en brouillon. Les signatures déjà recueillies resteront attachées à la version {contract.version}, mot pour mot.</Muted>
                  <div><Btn disabled={action.busy || !n.body.trim()} onClick={() => send({ action: "new_version", body: n.body, title: n.title || undefined }, `Version ${contract.version + 1} créée en brouillon.`, () => setNext(null))}>Créer la version {contract.version + 1}</Btn></div>
                </div>
              </Panel>
            </>
          )}

          {contract.status !== "archived" && (
            <Panel title="Archiver" description="Retire ce contrat de la circulation. Rien n'est supprimé : les signatures restent lisibles.">
              <Btn variant="secondary" disabled={action.busy} onClick={() => confirm("Archiver ce contrat ?") && send({ action: "archive" }, "Contrat archivé. Rien n'a été supprimé.")}>Archiver ce contrat</Btn>
            </Panel>
          )}
        </>
      )}
    </Page>
  );
}

export default function ContractsPage() {
  const { data, error, loading, reload } = useLoad<{ contracts?: Contract[] }>("/admin/mache/contracts?limit=100");
  const action = useAction();
  const [open, setOpen] = useState<string | null>(null);
  const [writing, setWriting] = useState(false);
  const [form, setForm] = useState({ title: "", summary: "", body: "" });

  if (open) return <Detail id={open} back={() => { setOpen(null); reload(); }} />;

  const contracts = data?.contracts ?? [];

  const create = async () => {
    if (!form.title.trim() || !form.body.trim()) return action.run(async () => { throw new Error("Le titre et le texte sont obligatoires."); }, "");
    let id: string | null = null;
    if (await action.run(async () => { const r = await api<{ contract?: Contract }>("/admin/mache/contracts", { method: "POST", body: { title: form.title, summary: form.summary || undefined, body: form.body } }); id = r.contract?.id ?? null; }, "Brouillon créé. Relisez-le avant de le publier.")) {
      setForm({ title: "", summary: "", body: "" });
      setWriting(false);
      if (id) setOpen(id); else reload();
    }
  };

  return (
    <Page title="Contrats" subtitle="Ce que MACHE fait accepter à ses marchands." actions={<Btn variant={writing ? "secondary" : "primary"} onClick={() => setWriting(!writing)}>{writing ? "Annuler" : "Écrire un contrat"}</Btn>}>
      <Feedback message={action.message} />
      <Loading error={error} loading={loading} />
      {writing && (
        <Panel title="Nouveau contrat" description="Il sera créé en brouillon : rien n'est envoyé tant que vous ne l'avez pas publié.">
          <Notice tone="warn" title="Ce texte deviendra immuable">Une fois publié, un contrat ne se modifie plus. Le corriger crée une nouvelle version, qu&apos;il faut renvoyer. C&apos;est ce qui permet de prouver, plus tard, quel texte un marchand a signé.</Notice>
          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            <Field label="Titre" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
            <Field label="En une phrase" hint="Ce que le marchand lit avant d'ouvrir le contrat." value={form.summary} onChange={(v) => setForm({ ...form, summary: v })} />
            <Field label="Texte du contrat" hint="Les sauts de ligne et les alinéas sont conservés tels quels." multiline value={form.body} onChange={(v) => setForm({ ...form, body: v })} />
            <div><Btn disabled={action.busy} onClick={create}>Créer le brouillon</Btn></div>
          </div>
        </Panel>
      )}
      {data && contracts.length === 0 && !writing && <Empty title="Aucun contrat">Rien n&apos;a encore été écrit.</Empty>}
      {contracts.length > 0 && (
        <Panel title={`${contracts.length} contrat${contracts.length > 1 ? "s" : ""}`}>
          <List>
            {contracts.map((c) => (
              <Row key={c.id}>
                <Flex between>
                  <div>
                    <strong style={{ cursor: "pointer" }} onClick={() => setOpen(c.id)}>{c.title}</strong>
                    <div><Muted>Version {c.version}{c.published_at ? ` · publié le ${formatDate(c.published_at)}` : ` · créé le ${formatDate(c.created_at)}`}</Muted></div>
                  </div>
                  <Flex><Badge tone={STATUS[c.status]?.tone}>{STATUS[c.status]?.label}</Badge><Btn variant="secondary" onClick={() => setOpen(c.id)}>Ouvrir</Btn></Flex>
                </Flex>
              </Row>
            ))}
          </List>
        </Panel>
      )}
    </Page>
  );
}
