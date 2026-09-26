/*
  PAGE : modération des avis et des articles.

  CE QUE CETTE PAGE NE FAIT PAS : SUPPRIMER

  Un avis masqué disparaît du site mais reste ici. C'est la parole d'un
  acheteur qu'on retire : la décision doit pouvoir s'expliquer le jour
  où il demande pourquoi son avis n'apparaît plus, et on ne peut pas
  expliquer ce qu'on a effacé.

  Un article retiré garde ses commandes lisibles. Supprimer le produit
  les rendrait incompréhensibles — « 2 articles » sans savoir lesquels.

  POURQUOI « RETIRÉ » ET PAS « BROUILLON »

  Medusa distingue les deux, et le site aussi. Un brouillon est un
  article que le vendeur n'a pas fini ; un article retiré est un
  article que MACHÉ a écarté. Les confondre ferait croire au vendeur
  qu'il a oublié de publier — et il republierait.

  Les avis en attente sont montrés en premier

  Ce sont ceux qui appellent une décision. Un avis déjà publié ou déjà
  masqué est une archive.
*/

import { Link } from "next-view-transitions";
import { redirect } from "next/navigation";
import {
  getAdminUser,
  fetchReviews,
  searchProducts,
  REVIEW_STATUS_LABELS,
  PRODUCT_STATUS_LABELS,
} from "@/lib/medusa/admin";
import { formatDate } from "@/lib/seller";
import {
  PageHeader, Panel, Badge, Notice, EmptyState, Input, Field,
} from "@/components/seller/ui";
import { SubmitButton } from "@/components/submit-button";
import { setReviewStatusAction, setProductStatusAction } from "./actions";

export const dynamic = "force-dynamic";

const REVIEW_TONES: Record<string, "neutral" | "success" | "warning" | "danger"> = {
  pending: "warning",
  published: "success",
  rejected: "danger",
};

const PRODUCT_TONES: Record<string, "neutral" | "success" | "warning" | "danger"> = {
  draft: "neutral",
  proposed: "warning",
  published: "success",
  rejected: "danger",
};

export default async function AdminModerationPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; fait?: string; erreur?: string }>;
}) {
  const user = await getAdminUser();

  if (!user) redirect("/dashboard/admin/connexion");

  const query = searchParams ? await searchParams : {};

  const term = (query.q ?? "").trim();

  const [reviews, products] = await Promise.all([
    fetchReviews(),
    /*
      Les articles ne sont chargés que sur recherche. Afficher les
      cinquante derniers par défaut inviterait à modérer au hasard ;
      on arrive ici parce qu'on a un article précis en tête, le plus
      souvent signalé par quelqu'un.
    */
    term ? searchProducts(term) : Promise.resolve(null),
  ]);

  const sortedReviews = reviews.ok
    ? [...reviews.data].sort((a, b) => {
        /* Ce qui attend une décision d'abord. */
        const weight = (status: string) => (status === "pending" ? 0 : 1);

        return weight(a.status) - weight(b.status);
      })
    : [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Modération"
        subtitle="Avis et articles. Rien n'est supprimé : ce qui est retiré reste consultable ici."
      />

      {query.fait && (
        <Notice tone="info" title="C'est fait">
          {query.fait}
        </Notice>
      )}
      {query.erreur && (
        <Notice tone="danger" title="Ça n'a pas marché">
          {query.erreur}
        </Notice>
      )}

      {/* ------------------------------------------------------------ */}
      <Panel
        title="Avis"
        description="Ceux qui attendent une décision sont en haut."
      >
        {!reviews.ok ? (
          <Notice tone="danger" title="Les avis ne s'affichent pas">
            {reviews.reason}
          </Notice>
        ) : sortedReviews.length === 0 ? (
          <EmptyState
            title="Aucun avis"
            description="Personne n'a encore laissé d'avis sur MACHÉ."
          />
        ) : (
          <ul className="space-y-2">
            {sortedReviews.map((review) => (
              <li
                key={review.id}
                className="rounded-[6px] border border-[#d5d9d9] bg-white p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#0f1111]">
                      {"★".repeat(Math.max(1, Math.min(5, review.rating)))}
                      <span className="text-[#c0c0c0]">
                        {"★".repeat(5 - Math.max(1, Math.min(5, review.rating)))}
                      </span>
                      <span className="ml-2 font-normal text-[#767676]">
                        {review.reference === "seller" ? "sur une boutique" : "sur un article"}
                        {review.createdAt ? ` · ${formatDate(review.createdAt)}` : ""}
                      </span>
                    </p>

                    {review.customerNote ? (
                      <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-[#0f1111]">
                        {review.customerNote}
                      </p>
                    ) : (
                      <p className="mt-1.5 text-sm italic text-[#767676]">
                        Note sans commentaire.
                      </p>
                    )}

                    {review.sellerNote && (
                      <p className="mt-2 rounded-[4px] bg-[#f7f8f8] px-2 py-1.5 text-xs leading-relaxed text-[#565959]">
                        Réponse du vendeur : {review.sellerNote}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <Badge tone={REVIEW_TONES[review.status] ?? "neutral"}>
                      {REVIEW_STATUS_LABELS[review.status] ?? review.status}
                    </Badge>

                    <form action={setReviewStatusAction}>
                      <input type="hidden" name="review_id" value={review.id} />
                      <input
                        type="hidden"
                        name="status"
                        value={review.status === "rejected" ? "published" : "rejected"}
                      />
                      <SubmitButton
                        pendingLabel="…"
                        className={
                          review.status === "rejected"
                            ? "!bg-white !text-[#0f1111] !border !border-[#8d9096] hover:!bg-[#f7f8f8]"
                            : "!bg-white !text-[#b01124] !border !border-[#b01124] hover:!bg-[#fdeaec]"
                        }
                      >
                        {review.status === "rejected" ? "Rétablir" : "Masquer"}
                      </SubmitButton>
                    </form>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* ------------------------------------------------------------ */}
      <Panel
        title="Articles"
        description="Cherchez l'article à retirer. La liste n'est pas affichée par défaut : on modère un article précis, pas au hasard."
      >
        <form className="flex flex-wrap items-end gap-2">
          <Field label="Nom de l'article">
            <Input name="q" defaultValue={term} placeholder="riz, savon, sandales…" />
          </Field>
          <SubmitButton pendingLabel="Recherche…">Chercher</SubmitButton>
        </form>

        {products && !products.ok && (
          <div className="mt-4">
            <Notice tone="danger" title="La recherche a échoué">
              {products.reason}
            </Notice>
          </div>
        )}

        {products?.ok && products.data.length === 0 && (
          <p className="mt-4 text-sm text-[#565959]">
            Aucun article ne correspond à « {term} ».
          </p>
        )}

        {products?.ok && products.data.length > 0 && (
          <ul className="mt-4 space-y-2">
            {products.data.map((product) => (
              <li
                key={product.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-[#d5d9d9] bg-white p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {product.thumbnail && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={product.thumbnail}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-[4px] border border-[#d5d9d9] object-cover"
                    />
                  )}

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#0f1111]">
                      {product.title}
                    </p>
                    <p className="truncate text-xs text-[#767676]">
                      {product.handle && (
                        <Link
                          href={`/product/${product.handle}`}
                          className="underline"
                        >
                          /product/{product.handle}
                        </Link>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Badge tone={PRODUCT_TONES[product.status] ?? "neutral"}>
                    {PRODUCT_STATUS_LABELS[product.status] ?? product.status}
                  </Badge>

                  <form action={setProductStatusAction}>
                    <input type="hidden" name="product_id" value={product.id} />
                    <input type="hidden" name="q" value={term} />
                    <input
                      type="hidden"
                      name="status"
                      value={product.status === "rejected" ? "published" : "rejected"}
                    />
                    <SubmitButton
                      pendingLabel="…"
                      className={
                        product.status === "rejected"
                          ? "!bg-white !text-[#0f1111] !border !border-[#8d9096] hover:!bg-[#f7f8f8]"
                          : "!bg-white !text-[#b01124] !border !border-[#b01124] hover:!bg-[#fdeaec]"
                      }
                    >
                      {product.status === "rejected" ? "Remettre en vente" : "Retirer du site"}
                    </SubmitButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* ------------------------------------------------------------ */}
      <Panel title="Ce que ces gestes font, et ne font pas">
        <ul className="space-y-2 text-sm leading-relaxed text-[#565959]">
          <li>
            <strong className="text-[#0f1111]">Rien n&apos;est supprimé.</strong> Un
            avis masqué et un article retiré restent en base et restent
            consultables ici. Vous pouvez revenir sur la décision.
          </li>
          <li>
            <strong className="text-[#0f1111]">« Retiré » n&apos;est pas
            « brouillon ».</strong> Un brouillon est un article que le vendeur
            n&apos;a pas fini ; un article retiré est un article que vous avez
            écarté. Les confondre ferait croire au vendeur qu&apos;il a oublié de
            publier, et il republierait.
          </li>
          <li>
            <strong className="text-[#0f1111]">Le vendeur n&apos;est pas
            prévenu.</strong> MACHÉ n&apos;envoie pas d&apos;e-mail. Si le
            retrait doit être expliqué,{" "}
            <Link href="/dashboard/admin/messages" className="font-medium underline">
              écrivez-lui
            </Link>
            .
          </li>
        </ul>
      </Panel>
    </div>
  );
}
