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

const PLANS = [
  {
    key: "free",
    name: "Gratuit",
    price: "0 HTG",
    period: "",
    maxProducts: 10,
    ads: false,
    analytics: false,
    invoices: false,
    employees: false,
    highlight: false,
    features: ["10 produits maximum", "Commandes simples", "Statistiques basiques", "Support standard"],
    locked: ["Publicité sponsorisée", "Statistiques avancées", "Factures PDF", "Employés", "Produits illimités"],
  },
  {
    key: "starter",
    name: "Starter",
    price: "1 500 HTG",
    period: "/ mois",
    maxProducts: 50,
    ads: false,
    analytics: false,
    invoices: false,
    employees: false,
    highlight: false,
    features: ["50 produits", "Meilleure visibilité", "Statistiques simples", "Support prioritaire"],
    locked: ["Publicité sponsorisée", "Statistiques avancées", "Factures PDF"],
  },
  {
    key: "business",
    name: "Business",
    price: "4 500 HTG",
    period: "/ mois",
    maxProducts: 500,
    ads: true,
    analytics: true,
    invoices: true,
    employees: true,
    highlight: true,
    features: ["500 produits", "Publicité sponsorisée", "Statistiques avancées", "Factures PDF", "Livraisons avancées", "Employés", "Analytics complets"],
    locked: [],
  },
  {
    key: "premium",
    name: "Premium / Marque",
    price: "Sur devis",
    period: "",
    maxProducts: 999999,
    ads: true,
    analytics: true,
    invoices: true,
    employees: true,
    highlight: false,
    features: ["Produits illimités", "Badge Marque officielle", "Mise en avant homepage", "Campagnes publicitaires", "Boutique premium", "Account manager dédié"],
    locked: [],
  },
];

const ROLE_PLAN_KEY: Record<string, string> = {
  seller_individual: "free",
  seller_business: "business",
  supplier: "business",
  official_brand: "premium",
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
  const displayName = profile.full_name || userData.user.email || "Vendeur";
  const roleLabel = ROLE_LABELS[profile.role];
  const isUnlimited = plan.maxProducts >= 999999;

  // ── Boutique ──
  const { data: store } = await supabase
    .from("stores")
    .select("id, slug, name, is_verified, description, logo_url")
    .eq("owner_id", uid)
    .maybeSingle();

  // ── Produits ──
  const { count: totalProducts } = await supabase
    .from("products").select("*", { count: "exact", head: true }).eq("seller_id", uid);
  const { count: activeProducts } = await supabase
    .from("products").select("*", { count: "exact", head: true }).eq("seller_id", uid).eq("status", "active");
  const { count: draftProducts } = await supabase
    .from("products").select("*", { count: "exact", head: true }).eq("seller_id", uid).eq("status", "draft");

  const { data: recentProducts } = await supabase
    .from("products")
    .select("id, title, price, stock, status, sales_count, image_url, category")
    .eq("seller_id", uid)
    .order("created_at", { ascending: false })
    .limit(8);

  const { data: topProducts } = await supabase
    .from("products")
    .select("id, title, price, sales_count, image_url")
    .eq("seller_id", uid)
    .order("sales_count", { ascending: false })
    .limit(5);

  // ── Commandes ──
  const { data: allOrders } = await supabase
    .from("orders")
    .select("id, status, total_price, created_at, delivery_status")
    .eq("seller_id", uid)
    .order("created_at", { ascending: false });

  const totalOrders = allOrders?.length ?? 0;
  const pendingOrders = allOrders?.filter((o) => o.status === "pending").length ?? 0;
  const completedOrders = allOrders?.filter((o) => o.status === "completed").length ?? 0;
  const cancelledOrders = allOrders?.filter((o) => o.status === "cancelled").length ?? 0;

  // ── Revenus ──
  const totalRevenue = allOrders
    ?.filter((o) => o.status === "completed")
    .reduce((s, o) => s + (o.total_price ?? 0), 0) ?? 0;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

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

  // ── Limites ──
  const productCount = totalProducts ?? 0;
  const limitDisplay = isUnlimited ? "∞" : plan.maxProducts;
  const limitReached = !isUnlimited && productCount >= plan.maxProducts;

  const TABS = [
    { key: "home",         label: "Accueil",     icon: "🏠" },
    { key: "products",     label: "Produits",     icon: "📦" },
    { key: "orders",       label: "Commandes",    icon: "🛒" },
    { key: "delivery",     label: "Livraison",    icon: "🚚" },
    { key: "sales",        label: "Ventes",       icon: "💰" },
    { key: "analytics",    label: "Analyses",     icon: "📊" },
    { key: "ads",          label: "Publicité",    icon: "📣" },
    { key: "store",        label: "Boutique",     icon: "🏪" },
    { key: "verification", label: "Vérification", icon: "✅" },
    { key: "subscription", label: "Forfait",      icon: "⭐" },
    { key: "settings",     label: "Paramètres",   icon: "⚙️" },
  ];

  return (
    <main className="min-h-screen bg-neutral-50">

      {/* ── Header ── */}
      <div className="bg-[#071f3d] text-white">
        <div className="container-page py-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-white/40">Espace vendeur</p>
              <h1 className="mt-1 text-2xl font-black">Bonjour, {displayName} 👋</h1>
              {store?.name && <p className="mt-0.5 text-sm text-white/60">{store.name}</p>}
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">{roleLabel}</span>
                <span className="rounded-full bg-[var(--mache-primary)]/30 px-3 py-1 text-xs font-bold text-orange-200">
                  Plan {plan.name}
                </span>
                {store?.is_verified
                  ? <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-bold text-green-300">✓ Vérifié</span>
                  : <span className="rounded-full bg-orange-500/20 px-3 py-1 text-xs font-bold text-orange-300">⏳ En attente de vérification</span>
                }
                {profile.role === "official_brand" && (
                  <span className="rounded-full bg-yellow-400/20 px-3 py-1 text-xs font-bold text-yellow-300">⭐ Marque officielle</span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {limitReached
                ? <Link href="/dashboard/seller?tab=subscription" className="rounded-2xl bg-red-500/20 px-4 py-2 text-xs font-bold text-red-300">🔒 Limite — Upgrade</Link>
                : <Link href="/dashboard/seller/products/new" className="btn-primary text-sm">+ Ajouter un produit</Link>
              }
              {store?.slug && (
                <Link href={`/store/${store.slug}`} target="_blank" className="btn-secondary border-white/20 text-sm text-white">
                  Ma boutique →
                </Link>
              )}
            </div>
          </div>

          {/* Nav tabs */}
          <div className="mt-5 flex gap-1 overflow-x-auto pb-1">
            {TABS.map((t) => (
              <Link
                key={t.key}
                href={`/dashboard/seller?tab=${t.key}`}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                  tab === t.key ? "bg-white text-[#071f3d]" : "text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span>{t.icon}</span>{t.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="container-page py-8">

        {/* ════════════════════ ACCUEIL ════════════════════ */}
        {tab === "home" && (
          <div className="space-y-8">
            {/* KPIs */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Produits actifs", value: `${activeProducts ?? 0} / ${limitDisplay}`, sub: limitReached ? "⚠️ Limite atteinte" : null, color: "text-[var(--mache-primary)]" },
                { label: "Brouillons", value: draftProducts ?? 0, sub: null, color: "" },
                { label: "Commandes totales", value: totalOrders, sub: null, color: "" },
                { label: "En attente", value: pendingOrders, sub: null, color: "text-orange-500" },
              ].map((s) => (
                <div key={s.label} className="card p-5">
                  <p className="text-sm text-neutral-500">{s.label}</p>
                  <p className={`mt-1 text-3xl font-black ${s.color}`}>{s.value}</p>
                  {s.sub && <p className="mt-1 text-xs font-bold text-red-500">{s.sub}</p>}
                </div>
              ))}
            </div>

            {/* Résumé financier rapide */}
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

            {/* Livraison alerte */}
            {toPrep > 0 && (
              <div className="flex items-center gap-4 rounded-2xl border border-orange-200 bg-orange-50 p-4">
                <span className="text-2xl">🚚</span>
                <div>
                  <p className="font-black text-orange-700">{toPrep} commande{toPrep > 1 ? "s" : ""} à préparer</p>
                  <p className="text-sm text-orange-600">Préparez vos colis pour expédition.</p>
                </div>
                <Link href="/dashboard/seller?tab=delivery" className="ml-auto text-sm font-black text-orange-700 hover:underline">
                  Voir →
                </Link>
              </div>
            )}

            {/* Accès rapides */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[
                { title: "Mes produits",   text: "Catalogue, stocks, statuts.",         href: "?tab=products",     icon: "📦", locked: false },
                { title: "Commandes",      text: "Traiter les commandes reçues.",        href: "?tab=orders",       icon: "🛒", locked: false },
                { title: "Livraisons",     text: "Expéditions et suivi colis.",          href: "?tab=delivery",     icon: "🚚", locked: false },
                { title: "Mes ventes",     text: "Revenus et historique.",               href: "?tab=sales",        icon: "💰", locked: false },
                { title: "Publicité",      text: "Sponsoriser vos produits.",            href: "?tab=ads",          icon: "📣", locked: !plan.ads },
                { title: "Analyses",       text: "Stats et performances boutique.",      href: "?tab=analytics",    icon: "📊", locked: !plan.analytics },
                { title: "Ma boutique",    text: "Page publique et paramètres.",         href: "?tab=store",        icon: "🏪", locked: false },
                { title: "Vérification",   text: "Documents et statut de vérification.", href: "?tab=verification", icon: "✅", locked: false },
                { title: "Changer forfait", text: "Voir les plans disponibles.",          href: "?tab=subscription", icon: "⭐", locked: false },
              ].map((item) => (
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
                  {!item.locked && <p className="mt-3 text-sm font-black text-[var(--mache-primary)]">Accéder →</p>}
                  {item.locked && <p className="mt-3 text-xs font-bold text-neutral-400">Réservé au plan Business</p>}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════ PRODUITS ════════════════════ */}
        {tab === "products" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black">Mes produits</h2>
                <p className="mt-1 text-sm text-neutral-500">{productCount} produit{productCount > 1 ? "s" : ""} sur {limitDisplay} maximum</p>
              </div>
              {!limitReached
                ? <Link href="/dashboard/seller/products/new" className="btn-primary">+ Ajouter</Link>
                : <Link href="?tab=subscription" className="rounded-2xl bg-red-50 px-4 py-2 text-sm font-black text-red-600">🔒 Limite atteinte</Link>
              }
            </div>

            {/* Barre limite */}
            {!isUnlimited && (
              <div>
                <div className="flex justify-between text-xs text-neutral-500 mb-1">
                  <span>{productCount} utilisés</span>
                  <span>{plan.maxProducts - productCount} restants</span>
                </div>
                <div className="h-2 rounded-full bg-neutral-100">
                  <div
                    className={`h-2 rounded-full transition-all ${limitReached ? "bg-red-500" : "bg-[var(--mache-primary)]"}`}
                    style={{ width: `${Math.min((productCount / plan.maxProducts) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}

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
                      <th className="hidden p-4 text-left font-black sm:table-cell">Catégorie</th>
                      <th className="hidden p-4 text-left font-black md:table-cell">Prix</th>
                      <th className="hidden p-4 text-left font-black md:table-cell">Stock</th>
                      <th className="hidden p-4 text-left font-black lg:table-cell">Ventes</th>
                      <th className="p-4 text-left font-black">Statut</th>
                      <th className="p-4 text-left font-black">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentProducts.map((p) => (
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
                        <td className="hidden p-4 text-neutral-500 sm:table-cell">{p.category || "—"}</td>
                        <td className="hidden p-4 text-neutral-500 md:table-cell">{p.price?.toLocaleString()} HTG</td>
                        <td className="hidden p-4 md:table-cell">
                          <span className={p.stock <= 3 ? "font-black text-red-500" : "text-neutral-500"}>{p.stock}</span>
                        </td>
                        <td className="hidden p-4 text-neutral-500 lg:table-cell">{p.sales_count ?? 0}</td>
                        <td className="p-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-black ${
                            p.status === "active" ? "bg-green-50 text-green-700"
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
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════ COMMANDES ════════════════════ */}
        {tab === "orders" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black">Commandes</h2>
            <div className="grid gap-4 sm:grid-cols-4">
              {[
                { label: "Total",      value: totalOrders,    color: "" },
                { label: "En attente", value: pendingOrders,  color: "text-orange-500" },
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
                      <th className="p-4 text-left font-black">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allOrders.slice(0, 20).map((o) => {
                      const orderStatus = ORDER_STATUSES[o.status] ?? { label: o.status, color: "bg-neutral-100 text-neutral-500" };
                      const delivStatus = o.delivery_status ? (DELIVERY_STATUSES[o.delivery_status] ?? null) : null;
                      return (
                        <tr key={o.id} className="border-t hover:bg-neutral-50">
                          <td className="p-4 font-mono text-xs font-bold text-neutral-400">#{o.id.slice(0, 8).toUpperCase()}</td>
                          <td className="hidden p-4 text-neutral-500 sm:table-cell">{new Date(o.created_at).toLocaleDateString("fr-FR")}</td>
                          <td className="p-4 font-bold">{(o.total_price ?? 0).toLocaleString()} HTG</td>
                          <td className="p-4">
                            <span className={`rounded-full px-2 py-1 text-xs font-black ${orderStatus.color}`}>{orderStatus.label}</span>
                          </td>
                          <td className="hidden p-4 md:table-cell">
                            {delivStatus
                              ? <span className={`rounded-full px-2 py-1 text-xs font-black ${delivStatus.color}`}>{delivStatus.label}</span>
                              : <span className="text-xs text-neutral-400">—</span>
                            }
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

        {/* ════════════════════ LIVRAISON ════════════════════ */}
        {tab === "delivery" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black">Livraisons</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "À préparer",   value: deliveryOrders.filter((o) => o.delivery_status === "to_prepare").length,  color: "text-orange-500" },
                { label: "En livraison", value: inDelivery, color: "text-indigo-600" },
                { label: "Livrées",      value: deliveryOrders.filter((o) => o.delivery_status === "delivered").length, color: "text-green-600" },
              ].map((s) => (
                <div key={s.label} className="card p-5 text-center">
                  <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                  <p className="mt-1 text-sm text-neutral-500">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Guide statuts */}
            <div className="card p-6">
              <h3 className="font-black mb-4">Statuts de livraison</h3>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(DELIVERY_STATUSES).map(([, v]) => (
                  <div key={v.label} className="flex items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${v.color}`}>{v.label}</span>
                  </div>
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
                          <td className="p-4">
                            <span className={`rounded-full px-2 py-1 text-xs font-black ${ds.color}`}>{ds.label}</span>
                          </td>
                          <td className="p-4">
                            <Link href={`/dashboard/seller/orders/${o.id}`} className="text-xs font-bold text-[var(--mache-primary)] hover:underline">Gérer</Link>
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

        {/* ════════════════════ VENTES ════════════════════ */}
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

            {/* Commission & net */}
            <div className="rounded-3xl border bg-white p-6">
              <h3 className="font-black text-lg">Bilan financier estimé</h3>
              <p className="mt-1 text-sm text-neutral-500">Commission estimée à 5% sur les ventes complétées.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-neutral-500">Revenu brut</p>
                  <p className="mt-1 text-2xl font-black">{totalRevenue.toLocaleString()} HTG</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Commission Maché (~5%)</p>
                  <p className="mt-1 text-2xl font-black text-red-500">− {commission.toLocaleString()} HTG</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Net à recevoir</p>
                  <p className="mt-1 text-2xl font-black text-green-600">{netRevenue.toLocaleString()} HTG</p>
                </div>
              </div>
              <p className="mt-4 text-xs text-neutral-400">* Estimation uniquement. Montant réel selon contrat Maché.</p>
            </div>

            {/* Top produits par ventes */}
            <div>
              <h3 className="font-black text-lg">Ventes par produit</h3>
              {!topProducts || topProducts.length === 0 ? (
                <p className="mt-4 text-sm text-neutral-500">Aucune vente enregistrée.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {topProducts.map((p, i) => (
                    <div key={p.id} className="card flex items-center gap-4 p-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm font-black">{i + 1}</span>
                      {p.image_url
                        ? <img src={p.image_url} alt={p.title} className="h-10 w-10 rounded-xl object-cover" />
                        : <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100">📦</div>
                      }
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

        {/* ════════════════════ ANALYSES ════════════════════ */}
        {tab === "analytics" && (
          <div className="space-y-6">
            {!plan.analytics ? (
              <div className="rounded-3xl border-2 border-dashed p-16 text-center">
                <p className="text-5xl">🔒</p>
                <p className="mt-4 text-xl font-black">Statistiques avancées</p>
                <p className="mt-2 text-neutral-500">Réservé aux vendeurs Business et Premium.</p>
                <Link href="?tab=subscription" className="btn-primary mt-6 inline-block">Voir les forfaits →</Link>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-black">Analyses & performances</h2>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: "CA ce mois",          value: `${monthRevenue.toLocaleString()} HTG`, color: "text-[var(--mache-primary)]" },
                    { label: "Commandes complétées", value: completedOrders,                        color: "" },
                    { label: "Produits actifs",      value: activeProducts ?? 0,                    color: "" },
                    { label: "Taux conversion",      value: `${totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0}%`, color: "" },
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

                <div>
                  <h3 className="font-black text-lg">Top produits</h3>
                  {!topProducts || topProducts.length === 0 ? (
                    <p className="mt-4 text-sm text-neutral-500">Aucune vente enregistrée.</p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {topProducts.map((p, i) => (
                        <div key={p.id} className="card flex items-center gap-4 p-4">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm font-black">{i + 1}</span>
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
              </>
            )}
          </div>
        )}

        {/* ════════════════════ PUBLICITÉ ════════════════════ */}
        {tab === "ads" && (
          <div className="space-y-6">
            {!plan.ads ? (
              <div className="rounded-3xl border-2 border-dashed p-16 text-center">
                <p className="text-5xl">📣</p>
                <p className="mt-4 text-xl font-black">Publicité sponsorisée</p>
                <p className="mt-2 text-neutral-500">
                  Cette fonctionnalité est réservée aux vendeurs Business et Premium.
                  <br />Passez à un abonnement supérieur pour sponsoriser vos produits.
                </p>
                <Link href="?tab=subscription" className="btn-primary mt-6 inline-block">Voir les forfaits →</Link>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-black">Publicité sponsorisée</h2>
                <p className="text-neutral-500">Boostez la visibilité de vos produits sur Maché.</p>
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { label: "Campagnes actives", value: "—", icon: "📣" },
                    { label: "Vues générées",     value: "—", icon: "👁️" },
                    { label: "Clics",             value: "—", icon: "🖱️" },
                  ].map((s) => (
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

        {/* ════════════════════ BOUTIQUE ════════════════════ */}
        {tab === "store" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black">Ma boutique</h2>
            {!store ? (
              <div className="rounded-3xl border-2 border-dashed p-12 text-center">
                <p className="text-4xl">🏪</p>
                <p className="mt-4 font-black">Aucune boutique créée</p>
                <p className="mt-2 text-sm text-neutral-500">Créez votre boutique publique pour vendre sur Maché.</p>
                <Link href="/dashboard/seller/store/create" className="btn-primary mt-6 inline-block">Créer ma boutique</Link>
              </div>
            ) : (
              <>
                <div className="card p-6">
                  <div className="flex items-start gap-4">
                    {store.logo_url
                      ? <img src={store.logo_url} alt={store.name} className="h-16 w-16 rounded-2xl object-cover" />
                      : <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 text-2xl">🏪</div>
                    }
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-black">{store.name}</h3>
                        {store.is_verified
                          ? <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-black text-green-700">✓ Vérifié</span>
                          : <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-black text-orange-700">⏳ En attente</span>
                        }
                        {profile.role === "official_brand" && (
                          <span className="rounded-full bg-yellow-50 px-2 py-0.5 text-xs font-black text-yellow-700">⭐ Officiel</span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-neutral-500">/store/{store.slug}</p>
                      {store.description && <p className="mt-2 text-sm text-neutral-600">{store.description}</p>}
                    </div>
                  </div>
                  <div className="mt-5 flex gap-3">
                    <Link href={`/store/${store.slug}`} target="_blank" className="btn-secondary text-sm">Voir la boutique →</Link>
                    <Link href="/dashboard/seller/store/edit" className="btn-primary text-sm">Modifier</Link>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { label: "Nom boutique",    value: store.name },
                    { label: "URL publique",    value: `/store/${store.slug}` },
                    { label: "Statut",          value: store.is_verified ? "Vérifié" : "En attente" },
                    { label: "Type de vendeur", value: roleLabel },
                  ].map((r) => (
                    <div key={r.label} className="card p-4">
                      <p className="text-xs font-black uppercase text-neutral-400">{r.label}</p>
                      <p className="mt-1 font-bold">{r.value}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ════════════════════ VÉRIFICATION ════════════════════ */}
        {tab === "verification" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black">Vérification du compte</h2>
            <div className={`rounded-3xl p-6 ${store?.is_verified ? "bg-green-50" : "bg-orange-50"}`}>
              <p className={`text-lg font-black ${store?.is_verified ? "text-green-700" : "text-orange-700"}`}>
                {store?.is_verified ? "✓ Compte vérifié" : "⏳ Vérification en attente"}
              </p>
              <p className={`mt-2 text-sm ${store?.is_verified ? "text-green-600" : "text-orange-600"}`}>
                {store?.is_verified
                  ? "Votre compte a été vérifié par l'équipe Maché. Vous bénéficiez de tous les avantages vendeur."
                  : "Soumettez vos documents pour obtenir le badge vérifié et accéder à toutes les fonctionnalités."}
              </p>
            </div>

            <div className="card p-6">
              <h3 className="font-black">Documents requis</h3>
              <div className="mt-4 space-y-3">
                {[
                  { doc: "Nom complet",          done: !!profile.full_name },
                  { doc: "Téléphone",            done: false },
                  { doc: "Adresse",              done: false },
                  { doc: "Nom boutique",         done: !!store?.name },
                  { doc: "Pièce d'identité",     done: false },
                  { doc: "Type de vendeur",      done: true },
                ].map((item) => (
                  <div key={item.doc} className="flex items-center gap-3">
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${item.done ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-400"}`}>
                      {item.done ? "✓" : "○"}
                    </span>
                    <span className={`text-sm ${item.done ? "font-medium text-neutral-700" : "text-neutral-400"}`}>{item.doc}</span>
                  </div>
                ))}
              </div>
              <Link href="/dashboard/seller/verification/submit" className="btn-primary mt-6 inline-block">
                Soumettre les documents
              </Link>
            </div>
          </div>
        )}

        {/* ════════════════════ FORFAIT ════════════════════ */}
        {tab === "subscription" && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-black">Changer de forfait</h2>
              <p className="mt-1 text-neutral-500">
                Plan actuel : <span className="font-black text-[var(--mache-primary)]">{plan.name}</span>
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {PLANS.map((p) => {
                const isCurrent = p.key === planKey;
                return (
                  <div key={p.key} className={`card relative flex flex-col p-6 ${p.highlight ? "border-2 border-[var(--mache-primary)] shadow-lg" : ""} ${isCurrent ? "ring-2 ring-green-400" : ""}`}>
                    {p.highlight && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--mache-primary)] px-4 py-1 text-xs font-black text-white">Recommandé</span>
                    )}
                    {isCurrent && (
                      <span className="absolute -top-3 right-4 rounded-full bg-green-500 px-3 py-1 text-xs font-black text-white">Actuel</span>
                    )}
                    <h3 className="text-xl font-black">{p.name}</h3>
                    <div className="mt-1 flex items-end gap-1">
                      <span className="text-2xl font-black text-[var(--mache-primary)]">{p.price}</span>
                      <span className="mb-0.5 text-sm text-neutral-400">{p.period}</span>
                    </div>
                    <div className="mt-4 flex-1 space-y-2">
                      {p.features.map((f) => (
                        <p key={f} className="flex items-start gap-2 text-sm"><span className="mt-0.5 text-green-500">✓</span>{f}</p>
                      ))}
                      {p.locked.map((f) => (
                        <p key={f} className="flex items-start gap-2 text-sm text-neutral-300"><span className="mt-0.5">✗</span>{f}</p>
                      ))}
                    </div>
                    <div className="mt-6">
                      {isCurrent ? (
                        <div className="w-full rounded-2xl bg-green-50 py-3 text-center text-sm font-black text-green-600">Plan actuel ✓</div>
                      ) : p.key === "premium" ? (
                        <Link href="/contact" className="block w-full rounded-2xl border-2 border-[var(--mache-primary)] py-3 text-center text-sm font-black text-[var(--mache-primary)] transition hover:bg-orange-50">
                          Nous contacter
                        </Link>
                      ) : (
                        <Link
                          href={`/dashboard/seller/subscription/checkout?plan=${p.key}`}
                          className={`block w-full rounded-2xl py-3 text-center text-sm font-black transition ${p.highlight ? "btn-primary" : "border-2 border-neutral-200 hover:border-[var(--mache-primary)] hover:text-[var(--mache-primary)]"}`}
                        >
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
              <div className="bg-neutral-50 p-5">
                <h3 className="font-black text-lg">Comparatif des fonctionnalités</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-t">
                    <th className="p-4 text-left font-black">Fonctionnalité</th>
                    {PLANS.map((p) => (
                      <th key={p.key} className={`p-4 text-center font-black ${p.key === planKey ? "text-[var(--mache-primary)]" : ""}`}>{p.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Produits max",          values: ["10", "50", "500", "∞"] },
                    { label: "Commandes",              values: ["✓", "✓", "✓", "✓"] },
                    { label: "Livraisons",             values: ["✓", "✓", "✓", "✓"] },
                    { label: "Publicité sponsorisée",  values: ["✗", "✗", "✓", "✓"] },
                    { label: "Statistiques avancées",  values: ["✗", "✗", "✓", "✓"] },
                    { label: "Factures PDF",           values: ["✗", "✗", "✓", "✓"] },
                    { label: "Employés",               values: ["✗", "✗", "✓", "✓"] },
                    { label: "Badge officiel",         values: ["✗", "✗", "✗", "✓"] },
                    { label: "Homepage mise en avant", values: ["✗", "✗", "✗", "✓"] },
                    { label: "Account manager",        values: ["✗", "✗", "✗", "✓"] },
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

        {/* ════════════════════ PARAMÈTRES ════════════════════ */}
        {tab === "settings" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black">Paramètres</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { title: "Profil vendeur",    text: "Modifier nom, email, téléphone.",     href: "/dashboard/seller/settings/profile",  icon: "👤" },
                { title: "Boutique",          text: "Nom, slug, logo, bannière.",           href: "/dashboard/seller/store/edit",        icon: "🏪" },
                { title: "Notifications",     text: "Alertes commandes, messages, ventes.", href: "/dashboard/seller/settings/notifs",   icon: "🔔" },
                { title: "Politique retour",  text: "Conditions de retour produits.",       href: "/dashboard/seller/settings/returns",  icon: "↩️" },
                { title: "Moyen de paiement", text: "RIB et réception des paiements.",      href: "/dashboard/seller/settings/payment",  icon: "💳" },
                { title: "Support",           text: "Contacter l'équipe Maché.",            href: "/contact",                            icon: "💬" },
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

        {/* Upgrade banner — vendeur particulier */}
        {profile.role === "seller_individual" && tab !== "subscription" && (
          <div className="mt-10 overflow-hidden rounded-3xl bg-gradient-to-r from-[#071f3d] to-[#d20a1e] p-8 text-white">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-white/60">Plan actuel : Gratuit</p>
                <h3 className="mt-2 text-2xl font-black">Passez au plan Business</h3>
                <p className="mt-2 text-sm text-white/70">Publicité, statistiques avancées, factures, 500 produits et plus.</p>
              </div>
              <Link href="?tab=subscription" className="btn-primary shrink-0">Voir les forfaits →</Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
