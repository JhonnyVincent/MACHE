/*
  PAGE : les articles mis de côté.

  Elle lisait l'ancien socle, dont les identifiants de produits ne désignent
  plus rien depuis que le catalogue vit dans Medusa : elle affichait une
  liste vide à qui avait mis dix articles de côté, et aucun écran ne
  permettait d'en ajouter. Une entrée de l'en-tête, présente sur chaque
  page, menait donc à une impasse.

  Les favoris vivent maintenant dans le compte client, et suivent donc
  la personne d'un appareil à l'autre.

  Les articles disparus

  Une adresse enregistrée peut ne plus correspondre à rien : le vendeur
  a retiré l'article, ou l'a renommé. On le dit, ligne par ligne, au
  lieu de faire disparaître l'entrée en silence — sans quoi la liste
  rétrécit sans explication.
*/

import Link from "next/link";
import { getFavorites } from "@/lib/medusa/favorites";
import { fetchProductByHandle } from "@/lib/medusa/catalog";
import { ProductCard } from "@/components/home/rails";
import { toggleFavoriteAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function FavoritesPage({
  searchParams,
}: {
  searchParams?: Promise<{ favori?: string }>;
}) {
  const query = searchParams ? await searchParams : {};
  const handles = await getFavorites();

  const results = await Promise.all(
    handles.map(async (handle) => ({
      handle,
      result: await fetchProductByHandle(handle),
    }))
  );

  const found = results.flatMap(({ result }) =>
    result.ok && result.data ? [result.data] : []
  );

  const missing = results.filter(
    ({ result }) => result.ok && !result.data
  ).length;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--mache-text)] sm:text-4xl">
        Mes favoris
      </h1>

      {query.favori && (
        <p className="mt-4 rounded-[8px] border border-[#f3d9a5] bg-[#fdf6e8] px-4 py-3 text-base text-[var(--mache-text)]">
          {decodeURIComponent(query.favori)}
        </p>
      )}

      {handles.length === 0 ? (
        <div className="mt-6 rounded-[10px] border border-[var(--mache-line)] bg-white p-6">
          <p className="text-md leading-relaxed text-[var(--mache-muted)]">
            Vous n&apos;avez encore rien mis de côté. Le cœur sur une fiche
            produit ajoute l&apos;article ici.
          </p>
          <p className="mt-2 text-base leading-relaxed text-[var(--mache-muted)]">
            Vos favoris sont attachés à votre compte : vous les retrouvez
            sur votre téléphone comme sur votre ordinateur.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link
              href="/shop"
              className="rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-md font-bold text-white transition-colors hover:bg-[var(--mache-primary-dark)]"
            >
              Parcourir le catalogue
            </Link>
            <Link
              href="/compte/connexion?next=/favorites"
              className="rounded-[6px] border border-[var(--mache-text)] px-5 py-2.5 text-md font-bold text-[var(--mache-text)] transition-colors hover:bg-[var(--mache-text)] hover:text-white"
            >
              Se connecter
            </Link>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-1.5 text-md text-[var(--mache-muted)]">
            {found.length} article{found.length > 1 ? "s" : ""} mis de côté
          </p>

          {missing > 0 && (
            <p className="mt-4 rounded-[8px] border border-[#f3d9a5] bg-[#fdf6e8] px-4 py-3 text-base leading-relaxed text-[var(--mache-text)]">
              {missing} article{missing > 1 ? "s ne sont plus" : " n'est plus"}{" "}
              en ligne : le vendeur {missing > 1 ? "les" : "l'"}a retiré du
              catalogue. {missing > 1 ? "Ils restent" : "Il reste"} dans votre
              liste au cas où {missing > 1 ? "ils reviendraient" : "il reviendrait"}.
            </p>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {found.map((product) => (
              <div key={product.id} className="flex flex-col">
                <ProductCard product={product} />

                <form action={toggleFavoriteAction} className="mt-1.5">
                  <input type="hidden" name="handle" value={product.handle} />
                  <input type="hidden" name="return_to" value="/favorites" />
                  <button
                    type="submit"
                    className="w-full rounded-[6px] border border-[var(--mache-line)] px-3 py-1.5 text-sm font-semibold text-[var(--mache-muted)] transition-colors hover:border-[var(--mache-danger)] hover:text-[var(--mache-danger)]"
                  >
                    Retirer de mes favoris
                  </button>
                </form>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
