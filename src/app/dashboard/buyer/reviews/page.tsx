/*
  PAGE : Espace client — noter mes achats

  Sert à :
  - lister les achats livrés que le client peut encore noter ;
  - déposer une note et un commentaire ;
  - relire les avis déjà publiés.

  Seuls les achats livrés apparaissent : noter un article jamais reçu
  n'aurait pas de sens, et la marketplace perdrait la valeur de ses notes.
*/

import { requireBuyer } from "@/lib/buyer";
import { fetchReviewableItems } from "@/lib/reviews";
import { formatDate } from "@/lib/seller";
import { PageHeader, Panel, Button, EmptyState, Notice, Badge } from "@/components/seller/ui";
import { submitReviewAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function BuyerReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; published?: string }>;
}) {
  const { error, published } = await searchParams;

  const { supabase, uid } = await requireBuyer("/dashboard/buyer/reviews");

  const [{ items, error: itemsError }, mine] = await Promise.all([
    fetchReviewableItems(uid),
    supabase
      .from("reviews")
      .select("id, rating, title, body, created_at, product_id, seller_reply")
      .eq("author_id", uid)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const myReviews = mine.data ?? [];

  return (
    <>
      <PageHeader
        title="Mes avis"
        subtitle="Notez les articles que vous avez reçus. Votre avis aide les autres clients."
      />

      <div className="space-y-4">
        {published && (
          <Notice tone="info" title="Avis publié">
            Merci. Votre avis est visible sur la fiche du produit.
          </Notice>
        )}

        {error && <Notice tone="warning" title="Avis non enregistré">{error}</Notice>}

        {itemsError && (
          <Notice tone="warning" title="Achats indisponibles">
            {itemsError.message}. Les migrations 0001 et 0004 doivent être
            appliquées à la base.
          </Notice>
        )}

        <Panel
          title="En attente de votre note"
          description={`${items.length} article${items.length > 1 ? "s" : ""} livré${items.length > 1 ? "s" : ""} et pas encore noté${items.length > 1 ? "s" : ""}`}
          padded={false}
        >
          {items.length === 0 ? (
            <EmptyState
              title="Rien à noter pour le moment"
              description="Les articles apparaissent ici une fois la commande livrée. Vous pourrez alors laisser une note et un commentaire."
              action={<Button href="/dashboard/buyer/orders" variant="primary">Voir mes commandes</Button>}
            />
          ) : (
            <ul className="divide-y divide-[#e3e6e6]">
              {items.map((item) => (
                <li key={item.orderItemId} className="p-4">
                  <div className="flex flex-wrap items-start gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl || "/placeholder-product.png"}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-[6px] border border-[#e3e6e6] object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold">{item.title}</p>
                      <p className="mt-0.5 text-[11.5px] text-[#565959]">
                        {item.orderReference ? `${item.orderReference} · ` : ""}
                        commandé le {formatDate(item.orderedAt)}
                      </p>
                    </div>
                  </div>

                  <form action={submitReviewAction} className="mt-3 grid gap-2.5">
                    <input type="hidden" name="order_item_id" value={item.orderItemId} />

                    <div className="flex flex-wrap items-center gap-3">
                      <label className="text-[12px] font-semibold" htmlFor={`rating-${item.orderItemId}`}>
                        Votre note
                      </label>
                      <select
                        id={`rating-${item.orderItemId}`}
                        name="rating"
                        required
                        defaultValue=""
                        className="rounded-[3px] border border-[#8d9096] bg-white px-2 py-1 text-[12.5px]"
                      >
                        <option value="" disabled>Choisir</option>
                        <option value="5">★★★★★ — Excellent</option>
                        <option value="4">★★★★ — Bien</option>
                        <option value="3">★★★ — Correct</option>
                        <option value="2">★★ — Décevant</option>
                        <option value="1">★ — Mauvais</option>
                      </select>
                    </div>

                    <input
                      name="title"
                      placeholder="Résumez votre avis en une ligne (facultatif)"
                      maxLength={120}
                      className="rounded-[3px] border border-[#d5d9d9] px-2.5 py-1.5 text-[12.5px] outline-none focus:border-[#d2162c]"
                    />

                    <textarea
                      name="body"
                      rows={3}
                      maxLength={2000}
                      placeholder="Ce qui vous a plu, ce qui pourrait être amélioré, la conformité à la description..."
                      className="rounded-[3px] border border-[#d5d9d9] px-2.5 py-1.5 text-[12.5px] outline-none focus:border-[#d2162c]"
                    />

                    <div>
                      <Button type="submit" variant="primary" size="sm">
                        Publier mon avis
                      </Button>
                    </div>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Mes avis publiés" padded={false}>
          {myReviews.length === 0 ? (
            <EmptyState
              title="Aucun avis publié"
              description="Vos avis apparaîtront ici après publication."
            />
          ) : (
            <ul className="divide-y divide-[#e3e6e6]">
              {myReviews.map((review) => (
                <li key={review.id} className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[#d4962a]">
                      {"★".repeat(Number(review.rating) || 0)}
                    </span>
                    {review.title && (
                      <span className="text-[13px] font-semibold">{review.title}</span>
                    )}
                    <span className="text-[11.5px] text-[#767676]">
                      {formatDate(review.created_at)}
                    </span>
                    {review.seller_reply && <Badge tone="info">Réponse reçue</Badge>}
                  </div>

                  {review.body && (
                    <p className="mt-1.5 whitespace-pre-line text-[12.5px] leading-relaxed text-[#565959]">
                      {review.body}
                    </p>
                  )}

                  {review.product_id && (
                    <Button href={`/product/${review.product_id}`} size="sm">
                      Voir le produit
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
