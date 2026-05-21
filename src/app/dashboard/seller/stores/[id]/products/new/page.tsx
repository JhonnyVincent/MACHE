import Link from "next/link";
import { createStoreProductAction } from "./actions";

const categories = [
  "Vêtements",
  "Beauté",
  "Alimentation",
  "Artisanat",
  "Maison",
  "Électronique",
  "Bijoux",
  "Chaussures",
  "Accessoires",
  "Services",
];

export default async function NewStoreProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const createProduct = createStoreProductAction.bind(null, id);

  return (
    <main className="min-h-screen bg-[#f3f4f8]">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <Link
          href={`/dashboard/seller/stores/${id}`}
          className="text-sm font-black text-[#d2162c]"
        >
          ← Retour au store
        </Link>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <section className="rounded-3xl border bg-white p-8 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#d2162c]">
              Nouveau produit
            </p>

            <h1 className="mt-3 text-4xl font-black text-[#070707]">
              Ajouter un produit
            </h1>

            <p className="mt-3 text-sm text-gray-500">
              Ce produit sera automatiquement rattaché uniquement à ce store.
            </p>

            <form action={createProduct} className="mt-8 space-y-5">
              <div>
                <label className="text-sm font-black text-gray-900">
                  Nom du produit *
                </label>
                <input
                  name="title"
                  required
                  placeholder="Ex : T-shirt MACHE"
                  className="mt-2 w-full rounded-2xl border px-4 py-4 text-sm outline-none focus:border-[#d2162c]"
                />
              </div>

              <div>
                <label className="text-sm font-black text-gray-900">
                  Catégorie *
                </label>
                <select
                  name="category"
                  required
                  className="mt-2 w-full rounded-2xl border bg-white px-4 py-4 text-sm outline-none focus:border-[#d2162c]"
                >
                  <option value="">Choisir une catégorie</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-black text-gray-900">
                    Prix HTG *
                  </label>
                  <input
                    name="price"
                    type="number"
                    min="1"
                    required
                    placeholder="1500"
                    className="mt-2 w-full rounded-2xl border px-4 py-4 text-sm outline-none focus:border-[#d2162c]"
                  />
                </div>

                <div>
                  <label className="text-sm font-black text-gray-900">
                    Stock
                  </label>
                  <input
                    name="stock"
                    type="number"
                    min="0"
                    defaultValue="0"
                    className="mt-2 w-full rounded-2xl border px-4 py-4 text-sm outline-none focus:border-[#d2162c]"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-black text-gray-900">
                  Image URL
                </label>
                <input
                  name="image_url"
                  placeholder="https://..."
                  className="mt-2 w-full rounded-2xl border px-4 py-4 text-sm outline-none focus:border-[#d2162c]"
                />
              </div>

              <div>
                <label className="text-sm font-black text-gray-900">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={5}
                  placeholder="Décrivez le produit, matière, taille, couleur, utilisation..."
                  className="mt-2 w-full rounded-2xl border px-4 py-4 text-sm outline-none focus:border-[#d2162c]"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-[#070707] px-6 py-4 text-sm font-black text-white hover:bg-[#111827]"
              >
                Ajouter le produit →
              </button>
            </form>
          </section>

          <aside className="space-y-5">
            <div className="rounded-3xl bg-[#070707] p-6 text-white">
              <h2 className="text-xl font-black">Important</h2>
              <div className="mt-5 space-y-4 text-sm text-white/70">
                <p>✅ Produit lié uniquement à ce store</p>
                <p>✅ Visible dans le dashboard du store</p>
                <p>✅ Stock compté dans ce store</p>
                <p>✅ Revenus et ventes séparés par store</p>
              </div>
            </div>

            <div className="rounded-3xl border bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-[#070707]">
                Conseil MACHE
              </h2>
              <p className="mt-3 text-sm text-gray-500">
                Ajoutez une image propre, un prix clair et une description simple.
                Ça aide les clients à acheter plus vite.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
