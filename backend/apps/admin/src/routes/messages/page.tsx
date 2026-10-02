/*
  PAGE : la boîte de réception de MACHE.

  Ordre de la pile : ce qui attend MACHE d'abord, et dans ce groupe LE
  PLUS ANCIEN EN PREMIER (on traite une file d'attente par son début).
  Le tri vient du backend.

  Liste et conversation sont sur la même page : on ouvre une conversation
  sans quitter l'écran.
*/
import { useEffect, useState } from "react";
import { Badge, Btn, Empty, Feedback, Field, Flex, List, Loading, Muted, Notice, Page, Panel, Row, api, useAction, useLoad, type Tone } from "../../lib/kit";

export const config = { label: "Messages", rank: 1, nested: "/mache" };

const CATEGORY: Record<string, string> = { question: "Question", commande: "Commande", boutique: "Boutique", signalement: "Signalement", autre: "Autre" };
const STATUS: Record<string, string> = { open: "À traiter", answered: "Répondu", closed: "Close" };
const TONE: Record<string, Tone> = { open: "warn", answered: "info", closed: "neutral" };
const FILTERS = [{ key: "", label: "Tout" }, { key: "open", label: "À traiter" }, { key: "answered", label: "Répondu" }, { key: "closed", label: "Closes" }];

type Message = { id: string; author: string; author_name: string; body: string; internal: boolean; created_at: string | null };
type Thread = {
  id: string; display_id: number; subject: string; category: string; from_name: string; from_email: string; from_phone: string | null;
  customer_id: string | null; status: string; awaiting_mache: boolean; awaiting_sender: boolean; last_message_at: string | null; messages?: Message[];
};

const when = (v: string | null) => {
  const d = v ? new Date(v) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }) : "";
};

function Conversation({ id, back }: { id: string; back: () => void }) {
  const { data, error, loading, reload } = useLoad<{ thread?: Thread }>(`/admin/mache/messages/${encodeURIComponent(id)}`);
  const me = useLoad<{ user?: { first_name?: string; last_name?: string; email?: string } }>("/admin/users/me");
  const action = useAction();
  const [reply, setReply] = useState("");
  const [note, setNote] = useState("");

  const thread = data?.thread;
  const closed = thread?.status === "closed";
  const author = [me.data?.user?.first_name, me.data?.user?.last_name].filter(Boolean).join(" ") || me.data?.user?.email || "MACHE";

  const post = async (body: Record<string, unknown>, ok: string, clear?: () => void) => {
    if (await action.run(() => api(`/admin/mache/messages/${encodeURIComponent(id)}`, { method: "POST", body }), ok)) {
      clear?.();
      reload();
    }
  };

  return (
    <Page title={thread?.subject ?? "Conversation"} subtitle={thread ? `n° ${thread.display_id} · ${CATEGORY[thread.category] ?? thread.category}` : undefined} actions={<Btn variant="secondary" onClick={back}>Tous les messages</Btn>}>
      <Feedback message={action.message} />
      <Loading error={error} loading={loading} />
      {thread && (
        <>
          <Panel title="Qui écrit">
            <p style={{ margin: 0 }}><Muted>Nom : </Muted>{thread.from_name}</p>
            <p style={{ margin: 0 }}><Muted>E-mail : </Muted>{thread.from_email}</p>
            {thread.from_phone && <p style={{ margin: 0 }}><Muted>Téléphone : </Muted><a href={`tel:${thread.from_phone}`}>{thread.from_phone}</a></p>}
            <p style={{ margin: 0 }}><Muted>Compte : </Muted>{thread.customer_id ? "Client connecté — il retrouvera la conversation dans son espace." : "Sans compte — il n'a que son lien privé pour revenir."}</p>
            <div style={{ marginTop: 10 }}>
              <Flex>
                <Badge tone={TONE[thread.status]}>{STATUS[thread.status]}</Badge>
                {thread.awaiting_mache && <Badge tone="warn">Attend MACHE</Badge>}
                {thread.awaiting_sender && <Badge tone="info">N&apos;a pas encore lu notre réponse</Badge>}
              </Flex>
            </div>
          </Panel>

          <Panel title="Le fil">
            <List>
              {(thread.messages ?? []).map((m) => (
                <Row key={m.id}>
                  <Muted>
                    <strong>{m.internal ? `Note interne — ${m.author_name}` : m.author === "mache" ? "MACHE" : m.author_name}</strong>
                    {m.created_at ? ` · ${when(m.created_at)}` : ""}
                  </Muted>
                  <p style={{ margin: "6px 0 0", whiteSpace: "pre-wrap" }}>{m.body}</p>
                </Row>
              ))}
            </List>
          </Panel>

          {!closed && (
            <Panel title="Répondre" description="Ce message s'affichera dans la conversation de la personne.">
              <Field label="Votre réponse" multiline value={reply} onChange={setReply} />
              <div style={{ marginTop: 10 }}>
                <Btn disabled={action.busy || reply.trim().length < 2} onClick={() => post({ action: "reply", message: reply.trim() }, "Réponse enregistrée. Elle s'affichera dans la conversation — la personne en est prévenue par e-mail.", () => setReply(""))}>Envoyer la réponse</Btn>
              </div>
            </Panel>
          )}

          <Panel title="Note interne" description="Elle reste ici. La personne ne la verra jamais.">
            <Field label="Ce que vous voulez noter" hint="Ce que vous avez vérifié, ce qui reste à faire, à qui passer le dossier." multiline value={note} onChange={setNote} />
            <div style={{ marginTop: 10 }}>
              <Btn variant="secondary" disabled={action.busy || note.trim().length < 2} onClick={() => post({ action: "note", message: note.trim(), author_name: author }, "Note interne ajoutée.", () => setNote(""))}>Ajouter la note</Btn>
            </div>
          </Panel>

          <Panel title={closed ? "Rouvrir" : "Clore"} description={closed ? "La personne pourra de nouveau écrire dans cette conversation." : "La personne ne pourra plus y répondre ; elle devra en ouvrir une nouvelle."}>
            <Btn variant="secondary" disabled={action.busy} onClick={() => post({ action: closed ? "reopen" : "close" }, closed ? "Conversation rouverte." : "Conversation close.")}>
              {closed ? "Rouvrir la conversation" : "Clore la conversation"}
            </Btn>
          </Panel>
        </>
      )}
    </Page>
  );
}

export default function MessagesPage() {
  const [status, setStatus] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const { data, error, loading, reload } = useLoad<{ threads?: Thread[]; waiting?: number }>(`/admin/mache/messages${status ? `?status=${status}` : ""}`);

  useEffect(() => { if (!open) reload(); }, [open, reload]);

  if (open) return <Conversation id={open} back={() => setOpen(null)} />;

  const threads = data?.threads ?? [];
  const waiting = Number(data?.waiting) || 0;

  return (
    <Page
      title="Messages"
      subtitle={data ? `${waiting} conversation${waiting > 1 ? "s" : ""} attend${waiting > 1 ? "ent" : ""} une réponse de MACHE.` : undefined}
      actions={<Flex gap={6}>{FILTERS.map((f) => <Btn key={f.key || "all"} variant={f.key === status ? "primary" : "secondary"} onClick={() => setStatus(f.key)}>{f.label}</Btn>)}</Flex>}
    >
      <Notice tone="warn" title="Le demandeur est prévenu par e-mail">
        Chaque réponse (pas les notes internes) envoie un e-mail au demandeur avec le lien de la conversation ; le texte de la réponse n&apos;y figure pas. Un e-mail peut finir dans les indésirables : pour les urgences, le téléphone laissé par le demandeur reste le canal le plus sûr.
      </Notice>
      <Loading error={error} loading={loading} />
      {data && (threads.length === 0 ? (
        <Empty title="Aucun message">{status ? "Aucune conversation dans cet état." : "Personne n'a encore écrit à MACHE."}</Empty>
      ) : (
        <Panel title={`${threads.length} conversation${threads.length > 1 ? "s" : ""}`}>
          <List>
            {threads.map((t) => (
              <Row key={t.id} highlight={t.awaiting_mache}>
                <Flex between>
                  <div>
                    <strong style={{ cursor: "pointer" }} onClick={() => setOpen(t.id)}>{t.subject}</strong>
                    <div><Muted>{t.from_name} · {t.from_email}{t.from_phone ? ` · ${t.from_phone}` : ""}</Muted></div>
                    <div><Muted>{CATEGORY[t.category] ?? t.category} · dernier message le {when(t.last_message_at)}</Muted></div>
                  </div>
                  <Flex>
                    {t.awaiting_mache && <Badge tone="warn">Attend MACHE</Badge>}
                    <Badge tone={TONE[t.status]}>{STATUS[t.status]}</Badge>
                    <Btn variant="secondary" onClick={() => setOpen(t.id)}>Ouvrir</Btn>
                  </Flex>
                </Flex>
              </Row>
            ))}
          </List>
        </Panel>
      ))}
    </Page>
  );
}
