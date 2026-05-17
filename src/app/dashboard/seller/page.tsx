import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// ─── Constantes ───────────────────────────────────────────────────────────────

const SELLER_ROLES = ["seller_individual", "seller_business", "supplier", "official_brand"];

const ROLE_LABELS: Record<string, string> = {
  seller_individual: "Vendeur particulier",
  seller_business: "Vendeur business",
  supplier: "Fournisseur",
  official_brand: "Marque officielle",
};

// ─── Limites par plan ─────────────────────────────────────────────────────────
// particulier  : 1 store,  3 articles/store
// business     : 2 stores, 5 articles/store
// marque       : 5 stores, 7 articles/store

const PLAN_LIMITS: Record<string, { maxStores: number; maxArticlesPerStore: number }> = {
  seller_individual: { maxStores: 1, maxArticlesPerStore: 3 },
  seller_business:   { maxStores: 2, maxArticlesPerStore: 5 },
  supplier:          { maxStores: 2, maxArticlesPerStore: 5 },
  official_brand:    { maxStores: 5, maxArticlesPerStore: 7 },
};

const PLANS = [
  {
    key: "free",
    name: "Gratuit / Particulier",
    price: "0 HTG",
    period: "",
    role: "seller_individual",
    maxStores: 1,
    maxArticlesPerStore: 3,
    ads: false,
    analytics: false,
    invoices: false,
    employees: false,
    bilan: false,
    ai: false,
    highlight: false,
    features: [
      "1 store",
      "3 articles par store",
      "Commandes simples",
      "Statistiques basiques",
      "Support standard",
    ],
    locked: ["Publicité sponsorisée", "Statistiques avancées", "Factures PDF", "Employés", "Bilan avancé", "IA Maché"],
  },
  {
    key: "business",
    name: "Business",
    price: "4 500 HTG",
    period: "/ mois",
    role: "seller_business",
    maxStores: 2,
    maxArticlesPerStore: 5,
    ads: true,
    analytics: true,
    invoices: true,
    employees: true,
    bilan: true,
    ai: false,
    highlight: true,
    features: [
      "2 stores",
      "5 articles par store",
      "Publicité sponsorisée",
      "Statistiques avancées",
      "Factures PDF & exports",
      "Bilan financier avancé",
      "Gestion employés",
      "Rapports mensuels",
      "Livraisons avancées",
    ],
    locked: ["IA Maché", "Vue multi-stores unifiée", "Analyse concurrence IA"],
  },
  {
    key: "premium",
    name: "Marque officielle",
    price: "Sur devis",
    period: "",
    role: "official_brand",
    maxStores: 5,
    maxArticlesPerStore: 7,
    ads: true,
    analytics: true,
    invoices: true,
    employees: true,
    bilan: true,
    ai: true,
    highlight: false,
    features: [
      "5 stores",
      "7 articles par store",
      "Tout le plan Business",
      "IA : descriptions produits",
      "IA : suggestions de prix",
      "IA : analyse concurrence",
      "Vue unifiée tous stores",
      "Rapport IA automatique",
      "Badge Marque officielle",
      "Mise en avant homepage",
      "Campagnes publicitaires",
      "Account manager dédié",
    ],
    locked: [],
  },
];

const ROLE_PLAN_KEY: Record<string, string> = {
  seller_individual: "free",
  seller_business:   "business",
  supplier:          "business",
  official_brand:    "premium",
};

const DELIVERY_STATUSES: Record<string, { label: string; color: string }> = {
  to_prepare:  { label: "À préparer",      color: "bg-orange-50 text-orange-700" },
  ready:       { label: "Prêt à déposer",  color: "bg-blue-50 text-blue-700" },
  deposited:   { label: "Déposé",          color: "bg-indigo-50 text-indigo-700" },
  in_delivery: { label: "En livraison",    color: "bg-purple-50 text-purple-700" },
  delivered:   { label: "Livré",           color: "bg-green-50 text-green-700" },
  issue:       { label: "Problème",        color: "bg-red-50 text-red-600" },
};

const ORDER_STATUSES: Record<string, { label: string; color: string }> = {
  pending:   { label: "En attente",  color: "bg-orange-50 text-orange-700" },
  confirmed: { label: "Confirmée",   color: "bg-blue-50 text-blue-700" },
  shipped:   { label: "Expédiée",    color: "bg-indigo-50 text-indigo-700" },
  completed: { label: "Complétée",   color: "bg-green-50 text-green-700" },
  cancelled: { label: "Annulée",     color: "bg-red-50 text-red-600" },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SellerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "home" } = await searchParams;
  const supabase = await createSupabaseServerClient();

  // Auth
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login?next=/dashboard/seller");

  // Profil
  const { data: profile } = await supabase
    .from("users")
    .select("role, full_name, email")
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
  const isMarque = plan.ai === true;
  const displayName = profile.full_name || userData.user.email || "Vendeur";
  const roleLabel = ROLE_LABELS[profile.role];

  // ── Stores du vendeur ──
  const { data: stores } = await supabase
    .from("stores")
    .select("id, slug, name, is_verified, description, logo_url")
    .eq("owner_id", uid);

  const storeCount = stores?.length ?? 0;
  const storeLimitReached = storeCount >= limits.maxStores;

  // Store principal (premier)
  const mainStore = stores?.[0] ?? null;

  // ── Produits (tous stores confondus) ──
  const { count: totalProducts } = await supabase
    .from("products").select("*", { count: "exact", head: true }).eq("seller_id", uid);
  const { count: activeProducts } = await supabase
    .from("products").select("*", { count: "exact", head: true }).eq("seller_id", uid).eq("status", "active");
  const { count: draftProducts } = await supabase
    .from("products").select("*", { count: "exact", head: true }).eq("seller_id", uid).eq("status", "draft");

  const { data: recentProducts } = await supabase
    .from("products")
    .select("id, title, price, stock, status, sales_count, image_url, category, store_id")
    .eq("seller_id", uid)
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: topProducts } = await supabase
    .from("products")
    .select("id, title, price, sales_count, image_url")
    .eq("seller_id", uid)
    .order("sales_count", { ascending: false })
    .limit(5);

  // Produits par store pour vérifier les limites
  const storeProductCounts: Record<string, number> = {};
  if (stores) {
    for (const s of stores) {
      const { count } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("store_id", s.id);
      storeProductCounts[s.id] = count ?? 0;
    }
  }

  // ── Commandes ──
  const { data: allOrders } = await supabase
    .from("orders")
    .select("id, status, total_price, created_at, delivery_status")
    .eq("seller_id", uid)
    .order("created_at", { ascending: false });

  const totalOrders = allOrders?.length ?? 0;
  const pendingOrders  = allOrders?.filter((o) => o.status === "pending").length ?? 0;
  const completedOrders = allOrders?.filter((o) => o.status === "completed").length ?? 0;
  const cancelledOrders = allOrders?.filter((o) => o.status === "cancelled").length ?? 0;

  // ── Revenus ──
  const totalRevenue = allOrders
    ?.filter((o) => o.status === "completed")
    .reduce((s, o) => s + (o.total_price ?? 0), 0) ?? 0;

  const now = new Date();
  const startOfMonth    = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const endOfLastMonth   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

  const monthRevenue = allOrders
    ?.filter((o) => o.status === "completed" && o.created_at >= startOfMonth)
    .reduce((s, o) => s + (o.total_price ?? 0), 0) ?? 0;
  const lastMonthRevenue = allOrders
    ?.filter((o) => o.status === "completed" && o.created_at >= startOfLastMonth && o.created_at <= endOfLastMonth)
    .reduce((s, o) => s + (o.total_price ?? 0), 0) ?? 0;
  const revenueGrowth = lastMonthRevenue > 0
    ? Math.round(((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : null;

  const commission = Math.round(totalRevenue * 0.05);
  const netRevenue = totalRevenue - commission;

  // ── Livraisons ──
  const deliveryOrders = allOrders?.filter((o) => o.delivery_status) ?? [];
  const toPrep = deliveryOrders.filter((o) => o.delivery_status === "to_prepare").length;
  const inDelivery = deliveryOrders.filter((o) => o.delivery_status === "in_delivery").length;

  const TABS = [
    { key: "home",         label: "Accueil",     icon: "🏠" },
    { key: "stores",       label: "Mes stores",   icon: "🏪" },
    { key: "products",     label: "Produits",     icon: "📦" },
    { key: "orders",       label: "Commandes",    icon: "🛒" },
    { key: "delivery",     label: "Livraison",    icon: "🚚" },
    { key: "sales",        label: "Ventes",       icon: "💰" },
    { key: "bilan",        label: "Bilan",        icon: "📋", locked: !isBusiness },
    { key: "analytics",    label: "Analyses",     icon: "📊", locked: !plan.analytics },
    { key: "employees",    label: "Employés",     icon: "👥", locked: !plan.employees },
    { key: "ads",          label: "Publicité",    icon: "📣", locked: !plan.ads },
    ...(isMarque ? [{ key: "ai", label: "IA Maché", icon: "🤖", locked: false }] : []),
    ...(isMarque ? [{ key: "overview", label: "Vue globale", icon: "🌐", locked: false }] : []),
    { key: "verification", label: "Vérification", icon: "✅" },
    { key: "subscription", label: "Forfait",      icon: "⭐" },
    { key: "settings",     label: "Paramètres",   icon: "⚙️" },
  ] as { key: string; label: string; icon: string; locked?: boolean }[];

  return (
    <main className="min-h-screen bg-neutral-50">

      {/* ── Header ── */}
      <div className="bg-[#071f3d] text-white">
        <div className="container-page py-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-white/40">Espace vendeur</p>
              <h1 className="mt-1 text-2xl font-black">Bonjour, {displayName} 👋</h1>
              {mainStore?.name && <p className="mt-0.5 text-sm text-white/60">{mainStore.name}</p>}
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">{roleLabel}</span>
                <span className="rounded-full bg-[var(--mache-primary)]/30 px-3 py-1 text-xs font-bold text-orange-200">
                  Plan {plan.name}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">
                  {storeCount}/{limits.maxStores} store{limits.maxStores > 1 ? "s" : ""} · {limits.maxArticlesPerStore} articles/store
                </span>
                {mainStore?.is_verified
                  ? <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-bold text-green-300">✓ Vérifié</span>
                  : <span className="rounded-full bg-orange-500/20 px-3 py-1 text-xs font-bold text-orange-300">⏳ En attente</span>
                }
                {profile.role === "official_brand" && (
                  <span className="rounded-full bg-yellow-400/20 px-3 py-1 text-xs font-bold text-yellow-300">⭐ Marque officielle</span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {!storeLimitReached
                ? <Link href="/dashboard/seller/stores/new" className="btn-primary text-sm">+ Nouveau store</Link>
                : <Link href="/dashboard/seller?tab=subscription" className="rounded-2xl bg-red-500/20 px-4 py-2 text-xs font-bold text-red-300">🔒 Limite stores</Link>
              }
              {mainStore?.slug && (
                <Link href={`/store/${mainStore.slug}`} target="_blank" className="btn-secondary border-white/20 text-sm text-white">
                  Voir store →
                </Link>
              )}
            </div>
          </div>

          {/* Nav tabs */}
          <div className="mt-5 flex gap-1 overflow-x-auto pb-1">
            {TABS.map((t) => (
              <Link
                key={t.key}
                href={t.locked ? "#" : `/dashboard/seller?tab=${t.key}`}
                onClick={t.locked ? (e) => e.preventDefault() : undefined}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                  tab === t.key ? "bg-white text-[#071f3d]"
                  : t.locked ? "cursor-not-allowed text-white/30"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span>{t.icon}</span>{t.label}{t.locked ? " 🔒" : ""}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="container-page py-8">

        {/* ════════════ ACCUEIL ════════════ */}
        {tab === "home" && (
          <div className="space-y-8">

            {/* Limites plan */}
            <div className="rounded-2xl border bg-white p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-black">Limites de votre plan <span className="text-[var(--mache-primary)]">{plan.name}</span></h3>
                <Link href="?tab=subscription" className="text-xs font-bold text-[var(--mache-primary)] hover:underline">Changer →</Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <div className="flex justify-between text-xs text-neutral-500 mb-1">
                    <span>Stores</span>
                    <span>{storeCount} / {limits.maxStores}</span>
                  </div>
                  <div className="h-2 rounded-full bg-neutral-100">
                    <div className={`h-2 rounded-full ${storeLimitReached ? "bg-red-500" : "bg-[var(--mache-primary)]"}`}
                      style={{ width: `${Math.min((storeCount / limits.maxStores) * 100, 100)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-neutral-500 mb-1">
                    <span>Articles par store</span>
                    <span>max {limits.maxArticlesPerStore}</span>
                  </div>
                  <div className="h-2 rounded-full bg-neutral-100">
                    <div className="h-2 rounded-full bg-[var(--mache-primary)]" style={{ width: "100%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-neutral-500 mb-1">
                    <span>Total articles max</span>
                    <span>{limits.maxStores * limits.maxArticlesPerStore}</span>
                  </div>
                  <div className="h-2 rounded-full bg-neutral-100">
                    <div className={`h-2 rounded-full ${(totalProducts ?? 0) >= limits.maxStores * limits.maxArticlesPerStore ? "bg-red-500" : "bg-[var(--mache-primary)]"}`}
                      style={{ width: `${Math.min(((totalProducts ?? 0) / (limits.maxStores * limits.maxArticlesPerStore)) * 100, 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* KPIs */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Stores actifs",   value: `${storeCount} / ${limits.maxStores}`,        color: storeLimitReached ? "text-red-500" : "text-[var(--mache-primary)]" },
                { label: "Produits actifs", value: `${activeProducts ?? 0}`,                      color: "" },
                { label: "Commandes total", value: totalOrders,                                    color: "" },
                { label: "En attente",      value: pendingOrders,                                  color: "text-orange-500" },
              ].map((s) => (
                <div key={s.label} className="card p-5">
                  <p className="text-sm text-neutral-500">{s.label}</p>
                  <p className={`mt-1 text-3xl font-black ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Résumé financier */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="card p-5">
                <p className="text-sm text-neutral-500">CA ce mois</p>
                <p className="mt-1 text-2xl font-black">{monthRevenue.toLocaleString()} HTG</p>
                {revenueGrowth !== null && (
                  <p className={`mt-1 text-xs font-bold ${revenueGrowth >= 0 ? "text-green-600" : "text-red-500"}`}>
                    {revenueGrowth >= 0 ? "▲" : "▼"} {Math.abs(revenueGrowth)}% vs mois dernier
                  </p>
                )}
              </div>
              <div className="card p-5">
                <p className="text-sm text-neutral-500">CA total</p>
                <p className="mt-1 text-2xl font-black">{totalRevenue.toLocaleString()} HTG</p>
              </div>
              <div className="card p-5">
                <p className="text-sm text-neutral-500">Net estimé</p>
                <p className="mt-1 text-2xl font-black text-green-600">{netRevenue.toLocaleString()} HTG</p>
                <p className="mt-0.5 text-xs text-neutral-400">après commission ~5%</p>
              </div>
            </div>

            {/* Alerte livraison */}
            {toPrep > 0 && (
              <div className="flex items-center gap-4 rounded-2xl border border-orange-200 bg-orange-50 p-4">
                <span className="text-2xl">🚚</span>
                <div>
                  <p className="font-black text-orange-700">{toPrep} commande{toPrep > 1 ? "s" : ""} à préparer</p>
                  <p className="text-sm text-orange-600">Préparez vos colis pour expédition.</p>
                </div>
                <Link href="?tab=delivery" className="ml-auto text-sm font-black text-orange-700 hover:underline">Voir →</Link>
              </div>
            )}

            {/* Accès rapides */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {([
                { title: "Mes stores",      text: "Gérer vos stores et leurs articles.", href: "?tab=stores",       icon: "🏪", locked: false },
                { title: "Produits",        text: "Catalogue et stocks.",                href: "?tab=products",     icon: "📦", locked: false },
                { title: "Commandes",       text: "Traiter les commandes reçues.",       href: "?tab=orders",       icon: "🛒", locked: false },
                { title: "Livraisons",      text: "Expéditions et suivi colis.",         href: "?tab=delivery",     icon: "🚚", locked: false },
                { title: "Ventes",          text: "Revenus et bilan financier.",         href: "?tab=sales",        icon: "💰", locked: false },
                { title: "Bilan avancé",    text: "Factures, exports, rapports.",        href: "?tab=bilan",        icon: "📋", locked: !isBusiness },
                { title: "Publicité",       text: "Sponsoriser vos produits.",           href: "?tab=ads",          icon: "📣", locked: !plan.ads },
                { title: "Analyses",        text: "Stats et performances.",              href: "?tab=analytics",    icon: "📊", locked: !plan.analytics },
                { title: "Employés",        text: "Gérer votre équipe boutique.",        href: "?tab=employees",    icon: "👥", locked: !plan.employees },
                ...(isMarque ? [
                  { title: "IA Maché",      text: "Descriptions, prix, analyse IA.",    href: "?tab=ai",           icon: "🤖", locked: false },
                  { title: "Vue globale",   text: "Synthèse unifiée de vos stores.",    href: "?tab=overview",     icon: "🌐", locked: false },
                ] : []),
                { title: "Vérification",    text: "Documents et statut.",               href: "?tab=verification", icon: "✅", locked: false },
                { title: "Changer forfait", text: "Voir les plans disponibles.",        href: "?tab=subscription", icon: "⭐", locked: false },
              ] as { title: string; text: string; href: string; icon: string; locked: boolean }[]).map((item) => (
                <Link
                  key={item.title}
                  href={item.locked ? "#" : item.href}
                  onClick={item.locked ? (e) => e.preventDefault() : undefined}
                  className={`card group relative p-5 transition hover:-translate-y-1 hover:shadow-lg ${item.locked ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  {item.locked && (
                    <span className="absolute right-3 top-3 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-black text-neutral-400">🔒 Business</span>
                  )}
                  <span className="text-2xl">{item.icon}</span>
                  <h3 className={`mt-3 font-black ${!item.locked ? "group-hover:text-[var(--mache-primary)]" : ""}`}>{item.title}</h3>
                  <p className="mt-1 text-sm text-neutral-500">{item.text}</p>
                  {!item.locked
                    ? <p className="mt-3 text-sm font-black text-[var(--mache-primary)]">Accéder →</p>
                    : <p className="mt-3 text-xs font-bold text-neutral-400">Réservé au plan Business</p>
                  }
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ════════════ MES STORES ════════════ */}
        {tab === "stores" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black">Mes stores</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  {storeCount} store{storeCount > 1 ? "s" : ""} sur {limits.maxStores} maximum · {limits.maxArticlesPerStore} articles par store
                </p>
              </div>
              {!storeLimitReached
                ? <Link href="/dashboard/seller/stores/new" className="btn-primary">+ Nouveau store</Link>
                : <Link href="?tab=subscription" className="rounded-2xl bg-red-50 px-4 py-2 text-sm font-black text-red-600">🔒 Limite atteinte</Link>
              }
            </div>

            {/* Barre limite stores */}
            <div>
              <div className="flex justify-between text-xs text-neutral-500 mb-1">
                <span>{storeCount} store{storeCount > 1 ? "s" : ""} utilisé{storeCount > 1 ? "s" : ""}</span>
                <span>{limits.maxStores - storeCount} restant{limits.maxStores - storeCount > 1 ? "s" : ""}</span>
              </div>
              <div className="h-2 rounded-full bg-neutral-100">
                <div className={`h-2 rounded-full transition-all ${storeLimitReached ? "bg-red-500" : "bg-[var(--mache-primary)]"}`}
                  style={{ width: `${Math.min((storeCount / limits.maxStores) * 100, 100)}%` }} />
              </div>
            </div>

            {!stores || stores.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed p-12 text-center">
                <p className="text-4xl">🏪</p>
                <p className="mt-4 text-lg font-black">Aucun store créé</p>
                <p className="mt-2 text-sm text-neutral-500">Créez votre premier store pour commencer à vendre.</p>
                <Link href="/dashboard/seller/stores/new" className="btn-primary mt-6 inline-block">+ Créer un store</Link>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                {stores.map((s) => {
                  const articleCount = storeProductCounts[s.id] ?? 0;
                  const articleLimitReached = articleCount >= limits.maxArticlesPerStore;
                  return (
                    <div key={s.id} className="card p-6">
                      <div className="flex items-start gap-4">
                        {s.logo_url
                          ? <img src={s.logo_url} alt={s.name} className="h-14 w-14 rounded-2xl object-cover" />
                          : <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-2xl">🏪</div>
                        }
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-lg">{s.name}</h3>
                            {s.is_verified
                              ? <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-black text-green-700">✓ Vérifié</span>
                              : <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-black text-orange-700">⏳ En attente</span>
                            }
                          </div>
                          <p className="text-sm text-neutral-500 mt-0.5">/store/{s.slug}</p>
                        </div>
                      </div>

                      {/* Barre articles du store */}
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-neutral-500 mb-1">
                          <span>Articles</span>
                          <span className={articleLimitReached ? "font-black text-red-500" : ""}>{articleCount} / {limits.maxArticlesPerStore}</span>
                        </div>
                        <div className="h-2 rounded-full bg-neutral-100">
                          <div className={`h-2 rounded-full transition-all ${articleLimitReached ? "bg-red-500" : "bg-[var(--mache-primary)]"}`}
                            style={{ width: `${Math.min((articleCount / limits.maxArticlesPerStore) * 100, 100)}%` }} />
                        </div>
                        {articleLimitReached && (
                          <p className="mt-1 text-xs font-bold text-red-500">Limite d'articles atteinte pour ce store</p>
                        )}
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Link href={`/store/${s.slug}`} target="_blank" className="btn-secondary text-xs">Voir →</Link>
                        <Link href={`/dashboard/seller/stores/${s.id}/edit`} className="btn-primary text-xs">Modifier</Link>
                        {!articleLimitReached && (
                          <Link href={`/dashboard/seller/products/new?store=${s.id}`} className="btn-secondary text-xs">+ Article</Link>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Carte ajouter store si pas encore à la limite */}
                {!storeLimitReached && (
                  <Link href="/dashboard/seller/stores/new" className="card flex flex-col items-center justify-center gap-3 border-2 border-dashed p-6 text-center transition hover:border-[var(--mache-primary)] hover:text-[var(--mache-primary)]">
                    <span className="text-3xl">＋</span>
                    <p className="font-black">Ajouter un store</p>
                    <p className="text-sm text-neutral-400">{limits.maxStores - storeCount} emplacement{limits.maxStores - storeCount > 1 ? "s" : ""} restant{limits.maxStores - storeCount > 1 ? "s" : ""}</p>
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* ════════════ PRODUITS ════════════ */}
        {tab === "products" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black">Mes produits</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  {totalProducts ?? 0} produit{(totalProducts ?? 0) > 1 ? "s" : ""} · max {limits.maxArticlesPerStore} par store
                </p>
              </div>
              <Link href="/dashboard/seller/products/new" className="btn-primary">+ Ajouter</Link>
            </div>

            {!recentProducts || recentProducts.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed p-12 text-center">
                <p className="text-4xl">📦</p>
                <p className="mt-4 text-lg font-black">Aucun produit encore</p>
                <Link href="/dashboard/seller/products/new" className="btn-primary mt-6 inline-block">+ Ajouter un produit</Link>
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="p-4 text-left font-black">Produit</th>
                      <th className="hidden p-4 text-left font-black sm:table-cell">Store</th>
                      <th className="hidden p-4 text-left font-black md:table-cell">Prix</th>
                      <th className="hidden p-4 text-left font-black md:table-cell">Stock</th>
                      <th className="hidden p-4 text-left font-black lg:table-cell">Ventes</th>
                      <th className="p-4 text-left font-black">Statut</th>
                      <th className="p-4 text-left font-black">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentProducts.map((p) => {
                      const storeName = stores?.find((s) => s.id === p.store_id)?.name ?? "—";
                      return (
                        <tr key={p.id} className="border-t hover:bg-neutral-50">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {p.image_url
                                ? <img src={p.image_url} alt={p.title} className="h-10 w-10 rounded-xl object-cover" />
                                : <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">📦</div>
                              }
                              <span className="font-medium">{p.title}</span>
                            </div>
                          </td>
                          <td className="hidden p-4 text-neutral-500 sm:table-cell">{storeName}</td>
                          <td className="hidden p-4 text-neutral-500 md:table-cell">{p.price?.toLocaleString()} HTG</td>
                          <td className="hidden p-4 md:table-cell">
                            <span className={p.stock <= 2 ? "font-black text-red-500" : "text-neutral-500"}>{p.stock}</span>
                          </td>
                          <td className="hidden p-4 text-neutral-500 lg:table-cell">{p.sales_count ?? 0}</td>
                          <td className="p-4">
                            <span className={`rounded-full px-3 py-1 text-xs font-black ${
                              p.status === "active"  ? "bg-green-50 text-green-700"
                              : p.status === "draft" ? "bg-orange-50 text-orange-700"
                              : p.status === "paused" ? "bg-neutral-100 text-neutral-500"
                              : "bg-red-50 text-red-600"
                            }`}>
                              {p.status === "active" ? "Actif" : p.status === "draft" ? "Brouillon" : p.status === "paused" ? "Pausé" : "Refusé"}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-3">
                              <Link href={`/dashboard/seller/products/${p.id}/edit`} className="text-xs font-bold text-[var(--mache-primary)] hover:underline">Modifier</Link>
                              <Link href={`/dashboard/seller/products/${p.id}/delete`} className="text-xs font-bold text-red-500 hover:underline">Supprimer</Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ════════════ COMMANDES ════════════ */}
        {tab === "orders" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black">Commandes</h2>
            <div className="grid gap-4 sm:grid-cols-4">
              {[
                { label: "Total",      value: totalOrders,     color: "" },
                { label: "En attente", value: pendingOrders,   color: "text-orange-500" },
                { label: "Complétées", value: completedOrders, color: "text-green-600" },
                { label: "Annulées",   value: cancelledOrders, color: "text-red-500" },
              ].map((s) => (
                <div key={s.label} className="card p-4 text-center">
                  <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                  <p className="mt-1 text-sm text-neutral-500">{s.label}</p>
                </div>
              ))}
            </div>
            {!allOrders || allOrders.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed p-12 text-center">
                <p className="text-4xl">🛒</p>
                <p className="mt-4 font-black">Aucune commande pour le moment</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="p-4 text-left font-black">N° Commande</th>
                      <th className="hidden p-4 text-left font-black sm:table-cell">Date</th>
                      <th className="p-4 text-left font-black">Montant</th>
                      <th className="p-4 text-left font-black">Paiement</th>
                      <th className="hidden p-4 text-left font-black md:table-cell">Livraison</th>
                      <th className="p-4 text-left font-black">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allOrders.slice(0, 20).map((o) => {
                      const os = ORDER_STATUSES[o.status] ?? { label: o.status, color: "bg-neutral-100 text-neutral-500" };
                      const ds = o.delivery_status ? (DELIVERY_STATUSES[o.delivery_status] ?? null) : null;
                      return (
                        <tr key={o.id} className="border-t hover:bg-neutral-50">
                          <td className="p-4 font-mono text-xs font-bold text-neutral-400">#{o.id.slice(0, 8).toUpperCase()}</td>
                          <td className="hidden p-4 text-neutral-500 sm:table-cell">{new Date(o.created_at).toLocaleDateString("fr-FR")}</td>
                          <td className="p-4 font-bold">{(o.total_price ?? 0).toLocaleString()} HTG</td>
                          <td className="p-4"><span className={`rounded-full px-2 py-1 text-xs font-black ${os.color}`}>{os.label}</span></td>
                          <td className="hidden p-4 md:table-cell">
                            {ds ? <span className={`rounded-full px-2 py-1 text-xs font-black ${ds.color}`}>{ds.label}</span> : <span className="text-xs text-neutral-400">—</span>}
                          </td>
                          <td className="p-4">
                            <Link href={`/dashboard/seller/orders/${o.id}`} className="text-xs font-bold text-[var(--mache-primary)] hover:underline">Voir</Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ════════════ LIVRAISON ════════════ */}
        {tab === "delivery" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black">Livraisons</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "À préparer",   value: toPrep,       color: "text-orange-500" },
                { label: "En livraison", value: inDelivery,   color: "text-indigo-600" },
                { label: "Livrées",      value: deliveryOrders.filter((o) => o.delivery_status === "delivered").length, color: "text-green-600" },
              ].map((s) => (
                <div key={s.label} className="card p-5 text-center">
                  <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                  <p className="mt-1 text-sm text-neutral-500">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="card p-5">
              <h3 className="font-black mb-3">Statuts</h3>
              <div className="flex flex-wrap gap-2">
                {Object.values(DELIVERY_STATUSES).map((v) => (
                  <span key={v.label} className={`rounded-full px-3 py-1 text-xs font-black ${v.color}`}>{v.label}</span>
                ))}
              </div>
            </div>
            {deliveryOrders.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed p-12 text-center">
                <p className="text-4xl">🚚</p>
                <p className="mt-4 font-black">Aucune livraison active</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="p-4 text-left font-black">Commande</th>
                      <th className="hidden p-4 text-left font-black sm:table-cell">Date</th>
                      <th className="p-4 text-left font-black">Statut livraison</th>
                      <th className="p-4 text-left font-black">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveryOrders.map((o) => {
                      const ds = DELIVERY_STATUSES[o.delivery_status ?? ""] ?? { label: o.delivery_status, color: "bg-neutral-100 text-neutral-500" };
                      return (
                        <tr key={o.id} className="border-t hover:bg-neutral-50">
                          <td className="p-4 font-mono text-xs font-bold text-neutral-400">#{o.id.slice(0, 8).toUpperCase()}</td>
                          <td className="hidden p-4 text-neutral-500 sm:table-cell">{new Date(o.created_at).toLocaleDateString("fr-FR")}</td>
                          <td className="p-4"><span className={`rounded-full px-2 py-1 text-xs font-black ${ds.color}`}>{ds.label}</span></td>
                          <td className="p-4"><Link href={`/dashboard/seller/orders/${o.id}`} className="text-xs font-bold text-[var(--mache-primary)] hover:underline">Gérer</Link></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ════════════ VENTES ════════════ */}
        {tab === "sales" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black">Ventes & revenus</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="card p-6">
                <p className="text-sm font-bold uppercase text-neutral-400">CA total</p>
                <p className="mt-2 text-4xl font-black text-[var(--mache-primary)]">{totalRevenue.toLocaleString()} HTG</p>
              </div>
              <div className="card p-6">
                <p className="text-sm font-bold uppercase text-neutral-400">CA ce mois</p>
                <p className="mt-2 text-4xl font-black">{monthRevenue.toLocaleString()} HTG</p>
                {revenueGrowth !== null && (
                  <p className={`mt-1 text-xs font-bold ${revenueGrowth >= 0 ? "text-green-600" : "text-red-500"}`}>
                    {revenueGrowth >= 0 ? "▲" : "▼"} {Math.abs(revenueGrowth)}% vs mois dernier
                  </p>
                )}
              </div>
              <div className="card p-6">
                <p className="text-sm font-bold uppercase text-neutral-400">Mois précédent</p>
                <p className="mt-2 text-4xl font-black">{lastMonthRevenue.toLocaleString()} HTG</p>
              </div>
            </div>
            <div className="rounded-3xl border bg-white p-6">
              <h3 className="font-black text-lg">Bilan financier estimé</h3>
              <p className="mt-1 text-sm text-neutral-500">Commission estimée à 5% sur les ventes complétées.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-neutral-500">Revenu brut</p>
                  <p className="mt-1 text-2xl font-black">{totalRevenue.toLocaleString()} HTG</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Commission (~5%)</p>
                  <p className="mt-1 text-2xl font-black text-red-500">− {commission.toLocaleString()} HTG</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Net à recevoir</p>
                  <p className="mt-1 text-2xl font-black text-green-600">{netRevenue.toLocaleString()} HTG</p>
                </div>
              </div>
              <p className="mt-4 text-xs text-neutral-400">* Estimation uniquement. Montant réel selon contrat Maché.</p>
            </div>
            <div>
              <h3 className="font-black text-lg">Top produits par ventes</h3>
              {!topProducts || topProducts.length === 0 ? (
                <p className="mt-4 text-sm text-neutral-500">Aucune vente enregistrée.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {topProducts.map((p, i) => (
                    <div key={p.id} className="card flex items-center gap-4 p-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm font-black">{i + 1}</span>
                      {p.image_url ? <img src={p.image_url} alt={p.title} className="h-10 w-10 rounded-xl object-cover" /> : <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100">📦</div>}
                      <div className="flex-1">
                        <p className="font-bold">{p.title}</p>
                        <p className="text-sm text-neutral-500">{p.price?.toLocaleString()} HTG</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-[var(--mache-primary)]">{p.sales_count ?? 0}</p>
                        <p className="text-xs text-neutral-400">ventes</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════ ANALYSES ════════════ */}
        {tab === "analytics" && (
          <div className="space-y-6">
            {!plan.analytics ? (
              <div className="rounded-3xl border-2 border-dashed p-16 text-center">
                <p className="text-5xl">🔒</p>
                <p className="mt-4 text-xl font-black">Statistiques avancées</p>
                <p className="mt-2 text-neutral-500">Réservé aux vendeurs Business et Marque.</p>
                <Link href="?tab=subscription" className="btn-primary mt-6 inline-block">Voir les forfaits →</Link>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-black">Analyses & performances</h2>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: "CA ce mois",           value: `${monthRevenue.toLocaleString()} HTG`, color: "text-[var(--mache-primary)]" },
                    { label: "Commandes complétées",  value: completedOrders,                        color: "" },
                    { label: "Produits actifs",       value: activeProducts ?? 0,                    color: "" },
                    { label: "Taux de conversion",    value: `${totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0}%`, color: "" },
                  ].map((s) => (
                    <div key={s.label} className="card p-5">
                      <p className="text-sm text-neutral-500">{s.label}</p>
                      <p className={`mt-1 text-3xl font-black ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>
                {revenueGrowth !== null && (
                  <div className={`rounded-2xl p-4 ${revenueGrowth >= 0 ? "bg-green-50" : "bg-red-50"}`}>
                    <p className={`font-black ${revenueGrowth >= 0 ? "text-green-700" : "text-red-600"}`}>
                      {revenueGrowth >= 0 ? "📈" : "📉"} Évolution mensuelle : {revenueGrowth >= 0 ? "+" : ""}{revenueGrowth}%
                    </p>
                    <p className={`text-sm mt-1 ${revenueGrowth >= 0 ? "text-green-600" : "text-red-500"}`}>
                      {monthRevenue.toLocaleString()} HTG ce mois vs {lastMonthRevenue.toLocaleString()} HTG le mois dernier
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ════════════ PUBLICITÉ ════════════ */}
        {tab === "ads" && (
          <div className="space-y-6">
            {!plan.ads ? (
              <div className="rounded-3xl border-2 border-dashed p-16 text-center">
                <p className="text-5xl">📣</p>
                <p className="mt-4 text-xl font-black">Publicité sponsorisée</p>
                <p className="mt-2 text-neutral-500">
                  Cette fonctionnalité est réservée aux vendeurs Business et Marque.<br />
                  Passez à un abonnement supérieur pour sponsoriser vos produits.
                </p>
                <Link href="?tab=subscription" className="btn-primary mt-6 inline-block">Voir les forfaits →</Link>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-black">Publicité sponsorisée</h2>
                <div className="grid gap-4 sm:grid-cols-3">
                  {[{ label: "Campagnes actives", value: "—", icon: "📣" }, { label: "Vues générées", value: "—", icon: "👁️" }, { label: "Clics", value: "—", icon: "🖱️" }].map((s) => (
                    <div key={s.label} className="card p-5 text-center">
                      <p className="text-3xl">{s.icon}</p>
                      <p className="mt-2 text-2xl font-black">{s.value}</p>
                      <p className="text-sm text-neutral-500">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="card p-6">
                  <h3 className="font-black">Sponsoriser un produit</h3>
                  <p className="mt-2 text-sm text-neutral-500">Choisissez un produit, un budget et une durée.</p>
                  <Link href="/dashboard/seller/ads/new" className="btn-primary mt-4 inline-block">Créer une campagne</Link>
                </div>
              </>
            )}
          </div>
        )}

        {/* ════════════ VÉRIFICATION ════════════ */}
        {tab === "verification" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black">Vérification du compte</h2>
            <div className={`rounded-3xl p-6 ${mainStore?.is_verified ? "bg-green-50" : "bg-orange-50"}`}>
              <p className={`text-lg font-black ${mainStore?.is_verified ? "text-green-700" : "text-orange-700"}`}>
                {mainStore?.is_verified ? "✓ Compte vérifié" : "⏳ Vérification en attente"}
              </p>
              <p className={`mt-2 text-sm ${mainStore?.is_verified ? "text-green-600" : "text-orange-600"}`}>
                {mainStore?.is_verified
                  ? "Votre compte a été vérifié par l'équipe Maché."
                  : "Soumettez vos documents pour obtenir le badge vérifié."}
              </p>
            </div>
            <div className="card p-6">
              <h3 className="font-black">Documents requis</h3>
              <div className="mt-4 space-y-3">
                {[
                  { doc: "Nom complet",       done: !!profile.full_name },
                  { doc: "Téléphone",         done: false },
                  { doc: "Adresse",           done: false },
                  { doc: "Nom boutique",      done: !!mainStore?.name },
                  { doc: "Pièce d'identité",  done: false },
                  { doc: "Type de vendeur",   done: true },
                ].map((item) => (
                  <div key={item.doc} className="flex items-center gap-3">
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${item.done ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-400"}`}>
                      {item.done ? "✓" : "○"}
                    </span>
                    <span className={`text-sm ${item.done ? "font-medium" : "text-neutral-400"}`}>{item.doc}</span>
                  </div>
                ))}
              </div>
              <Link href="/dashboard/seller/verification/submit" className="btn-primary mt-6 inline-block">Soumettre les documents</Link>
            </div>
          </div>
        )}

        {/* ════════════ FORFAIT ════════════ */}
        {tab === "subscription" && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-black">Changer de forfait</h2>
              <p className="mt-1 text-neutral-500">
                Plan actuel : <span className="font-black text-[var(--mache-primary)]">{plan.name}</span>
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {PLANS.map((p) => {
                const isCurrent = p.key === planKey;
                return (
                  <div key={p.key} className={`card relative flex flex-col p-6 ${p.highlight ? "border-2 border-[var(--mache-primary)] shadow-lg" : ""} ${isCurrent ? "ring-2 ring-green-400" : ""}`}>
                    {p.highlight && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--mache-primary)] px-4 py-1 text-xs font-black text-white">Recommandé</span>}
                    {isCurrent && <span className="absolute -top-3 right-4 rounded-full bg-green-500 px-3 py-1 text-xs font-black text-white">Actuel</span>}
                    <h3 className="text-xl font-black">{p.name}</h3>
                    <div className="mt-1 flex items-end gap-1">
                      <span className="text-2xl font-black text-[var(--mache-primary)]">{p.price}</span>
                      <span className="mb-0.5 text-sm text-neutral-400">{p.period}</span>
                    </div>
                    {/* Limites visuelles */}
                    <div className="mt-3 flex gap-3 rounded-2xl bg-neutral-50 p-3 text-center">
                      <div className="flex-1">
                        <p className="text-xl font-black text-[var(--mache-primary)]">{p.maxStores}</p>
                        <p className="text-xs text-neutral-500">store{p.maxStores > 1 ? "s" : ""}</p>
                      </div>
                      <div className="w-px bg-neutral-200" />
                      <div className="flex-1">
                        <p className="text-xl font-black text-[var(--mache-primary)]">{p.maxArticlesPerStore}</p>
                        <p className="text-xs text-neutral-500">articles/store</p>
                      </div>
                      <div className="w-px bg-neutral-200" />
                      <div className="flex-1">
                        <p className="text-xl font-black">{p.maxStores * p.maxArticlesPerStore}</p>
                        <p className="text-xs text-neutral-500">total</p>
                      </div>
                    </div>
                    <div className="mt-4 flex-1 space-y-2">
                      {p.features.map((f) => <p key={f} className="flex items-start gap-2 text-sm"><span className="mt-0.5 text-green-500">✓</span>{f}</p>)}
                      {p.locked.map((f) => <p key={f} className="flex items-start gap-2 text-sm text-neutral-300"><span className="mt-0.5">✗</span>{f}</p>)}
                    </div>
                    <div className="mt-6">
                      {isCurrent ? (
                        <div className="w-full rounded-2xl bg-green-50 py-3 text-center text-sm font-black text-green-600">Plan actuel ✓</div>
                      ) : p.key === "premium" ? (
                        <Link href="/contact" className="block w-full rounded-2xl border-2 border-[var(--mache-primary)] py-3 text-center text-sm font-black text-[var(--mache-primary)] transition hover:bg-orange-50">Nous contacter</Link>
                      ) : (
                        <Link href={`/dashboard/seller/subscription/checkout?plan=${p.key}`} className={`block w-full rounded-2xl py-3 text-center text-sm font-black transition ${p.highlight ? "btn-primary" : "border-2 border-neutral-200 hover:border-[var(--mache-primary)] hover:text-[var(--mache-primary)]"}`}>
                          {p.key === "free" ? "Rétrograder" : "Choisir ce plan"}
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tableau comparatif */}
            <div className="overflow-hidden rounded-3xl border bg-white">
              <div className="bg-neutral-50 p-5"><h3 className="font-black text-lg">Comparatif</h3></div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-t">
                    <th className="p-4 text-left font-black">Fonctionnalité</th>
                    {PLANS.map((p) => <th key={p.key} className={`p-4 text-center font-black ${p.key === planKey ? "text-[var(--mache-primary)]" : ""}`}>{p.name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Stores",               values: ["1", "2", "5"] },
                    { label: "Articles par store",    values: ["3", "5", "7"] },
                    { label: "Total articles max",    values: ["3", "10", "35"] },
                    { label: "Publicité",             values: ["✗", "✓", "✓"] },
                    { label: "Statistiques avancées", values: ["✗", "✓", "✓"] },
                    { label: "Factures PDF",          values: ["✗", "✓", "✓"] },
                    { label: "Employés",              values: ["✗", "✓", "✓"] },
                    { label: "Badge officiel",        values: ["✗", "✗", "✓"] },
                    { label: "Homepage mise en avant",values: ["✗", "✗", "✓"] },
                  ].map((row) => (
                    <tr key={row.label} className="border-t">
                      <td className="p-4 font-medium">{row.label}</td>
                      {row.values.map((v, i) => (
                        <td key={i} className={`p-4 text-center ${v === "✓" ? "font-black text-green-600" : v === "✗" ? "text-neutral-300" : "font-bold"}`}>{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-center text-xs text-neutral-400">
              Des questions ? <Link href="/contact" className="font-bold underline">Contactez l'équipe Maché</Link>
            </p>
          </div>
        )}

        {/* ════════════ BILAN AVANCÉ (Business+) ════════════ */}
        {tab === "bilan" && (
          <div className="space-y-6">
            {!isBusiness ? (
              <div className="rounded-3xl border-2 border-dashed p-16 text-center">
                <p className="text-5xl">📋</p>
                <p className="mt-4 text-xl font-black">Bilan financier avancé</p>
                <p className="mt-2 text-neutral-500">Réservé aux vendeurs Business et Marque.</p>
                <Link href="?tab=subscription" className="btn-primary mt-6 inline-block">Voir les forfaits →</Link>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black">Bilan financier avancé</h2>
                  <Link href="/dashboard/seller/bilan/export" className="btn-secondary text-sm">⬇ Exporter PDF</Link>
                </div>

                {/* Résumé global */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: "CA total",           value: `${totalRevenue.toLocaleString()} HTG`,  color: "text-[var(--mache-primary)]" },
                    { label: "CA ce mois",          value: `${monthRevenue.toLocaleString()} HTG`,  color: "" },
                    { label: "Commission (~5%)",    value: `−${commission.toLocaleString()} HTG`,   color: "text-red-500" },
                    { label: "Net à recevoir",      value: `${netRevenue.toLocaleString()} HTG`,    color: "text-green-600" },
                  ].map((s) => (
                    <div key={s.label} className="card p-5">
                      <p className="text-sm text-neutral-500">{s.label}</p>
                      <p className={`mt-1 text-2xl font-black ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Évolution mois */}
                <div className="card p-6">
                  <h3 className="font-black text-lg mb-4">Comparaison mensuelle</h3>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl bg-neutral-50 p-4">
                      <p className="text-xs font-black uppercase text-neutral-400">Mois précédent</p>
                      <p className="mt-2 text-2xl font-black">{lastMonthRevenue.toLocaleString()} HTG</p>
                    </div>
                    <div className="rounded-2xl bg-neutral-50 p-4">
                      <p className="text-xs font-black uppercase text-neutral-400">Ce mois</p>
                      <p className="mt-2 text-2xl font-black">{monthRevenue.toLocaleString()} HTG</p>
                    </div>
                    <div className={`rounded-2xl p-4 ${revenueGrowth !== null && revenueGrowth >= 0 ? "bg-green-50" : "bg-red-50"}`}>
                      <p className="text-xs font-black uppercase text-neutral-400">Évolution</p>
                      <p className={`mt-2 text-2xl font-black ${revenueGrowth !== null && revenueGrowth >= 0 ? "text-green-600" : "text-red-500"}`}>
                        {revenueGrowth !== null ? `${revenueGrowth >= 0 ? "+" : ""}${revenueGrowth}%` : "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Détail commandes */}
                <div className="card p-6">
                  <h3 className="font-black text-lg mb-4">Détail des commandes</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      { label: "Total commandes",  value: totalOrders,     color: "" },
                      { label: "Complétées",        value: completedOrders, color: "text-green-600" },
                      { label: "En attente",        value: pendingOrders,   color: "text-orange-500" },
                      { label: "Annulées",          value: cancelledOrders, color: "text-red-500" },
                    ].map((s) => (
                      <div key={s.label} className="rounded-2xl bg-neutral-50 p-4 text-center">
                        <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                        <p className="mt-1 text-sm text-neutral-500">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-2xl bg-neutral-50 p-4">
                    <p className="text-sm text-neutral-500">Taux de complétion</p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex-1 h-3 rounded-full bg-neutral-200">
                        <div className="h-3 rounded-full bg-green-500"
                          style={{ width: `${totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0}%` }} />
                      </div>
                      <span className="text-sm font-black">
                        {totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bilan par store */}
                {stores && stores.length > 0 && (
                  <div className="card p-6">
                    <h3 className="font-black text-lg mb-4">Bilan par store</h3>
                    <div className="space-y-3">
                      {stores.map((s) => {
                        const articles = storeProductCounts[s.id] ?? 0;
                        return (
                          <div key={s.id} className="flex items-center gap-4 rounded-2xl bg-neutral-50 p-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-sm">🏪</div>
                            <div className="flex-1">
                              <p className="font-bold">{s.name}</p>
                              <p className="text-xs text-neutral-500">{articles} article{articles > 1 ? "s" : ""} / {limits.maxArticlesPerStore} max</p>
                            </div>
                            <Link href={`/store/${s.slug}`} target="_blank" className="text-xs font-bold text-[var(--mache-primary)] hover:underline">Voir →</Link>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Rapport mensuel */}
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-black text-lg">Rapport mensuel</h3>
                    <Link href="/dashboard/seller/bilan/report" className="text-xs font-bold text-[var(--mache-primary)] hover:underline">Voir tout →</Link>
                  </div>
                  <p className="text-sm text-neutral-500 mb-4">Historique des 10 dernières transactions.</p>
                  {!allOrders || allOrders.length === 0 ? (
                    <p className="text-sm text-neutral-400">Aucune transaction enregistrée.</p>
                  ) : (
                    <div className="overflow-hidden rounded-2xl border">
                      <table className="w-full text-sm">
                        <thead className="bg-neutral-50">
                          <tr>
                            <th className="p-3 text-left font-black">Commande</th>
                            <th className="hidden p-3 text-left font-black sm:table-cell">Date</th>
                            <th className="p-3 text-left font-black">Montant</th>
                            <th className="p-3 text-left font-black">Statut</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allOrders.slice(0, 10).map((o) => {
                            const os = ORDER_STATUSES[o.status] ?? { label: o.status, color: "bg-neutral-100 text-neutral-500" };
                            return (
                              <tr key={o.id} className="border-t hover:bg-neutral-50">
                                <td className="p-3 font-mono text-xs font-bold text-neutral-400">#{o.id.slice(0, 8).toUpperCase()}</td>
                                <td className="hidden p-3 text-neutral-500 sm:table-cell">{new Date(o.created_at).toLocaleDateString("fr-FR")}</td>
                                <td className="p-3 font-bold">{(o.total_price ?? 0).toLocaleString()} HTG</td>
                                <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs font-black ${os.color}`}>{os.label}</span></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <p className="text-xs text-neutral-400">* Toutes les estimations financières sont indicatives. Le montant réel dépend de votre contrat Maché.</p>
              </>
            )}
          </div>
        )}

        {/* ════════════ EMPLOYÉS (Business+) ════════════ */}
        {tab === "employees" && (
          <div className="space-y-6">
            {!plan.employees ? (
              <div className="rounded-3xl border-2 border-dashed p-16 text-center">
                <p className="text-5xl">👥</p>
                <p className="mt-4 text-xl font-black">Gestion des employés</p>
                <p className="mt-2 text-neutral-500">Réservé aux vendeurs Business et Marque.</p>
                <Link href="?tab=subscription" className="btn-primary mt-6 inline-block">Voir les forfaits →</Link>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black">Gestion des employés</h2>
                    <p className="mt-1 text-sm text-neutral-500">Invitez des collaborateurs à gérer votre boutique.</p>
                  </div>
                  <Link href="/dashboard/seller/employees/invite" className="btn-primary text-sm">+ Inviter</Link>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { label: "Employés actifs", value: "—", icon: "👤" },
                    { label: "Invitations en attente", value: "—", icon: "📧" },
                    { label: "Rôles disponibles", value: "3", icon: "🏷️" },
                  ].map((s) => (
                    <div key={s.label} className="card p-5 text-center">
                      <p className="text-3xl">{s.icon}</p>
                      <p className="mt-2 text-2xl font-black">{s.value}</p>
                      <p className="text-sm text-neutral-500">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="card p-6">
                  <h3 className="font-black mb-4">Rôles disponibles</h3>
                  <div className="space-y-3">
                    {[
                      { role: "Gestionnaire",  desc: "Peut gérer produits, commandes et livraisons.",       color: "bg-blue-50 text-blue-700" },
                      { role: "Vendeur",       desc: "Peut voir les commandes et mettre à jour les stocks.", color: "bg-green-50 text-green-700" },
                      { role: "Comptable",     desc: "Accès lecture au bilan, ventes et factures.",          color: "bg-purple-50 text-purple-700" },
                    ].map((r) => (
                      <div key={r.role} className="flex items-start gap-3 rounded-2xl bg-neutral-50 p-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-black ${r.color}`}>{r.role}</span>
                        <p className="text-sm text-neutral-600">{r.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border-2 border-dashed p-10 text-center">
                  <p className="text-3xl">👥</p>
                  <p className="mt-3 font-black">Aucun employé encore</p>
                  <p className="mt-2 text-sm text-neutral-500">Invitez un collaborateur par email pour commencer.</p>
                  <Link href="/dashboard/seller/employees/invite" className="btn-primary mt-5 inline-block">Inviter un employé</Link>
                </div>
              </>
            )}
          </div>
        )}

        {/* ════════════ IA MACHÉ (Marque officielle seulement) ════════════ */}
        {tab === "ai" && (
          <div className="space-y-6">
            {!isMarque ? (
              <div className="rounded-3xl border-2 border-dashed p-16 text-center">
                <p className="text-5xl">🤖</p>
                <p className="mt-4 text-xl font-black">IA Maché</p>
                <p className="mt-2 text-neutral-500">Réservé aux Marques officielles.</p>
                <Link href="?tab=subscription" className="btn-primary mt-6 inline-block">Voir les forfaits →</Link>
              </div>
            ) : (
              <>
                <div>
                  <h2 className="text-2xl font-black">IA Maché ✨</h2>
                  <p className="mt-1 text-neutral-500">Outils d'intelligence artificielle pour optimiser votre boutique.</p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {[
                    {
                      title: "Rédaction produits",
                      text: "Générez automatiquement des descriptions produits optimisées en français, créole et anglais.",
                      icon: "✍️",
                      href: "/dashboard/seller/ai/description",
                      badge: "Nouveau",
                    },
                    {
                      title: "Suggestion de prix",
                      text: "Obtenez des suggestions de prix basées sur le marché local et vos ventes passées.",
                      icon: "💡",
                      href: "/dashboard/seller/ai/pricing",
                      badge: "Populaire",
                    },
                    {
                      title: "Analyse concurrence",
                      text: "Comparez vos produits avec la concurrence sur Maché pour mieux vous positionner.",
                      icon: "🔍",
                      href: "/dashboard/seller/ai/competition",
                      badge: null,
                    },
                    {
                      title: "Rapport automatique",
                      text: "Générez un rapport complet de votre activité mensuelle avec recommandations IA.",
                      icon: "📊",
                      href: "/dashboard/seller/ai/report",
                      badge: null,
                    },
                    {
                      title: "Optimisation boutique",
                      text: "L'IA analyse votre boutique et propose des améliorations pour booster vos ventes.",
                      icon: "🚀",
                      href: "/dashboard/seller/ai/optimize",
                      badge: "Beta",
                    },
                    {
                      title: "Traduction multilingue",
                      text: "Traduisez vos fiches produits en fr, en, es, ht automatiquement.",
                      icon: "🌍",
                      href: "/dashboard/seller/ai/translate",
                      badge: null,
                    },
                  ].map((tool) => (
                    <Link
                      key={tool.title}
                      href={tool.href}
                      className="card group relative p-6 transition hover:-translate-y-1 hover:shadow-lg"
                    >
                      {tool.badge && (
                        <span className="absolute right-4 top-4 rounded-full bg-[var(--mache-primary)] px-2 py-0.5 text-xs font-black text-white">
                          {tool.badge}
                        </span>
                      )}
                      <span className="text-3xl">{tool.icon}</span>
                      <h3 className="mt-3 font-black group-hover:text-[var(--mache-primary)]">{tool.title}</h3>
                      <p className="mt-2 text-sm text-neutral-500">{tool.text}</p>
                      <p className="mt-4 text-sm font-black text-[var(--mache-primary)]">Utiliser →</p>
                    </Link>
                  ))}
                </div>

                {/* Rapport IA rapide */}
                <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-[#071f3d] to-[#1a3a6b] p-8 text-white">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-white/50">IA Maché</p>
                      <h3 className="mt-2 text-xl font-black">Générer le rapport du mois</h3>
                      <p className="mt-1 text-sm text-white/70">
                        L'IA analyse vos {totalOrders} commandes, {activeProducts ?? 0} produits actifs et votre CA de {monthRevenue.toLocaleString()} HTG ce mois.
                      </p>
                    </div>
                    <Link href="/dashboard/seller/ai/report" className="btn-primary shrink-0">
                      Générer le rapport ✨
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ════════════ VUE GLOBALE (Marque officielle seulement) ════════════ */}
        {tab === "overview" && (
          <div className="space-y-6">
            {!isMarque ? (
              <div className="rounded-3xl border-2 border-dashed p-16 text-center">
                <p className="text-5xl">🌐</p>
                <p className="mt-4 text-xl font-black">Vue multi-stores unifiée</p>
                <p className="mt-2 text-neutral-500">Réservé aux Marques officielles.</p>
                <Link href="?tab=subscription" className="btn-primary mt-6 inline-block">Voir les forfaits →</Link>
              </div>
            ) : (
              <>
                <div>
                  <h2 className="text-2xl font-black">Vue globale — tous stores</h2>
                  <p className="mt-1 text-neutral-500">Synthèse unifiée de l'ensemble de votre activité multi-stores.</p>
                </div>

                {/* Résumé global tous stores */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: "Stores actifs",    value: storeCount,            color: "text-[var(--mache-primary)]" },
                    { label: "Total articles",   value: totalProducts ?? 0,    color: "" },
                    { label: "Total commandes",  value: totalOrders,           color: "" },
                    { label: "CA total",         value: `${totalRevenue.toLocaleString()} HTG`, color: "text-green-600" },
                  ].map((s) => (
                    <div key={s.label} className="card p-5">
                      <p className="text-sm text-neutral-500">{s.label}</p>
                      <p className={`mt-1 text-2xl font-black ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Stores côte à côte */}
                {stores && stores.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="font-black text-lg">Performance par store</h3>
                    {stores.map((s) => {
                      const articles = storeProductCounts[s.id] ?? 0;
                      const pct = Math.min(Math.round((articles / limits.maxArticlesPerStore) * 100), 100);
                      return (
                        <div key={s.id} className="card p-6">
                          <div className="flex items-start gap-4">
                            {s.logo_url
                              ? <img src={s.logo_url} alt={s.name} className="h-12 w-12 rounded-2xl object-cover" />
                              : <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-neutral-100 text-xl">🏪</div>
                            }
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-black">{s.name}</h4>
                                {s.is_verified && <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-black text-green-700">✓</span>}
                                <span className="rounded-full bg-yellow-50 px-2 py-0.5 text-xs font-black text-yellow-700">⭐ Officiel</span>
                              </div>
                              <p className="text-xs text-neutral-500 mt-0.5">/store/{s.slug}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-black">{articles}</p>
                              <p className="text-xs text-neutral-400">articles</p>
                            </div>
                          </div>

                          {/* Barre articles */}
                          <div className="mt-4">
                            <div className="flex justify-between text-xs text-neutral-400 mb-1">
                              <span>Articles utilisés</span>
                              <span>{articles} / {limits.maxArticlesPerStore}</span>
                            </div>
                            <div className="h-2 rounded-full bg-neutral-100">
                              <div className={`h-2 rounded-full ${pct >= 100 ? "bg-red-500" : pct > 70 ? "bg-orange-400" : "bg-[var(--mache-primary)]"}`}
                                style={{ width: `${pct}%` }} />
                            </div>
                          </div>

                          <div className="mt-4 flex gap-2">
                            <Link href={`/store/${s.slug}`} target="_blank" className="btn-secondary text-xs">Voir →</Link>
                            <Link href={`/dashboard/seller/stores/${s.id}/edit`} className="btn-primary text-xs">Gérer</Link>
                            {articles < limits.maxArticlesPerStore && (
                              <Link href={`/dashboard/seller/products/new?store=${s.id}`} className="btn-secondary text-xs">+ Article</Link>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-3xl border-2 border-dashed p-10 text-center">
                    <p className="text-4xl">🏪</p>
                    <p className="mt-4 font-black">Aucun store encore</p>
                    <Link href="/dashboard/seller/stores/new" className="btn-primary mt-5 inline-block">+ Créer un store</Link>
                  </div>
                )}

                {/* Bilan consolidé */}
                <div className="card p-6">
                  <h3 className="font-black text-lg mb-4">Bilan consolidé tous stores</h3>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl bg-neutral-50 p-4">
                      <p className="text-xs font-black uppercase text-neutral-400">Revenu brut</p>
                      <p className="mt-2 text-2xl font-black">{totalRevenue.toLocaleString()} HTG</p>
                    </div>
                    <div className="rounded-2xl bg-red-50 p-4">
                      <p className="text-xs font-black uppercase text-neutral-400">Commission (~5%)</p>
                      <p className="mt-2 text-2xl font-black text-red-500">−{commission.toLocaleString()} HTG</p>
                    </div>
                    <div className="rounded-2xl bg-green-50 p-4">
                      <p className="text-xs font-black uppercase text-neutral-400">Net estimé</p>
                      <p className="mt-2 text-2xl font-black text-green-600">{netRevenue.toLocaleString()} HTG</p>
                    </div>
                  </div>
                </div>

                {/* Actions rapides marque */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { title: "Rapport IA",         text: "Générez un rapport automatique de toute votre activité.", href: "/dashboard/seller/ai/report",    icon: "🤖" },
                    { title: "Exporter le bilan",   text: "Téléchargez le bilan consolidé de tous vos stores.",      href: "/dashboard/seller/bilan/export", icon: "⬇" },
                    { title: "Publicité groupée",   text: "Lancez une campagne sur plusieurs stores à la fois.",     href: "/dashboard/seller/ads/multi",    icon: "📣" },
                    { title: "Paramètres marque",   text: "Badge officiel, boutique premium, visibilité.",          href: "/dashboard/seller/brand",        icon: "⭐" },
                  ].map((a) => (
                    <Link key={a.title} href={a.href} className="card group flex items-start gap-4 p-5 transition hover:-translate-y-1 hover:shadow-lg">
                      <span className="text-2xl">{a.icon}</span>
                      <div>
                        <h3 className="font-black group-hover:text-[var(--mache-primary)]">{a.title}</h3>
                        <p className="mt-1 text-sm text-neutral-500">{a.text}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        )}


        {tab === "settings" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black">Paramètres</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { title: "Profil vendeur",    text: "Nom, email, téléphone.",             href: "/dashboard/seller/settings/profile", icon: "👤" },
                { title: "Notifications",     text: "Alertes commandes et messages.",     href: "/dashboard/seller/settings/notifs",  icon: "🔔" },
                { title: "Politique retour",  text: "Conditions de retour produits.",     href: "/dashboard/seller/settings/returns", icon: "↩️" },
                { title: "Moyen de paiement", text: "RIB et réception des paiements.",    href: "/dashboard/seller/settings/payment", icon: "💳" },
                { title: "Support",           text: "Contacter l'équipe Maché.",          href: "/contact",                           icon: "💬" },
              ].map((item) => (
                <Link key={item.title} href={item.href} className="card group flex items-start gap-4 p-5 transition hover:-translate-y-1 hover:shadow-lg">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <h3 className="font-black group-hover:text-[var(--mache-primary)]">{item.title}</h3>
                    <p className="mt-1 text-sm text-neutral-500">{item.text}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Upgrade banner — particulier */}
        {profile.role === "seller_individual" && tab !== "subscription" && (
          <div className="mt-10 overflow-hidden rounded-3xl bg-gradient-to-r from-[#071f3d] to-[#d20a1e] p-8 text-white">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-white/60">Plan actuel : Gratuit · 1 store · 3 articles</p>
                <h3 className="mt-2 text-2xl font-black">Passez au plan Business</h3>
                <p className="mt-2 text-sm text-white/70">2 stores, 5 articles/store, publicité, statistiques avancées, factures.</p>
              </div>
              <Link href="?tab=subscription" className="btn-primary shrink-0">Voir les forfaits →</Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
