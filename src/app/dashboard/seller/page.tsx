import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const SELLER_ROLES = ["seller_individual", "seller_business", "official_brand"];

const ROLE_LABELS: Record<string, string> = {
  seller_individual: "Vendeur particulier",
  seller_business: "Vendeur Business",
  official_brand: "Marque officielle",
};

const PLAN_LIMITS: Record<string, { maxStores: number; maxArticlesPerStore: number }> = {
  seller_individual: { maxStores: 1, maxArticlesPerStore: 50 },
  seller_business: { maxStores: 2, maxArticlesPerStore: 500 },
  official_brand: { maxStores: 10, maxArticlesPerStore: 10000 },
};

const ROLE_PLAN_KEY: Record<string, string> = {
  seller_individual: "Gratuit",
  seller_business: "Business",
  official_brand: "Marque officielle",
};

function formatHTG(value: number) {
  return `${value.toLocaleString("fr-FR")} HTG`;
}

export default async function SellerDashboardPage() {
  const supabase = await createSupabaseServerClient();

  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login?next=/dashboard/seller");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, full_name, email, address_verified")
    .eq("id", userData.user.id)
    .single();

  const role = String(profile?.role || "").trim();

  if (!profile || !SELLER_ROLES.includes(role)) {
    redirect(`/login?error=${encodeURIComponent(`Role: ${role || "aucun profil trouvé"}`)}`);
  }

  const uid = userData.user.id;
  const displayName = profile.full_name || "Vendeur";
  const firstName = displayName.split(" ")[0];
  const roleLabel = ROLE_LABELS[role];
  const planName = ROLE_PLAN_KEY[role];
  const limits = PLAN_LIMITS[role];

  const { data: stores } = await supabase
    .from("stores")
    .select("id, slug, name, is_verified, logo_url, category, legal_doc_url, created_at")
    .eq("owner_id", uid)
    .order("created_at", { ascending: true });

  const storeCount = stores?.length ?? 0;
  const storeLimitReached = storeCount >= limits.maxStores;

  const { data: allOrders } = await supabase
    .from("orders")
    .select("id, status, total_price, created_at, store_id")
    .eq("seller_id", uid)
    .order("created_at", { ascending: false });

  const totalOrders = allOrders?.length ?? 0;
  const pendingOrders = allOrders?.filter((o) => o.status === "pending").length ?? 0;

  const monthRevenue =
    allOrders
      ?.filter((o) => o.status === "completed")
      .reduce((s, o) => s + (o.total_price ?? 0), 0) ?? 0;

  const storeProductCounts: Record<string, number> = {};
  const storeRevenues: Record<string, number> = {};
  const storeOrderCounts: Record<string, number> = {};
  const storeLowStockCounts: Record<string, number> = {};

  if (stores) {
    for (const store of stores) {
      const { count: productCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("store_id", store.id);

      const { count: lowStockCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("store_id", store.id)
        .lte("stock", 5);

      storeProductCounts[store.id] = productCount ?? 0;
      storeLowStockCounts[store.id] = lowStockCount ?? 0;

      storeOrderCounts[store.id] =
        allOrders?.filter((o) => o.store_id === store.id).length ?? 0;

      storeRevenues[store.id] =
        allOrders
          ?.filter((o) => o.status === "completed" && o.store_id === store.id)
          .reduce((s, o) => s + (o.total_price ?? 0), 0) ?? 0;
    }
  }

  const totalProducts = Object.values(storeProductCounts).reduce((a, b) => a + b, 0);
  const lowStockCount = Object.values(storeLowStockCounts).reduce((a, b) => a + b, 0);

  const missingStoreDocs = stores?.filter((s) => !s.legal_doc_url).length ?? 0;
  const missingGlobalDocs = profile.address_verified ? 0 : 1;
  const totalMissingDocs = missingGlobalDocs + missingStoreDocs;

  const sortedByRevenue = [...(stores ?? [])].sort(
    (a, b) => (storeRevenues[b.id] ?? 0) - (storeRevenues[a.id] ?? 0)
  );

  const bestStore = sortedByRevenue[0];
  const worstStore = sortedByRevenue.length > 1 ? sortedByRevenue[sortedByRevenue.length - 1] : undefined;

  return (
    <main className="flex h-screen overflow-hidden bg-[#f3f4f8]">
      {/* SIDEBAR */}
      <aside className="hidden w-[260px] shrink-0 flex-col bg-[#070707] text-white lg:flex">
        <div className="border-b border-white/10 px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d2162c] text-lg font-black">
              M
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-widest">MACHE</h1>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/35">
                Espace vendeur
              </p>
            </div>
          </div>
        </div>

        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#d2162c] text-sm font-black">
              {firstName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black">{firstName}</p>
              <p className="text-xs text-white/45">{roleLabel}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5">
          {[
            ["Principal", [["Vue globale", "/dashboard/seller", "🏠", true, 0], ["Mes stores", "/dashboard/seller/stores", "🏪", false, 0]]],
            [
              "Gestion",
              [
                ["Documents", "/dashboard/seller/documents", "📄", false, totalMissingDocs],
                ["Finances globales", "/dashboard/seller/finance", "💰", false, 0],
                ["Analyse & Rapports", "/dashboard/seller/analytics", "📊", false, 0],
                ["Commandes", "/dashboard/seller/orders", "🛒", false, pendingOrders],
                ["Livraisons", "/dashboard/seller/deliveries", "🚚", false, 0],
              ],
            ],
            [
              "Croissance",
              [
                ["Accompagnement", "/dashboard/seller/support", "🤝", false, 0],
                ["Financement", "/dashboard/seller/financing", "🏦", false, 0],
                ["Partenaires", "/dashboard/seller/partners", "🌐", false, 0],
              ],
            ],
            [
              "Compte",
              [
                ["Notifications", "/dashboard/seller/notifications", "🔔", false, pendingOrders],
                ["Paramètres", "/dashboard/seller/settings", "⚙️", false, 0],
              ],
            ],
          ].map(([section, items]) => (
            <div key={section as string} className="mb-5">
              <p className="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/25">
                {section as string}
              </p>

              <div className="space-y-1">
                {(items as any[]).map(([label, href, icon, active, badge]) => (
                  <Link
                    key={label}
                    href={href}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-[14px] font-bold transition ${
                      active
                        ? "bg-[#d2162c] text-white"
                        : "text-white/65 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span>{icon}</span>
                    <span className="flex-1">{label}</span>
                    {badge > 0 && (
                      <span className="rounded-full bg-[#d2162c] px-2 py-0.5 text-[10px] font-black text-white">
                        {badge}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="mx-4 mb-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-sm font-black">Besoin d’aide ?</p>
          <p className="mt-1 text-xs text-white/40">Contactez un conseiller MACHE.</p>
          <Link
            href="/dashboard/seller/support"
            className="mt-4 block rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-center text-xs font-black text-white/80"
          >
            🎙️ Assistant vocal
          </Link>
        </div>

        <div className="px-4 pb-5">
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="w-full rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-xs font-black text-red-400"
            >
              Se déconnecter
            </button>
          </form>
        </div>
      </aside>

      {/* MAIN */}
      <section className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-[70px] shrink-0 items-center gap-5 border-b bg-white px-7">
          <p className="text-lg font-black text-gray-950">Vue globale</p>

          <div className="hidden max-w-[460px] flex-1 rounded-xl border bg-gray-50 px-4 py-3 text-sm text-gray-400 md:block">
            🔎 Rechercher un store, un produit, une commande...
          </div>

          <div className="ml-auto flex items-center gap-3">
            <button className="rounded-xl border bg-white px-4 py-3 text-xs font-black text-gray-600">
              Mode simple
            </button>

            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border bg-white">
              🔔
              {pendingOrders > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#d2162c] text-[10px] font-black text-white">
                  {pendingOrders}
                </span>
              )}
            </div>

            <div className="hidden items-center gap-3 sm:flex">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d2162c] text-sm font-black text-white">
                {firstName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-black text-gray-950">{firstName}</p>
                <p className="text-xs text-gray-400">{planName}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-7">
          <div className="space-y-7">
            {/* HERO */}
            <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
              <div>
                <h2 className="text-4xl font-black tracking-tight text-gray-950">
                  Bonjour, {firstName} 👋
                </h2>
                <p className="mt-2 text-base font-medium text-gray-500">
                  Voici la vue d’ensemble de votre activité sur MACHE.
                </p>

                <div className="mt-6 grid gap-5 sm:grid-cols-3">
                  {[
                    ["Stores actifs", storeCount, "sur " + limits.maxStores + " inclus", "🏪"],
                    ["Produits au total", totalProducts, "tous stores confondus", "📦"],
                    ["Commandes en cours", totalOrders, pendingOrders + " en attente", "🛒"],
                  ].map(([label, value, sub, icon]) => (
                    <div key={label as string} className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                        {icon}
                      </div>
                      <div>
                        <p className="text-3xl font-black leading-none text-gray-950">{value}</p>
                        <p className="mt-1 text-xs font-bold uppercase tracking-wide text-gray-400">
                          {label}
                        </p>
                        <p className="text-xs text-gray-400">{sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative overflow-hidden rounded-3xl bg-[#070707] p-6 text-white shadow-lg">
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/5" />
                <p className="text-xs font-black uppercase tracking-[0.2em] text-white/35">
                  Revenus estimés
                </p>
                <p className="mt-3 text-3xl font-black">{formatHTG(monthRevenue)}</p>
                <p className="mt-1 text-sm text-white/40">Ce mois-ci</p>

                <div className="mt-6 flex items-center justify-between">
                  <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-black text-green-300">
                    Données réelles
                  </span>
                  <Link href="/dashboard/seller/finance" className="text-sm font-black text-[#d2162c]">
                    Voir le rapport →
                  </Link>
                </div>
              </div>
            </section>

            {/* STORES */}
            <section>
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-2xl font-black text-gray-950">Mes stores</h3>
                <Link href="/dashboard/seller/stores" className="text-sm font-black text-[#d2162c]">
                  Voir tous mes stores →
                </Link>
              </div>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {stores?.map((store) => {
                  const revenue = storeRevenues[store.id] ?? 0;
                  const orders = storeOrderCounts[store.id] ?? 0;
                  const products = storeProductCounts[store.id] ?? 0;
                  const lowStock = storeLowStockCounts[store.id] ?? 0;
                  const initials = store.name
                    .split(" ")
                    .map((w: string) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <div key={store.id} className="overflow-hidden rounded-3xl border bg-white shadow-sm">
                      <div className="relative h-32 bg-gradient-to-br from-[#070707] via-[#111827] to-[#d2162c]">
                        <div className="absolute bottom-[-28px] left-5 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#d2162c] text-lg font-black text-white">
                          {store.logo_url ? (
                            <img src={store.logo_url} alt={store.name} className="h-full w-full object-cover" />
                          ) : (
                            initials
                          )}
                        </div>
                      </div>

                      <div className="p-5 pt-11">
                        <div className="mb-5 flex items-start justify-between gap-3">
                          <div>
                            <h4 className="text-xl font-black text-gray-950">{store.name}</h4>
                            <p className="text-xs text-gray-400">mache.ht/store/{store.slug}</p>
                          </div>

                          <span
                            className={`rounded-full px-2 py-1 text-[10px] font-black ${
                              store.is_verified
                                ? "bg-green-50 text-green-700"
                                : "bg-orange-50 text-orange-700"
                            }`}
                          >
                            {store.is_verified ? "Actif" : "En attente"}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="rounded-xl bg-gray-50 p-2 text-center">
                            <p className="text-[10px] text-gray-400">Ventes</p>
                            <p className="text-xs font-black">{formatHTG(revenue)}</p>
                          </div>
                          <div className="rounded-xl bg-gray-50 p-2 text-center">
                            <p className="text-[10px] text-gray-400">Commandes</p>
                            <p className="text-sm font-black">{orders}</p>
                          </div>
                          <div className="rounded-xl bg-gray-50 p-2 text-center">
                            <p className="text-[10px] text-gray-400">Stock bas</p>
                            <p className="text-sm font-black text-orange-600">{lowStock}</p>
                          </div>
                        </div>

                        <div className="mt-5 flex gap-2">
                          <Link
                            href={`/dashboard/seller/stores/${store.id}`}
                            className="flex-1 rounded-xl bg-[#070707] px-4 py-3 text-center text-xs font-black text-white"
                          >
                            Entrer →
                          </Link>
                          <Link
                            href={`/dashboard/seller/stores/${store.id}/settings`}
                            className="rounded-xl border px-4 py-3 text-sm"
                          >
                            ⚙️
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {!storeLimitReached && (
                  <Link
                    href="/dashboard/seller/stores/new"
                    className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-300 bg-white p-6 text-center transition hover:border-[#d2162c] hover:bg-red-50/30"
                  >
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-4xl text-gray-400">
                      +
                    </div>
                    <p className="mt-5 text-xl font-black text-gray-950">Ajouter un store</p>
                    <p className="mt-2 max-w-[220px] text-sm text-gray-500">
                      Développez votre activité en créant une nouvelle boutique.
                    </p>
                    <span className="mt-6 rounded-xl border bg-white px-6 py-3 text-sm font-black">
                      Créer un store
                    </span>
                  </Link>
                )}
              </div>
            </section>

            {/* DOCUMENTS / ALERTES */}
            <section className="grid gap-5 xl:grid-cols-3">
              <div className="rounded-3xl border bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-lg font-black text-gray-950">Documents personnels</h3>
                  {missingGlobalDocs > 0 && (
                    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-600">
                      {missingGlobalDocs} à compléter
                    </span>
                  )}
                </div>

                {[
                  ["Pièce d'identité", true],
                  ["Adresse personnelle", !!profile.address_verified],
                  ["Contrat marketplace MACHE", true],
                ].map(([label, ok]) => (
                  <div key={label as string} className="flex items-center justify-between border-t py-4 text-sm">
                    <span className="font-bold text-gray-700">{label}</span>
                    <span className={ok ? "font-black text-green-600" : "font-black text-orange-600"}>
                      {ok ? "Validé" : "À vérifier"}
                    </span>
                  </div>
                ))}

                <Link href="/dashboard/seller/documents" className="mt-4 block text-center text-sm font-black text-[#d2162c]">
                  Voir tous les documents →
                </Link>
              </div>

              <div className="rounded-3xl border bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-lg font-black text-gray-950">Documents par store</h3>
                  {missingStoreDocs > 0 && (
                    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-600">
                      {missingStoreDocs} à compléter
                    </span>
                  )}
                </div>

                {stores?.slice(0, 4).map((store) => {
                  const completed = store.legal_doc_url ? 4 : 2;
                  const total = 5;
                  const percent = Math.round((completed / total) * 100);

                  return (
                    <div key={store.id} className="border-t py-4">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-black text-gray-800">{store.name}</span>
                        <span className="text-xs font-bold text-gray-400">
                          {completed} / {total}
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full ${
                            percent >= 70 ? "bg-green-500" : "bg-orange-400"
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                <Link href="/dashboard/seller/documents" className="mt-4 block text-center text-sm font-black text-[#d2162c]">
                  Gérer les documents par store →
                </Link>
              </div>

              <div className="rounded-3xl border bg-white p-6 shadow-sm">
                <h3 className="mb-5 text-lg font-black text-gray-950">Alertes importantes</h3>

                {[
                  [`${lowStockCount} produits en stock faible`, "Répartis sur vos stores"],
                  [`${missingStoreDocs} documents manquants`, "Dans vos stores"],
                  [`${pendingOrders} commandes urgentes`, "À traiter rapidement"],
                ].map(([title, text]) => (
                  <div key={title} className="flex gap-4 border-t py-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-50">
                      ⚠️
                    </div>
                    <div>
                      <p className="font-black text-gray-900">{title}</p>
                      <p className="text-sm text-gray-500">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ANALYSE */}
            <section className="grid gap-5 xl:grid-cols-[1.4fr_0.9fr_0.9fr]">
              <div className="rounded-3xl border bg-white p-6 shadow-sm">
                <h3 className="mb-5 text-lg font-black text-gray-950">
                  Analyse globale de vos stores
                </h3>

                <div className="grid gap-4 md:grid-cols-4">
                  <div className="rounded-2xl bg-green-50 p-4">
                    <p className="text-xs font-bold text-gray-500">Performance</p>
                    <p className="mt-2 text-2xl font-black text-green-700">Live</p>
                    <p className="text-xs text-green-700">Données Supabase</p>
                  </div>
                  <div className="rounded-2xl bg-yellow-50 p-4">
                    <p className="text-xs font-bold text-gray-500">Store fort</p>
                    <p className="mt-2 font-black text-gray-900">{bestStore?.name ?? "—"}</p>
                  </div>
                  <div className="rounded-2xl bg-red-50 p-4">
                    <p className="text-xs font-bold text-gray-500">À surveiller</p>
                    <p className="mt-2 font-black text-gray-900">{worstStore?.name ?? "—"}</p>
                  </div>
                  <div className="rounded-2xl bg-orange-50 p-4">
                    <p className="text-xs font-bold text-gray-500">Stock critique</p>
                    <p className="mt-2 text-2xl font-black text-orange-700">{lowStockCount}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-black text-gray-950">Accompagnement</h3>
                {[
                  ["Centre d’aide", "Guides, vidéos et conseils"],
                  ["Formation vendeur", "Apprendre à booster vos ventes"],
                  ["Assistance vocale", "Écouter et gérer plus facilement"],
                ].map(([title, text]) => (
                  <Link key={title} href="/dashboard/seller/support" className="flex justify-between border-t py-4">
                    <div>
                      <p className="font-black text-gray-900">{title}</p>
                      <p className="text-sm text-gray-500">{text}</p>
                    </div>
                    <span>→</span>
                  </Link>
                ))}
              </div>

              <div className="rounded-3xl border bg-white p-6 shadow-sm">
                <h3 className="text-lg font-black text-gray-950">Financement & croissance</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Développez votre activité avec nos partenaires.
                </p>

                <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs font-bold">
                  <div className="rounded-2xl bg-blue-50 p-3">🏦<br />Fonds</div>
                  <div className="rounded-2xl bg-yellow-50 p-3">📦<br />Stock</div>
                  <div className="rounded-2xl bg-green-50 p-3">📣<br />Pub</div>
                </div>

                <Link
                  href="/dashboard/seller/financing"
                  className="mt-6 block rounded-xl bg-[#070707] px-4 py-3 text-center text-sm font-black text-white"
                >
                  Voir les offres →
                </Link>
              </div>
            </section>

            <section className="rounded-3xl bg-gradient-to-r from-[#6366f1] via-[#a855f7] to-[#ec4899] p-6 text-white">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-2xl font-black">Besoin d’un accompagnement personnalisé ?</h3>
                  <p className="text-sm text-white/75">
                    Nos experts MACHE sont là pour vous aider à faire grandir votre business.
                  </p>
                </div>
                <Link href="/dashboard/seller/support" className="rounded-xl bg-white/20 px-6 py-4 text-sm font-black">
                  Parler à un conseiller →
                </Link>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
