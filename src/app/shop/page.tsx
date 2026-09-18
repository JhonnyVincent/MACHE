/*
  PAGE : catalogue

  Recherche, filtre et tri sont délégués au backend, pas appliqués sur un
  tableau chargé en mémoire : le catalogue d'une marketplace grandit, et
  une page qui trie côté navigateur ralentit à mesure qu'elle réussit.
*/

import Link from "next/link";
import { fetchProducts, fetchCategories } from "@/lib/medusa/catalog";
import { ProductCard } from "@/components/home/rails";

export const dynamic = "force-dynamic";

/*
  Les tris exposés. « Meilleures ventes » n'y figure pas : il demande un
  cumul des quantités vendues qui n'existe pas encore, et proposer un tri
  qui retomberait en silence sur un autre serait mentir à l'utilisateur.
*/
const SORTS = [
  { key: "recent", label: "Plus récents", order: "-created_at" },
  { key: "oldest", label: "Plus anciens", order: "created_at" },
  { key: "title", label: "Ordre alphabétique", order: "title" },
] as const;

const PAGE_SIZE = 24;

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string; page?: string }>;
}) {
  const query = await searchParams;

  const search = (query.q || "").trim();
  const categoryHandle = (query.category || "").trim();

  const sort =
    SORTS.find((entry) => entry.key === query.sort) ?? SORTS[0];

  const page = Math.max(1, Number(query.page) || 1);

  const categoriesResult = await fetchCategories(40);
  const categories = categoriesResult.ok ? categoriesResult.data : [];

  const category = categories.find((entry) => entry.handle === categoryHandle);

  const result = await fetchProducts({
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
    q: search || undefined,
    categoryId: category?.id,
    order: sort.order,
  });

  const products = result.ok ? result.data.products : [];
  const total = result.ok ? result.data.count : 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  /* Conserve les filtres en changeant un seul paramètre. */
  const linkWith = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams();

    const next = {
      q: search || undefined,
      category: categoryHandle || undefined,
      sort: query.sort,
      page: page > 1 ? String(page) : undefined,
      ...patch,
    };

    for (const [name, value] of Object.entries(next)) {
      if (value) params.set(name, value);
    }

    const suffix = params.toString();

    return suffix ? `/shop?${suffix}` : "/shop";
  };

  return (
    <main className="bg-[var(--mache-bg)] pb-10">
      <div className="container-page py-6">
        <h1 className="text-[24px] font-bold tracking-[-0.01em] text-[var(--mache-text)] sm:text-[28px]">
          {search
            ? `Résultats pour « ${search} »`
            : category
              ? category.name
              : "Catalogue"}
        </h1>

        {result.ok && (
          <p className="mt-1 text-[13px] text-[var(--mache-muted)]">
            {total} produit{total > 1 ? "s" : ""}
          </p>
        )}

        {!result.ok && (
          <div className="mt-4 rounded-[10px] border border-[#f3d9a5] bg-[#fdf6e8] p-4">
            <p className="text-[14px] font-bold text-[var(--mache-text)]">
              {result.configured
                ? "Le catalogue ne répond pas"
                : "Backend commerce non configuré"}
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-[var(--mache-muted)]">
              {result.reason}
            </p>
          </div>
        )}

        {/* Recherche */}
        <form method="GET" className="mt-5 flex flex-col gap-2 sm:flex-row">
          <input
            name="q"
            defaultValue={search}
            placeholder="Rechercher un produit"
            aria-label="Rechercher un produit"
            className="flex-1 rounded-[6px] border border-[var(--mache-line)] bg-white px-3.5 py-2.5 text-[14px] outline-none focus:border-[var(--mache-primary)]"
          />
          {categoryHandle && (
            <input type="hidden" name="category" value={categoryHandle} />
          )}
          <button
            type="submit"
            className="rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-[var(--mache-primary-dark)]"
          >
            Rechercher
          </button>
        </form>

        {/* Catégories */}
        {categories.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={linkWith({ category: undefined, page: undefined })}
              className={`rounded-[6px] border px-3 py-1.5 text-[12.5px] transition-colors ${
                !categoryHandle
                  ? "border-[var(--mache-text)] bg-[var(--mache-text)] font-semibold text-white"
                  : "border-[var(--mache-line)] bg-white text-[var(--mache-text)] hover:border-[var(--mache-primary)]"
              }`}
            >
              Tout
            </Link>

            {categories.map((entry) => (
              <Link
                key={entry.id}
                href={linkWith({ category: entry.handle, page: undefined })}
                className={`rounded-[6px] border px-3 py-1.5 text-[12.5px] transition-colors ${
                  categoryHandle === entry.handle
                    ? "border-[var(--mache-text)] bg-[var(--mache-text)] font-semibold text-white"
                    : "border-[var(--mache-line)] bg-white text-[var(--mache-text)] hover:border-[var(--mache-primary)]"
                }`}
              >
                {entry.name}
              </Link>
            ))}
          </div>
        )}

        {/* Tri */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[12px] text-[var(--mache-muted)]">Trier :</span>
          {SORTS.map((entry) => (
            <Link
              key={entry.key}
              href={linkWith({ sort: entry.key, page: undefined })}
              className={`text-[12.5px] transition-colors ${
                sort.key === entry.key
                  ? "font-semibold text-[var(--mache-primary)]"
                  : "text-[var(--mache-muted)] hover:text-[var(--mache-text)]"
              }`}
            >
              {entry.label}
            </Link>
          ))}
        </div>

        {/* Résultats */}
        {products.length === 0 ? (
          <div className="mt-8 rounded-[10px] border border-dashed border-[var(--mache-line)] bg-white p-10 text-center">
            <p className="text-[15px] font-bold text-[var(--mache-text)]">
              {result.ok && total === 0 && !search && !categoryHandle
                ? "Le catalogue est vide"
                : "Aucun résultat"}
            </p>
            <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-[var(--mache-muted)]">
              {result.ok && total === 0 && !search && !categoryHandle
                ? "Aucun vendeur n'a encore mis de produit en ligne sur MACHÉ."
                : "Essayez d'autres mots, ou retirez le filtre de catégorie."}
            </p>

            {(search || categoryHandle) && (
              <Link
                href="/shop"
                className="mt-4 inline-block text-[13px] font-semibold text-[var(--mache-primary)] hover:underline"
              >
                Voir tout le catalogue
              </Link>
            )}
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pageCount > 1 && (
          <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
            {page > 1 && (
              <Link
                href={linkWith({ page: String(page - 1) })}
                className="rounded-[6px] border border-[var(--mache-line)] bg-white px-3.5 py-2 text-[13px] font-medium text-[var(--mache-text)] hover:border-[var(--mache-primary)]"
              >
                ← Précédent
              </Link>
            )}

            <span className="px-2 text-[13px] text-[var(--mache-muted)]">
              Page {page} sur {pageCount}
            </span>

            {page < pageCount && (
              <Link
                href={linkWith({ page: String(page + 1) })}
                className="rounded-[6px] border border-[var(--mache-line)] bg-white px-3.5 py-2 text-[13px] font-medium text-[var(--mache-text)] hover:border-[var(--mache-primary)]"
              >
                Suivant →
              </Link>
            )}
          </nav>
        )}
      </div>
    </main>
  );
}
