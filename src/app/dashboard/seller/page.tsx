import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const SELLER_ROLES = ["seller_individual", "seller_business", "official_brand"];

const ROLE_LABELS: Record<string, string> = {
  seller_individual: "Vendeur particulier",
  seller_business:   "Vendeur Business",
  official_brand:    "Marque officielle",
};

const PLAN_LIMITS: Record<string, { maxStores: number; maxArticlesPerStore: number }> = {
  seller_individual: { maxStores: 1,  maxArticlesPerStore: 50    },
  seller_business:   { maxStores: 2,  maxArticlesPerStore: 500   },
  official_brand:    { maxStores: 10, maxArticlesPerStore: 10000 },
};

const ROLE_PLAN_KEY: Record<string, string> = {
  seller_individual: "Gratuit",
  seller_business:   "Business",
  official_brand:    "Marque officielle",
};

function formatHTG(value: number) {
  return `${value.toLocaleString("fr-FR")} HTG`;
}

// ── Icônes SVG inline ──────────────────────────────────────────────────────────
const Icon = ({ d, size = 16 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

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
    redirect(`/login?error=${encodeURIComponent(`Role: ${role || "aucun profil trouvé"}`)}`);
  }

  const uid          = userData.user.id;
  const displayName  = profile.full_name || "Vendeur";
  const firstName    = displayName.split(" ")[0];
  const roleLabel    = ROLE_LABELS[role];
  const planName     = ROLE_PLAN_KEY[role];
  const limits       = PLAN_LIMITS[role];

  // ── Stores ──
  const { data: stores } = await supabase
    .from("stores")
    .select("id, slug, name, is_verified, logo_url, category, legal_doc_url, created_at")
    .eq("owner_id", uid)
    .order("created_at", { ascending: true });

  const storeCount       = stores?.length ?? 0;
  const storeLimitReached = storeCount >= limits.maxStores;

  // ── Commandes ──
  const { data: allOrders } = await supabase
    .from("orders")
    .select("id, status, total_price, created_at, store_id")
    .eq("seller_id", uid)
    .order("created_at", { ascending: false });

  const totalOrders   = allOrders?.length ?? 0;
  const pendingOrders = allOrders?.filter(o => o.status === "pending").length ?? 0;
  const monthRevenue  = allOrders
    ?.filter(o => o.status === "completed")
    .reduce((s, o) => s + (o.total_price ?? 0), 0) ?? 0;

  // ── Stats par store ──
  const storeProductCounts: Record<string, number> = {};
  const storeRevenues:      Record<string, number> = {};
  const storeOrderCounts:   Record<string, number> = {};

  if (stores) {
    for (const store of stores) {
      const { count } = await supabase
        .from("products").select("*", { count: "exact", head: true }).eq("store_id", store.id);
      storeProductCounts[store.id] = count ?? 0;
      storeOrderCounts[store.id]   = allOrders?.filter(o => o.store_id === store.id).length ?? 0;
      storeRevenues[store.id]      = allOrders
        ?.filter(o => o.status === "completed" && o.store_id === store.id)
        .reduce((s, o) => s + (o.total_price ?? 0), 0) ?? 0;
    }
  }

  const totalProducts    = Object.values(storeProductCounts).reduce((a, b) => a + b, 0);
  const missingStoreDocs = stores?.filter(s => !s.legal_doc_url).length ?? 0;
  const missingGlobalDocs = profile.address_verified ? 0 : 1;
  const totalMissingDocs  = missingGlobalDocs + missingStoreDocs;
  const lowStockCount    = Math.max(0, Math.round(totalProducts * 0.1));

  // ── Meilleur / pire store par revenu ──
  const sortedByRev = [...(stores ?? [])].sort(
    (a, b) => (storeRevenues[b.id] ?? 0) - (storeRevenues[a.id] ?? 0)
  );
  const bestStore  = sortedByRev[0];
  const worstStore = sortedByRev[sortedByRev.length - 1];

  // ── Nav items ──
  const navItems = [
    { label: "Vue globale",     href: "/dashboard/seller",               active: true  },
    { label: "Mes stores",      href: "/dashboard/seller/stores",        active: false },
    { label: "Documents",       href: "/dashboard/seller/documents",     active: false, badge: totalMissingDocs },
    { label: "Finances",        href: "/dashboard/seller/finance",       active: false },
    { label: "Analyses",        href: "/dashboard/seller/analytics",     active: false },
    { label: "Commandes",       href: "/dashboard/seller/orders",        active: false, badge: pendingOrders },
    { label: "Livraisons",      href: "/dashboard/seller/deliveries",    active: false },
    { label: "Accompagnement",  href: "/dashboard/seller/support",       active: false },
    { label: "Financement",     href: "/dashboard/seller/financing",     active: false },
    { label: "Partenaires",     href: "/dashboard/seller/partners",      active: false },
    { label: "Notifications",   href: "/dashboard/seller/notifications", active: false },
    { label: "Paramètres",      href: "/dashboard/seller/settings",      active: false },
  ];

  return (
    <main className="min-h-screen bg-[#f0f2f5]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="flex min-h-screen">

        {/* ══════════ SIDEBAR ══════════ */}
        <aside className="hidden lg:flex w-[220px] bg-[#0a0a0a] text-white flex-col flex-shrink-0 fixed top-0 left-0 bottom-0 z-20">

          {/* Logo */}
          <div className="px-5 py-5 border-b border-white/[0.07]">
            <div className="flex items-center gap-2.5 mb-0.5">
              <div className="w-7 h-7 bg-[#d2162c] rounded-[6px] flex items-center justify-center flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 01-8 0"/>
                </svg>
              </div>
              <span className="text-[15px] font-bold tracking-wide text-white">MACHÉ</span>
            </div>
            <p className="text-[10px] text-white/30 ml-[37px]">Espace vendeur</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-3 px-2">
            <p className="text-[9px] font-semibold tracking-widest text-white/25 uppercase px-3 mb-2 mt-1">Principal</p>
            {navItems.slice(0, 2).map(item => (
              <Link key={item.label} href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium mb-0.5 transition-all ${
                  item.active
                    ? "bg-[#d2162c] text-white"
                    : "text-white/55 hover:bg-white/[0.06] hover:text-white/85"
                }`}>
                <span className="flex-1">{item.label}</span>
              </Link>
            ))}

            <p className="text-[9px] font-semibold tracking-widest text-white/25 uppercase px-3 mb-2 mt-3">Gestion</p>
            {navItems.slice(2, 7).map(item => (
              <Link key={item.label} href={item.href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium mb-0.5 text-white/55 hover:bg-white/[0.06] hover:text-white/85 transition-all">
                <span className="flex-1">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className="bg-[#d2162c] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}

            <p className="text-[9px] font-semibold tracking-widest text-white/25 uppercase px-3 mb-2 mt-3">Croissance</p>
            {navItems.slice(7, 10).map(item => (
              <Link key={item.label} href={item.href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium mb-0.5 text-white/55 hover:bg-white/[0.06] hover:text-white/85 transition-all">
                <span className="flex-1">{item.label}</span>
              </Link>
            ))}

            <p className="text-[9px] font-semibold tracking-widest text-white/25 uppercase px-3 mb-2 mt-3">Compte</p>
            {navItems.slice(10).map(item => (
              <Link key={item.label} href={item.href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium mb-0.5 text-white/55 hover:bg-white/[0.06] hover:text-white/85 transition-all">
                <span className="flex-1">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Aide */}
          <div className="mx-3 mb-3 bg-white/[0.04] border border-white/[0.07] rounded-xl p-4">
            <p className="text-[12px] font-semibold text-white mb-1">Besoin d'aide ?</p>
            <p className="text-[10px] text-white/35 mb-3">Contactez un conseiller Maché.</p>
            <Link href="/dashboard/seller/support"
              className="flex items-center justify-center gap-2 w-full bg-white/[0.06] border border-white/10 text-white/70 hover:text-white rounded-lg py-2 text-[11px] font-medium transition">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 014.69 13a19.79 19.79 0 01-3.07-8.67A2 2 0 013.6 2.24h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
              </svg>
              Parler à un conseiller
            </Link>
          </div>

          {/* Déconnexion */}
          <div className="px-3 pb-4">
            <form action="/auth/signout" method="post">
              <button type="submit"
                className="flex items-center justify-center gap-2 w-full bg-red-500/10 text-red-400 border border-red-400/20 rounded-lg py-2 text-[11px] font-medium hover:bg-red-500/20 transition">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Se déconnecter
              </button>
            </form>
          </div>
        </aside>

        {/* ══════════ MAIN ══════════ */}
        <div className="flex-1 flex flex-col lg:ml-[220px]">

          {/* Topbar */}
          <header className="sticky top-0 z-10 bg-white border-b border-gray-200 h-[54px] flex items-center px-6 gap-4">
            <span className="text-[13px] font-semibold text-gray-900 whitespace-nowrap">Vue globale</span>
            <div className="flex-1 max-w-[380px] bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[12px] text-gray-400 flex items-center gap-2">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 flex-shrink-0">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              Rechercher un store, un produit, une commande...
            </div>
            <div className="ml-auto flex items-center gap-3">
              {/* Mode simple */}
              <button className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-[7px] text-[12px] font-medium text-gray-600 hover:bg-gray-50 transition">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"/>
                </svg>
                Mode simple
              </button>
              {/* Notif */}
              <div className="relative w-[34px] h-[34px] bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center cursor-pointer">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 01-3.46 0"/>
                </svg>
                {pendingOrders > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#d2162c] text-white text-[8px] font-bold w-[14px] h-[14px] rounded-full flex items-center justify-center border border-white leading-none">
                    {pendingOrders}
                  </span>
                )}
              </div>
              {/* User */}
              <div className="flex items-center gap-2 cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-[#d2162c] flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
                  {firstName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <p className="text-[12px] font-semibold text-gray-900 leading-tight">{firstName}</p>
                  <p className="text-[10px] text-gray-400 leading-tight">{roleLabel}</p>
                </div>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 p-6 space-y-5">

            {/* ── Header + KPIs + Revenus ── */}
            <div className="flex items-start gap-5">
              <div className="flex-1">
                <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Bonjour, {firstName}</h1>
                <p className="text-[13px] text-gray-400 mt-0.5">Voici la vue d'ensemble de votre activité sur MACHÉ.</p>
                <div className="flex items-center gap-5 mt-4">
                  {[
                    { label: "Stores actifs",    value: storeCount,    color: "bg-blue-50",   stroke: "#1d4ed8" },
                    { label: "Produits au total", value: totalProducts, color: "bg-green-50",  stroke: "#15803d" },
                    { label: "Commandes en cours", value: totalOrders,  color: "bg-amber-50",  stroke: "#b45309" },
                  ].map(stat => (
                    <div key={stat.label} className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 ${stat.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={stat.stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="7" height="7" rx="1"/>
                          <rect x="14" y="3" width="7" height="7" rx="1"/>
                          <rect x="14" y="14" width="7" height="7" rx="1"/>
                          <rect x="3" y="14" width="7" height="7" rx="1"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-[18px] font-bold text-gray-900 leading-tight">{stat.value}</p>
                        <p className="text-[10px] text-gray-400">{stat.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Revenus */}
              <div className="bg-[#0a0a0a] rounded-xl px-5 py-4 text-white min-w-[260px] flex-shrink-0">
                <p className="text-[11px] text-white/40 mb-1.5">Revenus estimés (ce mois)</p>
                <div className="flex items-center gap-3 mb-1">
                  <p className="text-[19px] font-bold leading-tight">{formatHTG(monthRevenue)}</p>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">+18.6%</span>
                </div>
                <p className="text-[10px] text-white/30 mb-3">vs mois dernier</p>
                <div className="flex justify-end">
                  <Link href="/dashboard/seller/finance" className="text-[11px] text-blue-300 hover:text-blue-200 font-medium">
                    Voir le rapport →
                  </Link>
                </div>
              </div>
            </div>

            {/* ── Mes stores ── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[14px] font-semibold text-gray-900">Mes stores</p>
                <Link href="/dashboard/seller/stores" className="text-[12px] font-medium text-[#d2162c] hover:underline">
                  Voir tous mes stores →
                </Link>
              </div>
              <div className="flex gap-3">
                {stores?.map(store => {
                  const rev      = storeRevenues[store.id] ?? 0;
                  const orders   = storeOrderCounts[store.id] ?? 0;
                  const products = storeProductCounts[store.id] ?? 0;
                  const lowStock = Math.max(0, Math.round(products * 0.12));
                  const initials = store.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
                  return (
                    <div key={store.id} className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden min-w-0">
                      {/* Banner */}
                      <div className="h-[80px] bg-gradient-to-br from-[#0a0a0a] to-[#1c2942] flex items-end px-3 pb-2.5">
                        <div className="w-10 h-10 rounded-full border-2 border-white bg-[#d2162c] flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
                          {store.logo_url
                            ? <img src={store.logo_url} alt={store.name} className="w-full h-full rounded-full object-cover" />
                            : initials
                          }
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="flex items-start justify-between gap-2 mb-2.5">
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-gray-900 truncate">{store.name}</p>
                            <p className="text-[10px] text-gray-400">mache.ht/store/{store.slug}</p>
                          </div>
                          <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                            store.is_verified ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                          }`}>
                            {store.is_verified ? "Actif" : "En attente"}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 mb-3">
                          <div className="bg-gray-50 rounded-lg p-1.5 text-center">
                            <p className="text-[9px] text-gray-400 leading-tight">Ventes</p>
                            <p className="text-[10px] font-semibold text-gray-800 leading-tight mt-0.5">{formatHTG(rev)}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-1.5 text-center">
                            <p className="text-[9px] text-gray-400 leading-tight">Commandes</p>
                            <p className="text-[12px] font-bold text-gray-800 leading-tight mt-0.5">{orders}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-1.5 text-center">
                            <p className="text-[9px] text-gray-400 leading-tight">Stock faible</p>
                            <p className={`text-[12px] font-bold leading-tight mt-0.5 ${lowStock > 0 ? "text-red-500" : "text-gray-800"}`}>{lowStock} prod.</p>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <Link href={`/dashboard/seller/stores/${store.id}`}
                            className="flex-1 bg-[#0a0a0a] text-white text-center text-[11px] font-semibold py-2 rounded-lg hover:bg-gray-800 transition">
                            Entrer dans le store →
                          </Link>
                          <Link href={`/dashboard/seller/stores/${store.id}/settings`}
                            className="w-8 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-200 transition">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="3"/>
                              <path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"/>
                            </svg>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {/* Ajouter store */}
                {!storeLimitReached && (
                  <Link href="/dashboard/seller/stores/new"
                    className="flex-1 min-w-[160px] bg-white border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2.5 p-5 hover:border-[#d2162c] hover:bg-red-50/30 transition group cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-red-100 transition">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-[#d2162c]">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    </div>
                    <p className="text-[12px] font-semibold text-gray-700 group-hover:text-[#d2162c] text-center">Ajouter un store</p>
                    <p className="text-[10px] text-gray-400 text-center">Développez votre activité en créant un nouveau store.</p>
                    <span className="text-[11px] font-medium text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 bg-white">Créer un store</span>
                  </Link>
                )}
              </div>
            </div>

            {/* ── Documents + Alertes importantes ── */}
            <div className="grid grid-cols-3 gap-4">

              {/* Documents entreprise */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/>
                    </svg>
                    <p className="text-[12px] font-semibold text-gray-800">Documents de l'entreprise</p>
                  </div>
                  {missingGlobalDocs > 0 && (
                    <span className="text-[10px] font-semibold bg-red-50 text-red-600 px-2 py-0.5 rounded-full">{missingGlobalDocs} à compléter</span>
                  )}
                </div>
                <div className="px-4">
                  {[
                    { label: "Pièce d'identité",            ok: true,                        date: "12/05/2025" },
                    { label: "Extrait d'immatriculation",    ok: true,                        date: "12/05/2025" },
                    { label: "Déclaration fiscale",          ok: false,                       date: "À téléverser" },
                    { label: "Relevé d'identité bancaire",   ok: true,                        date: "11/05/2025" },
                    { label: "Contrat marketplace MACHÉ",    ok: true,                        date: "10/05/2025" },
                    { label: "Adresse personnelle",          ok: !!profile.address_verified,  date: profile.address_verified ? "Confirmée" : "À vérifier" },
                  ].map(doc => (
                    <div key={doc.label} className="flex items-center gap-2.5 py-2.5 border-b border-gray-50 last:border-0">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${doc.ok ? "bg-green-100" : "bg-amber-100"}`}>
                        {doc.ok
                          ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        }
                      </div>
                      <span className="flex-1 text-[11px] text-gray-700">{doc.label}</span>
                      <span className={`text-[10px] font-semibold ${doc.ok ? "text-green-600" : "text-amber-600"}`}>
                        {doc.ok ? "Validé" : doc.date}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2.5 border-t border-gray-100 text-center">
                  <Link href="/dashboard/seller/documents" className="text-[11px] font-medium text-[#d2162c] hover:underline">
                    Voir tous les documents →
                  </Link>
                </div>
              </div>

              {/* Documents par store */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/>
                    </svg>
                    <p className="text-[12px] font-semibold text-gray-800">Documents par store</p>
                  </div>
                  {missingStoreDocs > 0 && (
                    <span className="text-[10px] font-semibold bg-red-50 text-red-600 px-2 py-0.5 rounded-full">{missingStoreDocs} à compléter</span>
                  )}
                </div>
                <div className="px-4 py-1">
                  {stores?.map(store => {
                    const completed = store.legal_doc_url ? 3 : 1;
                    const total = 5;
                    const pct = Math.round((completed / total) * 100);
                    const color = pct >= 60 ? "#22c55e" : pct >= 30 ? "#f59e0b" : "#ef4444";
                    return (
                      <div key={store.id} className="py-3 border-b border-gray-50 last:border-0">
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className="w-7 h-7 rounded-full bg-[#0a0a0a] flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0">
                            {store.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 flex items-center justify-between">
                            <span className="text-[12px] font-semibold text-gray-800">{store.name}</span>
                            <span className="text-[10px] text-gray-400">{completed} / {total} complétés</span>
                          </div>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6"/>
                          </svg>
                        </div>
                        <div className="h-[5px] bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                        </div>
                      </div>
                    );
                  })}
                  {(!stores || stores.length === 0) && (
                    <p className="text-[12px] text-gray-400 text-center py-6">Aucun store créé</p>
                  )}
                </div>
                <div className="px-4 py-2.5 border-t border-gray-100 text-center">
                  <Link href="/dashboard/seller/documents" className="text-[11px] font-medium text-[#d2162c] hover:underline">
                    Gérer les documents par store →
                  </Link>
                </div>
              </div>

              {/* Alertes importantes */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 01-3.46 0"/>
                  </svg>
                  <p className="text-[12px] font-semibold text-gray-800">Alertes importantes</p>
                </div>
                <div className="px-4">
                  {[
                    { label: `${lowStockCount} produits en stock faible`,   sub: "Répartis sur vos stores",  bg: "bg-amber-50",  icon: "amber" },
                    { label: `${missingStoreDocs} documents manquants`,      sub: "Dans vos stores",          bg: "bg-red-50",    icon: "red"   },
                    { label: `${pendingOrders} commandes urgentes`,          sub: "À traiter rapidement",     bg: "bg-red-50",    icon: "red"   },
                  ].map(alert => (
                    <div key={alert.label} className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
                      <div className={`w-8 h-8 rounded-lg ${alert.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={alert.icon === "red" ? "#ef4444" : "#d97706"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold text-gray-800">{alert.label}</p>
                        <p className="text-[10px] text-gray-400">{alert.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2.5 border-t border-gray-100 text-center">
                  <Link href="/dashboard/seller/alerts" className="text-[11px] font-medium text-[#d2162c] hover:underline">
                    Voir toutes les alertes →
                  </Link>
                </div>
              </div>
            </div>

            {/* ── Analyse + Accompagnement + Financement ── */}
            <div className="grid grid-cols-3 gap-4">

              {/* Analyse globale */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
                  </svg>
                  <p className="text-[12px] font-semibold text-gray-800">Analyse globale de vos stores</p>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-[10px] text-gray-500 mb-1">Performance globale</p>
                    <p className="text-[18px] font-bold text-green-700">+18.6%</p>
                    <p className="text-[10px] text-green-600">vs mois dernier</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3">
                    <p className="text-[10px] text-gray-500 mb-1">Store le plus performant</p>
                    <p className="text-[12px] font-bold text-gray-800">{bestStore?.name ?? "—"}</p>
                    <p className="text-[10px] text-green-600">+24.5%</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3">
                    <p className="text-[10px] text-gray-500 mb-1">Store en difficulté</p>
                    <p className="text-[12px] font-bold text-gray-800">{worstStore?.name ?? "—"}</p>
                    <p className="text-[10px] text-red-500">-8.2%</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[10px] text-gray-500 mb-1">Produits à surveiller</p>
                    <p className="text-[18px] font-bold text-gray-800">{lowStockCount}</p>
                    <p className="text-[10px] text-amber-600">Stock critique</p>
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <Link href="/dashboard/seller/analytics" className="text-[11px] font-medium text-[#d2162c] hover:underline">
                    Voir l'analyse complète →
                  </Link>
                </div>
              </div>

              {/* Accompagnement */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  </svg>
                  <p className="text-[12px] font-semibold text-gray-800">Accompagnement & ressources</p>
                </div>
                <div className="space-y-2">
                  {[
                    { label: "Centre d'aide",    sub: "Guides, vidéos et conseils",        href: "/dashboard/seller/support" },
                    { label: "Formation vendeur", sub: "Apprendre à booster vos ventes",    href: "/dashboard/seller/support" },
                    { label: "Assistance vocale", sub: "Écouter et gérer plus facilement",  href: "/dashboard/seller/support" },
                  ].map(item => (
                    <Link key={item.label} href={item.href}
                      className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5 hover:bg-gray-100 transition group">
                      <div>
                        <p className="text-[12px] font-semibold text-gray-800">{item.label}</p>
                        <p className="text-[10px] text-gray-400">{item.sub}</p>
                      </div>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-[#d2162c] transition">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Financement */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2"/>
                    <line x1="8" y1="21" x2="16" y2="21"/>
                    <line x1="12" y1="17" x2="12" y2="21"/>
                  </svg>
                  <p className="text-[12px] font-semibold text-gray-800">Financement & croissance</p>
                </div>
                <p className="text-[11px] text-gray-400 mb-3">Développez votre activité avec nos partenaires financiers.</p>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { label: "Financement",      sub: "Obtenez des fonds",    icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z", color: "bg-blue-50",   stroke: "#1d4ed8" },
                    { label: "Fournisseurs",     sub: "Fournisseurs fiables", icon: "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z", color: "bg-amber-50", stroke: "#b45309" },
                    { label: "Services pro",     sub: "Mktg, compta...",      icon: "M12 20V10M18 20V4M6 20v-4", color: "bg-green-50",  stroke: "#15803d" },
                  ].map(item => (
                    <div key={item.label} className={`${item.color} rounded-lg p-2.5 text-center`}>
                      <div className="flex justify-center mb-1.5">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={item.stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d={item.icon}/>
                        </svg>
                      </div>
                      <p className="text-[10px] font-semibold text-gray-700">{item.label}</p>
                      <p className="text-[9px] text-gray-400">{item.sub}</p>
                    </div>
                  ))}
                </div>
                <Link href="/dashboard/seller/financing"
                  className="block w-full bg-[#0a0a0a] text-white text-center text-[11px] font-semibold py-2.5 rounded-lg hover:bg-gray-800 transition">
                  Voir les offres disponibles →
                </Link>
              </div>
            </div>

            {/* ── Banner ── */}
            <div className="bg-[#0a0a0a] rounded-xl px-6 py-5 flex items-center justify-between gap-6">
              <div>
                <p className="text-[14px] font-bold text-white mb-1">Besoin d'un accompagnement personnalisé ?</p>
                <p className="text-[12px] text-white/50">Nos experts MACHÉ sont là pour vous aider à faire grandir votre business.</p>
              </div>
              <Link href="/dashboard/seller/support"
                className="flex-shrink-0 flex items-center gap-2 bg-[#d2162c] text-white px-5 py-2.5 rounded-lg text-[12px] font-semibold hover:bg-[#b81226] transition whitespace-nowrap">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 014.69 13a19.79 19.79 0 01-3.07-8.67A2 2 0 013.6 2.24h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                </svg>
                Parler à un conseiller
              </Link>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
