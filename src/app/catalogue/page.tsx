/*
  PAGE : tout le catalogue, rayon par rayon.

  Le catalogue compte plus de mille rayons et types d'articles. Cette
  page les présente tous, sur une seule page, comme le plan d'un grand
  magasin : on arrive par le rayon, on descend jusqu'au type d'article.
  Elle ne dépend pas du backend : la structure est celle du site, les
  liens mènent au catalogue filtré.
*/

import { Link } from "next-view-transitions";
import { CATEGORY_TREE, ALL_CATEGORIES } from "@/lib/categories";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Tous les rayons : Made in Ayiti, relié au monde",
  description:
    "Mode, maison, électronique, saveurs, artisanat, services : parcourez tous les rayons de MACHE, la place de marché haïtienne.",
  path: "/catalogue",
});

const link = (slug: string) => `/shop?category=${encodeURIComponent(slug)}`;

export default function CataloguePage() {
  const total = ALL_CATEGORIES.length;

  return (
    <main>
      <section className="bg-white">
        <div className="container-page py-14 lg:py-20">
          <p className="text-sm font-semibold tracking-label text-[var(--mache-primary)]">Le catalogue MACHE</p>

          <h1 className="mt-3 max-w-3xl text-hero text-[var(--mache-text)]">Made in Ayiti. Relié au monde.</h1>

          <p className="mt-2 text-sm text-[var(--mache-muted)]">Made in Ayiti, Connected Here &amp; Everywhere</p>

          <p className="mt-5 max-w-2xl text-md leading-relaxed text-[var(--mache-muted)]">
            {CATEGORY_TREE.length} rayons et {total} catégories, de la mode à la maison, de
            l&apos;électronique aux saveurs du pays : chaque produit des boutiques, artisans et
            fournisseurs haïtiens a sa place.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/shop" className="btn-primary">Voir tous les produits</Link>
            <Link href="/gros" className="btn-secondary">Trouver un fournisseur</Link>
          </div>

          <nav aria-label="Rayons" className="mt-10 flex flex-wrap gap-2">
            {CATEGORY_TREE.map((rayon) => (
              <a
                key={rayon.slug}
                href={`#${rayon.slug}`}
                className="rounded-[6px] border border-[var(--mache-line)] px-3 py-1.5 text-sm text-[var(--mache-text)] transition-colors hover:border-[var(--mache-text)]"
              >
                {rayon.label}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <div className="container-page divide-y divide-[var(--mache-line)]">
        {CATEGORY_TREE.map((rayon) => (
          <section key={rayon.slug} id={rayon.slug} className="scroll-mt-24 py-12">
            <h2 className="text-3xl text-[var(--mache-text)]">
              <Link href={link(rayon.slug)} className="hover:text-[var(--mache-primary)]">{rayon.label}</Link>
            </h2>

            <div className="mt-8 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
              {(rayon.children ?? []).map((sub) => (
                <div key={sub.slug}>
                  <h3 className="font-display text-xl font-semibold text-[var(--mache-text)]">
                    <Link href={link(sub.slug)} className="hover:text-[var(--mache-primary)]">{sub.label}</Link>
                  </h3>

                  {sub.children && sub.children.length > 0 && (
                    <ul className="mt-3 space-y-1.5 border-t border-[var(--mache-line)] pt-3">
                      {sub.children.map((leaf) => (
                        <li key={leaf.slug}>
                          <Link href={link(leaf.slug)} className="text-base text-[var(--mache-muted)] hover:text-[var(--mache-primary)]">
                            {leaf.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="container-page pb-16">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-[8px] bg-[var(--mache-dark)] p-8 text-white sm:p-10">
          <div className="max-w-xl">
            <h2 className="text-2xl sm:text-3xl">Vous fabriquez ou vendez ?</h2>
            <p className="mt-2 text-md leading-relaxed text-white/75">
              Chaque rayon attend ses boutiques. Ouvrez la vôtre et placez vos produits là où les
              acheteurs les cherchent.
            </p>
          </div>

          <Link
            href="/sell"
            className="rounded-[6px] bg-[var(--mache-primary)] px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-[var(--mache-primary-dark)]"
          >
            Vendre sur MACHE
          </Link>
        </div>
      </section>
    </main>
  );
}
