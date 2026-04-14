"use client";

import { useMemo, useState } from "react";
import { allProducts } from "@/lib/mock-data";
import { ProductCard } from "@/components/product-card";

const categoryOptions = [
  "Toutes",
  "Mode",
  "Épicerie",
  "Accessoires",
  "Cuisine",
  "Art"
];

export default function ShopPage() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("default");
  const [activeCategory, setActiveCategory] = useState("Toutes");

  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    if (activeCategory !== "Toutes") {
      result = result.filter((product) => product.category === activeCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (product) =>
          product.title.toLowerCase().includes(q) ||
          product.description.toLowerCase().includes(q) ||
          product.category.toLowerCase().includes(q)
      );
    }

    if (sort === "price_low") {
      result.sort((a, b) => a.price - b.price);
    } else if (sort === "price_high") {
      result.sort((a, b) => b.price - a.price);
    } else if (sort === "rating") {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [search, sort, activeCategory]);

  const suggestedProducts = allProducts.slice(0, 5);

  return (
    <main>
      <section className="bg-[var(--mache-dark)] py-8 text-white">
        <div className="container-page">
          <div className="mb-2 text-[11px] text-white/45">Accueil / Boutique</div>
          <h1 className="text-[clamp(26px,4vw,42px)] font-[900] tracking-[-0.04em]">
            Boutique
          </h1>
          <p className="mt-2 text-[13px] text-white/55">
            Explore notre catalogue dynamique de produits.
          </p>
        </div>
      </section>

      <section className="sticky top-[76px] z-20 border-b border-[var(--mache-line)] bg-[var(--mache-white)] py-3">
        <div className="container-page flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2 overflow-x-auto whitespace-nowrap">
            {categoryOptions.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`rounded-full border px-4 py-2 text-[12px] font-[600] transition ${
                  activeCategory === category
                    ? "border-[var(--mache-primary)] bg-[var(--mache-primary-soft)] text-[var(--mache-primary)]"
                    : "border-[var(--mache-line)] bg-[var(--mache-white)] text-[var(--mache-muted)]"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              className="input w-full sm:w-[220px]"
              placeholder="Filtrer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="input w-full sm:w-[180px]"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="default">Par défaut</option>
              <option value="price_low">Prix croissant</option>
              <option value="price_high">Prix décroissant</option>
              <option value="rating">Mieux notés</option>
            </select>
          </div>
        </div>
      </section>

      <section className="container-page py-8">
        <div className="mb-4 text-[12px] text-[var(--mache-muted)]">
          {filteredProducts.length} produit(s) trouvé(s)
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-[var(--mache-muted)]">
            <div className="mb-3 text-5xl opacity-30">🔍</div>
            <h3 className="mb-2 text-lg font-[800] text-[var(--mache-text)]">
              Aucun produit trouvé
            </h3>
            <p className="text-sm">Essaie d’autres mots-clés ou une autre catégorie.</p>
          </div>
        )}
      </section>

      <section className="container-page pb-12">
        <div className="mb-6">
          <h2 className="section-title">Vous aimerez aussi</h2>
          <p className="section-subtitle">
            Suggestions produit dynamiques pour garder une logique e-commerce vivante.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {suggestedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}
