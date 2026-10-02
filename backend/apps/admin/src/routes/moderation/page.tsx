/*
  PAGE : modération des avis et des articles.

  RIEN N'EST SUPPRIMÉ : un avis masqué disparaît du site mais reste ici
  (la décision doit pouvoir s'expliquer), un article retiré garde ses
  commandes lisibles. « Retiré » n'est pas « brouillon » : un brouillon
  est un article que le vendeur n'a pas fini ; un article retiré est un
  article que MACHE a écarté.
*/
import { useState } from "react";
import { Badge, Btn, Empty, Feedback, Field, Flex, List, Loading, Muted, Notice, Page, Panel, Row, api, formatDate, useAction, useLoad, type Tone } from "../../lib/kit";

export const config = { label: "Modération", rank: 5, nested: "/mache" };

const REVIEW: Record<string, { label: string; tone: Tone }> = { pending: { label: "En attente", tone: "warn" }, published: { label: "Visible sur le site", tone: "ok" }, rejected: { label: "Masqué par MACHE", tone: "error" } };
const PRODUCT: Record<string, { label: string; tone: Tone }> = { draft: { label: "Brouillon du vendeur", tone: "neutral" }, proposed: { label: "Proposé", tone: "warn" }, published: { label: "En vente", tone: "ok" }, rejected: { label: "Retiré par MACHE", tone: "error" } };

type Review = { id: string; rating?: number; customer_note?: string | null; seller_note?: string | null; status?: string; reference?: string; created_at?: string };
type Product = { id: string; title?: string; handle?: string; status?: string; thumbnail?: string | null };

export default function ModerationPage() {
  const reviews = useLoad<{ reviews?: Review[] }>("/admin/reviews?limit=100&order=-created_at");
  const action = useAction();
  const [term, setTerm] = useState("");
  const [products, setProducts] = useState<Product[] | null>(null);

  const list = [...(reviews.data?.reviews ?? [])].sort((a, b) => (a.status === "pending" ? 0 : 1) - (b.status === "pending" ? 0 : 1));

  const searchProducts = async (q: string) => {
    await action.run(async () => {
      const r = await api<{ products?: Product[] }>(`/admin/products?limit=50&order=-created_at&q=${encodeURIComponent(q)}`);
      setProducts(r.products ?? []);
    }, "");
  };

  const setReview = async (id: string, status: string) => {
    if (await action.run(() => api(`/admin/reviews/${encodeURIComponent(id)}`, { method: "POST", body: { status } }), status === "rejected" ? "Avis masqué." : "Avis rétabli.")) reviews.reload();
  };

  const setProduct = async (id: string, status: string) => {
    if (await action.run(() => api(`/admin/products/${encodeURIComponent(id)}`, { method: "POST", body: { status } }), status === "rejected" ? "Article retiré du site." : "Article remis en vente.")) await searchProducts(term.trim());
  };

  return (
    <Page title="Modération" subtitle="Avis et articles. Rien n'est supprimé : ce qui est retiré reste consultable ici.">
      <Feedback message={action.message} />
      <Panel title="Avis" description="Ceux qui attendent une décision sont en haut.">
        <Loading error={reviews.error} loading={reviews.loading} />
        {reviews.data && (list.length === 0 ? <Empty title="Aucun avis">Personne n&apos;a encore laissé d&apos;avis sur MACHE.</Empty> : (
          <List>
            {list.map((r) => {
              const stars = Math.max(1, Math.min(5, r.rating ?? 1));
              const st = REVIEW[r.status ?? ""] ?? { label: r.status ?? "", tone: "neutral" as Tone };

              return (
                <Row key={r.id}>
                  <Flex between>
                    <div style={{ minWidth: 0 }}>
                      <strong>{"★".repeat(stars)}<span style={{ opacity: 0.3 }}>{"★".repeat(5 - stars)}</span></strong>{" "}
                      <Muted>{r.reference === "seller" ? "sur une boutique" : "sur un article"}{r.created_at ? ` · ${formatDate(r.created_at)}` : ""}</Muted>
                      <p style={{ margin: "6px 0 0", whiteSpace: "pre-wrap" }}>{r.customer_note || <em style={{ opacity: 0.6 }}>Note sans commentaire.</em>}</p>
                      {r.seller_note && <p style={{ margin: "6px 0 0" }}><Muted>Réponse du vendeur : {r.seller_note}</Muted></p>}
                    </div>
                    <Flex>
                      <Badge tone={st.tone}>{st.label}</Badge>
                      <Btn variant={r.status === "rejected" ? "secondary" : "danger"} disabled={action.busy} onClick={() => setReview(r.id, r.status === "rejected" ? "published" : "rejected")}>{r.status === "rejected" ? "Rétablir" : "Masquer"}</Btn>
                    </Flex>
                  </Flex>
                </Row>
              );
            })}
          </List>
        ))}
      </Panel>

      <Panel title="Articles" description="Cherchez l'article à retirer. La liste n'est pas affichée par défaut : on modère un article précis, pas au hasard.">
        <Field label="Nom de l'article" value={term} onChange={setTerm} placeholder="riz, savon, sandales…" />
        <div style={{ marginTop: 10 }}><Btn disabled={action.busy || !term.trim()} onClick={() => searchProducts(term.trim())}>Chercher</Btn></div>
        {products && products.length === 0 && <p><Muted>Aucun article ne correspond à « {term} ».</Muted></p>}
        {products && products.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <List>
              {products.map((p) => {
                const st = PRODUCT[p.status ?? ""] ?? { label: p.status ?? "", tone: "neutral" as Tone };

                return (
                  <Row key={p.id}>
                    <Flex between>
                      <Flex>
                        {p.thumbnail && <img src={p.thumbnail} alt="" loading="lazy" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6, border: "1px solid var(--border-base)" }} />}
                        <div><strong>{p.title}</strong><div><Muted>{p.handle ? `/product/${p.handle}` : ""}</Muted></div></div>
                      </Flex>
                      <Flex>
                        <Badge tone={st.tone}>{st.label}</Badge>
                        <Btn variant={p.status === "rejected" ? "secondary" : "danger"} disabled={action.busy} onClick={() => setProduct(p.id, p.status === "rejected" ? "published" : "rejected")}>{p.status === "rejected" ? "Remettre en vente" : "Retirer du site"}</Btn>
                      </Flex>
                    </Flex>
                  </Row>
                );
              })}
            </List>
          </div>
        )}
      </Panel>

      <Notice tone="neutral" title="Ce que ces gestes font, et ne font pas">
        Rien n&apos;est supprimé : un avis masqué et un article retiré restent consultables ici et la décision se revient. « Retiré » n&apos;est pas « brouillon ». Le vendeur n&apos;est pas prévenu : si le retrait doit être expliqué, écrivez-lui depuis Messages.
      </Notice>
    </Page>
  );
}
