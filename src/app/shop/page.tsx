/*
  PAGE : catalogue

  Recherche, filtre et tri sont délégués au backend, pas appliqués sur un
  tableau chargé en mémoire : le catalogue d'une marketplace grandit, et
  une page qui trie côté navigateur ralentit à mesure qu'elle réussit.
*/

import Link from "next/link";
import {
  SELLER_PROFILES, isSellerProfile, readSellerProfile,
} from "@/lib/seller-profile";
import { reportOutage } from "@/lib/medusa/outage";
import { fetchProducts, fetchCategories, fetchSellers } from "@/lib/medusa/catalog";
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
  searchParams: Promise<{
    q?: string;
    category?: string;
    sort?: string;
    page?: string;
    profil?: string;
  }>;
}) {
  const query = await searchParams;

  const search = (query.q || "").trim();
  const categoryHandle = (query.category || "").trim();

  const sort =
    SORTS.find((entry) => entry.key === query.sort) ?? SORTS[0];

  const page = Math.max(1, Number(query.page) || 1);

  /*
    Filtre par profil de vendeur.

    Le catalogue mélange des artisans, des boutiques, des grossistes et
    des marques. Quelqu'un qui cherche à s'approvisionner en gros n'a
    aucun moyen d'écarter les vendeurs qui proposent trois articles, et
    inversement.

    Le profil est déclaré par le vendeur et rangé dans son champ libre,
    que l'API ne sait pas filtrer. On lit donc les boutiques, on retient
    celles qui correspondent, et on demande les produits de celles-là.
  */
  const profil = isSellerProfile(query.profil) ? query.profil : null;

  let sellerIds: string[] | undefined;
  let profileHasNoShop = false;

  if (profil) {
    const sellersResult = await fetchSellers(100);

    const matching = sellersResult.ok
      ? sellersResult.data.sellers.filter(
          (entry) => readSellerProfile(entry.metadata) === profil
        )
      : [];

    sellerIds = matching.map((entry) => entry.id);

    /*
      Aucune boutique de ce profil : on le dit, au lieu de renvoyer tout
      le catalogue comme si le filtre n'existait pas.
    */
    profileHasNoShop = sellerIds.length === 0;
  }

  const categoriesResult = await fetchCategories(40);
  const categories = categoriesResult.ok ? categoriesResult.data : [];

  const category = categories.find((entry) => entry.handle === categoryHandle);

  const result = profileHasNoShop
    ? ({ ok: true, data: { products: [], count: 0 } } as const)
    : await fetchProducts({
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        q: search || undefined,
        categoryId: category?.id,
        order: sort.order,
        sellerIds,
      });

  /*
    La raison technique d'une panne de catalogue va au journal du serveur.

    Elle s'affichait dans un encadré jaune en haut de la page, avec le nom
    de la variable d'environnement manquante. C'est ce dont a besoin qui
    déploie le site ; ce n'est pas ce dont a besoin qui vient acheter. La
    page dit donc au visiteur que le catalogue ne répond pas, sans lui
    demander de comprendre pourquoi — et sans prétendre non plus qu'il est
    vide, ce qui serait faux.
  */
  if (!result.ok) {
    reportOutage(
      "catalogue",
      `${result.configured ? "le backend ne répond pas" : "backend non configuré"} : ${result.reason}`
    );
  }

  const products = result.ok ? result.data.products : [];
  const total = result.ok ? result.data.count : 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  /* Conserve les filtres en changeant un seul paramètre. */
  const linkWith = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams();

    const next = {
      q: search || undefined,
      category: categoryHandle || undefined,
      profil: profil || undefined,
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
        <h1 className="text-2xl font-bold tracking-tight text-[var(--mache-text)] sm:text-3xl">
          {search
            ? `Résultats pour « ${search} »`
            : category
              ? category.name
              : "Catalogue"}
        </h1>

        {result.ok && (
          <p className="mt-1 text-base text-[var(--mache-muted)]">
            {total} produit{total > 1 ? "s" : ""}
          </p>
        )}

        {/* Recherche */}
        <form method="GET" className="mt-5 flex flex-col gap-2 sm:flex-row">
          <input
            name="q"
            defaultValue={search}
            placeholder="Rechercher un produit"
            aria-label="Rechercher un produit"
            className="flex-1 rounded-[6px] border border-[var(--mache-line)] bg-white px-3.5 py-2.5 text-md outline-none focus:border-[var(--mache-primary)]"
          />
          {categoryHandle && (
            <input type="hidden" name="category" value={categoryHandle} />
          )}
          <button
            type="submit"
            className="rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-md font-bold text-white transition-colors hover:bg-[var(--mache-primary-dark)]"
          >
            Rechercher
          </button>
        </form>

        {/*
          Filtre par profil de vendeur : à qui on achète, et non quoi.
          Il vient avant les catégories parce qu'il répond à une question
          antérieure — « je cherche du gros » plutôt que « je cherche des
          chaussures ».
        */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-[var(--mache-muted)]">
            Vendeur :
          </span>

          <Link
            href={linkWith({ profil: undefined, page: undefined })}
            className={`rounded-[6px] border px-3 py-1.5 text-sm transition-colors ${
              !profil
                ? "border-[var(--mache-text)] bg-[var(--mache-text)] font-semibold text-white"
                : "border-[var(--mache-line)] bg-white text-[var(--mache-text)] hover:border-[var(--mache-primary)]"
            }`}
          >
            Tous
          </Link>

          {SELLER_PROFILES.map((entry) => (
            <Link
              key={entry.id}
              href={linkWith({ profil: entry.id, page: undefined })}
              title={entry.meaning}
              className={`rounded-[6px] border px-3 py-1.5 text-sm transition-colors ${
                profil === entry.id
                  ? "border-[var(--mache-text)] bg-[var(--mache-text)] font-semibold text-white"
                  : "border-[var(--mache-line)] bg-white text-[var(--mache-text)] hover:border-[var(--mache-primary)]"
              }`}
            >
              {entry.badge}
            </Link>
          ))}
        </div>

        {/* Catégories */}
        {categories.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={linkWith({ category: undefined, page: undefined })}
              className={`rounded-[6px] border px-3 py-1.5 text-sm transition-colors ${
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
                className={`rounded-[6px] border px-3 py-1.5 text-sm transition-colors ${
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
          <span className="text-sm text-[var(--mache-muted)]">Trier :</span>
          {SORTS.map((entry) => (
            <Link
              key={entry.key}
              href={linkWith({ sort: entry.key, page: undefined })}
              className={`text-sm transition-colors ${
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
            <p className="text-md font-bold text-[var(--mache-text)]">
              {!result.ok
                ? "Catalogue momentanément indisponible"
                : profileHasNoShop
                  ? `Aucune boutique de ce type pour l'instant`
                  : total === 0 && !search && !categoryHandle
                    ? "Le catalogue est vide"
                    : "Aucun résultat"}
            </p>
            <p className="mx-auto mt-2 max-w-md text-base leading-relaxed text-[var(--mache-muted)]">
              {!result.ok
                ? "Les produits ne peuvent pas être affichés pour le moment. Réessayez dans quelques minutes."
                : profileHasNoShop
                  ? "Aucun vendeur ne s'est déclaré sous ce profil. Ce n'est pas que leurs produits sont épuisés : il n'y a pas encore de boutique de ce type sur MACHÉ."
                  : total === 0 && !search && !categoryHandle
                    ? "Aucun vendeur n'a encore mis de produit en ligne sur MACHÉ."
                    : "Essayez d'autres mots, ou retirez le filtre de catégorie."}
            </p>

            {(search || categoryHandle || profil) && (
              <Link
                href="/shop"
                className="mt-4 inline-block text-base font-semibold text-[var(--mache-primary)] hover:underline"
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
                className="rounded-[6px] border border-[var(--mache-line)] bg-white px-3.5 py-2 text-base font-medium text-[var(--mache-text)] hover:border-[var(--mache-primary)]"
              >
                ← Précédent
              </Link>
            )}

            <span className="px-2 text-base text-[var(--mache-muted)]">
              Page {page} sur {pageCount}
            </span>

            {page < pageCount && (
              <Link
                href={linkWith({ page: String(page + 1) })}
                className="rounded-[6px] border border-[var(--mache-line)] bg-white px-3.5 py-2 text-base font-medium text-[var(--mache-text)] hover:border-[var(--mache-primary)]"
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
