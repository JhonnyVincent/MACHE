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

  const { data: profile } = await supabase
    .from("users")
    .select("role, full_name, email, address_verified")
    .eq("id", userData.user.id)
    .single();

  const role = String(profile?.role || "").trim();

  if (!profile || !SELLER_ROLES.includes(role)) {
    redirect(`/login?error=${encodeURIComponent(`Role lu par le code: ${role || "aucun profil trouvé"}`)}`);
  }

  const uid = userData.user.id;
  const displayName = profile.full_name?.split(" ")[0] || "Vendeur";
  const roleLabel = ROLE_LABELS[role];
  const planName = ROLE_PLAN_KEY[role];
  const limits = PLAN_LIMITS[role];

  // ── Stores ──
  const { data: stores } = await supabase
    .from("stores")
    .select("id, slug, name, is_verified, description, logo_url, category, legal_doc_url, created_at")
    .eq("owner_id", uid)
    .order("created_at", { ascending: true });

  const storeCount = stores?.length ?? 0;
  const storeLimitReached = storeCount >= limits.maxStores;

  // ── Commandes ──
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

  // ── Stats par store ──
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
  const missingStoreDocs = stores?.filter((s) => !s.legal_doc_url).length ?? 0;
  const missingGlobalDocs = profile.address_verified ? 0 : 1;
  const totalMissingDocs = missingGlobalDocs + missingStoreDocs;
  const bestStore = stores?.[0];
  const worstStore = stores?.[1];

  return (
    <main className="min-h-screen bg-[#f7f8fb]">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">

        {/* ══ SIDEBAR ══ */}
        <aside className="hidden bg-[#071f3d] text-white lg:flex lg:flex-col">
          <div className="p-6 border-b border-white/10">
            <h1 className="text-2xl font-black tracking-tight">Maché</h1>
            <p className="text-xs text-white/50 mt-0.5">Espace vendeur</p>
          </div>

          {/* Profil vendeur */}
          <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#d2162c] flex items-center justify-center text-sm font-black shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{displayName}</p>
              <p className="text-xs text-white/50">{roleLabel}</p>
            </div>
          </div>

          <nav className="flex-1 py-4 px-3 space-y-1">
            {[
              ["Vue globale",       "/dashboard/seller",              "🏠",  true],
              ["Mes stores",        "/dashboard/seller/stores",       "🏪",  false],
              ["Documents",         "/dashboard/seller/documents",    "📄",  false],
              ["Finances",          "/dashboard/seller/finance",      "💰",  false],
              ["Analyses",          "/dashboard/seller/analytics",    "📊",  false],
              ["Accompagnement",    "/dashboard/seller/support",      "🤝",  false],
              ["Financement",       "/dashboard/seller/financing",    "🏦",  false],
              ["Partenaires",       "/dashboard/seller/partners",     "🌐",  false],
              ["Notifications",     "/dashboard/seller/notifications","🔔",  false],
              ["Paramètres",        "/dashboard/seller/settings",     "⚙️", false],
            ].map(([label, href, icon, active]) => (
              <Link
                key={label as string}
                href={href as string}
                className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  active ? "bg-[#d2162c] text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="text-base">{icon}</span>
                <span>{label}</span>
                {label === "Documents" && totalMissingDocs > 0 && (
                  <span className="ml-auto rounded-full bg-[#d2162c] px-2 py-0.5 text-xs font-bold">
                    {totalMissingDocs}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Plan */}
          <div className="mx-4 mb-4 rounded-2xl bg-white/5 border border-white/10 p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-bold">👑 {planName}</p>
              <span className="text-[10px] bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full font-bold">Actif</span>
            </div>
            <p className="text-xs text-white/50 mb-3">{storeCount}/{limits.maxStores} stores utilisés</p>
            <div className="h-1.5 rounded-full bg-white/10 mb-3">
              <div className="h-1.5 rounded-full bg-[#d2162c]" style={{ width: `${Math.min((storeCount / limits.maxStores) * 100, 100)}%` }} />
            </div>
            <Link href="/dashboard/seller/subscription" className="block text-center text-xs font-bold text-white/70 hover:text-white">
              Gérer mon abonnement →
            </Link>
          </div>

          {/* Déconnexion */}
          <div className="px-4 pb-5">
            <form action="/auth/signout" method="post">
              <button type="submit" className="w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-400 border border-red-400/20 rounded-xl px-4 py-2.5 text-sm hover:bg-red-500/20 transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Se déconnecter
              </button>
            </form>
          </div>
        </aside>

        {/* ══ MAIN ══ */}
        <section className="flex flex-col">

          {/* Topbar */}
          <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-6 py-3.5">
              <div className="flex items-center gap-3">
                <button className="rounded-xl border px-3 py-2 lg:hidden">☰</button>
                <p className="font-bold text-[#071f3d] text-sm">Vue globale</p>
              </div>
              <div className="hidden flex-1 justify-center md:flex max-w-md mx-auto">
                <div className="w-full rounded-xl bg-neutral-100 px-4 py-2.5 text-sm text-neutral-400">
                  🔎 Rechercher un store, produit, commande...
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="rounded-xl border bg-white px-3 py-2 text-sm cursor-pointer">🔔</div>
                  {pendingOrders > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#d2162c] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{pendingOrders}</span>
                  )}
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-bold text-[#071f3d]">{displayName}</p>
                  <p className="text-xs text-neutral-400">{planName}</p>
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 space-y-6 p-6">

            {/* Hero */}
            <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
              <div>
                <h2 className="text-2xl font-black text-[#071f3d]">Bonjour, {displayName} 👋</h2>
                <p className="mt-1 text-sm text-neutral-500">Voici la vue d'ensemble de votre activité sur Maché.</p>
              </div>
              <div className="rounded-2xl bg-[#071f3d] p-5 text-white">
                <p className="text-xs text-white/60">Revenus ce mois</p>
                <p className="mt-1.5 text-2xl font-black">{formatHTG(monthRevenue)}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-bold text-green-300">+18.6%</span>
                  <Link href="/dashboard/seller/finance" className="text-xs font-bold text-white/70 hover:text-white">Voir le rapport →</Link>
                </div>
              </div>
            </div>

            {/* KPIs */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Stores actifs",    value: storeCount,     sub: `sur ${limits.maxStores} inclus` },
                { label: "Produits total",   value: totalProducts,  sub: "tous stores confondus" },
                { label: "Commandes",        value: totalOrders,    sub: `${pendingOrders} en attente` },
                { label: "Forfait",          value: planName,       sub: roleLabel },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl bg-white p-5 shadow-sm">
                  <p className="text-xs text-neutral-400">{s.label}</p>
                  <p className="mt-2 text-2xl font-black text-[#071f3d]">{s.value}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Alertes */}
            {pendingOrders > 0 && (
              <div className="bg-[#fdf0f1] border border-[#f5b8be] rounded-2xl p-4 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#d2162c] shrink-0" />
                <p className="flex-1 text-sm font-medium text-[#071f3d]">{pendingOrders} commande{pendingOrders > 1 ? "s" : ""} en attente de traitement</p>
                <Link href="/dashboard/seller/orders" className="text-xs text-[#d2162c] bg-white border border-[#f5b8be] rounded-lg px-3 py-1.5 shrink-0">Traiter →</Link>
              </div>
            )}

            {/* Mes stores */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-[#071f3d]">Mes boutiques</h3>
                <Link href="/dashboard/seller/stores" className="text-sm font-bold text-[#d2162c]">Voir tout →</Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {stores?.map((store) => {
                  const revenue = storeRevenues[store.id] ?? 0;
                  const orders = storeOrderCounts[store.id] ?? 0;
                  const products = storeProductCounts[store.id] ?? 0;
                  return (
                    <div key={store.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                      <div className="h-24 bg-gradient-to-r from-[#071f3d] to-[#d2162c] p-4 flex items-end">
                        <div className="w-12 h-12 rounded-xl border-2 border-white bg-[#071f3d] flex items-center justify-center text-lg font-black text-white overflow-hidden">
                          {store.logo_url ? <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" /> : store.name?.charAt(0)?.toUpperCase()}
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <h4 className="font-black text-[#071f3d]">{store.name}</h4>
                            <p className="text-xs text-neutral-400">mache.ht/store/{store.slug}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${store.is_verified ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"}`}>
                            {store.is_verified ? "✓ Vérifié" : "⏳ En attente"}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center mb-4">
                          <div className="bg-[#f7f8fb] rounded-xl p-2">
                            <p className="text-[10px] text-neutral-400">Ventes</p>
                            <p className="text-xs font-black text-[#071f3d]">{formatHTG(revenue)}</p>
                          </div>
                          <div className="bg-[#f7f8fb] rounded-xl p-2">
                            <p className="text-[10px] text-neutral-400">Commandes</p>
                            <p className="text-sm font-black text-[#071f3d]">{orders}</p>
                          </div>
                          <div className="bg-[#f7f8fb] rounded-xl p-2">
                            <p className="text-[10px] text-neutral-400">Produits</p>
                            <p className="text-sm font-black text-[#071f3d]">{products}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/dashboard/seller/stores/${store.id}`} className="flex-1 bg-[#071f3d] text-white text-center text-xs font-bold py-2.5 rounded-xl hover:bg-[#0f2d50] transition">
                            Gérer →
                          </Link>
                          <Link href={`/store/${store.slug}`} target="_blank" className="border rounded-xl px-3 py-2.5 text-xs text-neutral-500 hover:bg-gray-50 transition">
                            Voir
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {!storeLimitReached && (
                  <Link href="/dashboard/seller/stores/new" className="flex flex-col items-center justify-center min-h-[260px] bg-white rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#d2162c] hover:bg-[#fdf0f1] transition group">
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-2xl text-gray-400 group-hover:bg-[#f5b8be] group-hover:text-[#d2162c] transition mb-3">+</div>
                    <p className="font-black text-[#071f3d] group-hover:text-[#d2162c]">Ajouter une boutique</p>
                    <p className="text-xs text-neutral-400 mt-1">{limits.maxStores - storeCount} emplacement{limits.maxStores - storeCount > 1 ? "s" : ""} restant{limits.maxStores - storeCount > 1 ? "s" : ""}</p>
                  </Link>
                )}
              </div>
            </div>

            {/* Documents + Alertes + Analyse */}
            <div className="grid gap-5 xl:grid-cols-3">

              {/* Documents personnels */}
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-[#071f3d] text-sm">Documents personnels</h3>
                  {missingGlobalDocs > 0 && (
                    <span className="text-[10px] bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded-full">{missingGlobalDocs} à compléter</span>
                  )}
                </div>
                {[
                  ["Pièce d'identité",    true],
                  ["Adresse personnelle", !!profile.address_verified],
                  ["Contrat Maché",       true],
                ].map(([label, ok]) => (
                  <div key={label as string} className="flex items-center justify-between border-t py-2.5 text-sm">
                    <span className="text-[#071f3d] text-xs">{label}</span>
                    <span className={`text-xs font-bold ${ok ? "text-green-600" : "text-orange-600"}`}>{ok ? "✓ Validé" : "À compléter"}</span>
                  </div>
                ))}
                <Link href="/dashboard/seller/documents" className="mt-3 block text-center text-xs font-bold text-[#d2162c]">Voir tous les documents →</Link>
              </div>

              {/* Documents par store */}
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-[#071f3d] text-sm">Documents par boutique</h3>
                  {missingStoreDocs > 0 && (
                    <span className="text-[10px] bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded-full">{missingStoreDocs} à compléter</span>
                  )}
                </div>
                {stores?.slice(0, 4).map((store) => (
                  <div key={store.id} className="border-t py-2.5">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-[#071f3d]">{store.name}</span>
                      <span className={store.legal_doc_url ? "text-green-600" : "text-orange-600"}>
                        {store.legal_doc_url ? "Complet" : "Manquant"}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-neutral-100">
                      <div className={`h-1.5 rounded-full ${store.legal_doc_url ? "bg-green-500" : "bg-orange-400"}`} style={{ width: store.legal_doc_url ? "100%" : "35%" }} />
                    </div>
                  </div>
                ))}
                <Link href="/dashboard/seller/documents" className="mt-3 block text-center text-xs font-bold text-[#d2162c]">Gérer les documents →</Link>
              </div>

              {/* Alertes */}
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h3 className="font-black text-[#071f3d] text-sm mb-4">Alertes importantes</h3>
                {[
                  [`${pendingOrders} commandes urgentes`,           "À traiter rapidement"],
                  [`${missingStoreDocs} documents manquants`,       "Dans vos boutiques"],
                  [`${Math.max(0, Math.round(totalProducts * 0.1))} produits stock faible`, "Répartis sur vos stores"],
                ].map(([title, text]) => (
                  <div key={title} className="flex gap-3 border-t py-3">
                    <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-sm shrink-0">⚠️</div>
                    <div>
                      <p className="text-sm font-bold text-[#071f3d]">{title}</p>
                      <p className="text-xs text-neutral-400">{text}</p>
                    </div>
                  </div>
                ))}
                <Link href="/dashboard/seller/alerts" className="mt-3 block text-center text-xs font-bold text-[#d2162c]">Voir toutes les alertes →</Link>
              </div>
            </div>

            {/* Analyse + Accompagnement */}
            <div className="grid gap-5 xl:grid-cols-3">
              <div className="bg-white rounded-2xl p-5 shadow-sm xl:col-span-2">
                <h3 className="font-black text-[#071f3d] text-sm mb-4">Analyse globale</h3>
                <div className="grid gap-3 sm:grid-cols-4">
                  {[
                    { label: "Performance", value: "+18.6%",               color: "bg-green-50 text-green-700" },
                    { label: "Store fort",  value: bestStore?.name ?? "—", color: "bg-yellow-50 text-yellow-700" },
                    { label: "À surveiller", value: worstStore?.name ?? "—", color: "bg-red-50 text-red-700" },
                    { label: "Stock critique", value: `${Math.max(0, Math.round(totalProducts * 0.1))}`, color: "bg-orange-50 text-orange-700" },
                  ].map((s) => (
                    <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
                      <p className="text-xs opacity-70 mb-1">{s.label}</p>
                      <p className="font-black text-sm">{s.value}</p>
                    </div>
                  ))}
                </div>
                <Link href="/dashboard/seller/analytics" className="mt-4 block text-center text-xs font-bold text-[#d2162c]">Voir l'analyse complète →</Link>
              </div>
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <h3 className="font-black text-[#071f3d] text-sm mb-3">Accompagnement</h3>
                  {[
                    ["Centre d'aide",    "Guides et conseils"],
                    ["Formation",        "Booster vos ventes"],
                    ["Conseiller Maché", "Aide personnalisée"],
                  ].map(([title, text]) => (
                    <Link key={title} href="/dashboard/seller/support" className="flex items-center justify-between border-t py-2.5 hover:bg-gray-50 transition -mx-2 px-2 rounded">
                      <div>
                        <p className="text-xs font-bold text-[#071f3d]">{title}</p>
                        <p className="text-[10px] text-neutral-400">{text}</p>
                      </div>
                      <span className="text-xs text-neutral-400">→</span>
                    </Link>
                  ))}
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <h3 className="font-black text-[#071f3d] text-sm mb-2">Financement</h3>
                  <p className="text-xs text-neutral-400 mb-3">Préparez vos dossiers pour nos partenaires.</p>
                  <Link href="/dashboard/seller/financing" className="block bg-[#071f3d] text-white text-center text-xs font-bold py-2.5 rounded-xl hover:bg-[#0f2d50] transition">
                    Voir les offres →
                  </Link>
                </div>
              </div>
            </div>

            {/* Banner upgrade */}
            <div className="rounded-2xl bg-[#071f3d] p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black text-[#d2162c] mb-1">Passez au plan Premium</p>
                <p className="text-xs text-white/60">Débloquez plus de stores, des outils IA avancés, et boostez votre visibilité.</p>
              </div>
              <Link href="/dashboard/seller/subscription" className="shrink-0 bg-[#d2162c] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-[#b81226] transition whitespace-nowrap">
                👑 Découvrir Premium →
              </Link>
            </div>

          </div>
        </section>
      </div>
    </main>
  );
}
