/*
  PAGE : les textes du site (confidentialité, conditions, retours…).

  Chaque texte a des VERSIONS : le texte publié ne bouge plus, une
  correction est une version suivante, et les anciennes ne sont jamais
  supprimées (un client qui a accepté les conditions l'an dernier a
  accepté CE texte-là). Le texte d'origine écrit dans le code du site
  reste le filet : il s'affiche tant qu'aucune version n'est publiée.
  Le site met jusqu'à dix minutes à afficher une version publiée.
*/
import { useState } from "react";
import { Badge, Btn, Feedback, Field, Flex, List, Loading, Muted, Notice, Page, Panel, Row, Select, api, formatDate, useAction, useLoad, type Tone } from "../../lib/kit";

export const config = { label: "Textes du site", rank: 15, nested: "/mache" };

const STATUS: Record<string, { label: string; tone: Tone }> = { draft: { label: "Brouillon", tone: "warn" }, live: { label: "En vigueur", tone: "ok" }, archived: { label: "Version précédente", tone: "neutral" } };

type Policy = { id: string; slug: string; title: string; summary?: string | null; body: string; version: number; content_hash?: string | null; status: string; published_at?: string | null; change_note?: string | null };
type Catalogue = { policies?: Policy[]; pages?: { slug: string; label: string; path: string; hint: string }[] };

type Block = { kind: "heading" | "paragraph"; text: string };
function parse(body: string): Block[] {
  const out: Block[] = [];
  let buf: string[] = [];
  const flush = () => { const t = buf.join(" ").trim(); if (t) out.push({ kind: "paragraph", text: t }); buf = []; };
  for (const line of body.replace(/\r\n?/g, "\n").split("\n")) {
    const t = line.trim();
    if (t.startsWith("##")) { flush(); const h = t.replace(/^#+/, "").trim(); if (h) out.push({ kind: "heading", text: h }); continue; }
    if (!t) { flush(); continue; }
    buf.push(t);
  }
  flush();
  return out;
}

function Version({ id, path, back }: { id: string; path: string; back: () => void }) {
  const { data, error, loading, reload } = useLoad<{ policy?: Policy }>(`/admin/mache/policies/${encodeURIComponent(id)}`);
  const action = useAction();
  const policy = data?.policy;
  const [draft, setDraft] = useState<{ title: string; summary: string; body: string; note: string } | null>(null);
  const [next, setNext] = useState<{ title: string; body: string; note: string } | null>(null);

  const send = async (body: Record<string, unknown>, ok: string, after?: () => void) => {
    if (await action.run(() => api(`/admin/mache/policies/${encodeURIComponent(id)}`, { method: "POST", body }), ok)) { after?.(); reload(); }
  };

  const isDraft = policy?.status === "draft";
  const d = draft ?? (policy ? { title: policy.title, summary: policy.summary ?? "", body: policy.body, note: policy.change_note ?? "" } : null);
  const n = next ?? (policy ? { title: "", body: policy.body, note: "" } : null);

  return (
    <Page title={policy?.title ?? "Texte"} subtitle={policy ? `${policy.slug} · version ${policy.version} · ${STATUS[policy.status]?.label}` : undefined} actions={<Flex><Btn variant="secondary" href={path}>Voir la page</Btn><Btn variant="secondary" onClick={back}>Tous les textes</Btn></Flex>}>
      <Feedback message={action.message} />
      <Loading error={error} loading={loading} />
      {policy && d && n && (
        <>
          <Flex><Badge tone={STATUS[policy.status]?.tone}>{STATUS[policy.status]?.label}</Badge>{policy.change_note && <Muted>{policy.change_note}</Muted>}</Flex>
          {isDraft ? (
            <Panel title="Brouillon" description="Le site ne l'affiche pas encore.">
              <div style={{ display: "grid", gap: 12 }}>
                <Field label="Titre de la page" value={d.title} onChange={(v) => setDraft({ ...d, title: v })} />
                <Field label="Sous-titre" value={d.summary} onChange={(v) => setDraft({ ...d, summary: v })} />
                <Field label="Texte" hint="Une ligne commençant par ## devient un titre de section. Les lignes vides séparent les paragraphes." multiline value={d.body} onChange={(v) => setDraft({ ...d, body: v })} />
                <Field label="Pourquoi cette version ?" hint="Note interne, jamais publiée." value={d.note} onChange={(v) => setDraft({ ...d, note: v })} />
                <div><Btn disabled={action.busy} onClick={() => send({ action: "edit", title: d.title, summary: d.summary, body: d.body, change_note: d.note }, "Brouillon enregistré.", () => setDraft(null))}>Enregistrer le brouillon</Btn></div>
              </div>
              <div style={{ marginTop: 18, borderTop: "1px solid var(--border-base)", paddingTop: 14 }}>
                <Notice tone="warn" title="Publier remplace le texte actuel du site">Cette version deviendra celle que lisent vos visiteurs, et son texte ne sera plus modifiable. La version actuelle passera en archive — elle restera lisible.</Notice>
                <div style={{ marginTop: 10 }}><Btn disabled={action.busy} onClick={() => confirm("Mettre cette version en vigueur sur le site ?") && send({ action: "publish" }, "Version en vigueur. Le site l'affiche d'ici dix minutes au plus.")}>Mettre en vigueur sur le site</Btn></div>
              </div>
            </Panel>
          ) : (
            <Panel title="Texte" description={policy.published_at ? `Publié le ${formatDate(policy.published_at)}.` : undefined}>
              <div style={{ display: "grid", gap: 10, padding: 14, borderRadius: 8, background: "var(--bg-subtle)", border: "1px solid var(--border-base)" }}>
                {parse(policy.body).map((b, i) => b.kind === "heading" ? <h3 key={i} style={{ margin: "6px 0 0" }}>{b.text}</h3> : <p key={i} style={{ margin: 0, color: "var(--fg-subtle)" }}>{b.text}</p>)}
              </div>
              <p><Muted>Empreinte (SHA-256) : {policy.content_hash ?? "—"}</Muted></p>
            </Panel>
          )}
          {!isDraft && (
            <Panel title="Corriger ce texte" description="Le texte publié ne bouge plus. Une correction prend la forme d'une version suivante.">
              <div style={{ display: "grid", gap: 12 }}>
                <Field label="Titre" hint="Vide = le même titre." value={n.title} onChange={(v) => setNext({ ...n, title: v })} />
                <Field label="Nouveau texte" multiline value={n.body} onChange={(v) => setNext({ ...n, body: v })} />
                <Field label="Pourquoi cette version ?" hint="Note interne, jamais publiée." value={n.note} onChange={(v) => setNext({ ...n, note: v })} />
                <Muted>La nouvelle version naîtra en brouillon. Le site continuera d&apos;afficher la version {policy.version} tant que vous ne l&apos;aurez pas publiée.</Muted>
                <div><Btn disabled={action.busy || !n.body.trim()} onClick={() => send({ action: "new_version", body: n.body, title: n.title || undefined, change_note: n.note || undefined }, `Version ${policy.version + 1} créée en brouillon.`, () => setNext(null))}>Créer la version {policy.version + 1}</Btn></div>
              </div>
            </Panel>
          )}
          {policy.status !== "archived" && (
            <Panel title="Retirer cette version" description={policy.status === "live" ? "La page reviendra au texte écrit dans le code du site." : "Ce brouillon sera archivé."}>
              <Btn variant="secondary" disabled={action.busy} onClick={() => confirm("Retirer cette version ?") && send({ action: "archive" }, "Version retirée.")}>Retirer</Btn>
            </Panel>
          )}
        </>
      )}
    </Page>
  );
}

export default function TextsPage() {
  const { data, error, loading, reload } = useLoad<Catalogue>("/admin/mache/policies");
  const action = useAction();
  const [open, setOpen] = useState<string | null>(null);
  const [writing, setWriting] = useState(false);
  const [form, setForm] = useState({ slug: "", title: "", summary: "", body: "", note: "" });

  const pages = data?.pages ?? [];
  const all = data?.policies ?? [];
  const pathOf = (slug: string) => pages.find((p) => p.slug === slug)?.path ?? "/";

  if (open) {
    const slug = all.find((p) => p.id === open)?.slug ?? "";
    return <Version id={open} path={pathOf(slug)} back={() => { setOpen(null); reload(); }} />;
  }

  const create = async () => {
    const slug = form.slug || pages[0]?.slug;
    if (!slug || !form.title.trim() || !form.body.trim()) return action.run(async () => { throw new Error("Page, titre et texte sont obligatoires."); }, "");
    if (await action.run(() => api("/admin/mache/policies", { method: "POST", body: { slug, title: form.title, summary: form.summary || undefined, body: form.body, change_note: form.note || undefined } }), "Brouillon créé. Rien n'est en ligne tant que vous ne l'avez pas publié.")) {
      setWriting(false);
      setForm({ slug: "", title: "", summary: "", body: "", note: "" });
      reload();
    }
  };

  return (
    <Page title="Textes du site" subtitle="Confidentialité, conditions, retours — modifiables sans passer par un développeur." actions={<Btn variant={writing ? "secondary" : "primary"} onClick={() => setWriting(!writing)}>{writing ? "Annuler" : "Écrire une version"}</Btn>}>
      <Feedback message={action.message} />
      <Loading error={error} loading={loading} />
      {writing && pages.length > 0 && (
        <Panel title="Nouvelle version" description="Créée en brouillon : le site continue d'afficher la version actuelle.">
          <div style={{ display: "grid", gap: 12 }}>
            <Select label="Quelle page ?" value={form.slug || pages[0].slug} onChange={(v) => setForm({ ...form, slug: v })} options={pages.map((p) => ({ value: p.slug, label: `${p.label} — ${p.path}` }))} />
            <Field label="Titre de la page" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
            <Field label="Sous-titre" hint="Une phrase sous le titre. Facultative." value={form.summary} onChange={(v) => setForm({ ...form, summary: v })} />
            <Field label="Texte" hint="Une ligne commençant par ## devient un titre de section. Les lignes vides séparent les paragraphes." multiline value={form.body} onChange={(v) => setForm({ ...form, body: v })} />
            <Field label="Pourquoi cette version ?" hint="Note interne, jamais affichée au public." value={form.note} onChange={(v) => setForm({ ...form, note: v })} />
            <div><Btn disabled={action.busy} onClick={create}>Créer le brouillon</Btn></div>
          </div>
        </Panel>
      )}
      {pages.map((page) => {
        const versions = all.filter((p) => p.slug === page.slug).sort((a, b) => b.version - a.version);
        const live = versions.find((p) => p.status === "live");
        const drafts = versions.filter((p) => p.status === "draft");
        const archived = versions.filter((p) => p.status === "archived");

        return (
          <Panel key={page.slug} title={page.label} description={page.hint}>
            <Row>
              <Flex between>
                <div>
                  <strong>{live ? `Version ${live.version} — en vigueur` : "Texte d'origine"}</strong>
                  <div><Muted>{live ? `Depuis le ${formatDate(live.published_at)}${live.change_note ? ` · ${live.change_note}` : ""}` : "Aucune version publiée : le site affiche le texte écrit dans son code."}</Muted></div>
                </div>
                <Flex><a href={page.path} style={{ fontSize: 14 }}>Voir la page</a>{live && <Btn variant="secondary" onClick={() => setOpen(live.id)}>Ouvrir</Btn>}</Flex>
              </Flex>
            </Row>
            {drafts.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <Muted>Brouillon{drafts.length > 1 ? "s" : ""} en attente</Muted>
                <List>{drafts.map((p) => <Row key={p.id} highlight><Flex between><span>Version {p.version}{p.change_note ? ` — ${p.change_note}` : ""}</span><Btn variant="secondary" onClick={() => setOpen(p.id)}>Reprendre</Btn></Flex></Row>)}</List>
              </div>
            )}
            {archived.length > 0 && (
              <details style={{ marginTop: 12 }}>
                <summary style={{ cursor: "pointer" }}><Muted>{archived.length} version{archived.length > 1 ? "s" : ""} précédente{archived.length > 1 ? "s" : ""}</Muted></summary>
                <List>{archived.map((p) => <Row key={p.id}><Flex between><Muted>Version {p.version}{p.published_at ? ` — en vigueur à partir du ${formatDate(p.published_at)}` : ""}</Muted><Btn variant="secondary" onClick={() => setOpen(p.id)}>Lire</Btn></Flex></Row>)}</List>
                <p><Muted>Elles ne sont jamais supprimées : un client qui a accepté les conditions l&apos;an dernier a accepté CE texte-là.</Muted></p>
              </details>
            )}
          </Panel>
        );
      })}
    </Page>
  );
}
