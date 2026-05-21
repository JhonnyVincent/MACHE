"use client";

import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// ─── Constantes ───────────────────────────────────────────────────────────────

const SELLER_ROLES = ["seller_individual", "seller_business", "official_brand"];

const ROLE_LABELS: Record<string, string> = {
  seller_individual: "Vendeur particulier",
  seller_business:   "Vendeur business",
  official_brand:    "Marque officielle",
};

const PLAN_LIMITS: Record<string, { maxStores: number; maxArticlesPerStore: number }> = {
  seller_individual: { maxStores: 1, maxArticlesPerStore: 3 },
  seller_business:   { maxStores: 2, maxArticlesPerStore: 5 },
  official_brand:    { maxStores: 5, maxArticlesPerStore: 7 },
};

const PLANS = [
  {
    key: "free", name: "Gratuit / Particulier", price: "0 HTG", period: "",
    role: "seller_individual", maxStores: 1, maxArticlesPerStore: 3,
    ads: false, analytics: false, invoices: false, employees: false, bilan: false, ai: false, highlight: false,
    features: ["1 store","3 articles par store","Commandes simples","Statistiques basiques","Support standard"],
    locked: ["Publicité sponsorisée","Statistiques avancées","Factures PDF","Employés","Bilan avancé","IA Maché"],
  },
  {
    key: "business", name: "Business", price: "4 500 HTG", period: "/ mois",
    role: "seller_business", maxStores: 2, maxArticlesPerStore: 5,
    ads: true, analytics: true, invoices: true, employees: true, bilan: true, ai: false, highlight: true,
    features: ["2 stores","5 articles par store","Publicité sponsorisée","Statistiques avancées","Factures PDF & exports","Bilan financier avancé","Gestion employés","Rapports mensuels","Livraisons avancées"],
    locked: ["IA Maché","Vue multi-stores unifiée","Analyse concurrence IA"],
  },
  {
    key: "premium", name: "Marque officielle", price: "Sur devis", period: "",
    role: "official_brand", maxStores: 5, maxArticlesPerStore: 7,
    ads: true, analytics: true, invoices: true, employees: true, bilan: true, ai: true, highlight: false,
    features: ["5 stores","7 articles par store","Tout le plan Business","IA : descriptions produits","IA : suggestions de prix","IA : analyse concurrence","Vue unifiée tous stores","Rapport IA automatique","Badge Marque officielle","Mise en avant homepage","Campagnes publicitaires","Account manager dédié"],
    locked: [],
  },
];

const ROLE_PLAN_KEY: Record<string, string> = {
  seller_individual: "free",
  seller_business:   "business",
  official_brand:    "premium",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SellerDashboardPage() {
  const supabase = await createSupabaseServerClient();

  // Auth
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login?next=/dashboard/seller");

  // Profil
  const { data: profile } = await supabase
    .from("users")
    .select("role, full_name, email, phone, address_verified")
    .eq("id", userData.user.id)
    .single();

  if (!profile || !SELLER_ROLES.includes(profile.role)) {
    redirect(`/login?error=${encodeURIComponent("Ce compte n'est pas un compte vendeur.")}`);
  }

  const uid = userData.user.id;
  const planKey = ROLE_PLAN_KEY[profile.role] ?? "free";
  const plan = PLANS.find((p) => p.key === planKey)!;
  const limits = PLAN_LIMITS[profile.role];
  const isBusiness = plan.bilan === true;
  const displayName = profile.full_name?.split(" ")[0] || "Vendeur";

  // ── Stores ──
  const { data: stores } = await supabase
    .from("stores")
    .select("id, slug, name, is_verified, description, logo_url, category, legal_doc_url, created_at")
    .eq("owner_id", uid)
    .order("created_at", { ascending: true });

  const storeCount = stores?.length ?? 0;
  const storeLimitReached = storeCount >= limits.maxStores;

  // ── Produits ──
  const { count: totalProducts } = await supabase
    .from("products").select("*", { count: "exact", head: true }).eq("seller_id", uid);
  const { count: activeProducts } = await supabase
    .from("products").select("*", { count: "exact", head: true }).eq("seller_id", uid).eq("status", "active");

  // Produits par store
  const storeProductCounts: Record<string, number> = {};
  if (stores) {
    for (const s of stores) {
      const { count } = await supabase
        .from("products").select("*", { count: "exact", head: true }).eq("store_id", s.id);
      storeProductCounts[s.id] = count ?? 0;
    }
  }

  // ── Commandes ──
  const { data: allOrders } = await supabase
    .from("orders")
    .select("id, status, total_price, created_at, delivery_status, store_id")
    .eq("seller_id", uid)
    .order("created_at", { ascending: false });

  const totalOrders    = allOrders?.length ?? 0;
  const pendingOrders  = allOrders?.filter((o) => o.status === "pending").length ?? 0;
  const completedOrders = allOrders?.filter((o) => o.status === "completed").length ?? 0;

  // ── Revenus ──
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const totalRevenue = allOrders
    ?.filter((o) => o.status === "completed")
    .reduce((s, o) => s + (o.total_price ?? 0), 0) ?? 0;

  const monthRevenue = allOrders
    ?.filter((o) => o.status === "completed" && o.created_at >= startOfMonth)
    .reduce((s, o) => s + (o.total_price ?? 0), 0) ?? 0;

  const netRevenue = Math.round(totalRevenue * 0.95);

  // Revenus par store
  const storeRevenues: Record<string, number> = {};
  const storeOrders: Record<string, number> = {};
  if (stores) {
    for (const s of stores) {
      storeRevenues[s.id] = allOrders
        ?.filter((o) => o.status === "completed" && o.store_id === s.id)
        .reduce((acc, o) => acc + (o.total_price ?? 0), 0) ?? 0;
      storeOrders[s.id] = allOrders?.filter((o) => o.store_id === s.id).length ?? 0;
    }
  }

  // ── Avis moyens par store (si table ratings existe) ──
  const storeRatings: Record<string, { avg: number; count: number }> = {};
  if (stores) {
    for (const s of stores) {
      const { data: ratings } = await supabase
        .from("store_ratings")
        .select("rating")
        .eq("store_id", s.id);
      if (ratings && ratings.length > 0) {
        const avg = ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length;
        storeRatings[s.id] = { avg: Math.round(avg * 10) / 10, count: ratings.length };
      } else {
        storeRatings[s.id] = { avg: 0, count: 0 };
      }
    }
  }

  // Expire date forfait (placeholder — à brancher sur ta table subscriptions)
  const planExpiry = "15 juin 2026"; // TODO: récupérer depuis subscriptions

  // ─── Rendu ────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-[#f5f5f0]">

      {/* ══════════ HEADER ══════════ */}
      <div className="bg-[#081c37]">
        <div className="container-page py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-[#5a8ab8] tracking-wide mb-1">Espace vendeur · Maché</p>
              <h1 className="text-xl font-semibold text-white mb-1">Bonjour, {displayName} 👋</h1>
              <p className="text-sm text-[#8ab0cc]">Merci de faire partie de la famille Maché.</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {/* Forfait */}
              <div className="bg-white/7 border border-white/10 rounded-xl px-4 py-3 text-center hidden sm:block">
                <p className="text-[10px] text-[#5a8ab8] mb-0.5">Forfait</p>
                <p className="text-sm font-semibold text-white">{plan.name}</p>
                <p className="text-[10px] text-[#f9c84a] mt-1">Expire {planExpiry}</p>
                <p className="text-[10px] text-[#5ed49a] mt-0.5">✓ Harris vérifié</p>
              </div>
              {/* Déconnexion */}
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-red-500/10 text-red-400 border border-red-400/20 rounded-xl px-4 py-2.5 text-sm hover:bg-red-500/20 transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Se déconnecter
                </button>
              </form>
            </div>
          </div>
        </div>
        {/* Barre rouge Maché */}
        <div className="h-[3px] bg-[#d2162c]" />
      </div>

      <div className="container-page py-6 space-y-6">

        {/* ══════════ ALERTES ══════════ */}
        {(pendingOrders > 0 || true) && (
          <div className="bg-[#fdf0f1] border border-[#f5b8be] rounded-2xl p-4">
            <p className="text-xs font-semibold text-[#d2162c] mb-3 flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              À traiter
            </p>
            <div className="space-y-2.5">
              {pendingOrders > 0 && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#d2162c] shrink-0" />
                  <p className="flex-1 text-sm font-medium text-[#081c37]">{pendingOrders} commande{pendingOrders > 1 ? "s" : ""} en attente</p>
                  <Link href="/dashboard/seller/orders" className="text-xs text-[#d2162c] bg-white border border-[#f5b8be] rounded-lg px-3 py-1 hover:bg-[#fdf0f1] transition shrink-0">Voir →</Link>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#f0a030] shrink-0" />
                <p className="flex-1 text-sm font-medium text-[#081c37]">Forfait expire dans 25 jours</p>
                <Link href="/dashboard/seller/subscription" className="text-xs text-[#854f0b] bg-[#fffaf0] border border-[#f5c88a] rounded-lg px-3 py-1 hover:bg-[#faeeda] transition shrink-0">Renouveler →</Link>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#3b82f6] shrink-0" />
                <p className="flex-1 text-sm font-medium text-[#081c37]">1 message de l'équipe Maché</p>
                <Link href="/dashboard/seller/support" className="text-xs text-[#185fa5] bg-[#f0f6ff] border border-[#b5d4f4] rounded-lg px-3 py-1 hover:bg-[#e6f1fb] transition shrink-0">Lire →</Link>
              </div>
            </div>
          </div>
        )}

        {/* ══════════ MES BOUTIQUES ══════════ */}
        <div>
          <p className="text-base font-semibold text-[#081c37] mb-3">Mes boutiques</p>

          <div className="space-y-3">
            {(!stores || stores.length === 0) ? (
              <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center">
                <p className="text-3xl mb-3">🏪</p>
                <p className="font-semibold text-[#081c37] mb-1">Aucune boutique créée</p>
                <p className="text-sm text-gray-500 mb-4">Créez votre première boutique pour commencer à vendre.</p>
                <Link href="/dashboard/seller/stores/new" className="inline-flex items-center gap-2 bg-[#d2162c] text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-[#b81226] transition">
                  + Créer ma boutique
                </Link>
              </div>
            ) : (
              stores.map((store) => {
                const articleCount = storeProductCounts[store.id] ?? 0;
                const rev = storeRevenues[store.id] ?? 0;
                const orders = storeOrders[store.id] ?? 0;
                const rating = storeRatings[store.id];
                const articleLimitReached = articleCount >= limits.maxArticlesPerStore;

                return (
                  <div key={store.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-4">
                    {/* Avatar */}
                    {store.logo_url ? (
                      <img src={store.logo_url} alt={store.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-[#fbeaec] flex items-center justify-center text-xl font-semibold text-[#d2162c] shrink-0">
                        {store.name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-[15px] font-semibold text-[#081c37]">{store.name}</p>
                        {/* Badge par boutique — indépendant */}
                        {store.is_verified ? (
                          <span className="inline-flex items-center gap-1 bg-[#eaf3de] text-[#3b6d11] text-[11px] font-medium px-2 py-0.5 rounded-full">
                            ✓ Boutique vérifiée
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-[#faeeda] text-[#854f0b] text-[11px] font-medium px-2 py-0.5 rounded-full">
                            ⏳ Vérification en attente
                          </span>
                        )}
                        {store.category && (
                          <span className="bg-[#e6f1fb] text-[#185fa5] text-[11px] px-2 py-0.5 rounded-full">{store.category}</span>
                        )}
                      </div>
                      {/* Étoiles */}
                      {rating && rating.count > 0 && (
                        <div className="flex items-center gap-1 mb-1">
                          {[1,2,3,4,5].map((star) => (
                            <svg key={star} xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill={star <= Math.round(rating.avg) ? "#f0a030" : "none"} stroke="#f0a030" strokeWidth="2">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                          ))}
                          <span className="text-[11px] text-gray-500 ml-1">{rating.avg} · {rating.count} avis</span>
                        </div>
                      )}
                      <p className="text-xs text-gray-400">mache.ht/store/{store.slug}</p>
                    </div>

                    {/* Stats */}
                    <div className="hidden sm:flex gap-2 shrink-0">
                      <div className="bg-[#f5f5f0] rounded-xl px-3 py-2 text-center min-w-[60px]">
                        <p className="text-[10px] text-gray-500">Produits</p>
                        <p className={`text-lg font-semibold ${articleLimitReached ? "text-[#d2162c]" : "text-[#081c37]"}`}>{articleCount}</p>
                      </div>
                      <div className="bg-[#f5f5f0] rounded-xl px-3 py-2 text-center min-w-[60px]">
                        <p className="text-[10px] text-gray-500">Commandes</p>
                        <p className="text-lg font-semibold text-[#081c37]">{orders}</p>
                      </div>
                      <div className="bg-[#f5f5f0] rounded-xl px-3 py-2 text-center min-w-[90px]">
                        <p className="text-[10px] text-gray-500">CA ce mois</p>
                        <p className="text-base font-semibold text-[#0a6e4a]">{rev.toLocaleString()} HTG</p>
                      </div>
                    </div>

                    {/* Bouton Gérer */}
                    <Link
                      href={`/dashboard/seller/stores/${store.id}`}
                      className="bg-[#d2162c] text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-[#b81226] transition shrink-0 whitespace-nowrap"
                    >
                      Gérer →
                    </Link>
                  </div>
                );
              })
            )}

            {/* + Nouvelle boutique — inline */}
            {!storeLimitReached && (
              <Link
                href="/dashboard/seller/stores/new"
                className="flex items-center gap-4 p-4 border-2 border-dashed border-gray-300 rounded-2xl hover:border-[#d2162c] hover:bg-[#fdf0f1] transition group"
              >
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 group-hover:bg-[#f5b8be]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7a8d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-[#d2162c]"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#081c37] group-hover:text-[#d2162c]">Ouvrir une nouvelle boutique</p>
                  <p className="text-xs text-gray-500">Vos informations personnelles sont déjà enregistrées · rapide à configurer</p>
                </div>
                <span className="text-sm font-medium text-[#d2162c] border border-[#f5b8be] rounded-xl px-4 py-2 shrink-0 group-hover:bg-[#d2162c] group-hover:text-white transition">
                  + Nouvelle boutique
                </span>
              </Link>
            )}
          </div>

          {/* Total consolidé */}
          <div className="bg-[#081c37] rounded-2xl p-4 mt-3 grid grid-cols-3 gap-0">
            <div className="text-center px-3">
              <p className="text-[10px] text-[#5a8ab8] mb-1">Total ce mois</p>
              <p className="text-lg font-semibold text-[#5ed49a]">{monthRevenue.toLocaleString()} HTG</p>
            </div>
            <div className="text-center px-3 border-l border-r border-white/10">
              <p className="text-[10px] text-[#5a8ab8] mb-1">Commandes</p>
              <p className="text-lg font-semibold text-white">{totalOrders}</p>
            </div>
            <div className="text-center px-3">
              <p className="text-[10px] text-[#5a8ab8] mb-1">Note moyenne</p>
              <p className="text-lg font-semibold text-[#f9c84a]">
                {Object.values(storeRatings).some(r => r.count > 0)
                  ? (Object.values(storeRatings).filter(r => r.count > 0).reduce((acc, r) => acc + r.avg, 0) /
                     Object.values(storeRatings).filter(r => r.count > 0).length).toFixed(1) + " ★"
                  : "— ★"}
              </p>
            </div>
          </div>
        </div>

        {/* ══════════ QUE VOULEZ-VOUS FAIRE ══════════ */}
        <div>
          <p className="text-base font-semibold text-[#081c37] mb-3">Que voulez-vous faire ?</p>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: "Mes employés",         sub: "Gérer votre équipe",                  href: "/dashboard/seller/employees",   bg: "#fbeaec", iconColor: "#d2162c",  locked: !isBusiness,
                icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
              { label: "Changer de forfait",   sub: "Voir les plans",                       href: "/dashboard/seller/subscription", bg: "#eeedfe", iconColor: "#534ab7", locked: false,
                icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
              { label: "Trouver un financement", sub: "Micro-crédit & partenaires",         href: "/dashboard/seller/financing",   bg: "#eaf3de", iconColor: "#3b6d11",  locked: false,
                icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
              { label: "Messagerie support",   sub: "1 nouveau message",                    href: "/dashboard/seller/support",     bg: "#e6f1fb", iconColor: "#185fa5",  locked: false, alert: true,
                icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.locked ? "/dashboard/seller/subscription" : item.href}
                className="bg-white border border-gray-200 rounded-2xl p-3 flex items-center gap-3 hover:border-gray-300 transition"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: item.bg, color: item.iconColor }}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[#081c37]">{item.label}</p>
                  <p className={`text-[11px] ${item.alert ? "text-[#d2162c] font-medium" : "text-gray-500"}`}>{item.sub}</p>
                  {item.locked && <p className="text-[10px] text-gray-400">Plan Business requis</p>}
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </Link>
            ))}

            {/* Partenaires — pleine largeur */}
            <Link
              href="/dashboard/seller/partners"
              className="col-span-2 bg-white border border-gray-200 rounded-2xl p-3 flex items-center gap-3 hover:border-gray-300 transition"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-[#faeeda]">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#854f0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-[#081c37]">Partenaires Maché</p>
                <p className="text-[11px] text-gray-500">Livraison, logistique, assurance, comptabilité</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </Link>
          </div>
        </div>

        {/* ══════════ DOCUMENTS & VÉRIFICATION ══════════ */}
        <div>
          <p className="text-base font-semibold text-[#081c37] mb-3">Documents & vérification</p>

          {/* Bloc 1 — Documents personnels */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-3">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Documents personnels</p>
              <p className="text-xs text-gray-400 mt-0.5">Vérifiés une seule fois pour tout votre compte</p>
            </div>
            <div className="divide-y divide-gray-100">
              {[
                {
                  label: "Pièce d'identité",
                  sub: "CIN, passeport ou permis de conduire",
                  status: "approved",
                  icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
                  iconBg: "#eaf3de", iconColor: "#3b6d11",
                },
                {
                  label: "Adresse personnelle",
                  sub: "Confidentielle · Vérification par lettre recommandée ou agence Maché",
                  status: profile.address_verified ? "approved" : "pending_letter",
                  icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
                  iconBg: profile.address_verified ? "#eaf3de" : "#faeeda",
                  iconColor: profile.address_verified ? "#3b6d11" : "#854f0b",
                },
                {
                  label: "Numéro de téléphone",
                  sub: "Pour recevoir les notifications et alertes",
                  status: profile.phone ? "approved" : "missing",
                  icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.24h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
                  iconBg: "#eaf3de", iconColor: "#3b6d11",
                },
                {
                  label: "Permis de conduire",
                  sub: "Optionnel · renforce la confiance",
                  status: "optional",
                  icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
                  iconBg: "#faeeda", iconColor: "#854f0b",
                },
              ].map((doc) => (
                <div key={doc.label} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: doc.iconBg, color: doc.iconColor }}>
                    {doc.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#081c37]">{doc.label}</p>
                    <p className="text-xs text-gray-500">{doc.sub}</p>
                  </div>
                  {doc.status === "approved" && (
                    <span className="text-[11px] font-medium bg-[#eaf3de] text-[#3b6d11] px-2.5 py-1 rounded-full shrink-0">Approuvé</span>
                  )}
                  {doc.status === "pending_letter" && (
                    <span className="text-[11px] font-medium bg-[#faeeda] text-[#854f0b] px-2.5 py-1 rounded-full shrink-0">Lettre envoyée</span>
                  )}
                  {doc.status === "missing" && (
                    <Link href="/dashboard/seller/settings" className="text-[11px] text-[#d2162c] bg-white border border-[#f5b8be] rounded-lg px-2.5 py-1 shrink-0">Ajouter</Link>
                  )}
                  {doc.status === "optional" && (
                    <button className="text-[11px] text-[#854f0b] bg-[#fffaf0] border border-[#f5c88a] rounded-lg px-2.5 py-1 shrink-0">
                      Envoyer
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bloc 2 — Documents par boutique */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Par boutique</p>
              <p className="text-xs text-gray-400 mt-0.5">Document légal requis pour obtenir le badge vérifié</p>
            </div>
            {(!stores || stores.length === 0) ? (
              <div className="p-4 text-center">
                <p className="text-sm text-gray-400">Aucune boutique créée</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {stores.map((store) => (
                  <div key={store.id} className="px-4 py-3">
                    <p className="text-xs font-semibold text-[#081c37] mb-2">{store.name}</p>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${store.legal_doc_url ? "bg-[#eaf3de]" : "bg-[#fdf0f1]"}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={store.legal_doc_url ? "#3b6d11" : "#d2162c"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#081c37]">Document légal de la boutique</p>
                        <p className="text-xs text-gray-500">Registre de commerce ou patente · Recommandé pour le badge</p>
                      </div>
                      {store.legal_doc_url ? (
                        <span className="text-[11px] font-medium bg-[#eaf3de] text-[#3b6d11] px-2.5 py-1 rounded-full shrink-0">Approuvé</span>
                      ) : (
                        <Link
                          href={`/dashboard/seller/stores/${store.id}/documents`}
                          className="text-[11px] text-[#d2162c] bg-white border border-[#f5b8be] rounded-lg px-2.5 py-1 shrink-0 flex items-center gap-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
                          Envoyer
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ══════════ PARAMÈTRES DU COMPTE ══════════ */}
        <div>
          <p className="text-base font-semibold text-[#081c37] mb-3">Paramètres du compte</p>
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            {[
              { label: "Nom complet",          sub: profile.full_name || "Non renseigné",          href: "/dashboard/seller/settings/profile" },
              { label: "Email",                sub: profile.email || userData.user.email || "—",    href: "/dashboard/seller/settings/profile" },
              { label: "Mot de passe",         sub: "Modifier votre mot de passe",                  href: "/dashboard/seller/settings/password" },
              { label: "Téléphone",            sub: profile.phone || "Non renseigné",               href: "/dashboard/seller/settings/profile" },
              { label: "Paiements & retraits", sub: "MonCash · compte bancaire",                    href: "/dashboard/seller/settings/payment" },
              { label: "Notifications",        sub: "SMS, email, application",                      href: "/dashboard/seller/settings/notifications" },
              { label: "Langue",               sub: "Français · Kreyòl · English · Español",        href: "/dashboard/seller/settings/language" },
            ].map((item, i, arr) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition ${i < arr.length - 1 ? "border-b border-gray-100" : ""}`}
              >
                <div>
                  <p className="text-sm font-medium text-[#081c37]">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.sub}</p>
                </div>
                <span className="text-xs text-[#081c37] bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 font-medium hover:bg-gray-200 transition shrink-0 ml-4">
                  Modifier
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* ══════════ ZONE SENSIBLE ══════════ */}
        <div>
          <p className="text-base font-semibold text-[#d2162c] mb-3">Zone sensible</p>
          <div className="space-y-2">
            <Link href="/dashboard/seller/settings/deactivate" className="flex items-center gap-3 p-3.5 bg-[#fdf0f1] border border-[#f5b8be] rounded-2xl hover:bg-[#fce8ea] transition">
              <div className="w-9 h-9 rounded-xl bg-[#fdf0f1] flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#d2162c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="10" y1="15" x2="10" y2="9"/><line x1="14" y1="15" x2="14" y2="9"/></svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#081c37]">Désactiver temporairement</p>
                <p className="text-xs text-gray-500">Boutiques masquées · Réactivable à tout moment</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d2162c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </Link>

            <Link href="/dashboard/seller/settings/transfer" className="flex items-center gap-3 p-3.5 bg-[#fdf0f1] border border-[#f5b8be] rounded-2xl hover:bg-[#fce8ea] transition">
              <div className="w-9 h-9 rounded-xl bg-[#fdf0f1] flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#d2162c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#081c37]">Vendre / transférer une boutique</p>
                <p className="text-xs text-gray-500">Transférer la propriété à un autre vendeur Maché</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d2162c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </Link>

            <Link href="/dashboard/seller/settings/delete" className="flex items-center gap-3 p-3.5 bg-[#fdf0f1] border border-[#f5b8be] rounded-2xl hover:bg-[#fce8ea] transition">
              <div className="w-9 h-9 rounded-xl bg-[#fdf0f1] flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#d2162c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#d2162c]">Supprimer mon compte</p>
                <p className="text-xs text-gray-500">Action irréversible · toutes les données effacées</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d2162c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </Link>
          </div>
        </div>

        {/* ══════════ FOOTER SIMPLIFIÉ (dashboard) ══════════ */}
        <footer className="bg-[#081c37] rounded-2xl px-5 py-4 mt-4">
          <div className="flex flex-wrap gap-x-5 gap-y-2 mb-3">
            {[
              { label: "Conditions d'utilisation", href: "/legal/terms" },
              { label: "Confidentialité",          href: "/legal/privacy" },
              { label: "Politique vendeur",         href: "/legal/seller-policy" },
              { label: "Frais & commissions",       href: "/legal/fees" },
              { label: "Centre d'aide",             href: "/help" },
              { label: "Signaler un problème",      href: "/contact" },
            ].map((link) => (
              <Link key={link.label} href={link.href} className="text-xs text-[#5a8ab8] hover:text-white transition">
                {link.label}
              </Link>
            ))}
          </div>
          <p className="text-[11px] text-[#3a5a78]">© 2026 Maché · Tous droits réservés · Pensé pour les Caraïbes, ouvert au monde.</p>
        </footer>

      </div>
    </main>
  );
}
