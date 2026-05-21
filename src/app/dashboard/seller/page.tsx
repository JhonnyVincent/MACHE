import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const SELLER_ROLES = ["seller_individual", "seller_business", "official_brand"];

const ROLE_LABELS: Record<string, string> = {
  seller_individual: "Vendeur particulier",
  seller_business: "Vendeur business",
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
  return `${value.toLocaleString()} HTG`;
}

export default async function SellerDashboardPage() {
  const supabase = await createSupabaseServerClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login?next=/dashboard/seller");

  let { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, role, full_name, email, address_verified")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (!profile && userData.user.email) {
    const result = await supabase
      .from("users")
      .select("id, role, full_name, email, address_verified")
      .eq("email", userData.user.email)
      .maybeSingle();

    profile = result.data;
    profileError = result.error;
  }

  if (profileError) {
    redirect(`/login?error=${encodeURIComponent(`Erreur profil: ${profileError.message}`)}`);
  }

  if (!profile) {
    redirect(`/login?error=${encodeURIComponent("Aucun profil trouvé")}`);
  }

  const role = String(profile.role || "").trim();

  if (!SELLER_ROLES.includes(role)) {
    redirect(`/login?error=${encodeURIComponent(`Role lu par le code: ${role}`)}`);
  }

  const uid = userData.user.id;
  const displayName = profile.full_name?.split(" ")[0] || "Vendeur";
  const roleLabel = ROLE_LABELS[role];
  const planName = ROLE_PLAN_KEY[role];
  const limits = PLAN_LIMITS[role];

  const { data: stores } = await supabase
    .from("stores")
    .select("id, slug, name, is_verified, description, logo_url, category, legal_doc_url, created_at")
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
      .reduce((sum, o) => sum + (o.total_price ?? 0), 0) ?? 0;

  const storeProductCounts: Record<string, number> = {};
  const storeRevenues: Record<string, number> = {};
  const storeOrderCounts: Record<string, number> = {};

  if (stores) {
    for (const store of stores) {
      const { count } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("store_id", store.id);

      storeProductCounts[store.id] = count ?? 0;
      storeOrderCounts[store.id] = allOrders?.filter((o) => o.store_id === store.id).length ?? 0;

      storeRevenues[store.id] =
        allOrders
          ?.filter((o) => o.status === "completed" && o.store_id === store.id)
          .reduce((sum, o) => sum + (o.total_price ?? 0), 0) ?? 0;
    }
  }

  const totalProducts = Object.values(storeProductCounts).reduce((a, b) => a + b, 0);
  const missingGlobalDocs = profile.address_verified ? 0 : 1;
  const missingStoreDocs = stores?.filter((s) => !s.legal_doc_url).length ?? 0;
  const totalMissingDocs = missingGlobalDocs + missingStoreDocs;
  const bestStore = stores?.[0];
  const worstStore = stores?.[1];

  return (
    <main className="min-h-screen bg-[#f7f8fc]">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="hidden bg-[#071f3d] text-white lg:flex lg:flex-col">
          <div className="p-7">
            <h1 className="text-4xl font-black tracking-tight">MACHE</h1>
            <p className="mt-1 text-sm text-white/60">Espace vendeur</p>
          </div>

          <div className="border-y border-white/10 px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e31b3d] text-lg font-black">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-black">{displayName}</p>
                <p className="text-xs text-white/55">{roleLabel}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-2 px-4 py-5 text-sm font-bold">
            {[
              ["🏠", "Vue globale", "/dashboard/seller", true, ""],
              ["🏪", "Mes stores", "/dashboard/seller/stores", false, ""],
              ["📄", "Documents", "/dashboard/seller/documents", false, totalMissingDocs > 0 ? String(totalMissingDocs) : ""],
              ["💰", "Finances globales", "/dashboard/seller/finance", false, ""],
              ["📊", "Analyse & Rapports", "/dashboard/seller/analytics", false, ""],
              ["🤝", "Accompagnement", "/dashboard/seller/support", false, ""],
              ["🏦", "Financement", "/dashboard/seller/financing", false, ""],
              ["🌐", "Partenaires", "/dashboard/seller/partners", false, ""],
              ["🔔", "Notifications", "/dashboard/seller/notifications", false, pendingOrders > 0 ? String(pendingOrders) : ""],
              ["⚙️", "Paramètres", "/dashboard/seller/settings", false, ""],
            ].map(([icon, label, href, active, badge]) => (
              <Link
                key={label as string}
                href={href as string}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition ${
                  active ? "bg-[#e31b3d] text-white" : "text-white/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span>{icon}</span>
                <span>{label}</span>
                {badge && (
                  <span className="ml-auto rounded-full bg-[#e31b3d] px-2 py-0.5 text-xs">
                    {badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className="mx-4 mb-5 rounded-3xl border border-white/15 bg-white/5 p-5">
            <p className="font-black">Besoin d’aide ?</p>
            <p className="mt-1 text-sm text-white/60">Parler à un conseiller MACHE</p>
            <button className="mt-4 w-full rounded-2xl border border-white/20 px-4 py-3 text-sm font-bold">
              🎙️ Lancer l’assistant vocal
            </button>
          </div>
        </aside>

        <section className="flex flex-col">
          <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
            <div className="flex h-[76px] items-center justify-between gap-4 px-7">
              <div className="flex items-center gap-6">
                <button className="rounded-xl border px-3 py-2 lg:hidden">☰</button>
                <p className="font-black text-[#071f3d]">Vue globale</p>
              </div>

              <div className="hidden w-full max-w-xl rounded-2xl bg-[#f1f2f5] px-5 py-3 text-sm text-neutral-400 md:block">
                🔎 Rechercher un store, un produit, une commande...
              </div>

              <div className="flex items-center gap-4">
                <button className="rounded-2xl border bg-white px-5 py-3 text-sm font-black">
                  Mode simple
                </button>

                <div className="relative rounded-2xl border bg-white px-4 py-3">
                  🔔
                  {pendingOrders > 0 && (
                    <span className="absolute -right-1 -top-1 rounded-full bg-[#e31b3d] px-1.5 text-xs text-white">
                      {pendingOrders}
                    </span>
                  )}
                </div>

                <div className="hidden text-right sm:block">
                  <p className="font-black text-[#071f3d]">{displayName}</p>
                  <p className="text-xs text-neutral-500">{planName}</p>
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 space-y-6 p-7">
            <section className="grid gap-6 xl:grid-cols-[1fr_620px]">
              <div>
                <h2 className="text-3xl font-black text-[#071f3d]">
                  Bonjour, {displayName} 👋
                </h2>
                <p className="mt-2 text-sm text-neutral-500">
                  Voici la vue d’ensemble de votre activité sur MACHE.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-[1fr_360px]">
                <div className="rounded-3xl bg-white p-5 shadow-sm">
                  <div className="grid grid-cols-3 divide-x text-center">
                    <div>
                      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-orange-50 text-xl">🏪</div>
                      <p className="mt-2 text-2xl font-black">{storeCount}</p>
                      <p className="text-xs text-neutral-500">Stores actifs</p>
                    </div>
                    <div>
                      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-green-50 text-xl">📦</div>
                      <p className="mt-2 text-2xl font-black">{totalProducts}</p>
                      <p className="text-xs text-neutral-500">Produits au total</p>
                    </div>
                    <div>
                      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-xl">🛒</div>
                      <p className="mt-2 text-2xl font-black">{totalOrders}</p>
                      <p className="text-xs text-neutral-500">Commandes</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl bg-[#08244a] p-6 text-white shadow-lg">
                  <p className="text-sm text-white/70">Revenus estimés ce mois</p>
                  <p className="mt-2 text-3xl font-black">{formatHTG(monthRevenue)}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-black text-green-300">
                      +18.6%
                    </span>
                    <Link href="/dashboard/seller/finance" className="text-sm font-black">
                      Voir le rapport →
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-black text-[#071f3d]">Mes stores</h3>
                <Link href="/dashboard/seller/stores" className="text-sm font-black text-[#2757d8]">
                  Voir tous mes stores →
                </Link>
              </div>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {stores?.map((store) => {
                  const revenue = storeRevenues[store.id] ?? 0;
                  const orders = storeOrderCounts[store.id] ?? 0;
                  const products = storeProductCounts[store.id] ?? 0;
                  const stockWeak = Math.max(0, Math.round(products * 0.12));

                  return (
                    <div key={store.id} className="overflow-hidden rounded-3xl bg-white shadow-sm">
                      <div className="relative h-32 bg-gradient-to-r from-[#071f3d] to-[#e31b3d]">
                        <div className="absolute bottom-[-26px] left-5 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#071f3d] text-xl font-black text-white">
                          {store.logo_url ? (
                            <img src={store.logo_url} alt={store.name} className="h-full w-full object-cover" />
                          ) : (
                            store.name?.charAt(0)?.toUpperCase()
                          )}
                        </div>
                      </div>

                      <div className="p-5 pt-10">
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="text-lg font-black text-[#071f3d]">{store.name}</h4>
                          <span className={`rounded-full px-2 py-1 text-xs font-black ${
                            store.is_verified ? "bg-green-100 text-green-700" : "bg-orange-50 text-orange-700"
                          }`}>
                            {store.is_verified ? "● Actif" : "À vérifier"}
                          </span>
                        </div>

                        <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-neutral-500">Ventes</p>
                            <p className="font-black text-[#071f3d]">{formatHTG(revenue)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-500">Commandes</p>
                            <p className="font-black text-[#071f3d]">{orders}</p>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-500">Stock faible</p>
                            <p className="font-black text-orange-600">{stockWeak}</p>
                          </div>
                        </div>

                        <div className="mt-5 flex gap-3">
                          <Link href={`/dashboard/seller/stores/${store.id}`} className="flex-1 rounded-xl bg-[#071f3d] px-4 py-3 text-center text-sm font-black text-white">
                            Entrer dans le store →
                          </Link>
                          <Link href={`/dashboard/seller/stores/${store.id}/settings`} className="rounded-xl border px-4 py-3">
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
                    className="flex min-h-[318px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[#d4d9e6] bg-white text-center transition hover:border-[#e31b3d]"
                  >
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#eef0ff] text-4xl text-[#5d6dfd]">
                      +
                    </div>
                    <h4 className="mt-5 text-xl font-black text-[#071f3d]">Ajouter un store</h4>
                    <p className="mt-2 max-w-[220px] text-sm text-neutral-500">
                      Développez votre activité en créant un nouveau store.
                    </p>
                    <span className="mt-6 rounded-xl border px-10 py-3 text-sm font-black">
                      Créer un store
                    </span>
                  </Link>
                )}
              </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-3">
              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-black">📄 Documents de l’entreprise</h3>
                  <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-600">
                    {missingGlobalDocs} à compléter
                  </span>
                </div>

                {[
                  ["Pièce d’identité", "Validé", true],
                  ["Adresse personnelle", profile.address_verified ? "Validé" : "À vérifier", !!profile.address_verified],
                  ["Contrat marketplace MACHE", "Validé", true],
                ].map(([label, status, ok]) => (
                  <div key={label as string} className="flex items-center justify-between border-t py-3 text-sm">
                    <span>{label}</span>
                    <span className={ok ? "font-bold text-green-600" : "font-bold text-orange-600"}>{status}</span>
                  </div>
                ))}

                <Link href="/dashboard/seller/documents" className="mt-4 block text-center text-sm font-black text-[#2757d8]">
                  Voir tous les documents →
                </Link>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-black">📄 Documents par store</h3>
                  <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-600">
                    {missingStoreDocs} à compléter
                  </span>
                </div>

                {stores?.slice(0, 3).map((store) => (
                  <div key={store.id} className="border-t py-3">
                    <div className="mb-2 flex justify-between text-sm">
                      <b>{store.name}</b>
                      <span>{store.legal_doc_url ? "Complet" : "Document manquant"} ›</span>
                    </div>
                    <div className="h-2 rounded-full bg-neutral-100">
                      <div
                        className={`h-2 rounded-full ${store.legal_doc_url ? "bg-green-500" : "bg-orange-400"}`}
                        style={{ width: store.legal_doc_url ? "100%" : "35%" }}
                      />
                    </div>
                  </div>
                ))}

                <Link href="/dashboard/seller/documents" className="mt-4 block text-center text-sm font-black text-[#2757d8]">
                  Gérer les documents par store →
                </Link>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <h3 className="font-black">🔔 Alertes importantes</h3>

                {[
                  [`${pendingOrders} commandes urgentes`, "À traiter rapidement"],
                  [`${missingStoreDocs} documents manquants`, "Dans vos stores"],
                  [`${Math.max(0, Math.round(totalProducts * 0.1))} produits en stock faible`, "Répartis sur vos stores"],
                ].map(([title, sub]) => (
                  <div key={title} className="flex gap-3 border-t py-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-50">
                      ⚠️
                    </div>
                    <div>
                      <p className="font-black">{title}</p>
                      <p className="text-sm text-neutral-500">{sub}</p>
                    </div>
                  </div>
                ))}

                <Link href="/dashboard/seller/alerts" className="mt-4 block text-center text-sm font-black text-[#2757d8]">
                  Voir toutes les alertes →
                </Link>
              </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-[1.6fr_0.8fr_1.1fr]">
              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <h3 className="font-black">📊 Analyse globale de vos stores</h3>

                <div className="mt-5 grid gap-4 md:grid-cols-4">
                  <div className="rounded-2xl bg-green-50 p-4">
                    <p className="text-xs text-neutral-500">Performance globale</p>
                    <p className="mt-2 text-2xl font-black text-green-700">+18.6%</p>
                    <p className="text-xs text-green-700">vs mois dernier</p>
                  </div>
                  <div className="rounded-2xl bg-orange-50 p-4">
                    <p className="text-xs text-neutral-500">Store le plus performant</p>
                    <p className="mt-2 font-black">{bestStore?.name ?? "—"}</p>
                    <p className="text-xs text-green-700">Bonne performance</p>
                  </div>
                  <div className="rounded-2xl bg-red-50 p-4">
                    <p className="text-xs text-neutral-500">Store en difficulté</p>
                    <p className="mt-2 font-black">{worstStore?.name ?? "—"}</p>
                    <p className="text-xs text-red-600">À analyser</p>
                  </div>
                  <div className="rounded-2xl bg-orange-50 p-4">
                    <p className="text-xs text-neutral-500">Produits à surveiller</p>
                    <p className="mt-2 font-black">{Math.max(0, Math.round(totalProducts * 0.1))} produits</p>
                    <p className="text-xs text-neutral-500">Stock critique</p>
                  </div>
                </div>

                <Link href="/dashboard/seller/analytics" className="mt-5 block text-center text-sm font-black text-[#2757d8]">
                  Voir l’analyse complète →
                </Link>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <h3 className="font-black">🤝 Accompagnement</h3>

                {[
                  ["Centre d’aide", "Guides, vidéos et conseils"],
                  ["Formation vendeur", "Apprenez à booster vos ventes"],
                  ["Assistance vocale", "Écoutez et gérez plus facilement"],
                ].map(([title, sub]) => (
                  <Link key={title} href="/dashboard/seller/support" className="flex items-center justify-between border-t py-3 text-sm">
                    <div>
                      <b>{title}</b>
                      <p className="text-xs text-neutral-500">{sub}</p>
                    </div>
                    <span>›</span>
                  </Link>
                ))}
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <h3 className="font-black">🏦 Financement & croissance</h3>
                <p className="mt-1 text-xs text-neutral-500">
                  Développez votre activité avec nos partenaires.
                </p>

                <div className="mt-6 grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="rounded-2xl bg-[#eef0ff] p-3">💰<br />Financement</div>
                  <div className="rounded-2xl bg-[#eef0ff] p-3">📦<br />Stock</div>
                  <div className="rounded-2xl bg-[#eef0ff] p-3">📣<br />Marketing</div>
                </div>

                <Link href="/dashboard/seller/financing" className="mt-6 block rounded-xl bg-[#071f3d] px-4 py-3 text-center text-sm font-black text-white">
                  Voir les offres disponibles ›
                </Link>
              </div>
            </section>

            <section className="rounded-3xl bg-gradient-to-r from-[#6656f6] to-[#ffd6e7] p-5 text-white">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-xl font-black">Besoin d’un accompagnement personnalisé ?</h3>
                  <p className="text-sm text-white/80">
                    Nos experts MACHE sont là pour vous aider à faire grandir votre business.
                  </p>
                </div>

                <Link href="/dashboard/seller/support" className="rounded-xl bg-[#6656f6] px-8 py-4 font-black shadow-lg">
                  🎧 Parler à un conseiller ›
                </Link>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
