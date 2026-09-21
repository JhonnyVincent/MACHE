/*
  Affichage des avis.

  Deux règles tiennent ce fichier.

  1. Pas d'avis, pas de note. On n'affiche ni « 0/5 », ni « — /5 », ni
     une rangée d'étoiles vides : tout cela se lit comme une mauvaise
     note, alors qu'une boutique neuve n'a simplement pas encore été
     notée. On écrit qu'il n'y a pas encore d'avis, ce qui est la
     vérité.

  2. Le nombre d'avis est toujours affiché à côté de la moyenne. « 4,8 »
     sur trois avis et « 4,8 » sur six cents ne disent pas la même
     chose, et cacher le compte laisse croire au second.
*/

import type { StoreRatings } from "@/lib/medusa/catalog";

function Stars({ value }: { value: number }) {
  const full = Math.round(value);

  return (
    <span aria-hidden="true" className="text-[var(--mache-gold)]">
      {"★".repeat(Math.max(0, Math.min(5, full)))}
      <span className="text-[var(--mache-line)]">
        {"★".repeat(Math.max(0, 5 - full))}
      </span>
    </span>
  );
}

/* La note en une ligne : pour un en-tête de boutique ou une fiche. */
export function RatingSummary({
  ratings,
  emptyLabel = "Pas encore d'avis",
}: {
  ratings: StoreRatings;
  emptyLabel?: string;
}) {
  if (ratings.average === null || ratings.count === 0) {
    return (
      <span className="text-sm text-[var(--mache-muted)]">{emptyLabel}</span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <Stars value={ratings.average} />
      <span className="font-semibold text-[var(--mache-text)]">
        {ratings.average.toLocaleString("fr-FR", { minimumFractionDigits: 1 })}
      </span>
      <span className="text-[var(--mache-muted)]">
        sur {ratings.count} avis
      </span>
    </span>
  );
}

/* La liste des avis, avec la réponse du vendeur quand il y en a une. */
export function ReviewList({ ratings }: { ratings: StoreRatings }) {
  if (ratings.reviews.length === 0) return null;

  return (
    <ul className="mt-3 space-y-3">
      {ratings.reviews.map((review) => (
        <li
          key={review.id}
          className="rounded-[10px] border border-[var(--mache-line)] bg-white p-4"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Stars value={review.rating} />
            <span className="sr-only">{review.rating} sur 5</span>

            {review.createdAt && (
              <span className="text-sm text-[var(--mache-muted)]">
                {new Date(review.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            )}
          </div>

          {review.note && (
            <p className="mt-2 whitespace-pre-line text-base leading-relaxed text-[var(--mache-text)]">
              {review.note}
            </p>
          )}

          {/*
            La réponse du vendeur est marquée comme telle et décalée :
            une réponse qui ressemble à un avis ferait passer la parole
            du vendeur pour celle d'un client.
          */}
          {review.sellerNote && (
            <div className="mt-3 border-l-2 border-[var(--mache-line)] pl-3">
              <p className="text-sm font-semibold text-[var(--mache-muted)]">
                Réponse du vendeur
              </p>
              <p className="mt-0.5 whitespace-pre-line text-base leading-relaxed text-[var(--mache-muted)]">
                {review.sellerNote}
              </p>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
