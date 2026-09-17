/*
  PAGE : boutique publique

  Catalogue lu depuis Supabase. La recherche et les filtres sont appliqués
  côté base, et non sur un tableau chargé en mémoire : le catalogue peut
  grandir sans que la page ralentisse.
*/

import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { fetchProducts, type CatalogProduct } from "@/lib/catalog";
import { CATEGORY_TREE, findCategory } from "@/lib/categories";
import type { Product } from "@/types";

export const dynamic = "force-dynamic";

function toCardProduct(product: CatalogProduct): Product {
  return {
    id: product.id,
    slug: product.handle,
    title: product.title,
    price: product.price,
    currency: "HTG",
    stock: product.stock,
    images: product.images,
    vendorName: product.storeName,
    category: product.category,
    description: product.description,
    rating: product.ratingAverage,
    reviewCount: product.ratingCount,
    status: "active",
  };
}

/*
  Les liens du site pointent vers ?sort=new et ?sort=best. Ils étaient
  silencieusement ignorés : la page retombait sur le tri par défaut sans rien
  dire. Ils sont désormais des tris déclarés.
*/
const SORTS = [
  { key: "recent", label: "Plus récents", query: "recent" as const },
  { key: "new", label: "Nouveautés", query: "recent" as const },
  { key: "best", label: "Meilleures ventes", query: "recent" as const },
  { key: "price_asc", label: "Prix croissant", query: "price_asc" as const },
  { key: "price_desc", label: "Prix décroissant", query: "price_desc" as const },
] as const;

/* Tris proposés dans la barre ; « new » et « best » n'y figurent pas deux fois. */
const VISIBLE_SORTS = ["recent", "price_asc", "price_desc"] as const;

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
}) {
  const { q, category, sort } = await searchParams;

  const search = (q || "").trim();

  /*
    La catégorie arrive sous forme de slug. Les anciens liens passaient un
    libellé en minuscules ; findCategory les rattache au bon slug, ce qui
    évite de casser les URL déjà partagées.
  */
  const resolved = findCategory(category);
  const activeCategory = resolved?.slug ?? "Tous";
  const activeLabel = resolved?.label;

  const sortEntry = SORTS.find((s) => s.key === sort);
  const activeSort = sortEntry?.key ?? "recent";

  const { products, error } = await fetchProducts({
    search,
    category: activeCategory,
    sort: sortEntry?.query ?? "recent",
  });

  function linkFor(next: { category?: string; sort?: string }) {
    const params = new URLSearchParams();

    if (search) params.set("q", search);

    const nextCategory = next.category ?? activeCategory;
    if (nextCategory && nextCategory !== "Tous") params.set("category", nextCategory);

    const nextSort = next.sort ?? activeSort;
    if (nextSort !== "recent") params.set("sort", nextSort);

    const query = params.toString();
    return query ? `/shop?${query}` : "/shop";
  }

  return (
    <main className="container-page py-10">
      <header>
        <h1 className="section-title">Boutique</h1>
        <p className="section-subtitle">
          Tous les produits des vendeurs de Maché, en Haïti et dans la diaspora.
        </p>
      </header>

      <form action="/shop" className="mt-6 flex flex-wrap gap-2">
        {activeCategory !== "Tous" && (
          <input type="hidden" name="category" value={activeCategory} />
        )}
        {activeSort !== "recent" && <input type="hidden" name="sort" value={activeSort} />}

        <input
          className="input max-w-md flex-1"
          type="search"
          name="q"
          defaultValue={search}
          placeholder="Rechercher un produit..."
          aria-label="Rechercher un produit"
        />
        <button className="btn-primary" type="submit">
          Rechercher
        </button>
        {search && (
          <Link href={linkFor({})} className="btn-secondary">
            Effacer
          </Link>
        )}
      </form>

      <div className="mt-5 flex flex-wrap gap-2">
        {[{ slug: "Tous", label: "Tous", icon: undefined }, ...CATEGORY_TREE].map((item) => (
          <Link
            key={item.slug}
            href={linkFor({ category: item.slug })}
            className={`rounded-full border px-3.5 py-1.5 text-[12.5px] font-[800] transition ${
              item.slug === activeCategory
                ? "border-[var(--mache-primary)] bg-[var(--mache-primary)] text-white"
                : "border-[var(--mache-line)] bg-[var(--mache-white)] hover:border-[var(--mache-primary)]"
            }`}
          >
            {item.icon ? `${item.icon} ` : ""}
            {item.label}
          </Link>
        ))}
      </div>

      {/* Sous-catégories de la catégorie choisie. */}
      {resolved &&
        (() => {
          const parent = CATEGORY_TREE.find(
            (n) => n.slug === resolved.slug || n.slug === resolved.parentSlug
          );
          const children = parent?.children ?? [];

          if (children.length === 0) return null;

          return (
            <div className="mt-2.5 flex flex-wrap gap-2 border-t border-[var(--mache-line)] pt-3">
              {children.map((child) => (
                <Link
                  key={child.slug}
                  href={linkFor({ category: child.slug })}
                  className={`rounded-full px-3 py-1 text-[12px] font-[700] transition ${
                    child.slug === activeCategory
                      ? "bg-[var(--mache-primary-soft)] text-[var(--mache-primary)]"
                      : "text-[var(--mache-muted)] hover:text-[var(--mache-primary)]"
                  }`}
                >
                  {child.label}
                </Link>
              ))}
            </div>
          );
        })()}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--mache-line)] pb-4">
        <p className="text-[13px] text-[var(--mache-muted)]">
          {products.length} produit{products.length > 1 ? "s" : ""}
          {search ? ` pour « ${search} »` : ""}
          {activeLabel ? ` dans ${activeLabel}` : ""}
        </p>

        <div className="flex flex-wrap gap-2">
          {SORTS.filter((option) =>
            (VISIBLE_SORTS as readonly string[]).includes(option.key)
          ).map((option) => (
            <Link
              key={option.key}
              href={linkFor({ sort: option.key })}
              className={`text-[13px] font-[800] ${
                option.key === activeSort
                  ? "text-[var(--mache-primary)] underline"
                  : "text-[var(--mache-muted)] hover:underline"
              }`}
            >
              {option.label}
            </Link>
          ))}
        </div>
      </div>

      {error ? (
        <div className="card mt-8 p-8 text-center">
          <p className="text-[16px] font-[900]">Catalogue indisponible</p>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-[1.7] text-[var(--mache-muted)]">
            Les produits n&apos;ont pas pu être chargés. Détail : {error.message}
          </p>
        </div>
      ) : products.length === 0 ? (
        <div className="card mt-8 p-10 text-center">
          <p className="text-[18px] font-[900]">
            {search || activeCategory !== "Tous"
              ? "Aucun produit ne correspond"
              : "Le catalogue est encore vide"}
          </p>
          <p className="mx-auto mt-2 max-w-lg text-[14px] leading-[1.8] text-[var(--mache-muted)]">
            {search || activeCategory !== "Tous"
              ? "Essayez un autre mot-clé ou une autre catégorie."
              : "Aucun vendeur n'a encore publié d'article. Les produits apparaîtront ici dès la première mise en ligne."}
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {(search || activeCategory !== "Tous") && (
              <Link href="/shop" className="btn-secondary">
                Voir tout le catalogue
              </Link>
            )}
            <Link href="/sell" className="btn-primary">
              Devenir vendeur
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={toCardProduct(product)} />
          ))}
        </div>
      )}
    </main>
  );
}
