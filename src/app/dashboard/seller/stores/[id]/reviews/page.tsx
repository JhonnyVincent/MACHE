/*
  PAGE : Espace vendeur — avis d'une boutique

  Sert à :
  - afficher la note moyenne de la boutique et sa répartition ;
  - lister les avis reçus ;
  - répondre publiquement à un avis.

  Cette page était un gabarit de 47 lignes sans données.
*/

import { notFound } from "next/navigation";
import { requireSeller, formatNumber, formatDate } from "@/lib/seller";
import { fetchStoreReviews } from "@/lib/reviews";
import {
  PageHeader, Panel, Stat, StatRow, Button, EmptyState, Notice, Badge,
} from "@/components/seller/ui";
import { replyToReviewAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function StoreReviewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; replied?: string }>;
}) {
  const { id } = await params;
  const { error, replied } = await searchParams;

  const { supabase, uid } = await requireSeller(
    `/dashboard/seller/stores/${id}/reviews`
  );

  const { data: store } = await supabase
    .from("stores")
    .select("id, name")
    .eq("id", id)
    .eq("owner_id", uid)
    .maybeSingle();

  if (!store) notFound();

  const { reviews, summary, error: reviewsError } = await fetchStoreReviews(store.id);

  const awaitingReply = reviews.filter((r) => !r.sellerReply);
  const negative = reviews.filter((r) => r.rating <= 2);

  return (
    <>
      <PageHeader
        title="Avis clients"
        subtitle={store.name?.trim() || "Boutique"}
        actions={<Button href={`/dashboard/seller/stores/${store.id}`} size="sm">Retour à la boutique</Button>}
      />

      <div className="space-y-4">
        {replied && <Notice tone="info" title="Réponse publiée">Votre réponse est visible sous l&apos;avis.</Notice>}
        {error && <Notice tone="warning" title="Réponse non enregistrée">{error}</Notice>}
        {reviewsError && (
          <Notice tone="warning" title="Avis indisponibles">
            {reviewsError.message}. Les migrations 0001 et 0004 doivent être appliquées.
          </Notice>
        )}

        <StatRow>
          <Stat
            label="Note moyenne"
            value={summary.count ? summary.average.toFixed(1) : "—"}
            hint={summary.count ? `sur ${formatNumber(summary.count)} avis` : "aucun avis"}
            tone={summary.average >= 4 ? "success" : summary.average > 0 && summary.average < 3 ? "danger" : "default"}
          />
          <Stat label="Avis reçus" value={formatNumber(summary.count)} />
          <Stat
            label="Sans réponse"
            value={formatNumber(awaitingReply.length)}
            tone={awaitingReply.length ? "warning" : "success"}
            hint="répondre rassure les futurs clients"
          />
          <Stat
            label="Notes ≤ 2 étoiles"
            value={formatNumber(negative.length)}
            tone={negative.length ? "danger" : "success"}
          />
        </StatRow>

        <Panel title="Avis reçus" padded={false}>
          {reviews.length === 0 ? (
            <EmptyState
              title="Aucun avis"
              description="Les avis arrivent après les premières livraisons. Seuls les clients ayant reçu un article peuvent noter."
            />
          ) : (
            <ul className="divide-y divide-[#e3e6e6]">
              {reviews.map((review) => (
                <li key={review.id} className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[#d4962a]">{"★".repeat(review.rating)}</span>
                    <span className="text-[13px] font-semibold">{review.authorName}</span>
                    {review.isVerified && <Badge tone="success">Achat vérifié</Badge>}
                    <span className="text-[11.5px] text-[#767676]">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>

                  {review.title && (
                    <p className="mt-1.5 text-[13px] font-semibold">{review.title}</p>
                  )}

                  {review.body && (
                    <p className="mt-1 whitespace-pre-line text-[12.5px] leading-relaxed text-[#565959]">
                      {review.body}
                    </p>
                  )}

                  {review.sellerReply ? (
                    <div className="mt-3 rounded-[3px] border-l-2 border-[#d2162c] bg-[#f7f8f8] px-3 py-2.5">
                      <p className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[#d2162c]">
                        Votre réponse · {formatDate(review.sellerRepliedAt)}
                      </p>
                      <p className="mt-1 whitespace-pre-line text-[12px] leading-relaxed">
                        {review.sellerReply}
                      </p>
                    </div>
                  ) : (
                    <form action={replyToReviewAction} className="mt-3 grid gap-2">
                      <input type="hidden" name="store_id" value={store.id} />
                      <input type="hidden" name="review_id" value={review.id} />

                      <textarea
                        name="reply"
                        rows={2}
                        required
                        maxLength={1000}
                        placeholder="Répondre publiquement à ce client..."
                        className="rounded-[3px] border border-[#d5d9d9] px-2.5 py-1.5 text-[12.5px] outline-none focus:border-[#d2162c]"
                      />

                      <div>
                        <Button type="submit" size="sm">Publier ma réponse</Button>
                      </div>
                    </form>
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
