import { ProductCard } from "@/components/product-card";
import { allProducts } from "@/lib/mock-data";

export default function ShopPage() {
  return (
    <main className="container-page py-12">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Boutique</h1>
          <p className="mt-2 text-neutral-500">
            Recherche, filtres, tri et listing produit prêts pour Supabase.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input className="input" placeholder="Rechercher un produit..." />
          <select className="input">
            <option>Toutes catégories</option>
            <option>Mode</option>
            <option>Art</option>
            <option>Épicerie</option>
          </select>
          <select className="input">
            <option>Trier par</option>
            <option>Populaire</option>
            <option>Prix croissant</option>
            <option>Prix décroissant</option>
          </select>
          <button className="btn-primary">Appliquer</button>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {allProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <div className="mt-10 flex justify-center">
        <button className="btn-secondary">Charger plus</button>
      </div>
    </main>
  );
}
