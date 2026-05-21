import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function formatHTG(value: number) {
  return `${value.toLocaleString("fr-FR")} HTG`;
}

export default async function StoreDashboardPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createSupabaseServerClient();

  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect(`/login?next=/dashboard/seller/stores/${params.id}`);
  }

  const uid = userData.user.id;

  const { data: store } = await supabase
    .from("stores")
    .select("id, slug, name, description, logo_url, is_verified, legal_doc_url, category, created_at")
    .eq("id", params.id)
    .eq("owner_id", uid)
    .single();

  if (!store) {
    redirect("/dashboard/seller/stores?error=store_introuvable");
  }

  const { count: totalProducts } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("store_id", store.id);

  const { count: activeProducts } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("store_id", store.id)
    .eq("status", "active");

  const { count: lowStockProducts } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("store_id", store.id)
    .lte("stock", 5);

  const { data: orders } = await supabase
    .from("orders")
    .select("id, status, total_price, created_at")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false });

  const totalOrders = orders?.length ?? 0;
  const pendingOrders = orders?.filter((o) => o.status === "pending").length ?? 0;
  const completedOrders = orders?.filter((o) => o.status === "completed") ?? [];

  const totalRevenue = completedOrders.reduce(
    (sum, order) => sum + (order.total_price ?? 0),
    0
  );

  const { data: recentProducts } = await supabase
    .from("products")
    .select("id, title, price, stock, status, image_url")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const storeInitial = store.name?.charAt(0)?.toUpperCase() || "M";

  return (
    <main className="min-h-screen bg-[#f3f4f8]">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="hidden bg-[#070707] text-white lg:block">
          <div className="border-b border-white/10 p-6">
            <h1 className="text-3xl font-black tracking-widest">MACHE</h1>
            <p className="text-xs text-white/40">Dashboard store</p>
          </div>

          <nav className="space-y-2 p-4 text-sm font-bold">
            {[
              ["Vue globale seller", "/dashboard/seller", "🏠"],
              ["Retour aux stores", "/dashboard/seller/stores", "🏪"],
              ["Produits", `/dashboard/seller/stores/${store.id}/products`, "📦"],
              ["Ajouter produit", `/dashboard/seller/stores/${store.id}/products/new`, "➕"],
              ["Commandes", `/dashboard/seller/stores/${store.id}/orders`, "🛒"],
              ["Stock", `/dashboard/seller/stores/${store.id}/stock`, "📊"],
              ["Documents", `/dashboard/seller/stores/${store.id}/documents`, "📄"],
              ["Paramètres", `/dashboard/seller/stores/${store.id}/settings`, "⚙️"],
            ].map(([label, href, icon]) => (
              <Link
                key={label}
                href={href}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-white/70 hover:bg-white/10 hover:text-white"
              >
                <span>{icon}</span>
                <span>{label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        <section className="overflow-y-auto">
          <div className="relative h-64 bg-gradient-to-r from-[#070707] via-[#111827] to-[#d2162c]">
            <div className="absolute inset-0 bg-black/20" />

            <div className="relative flex h-full items-end justify-between p-8 text-white">
              <div className="flex items-end gap-5">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-[#d2162c] text-4xl font-black shadow-xl">
                  {store.logo_url ? (
                    <img src={store.logo_url} alt={store.name} className="h-full w-full object-cover" />
                  ) : (
                    storeInitial
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-4xl font-black">{store.name}</h1>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${
                      store.is_verified
                        ? "bg-green-500/20 text-green-300"
                        : "bg-orange-500/20 text-orange-300"
                    }`}>
                      {store.is_verified ? "Store vérifié" : "Vérification en attente"}
                    </span>
                  </div>

                  <p className="mt-2 max-w-2xl text-sm text-white/70">
                    {store.description || "Aucune description pour le moment. Ajoutez une description dans les paramètres du store."}
                  </p>

                  <p className="mt-2 text-xs text-white/50">
                    mache.ht/store/{store.slug}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Link
                  href={`/store/${store.slug}`}
                  target="_blank"
                  className="rounded-xl bg-white/10 px-5 py-3 text-sm font-black backdrop-blur hover:bg-white/20"
                >
                  Voir la page publique →
                </Link>

                <Link
                  href={`/dashboard/seller/stores/${store.id}/settings`}
                  className="rounded-xl bg-white px-5 py-3 text-sm font-black text-[#070707]"
                >
                  Modifier le store
                </Link>
              </div>
            </div>
          </div>

          <div className="space-y-7 p-8">
            <div className="grid gap-5 md:grid-cols-4">
              {[
                ["Produits actifs", activeProducts ?? 0, `${totalProducts ?? 0} produits au total`, "📦"],
                ["Commandes", totalOrders, `${pendingOrders} en attente`, "🛒"],
                ["Revenus", formatHTG(totalRevenue), "ventes complétées", "💰"],
                ["Stock faible", lowStockProducts ?? 0, "produits à réapprovisionner", "⚠️"],
              ].map(([title, value, sub, icon]) => (
                <div key={title} className="rounded-3xl border bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-400">{title}</p>
                      <p className="mt-2 text-3xl font-black text-gray-950">{value}</p>
                      <p className="mt-1 text-xs text-gray-400">{sub}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-xl">
                      {icon}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
              <div className="rounded-3xl border bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-gray-950">Graphique du store</h2>
                    <p className="text-sm text-gray-500">Choisissez la période et le format d’affichage.</p>
                  </div>

                  <div className="flex gap-2">
                    <select className="rounded-xl border bg-white px-3 py-2 text-sm font-bold">
                      <option>Ce mois-ci</option>
                      <option>Cette semaine</option>
                      <option>6 derniers mois</option>
                      <option>Cette année</option>
                    </select>

                    <select className="rounded-xl border bg-white px-3 py-2 text-sm font-bold">
                      <option>Courbe</option>
                      <option>Barres</option>
                      <option>Cercle</option>
                    </select>
                  </div>
                </div>

                <div className="flex h-72 items-end gap-3 rounded-2xl bg-[#f7f8fb] p-5">
                  {[35, 55, 45, 70, 60, 90, 75, 120, 95, 140, 110, 160].map((height, index) => (
                    <div key={index} className="flex flex-1 flex-col items-center justify-end gap-2">
                      <div
                        className="w-full rounded-t-xl bg-[#d2162c]"
                        style={{ height: `${height}px` }}
                      />
                      <span className="text-[10px] font-bold text-gray-400">
                        {index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border bg-white p-6 shadow-sm">
                <h2 className="text-xl font-black text-gray-950">Actions rapides</h2>

                <div className="mt-5 grid gap-3">
                  {[
                    ["Ajouter un produit", `/dashboard/seller/stores/${store.id}/products/new`, "➕"],
                    ["Gérer les commandes", `/dashboard/seller/stores/${store.id}/orders`, "🛒"],
                    ["Modifier boutique", `/dashboard/seller/stores/${store.id}/settings`, "🎨"],
                    ["Documents du store", `/dashboard/seller/stores/${store.id}/documents`, "📄"],
                  ].map(([label, href, icon]) => (
                    <Link
                      key={label}
                      href={href}
                      className="flex items-center justify-between rounded-2xl border bg-white p-4 font-black hover:bg-gray-50"
                    >
                      <span className="flex items-center gap-3">
                        <span>{icon}</span>
                        {label}
                      </span>
                      <span>→</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
              <div className="rounded-3xl border bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-xl font-black text-gray-950">Produits récents</h2>
                  <Link
                    href={`/dashboard/seller/stores/${store.id}/products`}
                    className="text-sm font-black text-[#d2162c]"
                  >
                    Voir tout →
                  </Link>
                </div>

                {!recentProducts || recentProducts.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed p-10 text-center">
                    <p className="text-4xl">📦</p>
                    <p className="mt-3 font-black">Aucun produit dans ce store</p>
                    <p className="mt-1 text-sm text-gray-500">
                      Ajoutez votre premier produit pour commencer à vendre.
                    </p>
                    <Link
                      href={`/dashboard/seller/stores/${store.id}/products/new`}
                      className="mt-5 inline-block rounded-xl bg-[#070707] px-5 py-3 text-sm font-black text-white"
                    >
                      Ajouter un produit
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentProducts.map((product) => (
                      <Link
                        key={product.id}
                        href={`/dashboard/seller/stores/${store.id}/products/${product.id}`}
                        className="flex items-center gap-4 rounded-2xl border p-4 hover:bg-gray-50"
                      >
                        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.title} className="h-full w-full object-cover" />
                          ) : (
                            "📦"
                          )}
                        </div>

                        <div className="flex-1">
                          <p className="font-black text-gray-950">{product.title}</p>
                          <p className="text-sm text-gray-500">{formatHTG(product.price ?? 0)}</p>
                        </div>

                        <div className="text-right">
                          <p className="font-black">Stock {product.stock ?? 0}</p>
                          <p className="text-xs text-gray-400">{product.status}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-3xl border bg-white p-6 shadow-sm">
                <h2 className="text-xl font-black text-gray-950">Vérification du store</h2>

                <div className="mt-5 space-y-4">
                  <div className="flex items-center justify-between rounded-2xl bg-gray-50 p-4">
                    <div>
                      <p className="font-black">Document légal</p>
                      <p className="text-sm text-gray-500">Registre, patente ou document officiel</p>
                    </div>

                    <span className={`rounded-full px-3 py-1 text-xs font-black ${
                      store.legal_doc_url
                        ? "bg-green-50 text-green-700"
                        : "bg-orange-50 text-orange-700"
                    }`}>
                      {store.legal_doc_url ? "Complet" : "Manquant"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl bg-gray-50 p-4">
                    <div>
                      <p className="font-black">Bannière & identité</p>
                      <p className="text-sm text-gray-500">Logo, couleurs, description</p>
                    </div>

                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                      À personnaliser
                    </span>
                  </div>
                </div>

                <Link
                  href={`/dashboard/seller/stores/${store.id}/settings`}
                  className="mt-5 block rounded-xl bg-[#070707] px-5 py-3 text-center text-sm font-black text-white"
                >
                  Compléter le store →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
