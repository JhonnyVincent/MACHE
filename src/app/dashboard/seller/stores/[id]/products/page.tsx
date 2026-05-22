// src/app/dashboard/seller/stores/[id]/products/page.tsx

/*
  PAGE : Mes produits dynamique

  Sert à :
  - Afficher les vrais produits du store depuis Supabase
  - Vérifier que le vendeur connecté est bien propriétaire du store
  - Voir image, nom, prix, stock, statut de chaque produit
  - Aller vers la page ajouter produit
  - Préparer plus tard : modifier, supprimer, activer/désactiver
*/

import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function formatHTG(value: number) {
  return `${Number(value || 0).toLocaleString("fr-FR")} HTG`;
}

export default async function StoreProductsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();

  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect(`/login?next=/dashboard/seller/stores/${id}/products`);
  }

  const uid = userData.user.id;

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, slug, owner_id")
    .eq("id", id)
    .eq("owner_id", uid)
    .single();

  if (!store) {
    redirect("/dashboard/seller/stores?error=store_introuvable");
  }

  const { data: products } = await supabase
    .from("products")
    .select(`
      id,
      title,
      slug,
      price,
      stock,
      status,
      image_urls,
      category,
      created_at
    `)
    .eq("store_id", store.id)
    .order("created_at", { ascending: false });

  const totalProducts = products?.length ?? 0;
  const activeProducts = products?.filter((p) => p.status === "active").length ?? 0;
  const draftProducts = products?.filter((p) => p.status !== "active").length ?? 0;
  const lowStockProducts = products?.filter((p) => Number(p.stock ?? 0) <= 5).length ?? 0;

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href={`/dashboard/seller/stores/${store.id}`}
            className="text-sm font-bold text-[#0053c6]"
          >
            ← Retour au tableau de bord
          </Link>

          <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[#07152f]">
            Mes produits
          </h1>

          <p className="mt-2 text-gray-500">
            Gérez les produits de la boutique : {store.name}
          </p>
        </div>

        <Link
          href={`/dashboard/seller/stores/${store.id}/products/new`}
          className="rounded-xl bg-[#e31837] px-5 py-3 text-sm font-black text-white"
        >
          + Ajouter un produit
        </Link>
      </div>

      <section className="mb-6 grid gap-4 md:grid-cols-4">
        <StatCard title="Total produits" value={totalProducts} icon="📦" />
        <StatCard title="Produits actifs" value={activeProducts} icon="✅" />
        <StatCard title="Brouillons" value={draftProducts} icon="📝" />
        <StatCard title="Stock faible" value={lowStockProducts} icon="⚠️" />
      </section>

      <section className="rounded-2xl border border-[#e7eaf1] bg-white shadow-sm">
        <div className="border-b border-[#e7eaf1] p-5">
          <h2 className="text-xl font-black text-[#07152f]">
            Liste des produits
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Tous les produits liés à ce store.
          </p>
        </div>

        {!products || products.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#edf3ff] text-4xl">
              📦
            </div>

            <h3 className="mt-5 text-xl font-black">
              Aucun produit pour le moment
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Ajoutez votre premier produit pour commencer à vendre sur MACHÉ.
            </p>

            <Link
              href={`/dashboard/seller/stores/${store.id}/products/new`}
              className="mt-6 inline-flex rounded-xl bg-[#061a36] px-5 py-3 text-sm font-black text-white"
            >
              Ajouter mon premier produit
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-[#f8fafc] text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-4">Produit</th>
                  <th className="px-5 py-4">Catégorie</th>
                  <th className="px-5 py-4">Prix</th>
                  <th className="px-5 py-4">Stock</th>
                  <th className="px-5 py-4">Statut</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#e7eaf1]">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-[#f8fafc]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-gray-100">
                          {product.image_urls?.[0] ? (
                            <img
                              src={product.image_urls[0]}
                              alt={product.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-2xl">📦</span>
                          )}
                        </div>

                        <div>
                          <p className="font-black text-[#07152f]">
                            {product.title}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            ID : {product.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm font-bold text-gray-600">
                      {product.category || "Non classé"}
                    </td>

                    <td className="px-5 py-4 text-sm font-black">
                      {formatHTG(product.price ?? 0)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          Number(product.stock ?? 0) <= 5
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {product.stock ?? 0}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          product.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {product.status === "active" ? "Actif" : "Brouillon"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/product/${product.slug}`}
                          target="_blank"
                          className="rounded-xl border border-[#e7eaf1] px-4 py-2 text-xs font-black hover:bg-gray-50"
                        >
                          Voir
                        </Link>

                        <Link
                          href={`/dashboard/seller/stores/${store.id}/products/${product.id}`}
                          className="rounded-xl bg-[#061a36] px-4 py-2 text-xs font-black text-white"
                        >
                          Modifier
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e7eaf1] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-black text-[#07152f]">{value}</p>
        </div>

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf3ff] text-2xl">
          {icon}
        </div>
      </div>
    </div>
  );
}
