/*
  COMPOSANT : section des avis d'une fiche produit

  Sert à :
  - afficher la note moyenne et sa répartition ;
  - lister les avis publiés et les réponses des boutiques ;
  - inviter à noter ses achats quand aucun avis n'existe.

  Rien n'est affiché quand il n'y a aucun avis, sinon une invitation : une
  note moyenne de zéro étoile sur un produit jamais commenté ferait croire à
  un mauvais produit.
*/

import Link from "next/link";
import type { Review, RatingSummary } from "@/lib/reviews";

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  const rounded = Math.round(value);

  return (
    <span
      className="inline-flex items-center gap-px align-middle"
      role="img"
      aria-label={`${value.toFixed(1)} sur 5`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          style={{ fontSize: size }}
          className={star <= rounded ? "text-[#d4962a]" : "text-[var(--mache-line)]"}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function formatDate(value: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function ReviewsSection({
  reviews,
  summary,
}: {
  reviews: Review[];
  summary: RatingSummary;
}) {
  if (summary.count === 0) {
    return (
      <section className="mt-14">
        <h2 className="section-title">Avis des clients</h2>

        <div className="card mt-5 p-7 text-center">
          <p className="text-[15px] font-[900]">Aucun avis pour le moment</p>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-[1.7] text-[var(--mache-muted)]">
            Seuls les clients ayant reçu cet article peuvent le noter. Si vous
            l&apos;avez commandé, votre avis est attendu.
          </p>
          <Link href="/dashboard/buyer/reviews" className="btn-secondary mt-5">
            Noter mes achats
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-14">
      <h2 className="section-title">Avis des clients</h2>

      <div className="mt-5 grid gap-5 lg:grid-cols-[260px_1fr]">
        {/* Synthèse */}
        <div className="card h-fit p-5">
          <p className="text-[38px] font-[950] leading-none tracking-[-0.03em]">
            {summary.average.toFixed(1)}
          </p>
          <div className="mt-1.5">
            <Stars value={summary.average} size={17} />
          </div>
          <p className="mt-1.5 text-[12.5px] text-[var(--mache-muted)]">
            {summary.count} avis vérifié{summary.count > 1 ? "s" : ""}
          </p>

          <dl className="mt-4 space-y-1.5">
            {([5, 4, 3, 2, 1] as const).map((star) => {
              const count = summary.breakdown[star];
              const percent = summary.count ? (count / summary.count) * 100 : 0;

              return (
                <div key={star} className="flex items-center gap-2 text-[11.5px]">
                  <dt className="w-8 shrink-0 text-[var(--mache-muted)]">{star} ★</dt>
                  <dd className="flex-1">
                    <span className="block h-1.5 overflow-hidden rounded-[2px] bg-[var(--mache-bg)]">
                      <span
                        className="block h-full bg-[#d4962a]"
                        style={{ width: `${percent}%` }}
                      />
                    </span>
                  </dd>
                  <dd className="tnum w-6 shrink-0 text-right text-[var(--mache-muted)]">
                    {count}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>

        {/* Liste */}
        <ul className="space-y-3">
          {reviews.map((review) => (
            <li key={review.id} className="card p-5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Stars value={review.rating} />
                <span className="text-[13px] font-[800]">{review.authorName}</span>
                {review.isVerified && (
                  <span className="rounded-[3px] bg-[var(--mache-success-soft)] px-1.5 py-0.5 text-[10.5px] font-[700] text-[var(--mache-success)]">
                    Achat vérifié
                  </span>
                )}
                <span className="text-[11.5px] text-[var(--mache-light)]">
                  {formatDate(review.createdAt)}
                </span>
              </div>

              {review.title && (
                <p className="mt-2.5 text-[14px] font-[800]">{review.title}</p>
              )}

              {review.body && (
                <p className="mt-1.5 whitespace-pre-line text-[13px] leading-[1.75] text-[var(--mache-muted)]">
                  {review.body}
                </p>
              )}

              {review.sellerReply && (
                <div className="mt-3 rounded-[8px] border-l-2 border-[var(--mache-primary)] bg-[var(--mache-bg)] px-3.5 py-3">
                  <p className="text-[11.5px] font-[800] uppercase tracking-[0.06em] text-[var(--mache-primary)]">
                    Réponse de la boutique
                  </p>
                  <p className="mt-1 whitespace-pre-line text-[12.5px] leading-[1.7]">
                    {review.sellerReply}
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
