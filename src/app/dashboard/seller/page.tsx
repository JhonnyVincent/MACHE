/*
  PAGE : Vue globale du dashboard vendeur

  Fichier :
  src/app/dashboard/seller/page.tsx

  Sert à :
  - Vérifier que l'utilisateur connecté a bien un rôle vendeur
  - Agréger les chiffres de tous ses stores (produits, commandes, revenus)
  - Signaler les documents manquants et le stock faible
  - Donner accès à chaque store et aux sections transverses
*/

import { redirect } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  FileText,
  Globe,
  Landmark,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Megaphone,
  Package,
  Plus,
  Search,
  Settings,
  ShoppingCart,
  Store as StoreIcon,
  Truck,
  Wallet,
} from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSellerRole, type SellerRole } from "@/lib/authz";

const ROLE_LABELS: Record<SellerRole, string> = {
  seller_individual: "Vendeur particulier",
  seller_business: "Vendeur Business",
  supplier: "Fournisseur",
  official_brand: "Marque officielle",
};

type PlanLimits = {
  maxStores: number;
  maxArticlesPerStore: number;
  planName: string;
};

const PLAN_LIMITS: Record<SellerRole, PlanLimits> = {
  seller_individual: { maxStores: 1, maxArticlesPerStore: 50, planName: "Gratuit" },
  seller_business: { maxStores: 2, maxArticlesPerStore: 500, planName: "Business" },
  supplier: { maxStores: 3, maxArticlesPerStore: 2000, planName: "Fournisseur" },
  official_brand: { maxStores: 10, maxArticlesPerStore: 10000, planName: "Marque officielle" },
};

const DEFAULT_LIMITS: PlanLimits = {
  maxStores: 1,
  maxArticlesPerStore: 50,
  planName: "Gratuit",
};

const LOW_STOCK_THRESHOLD = 5;

const htgFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0,
});

function formatHTG(value: number) {
  return `${htgFormatter.format(Number(value) || 0)} HTG`;
}

function initialsOf(value: string, max = 2) {
  const cleaned = value.trim();

  if (!cleaned) return "?";

  return cleaned
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, max)
    .toUpperCase();
}

function startOfCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

export default async function SellerDashboardPage() {
  const supabase = await createSupabaseServerClient();

  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login?next=/dashboard/seller");
  }

  const uid = userData.user.id;

  // maybeSingle() : `single()` renvoie une erreur PGRST116 quand la ligne
  // users n'existe pas encore (compte créé mais profil non inséré), ce qui
  // masquait la vraie cause derrière un profil `null`.
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role, full_name, email, address_verified")
    .eq("id", uid)
    .maybeSingle();

  if (profileError) {
    console.error("[dashboard/seller] users:", profileError.message);
  }

  const role = String(profile?.role || "").trim();

  if (!profile) {
    redirect("/login?error=Profil%20introuvable.%20Reconnectez-vous.");
  }

  if (!isSellerRole(role)) {
    redirect(
      `/login?error=${encodeURIComponent(
        `Ce compte n'est pas un compte vendeur (rôle : ${role || "inconnu"}).`
      )}`
    );
  }

  const displayName = profile.full_name?.trim() || "Vendeur";
  const firstName = displayName.split(" ")[0];
  const roleLabel = ROLE_LABELS[role];
  const limits = PLAN_LIMITS[role] ?? DEFAULT_LIMITS;
  const planName = limits.planName;

  const { data: stores, error: storesError } = await supabase
    .from("stores")
    .select("id, slug, name, is_verified, logo_url, category, legal_doc_url, created_at")
    .eq("owner_id", uid)
    .order("created_at", { ascending: true });

  if (storesError) {
    console.error("[dashboard/seller] stores:", storesError.message);
  }

  const storeList = stores ?? [];
  const storeIds = storeList.map((store) => store.id);
  const storeCount = storeList.length;
  const storeLimitReached = storeCount >= limits.maxStores;

  /*
    Les commandes sont filtrées sur les stores du vendeur, et non sur une
    colonne `orders.seller_id` : cette colonne n'existe pas partout, et
    l'erreur PostgREST correspondante était ignorée — le dashboard
    affichait alors 0 commande et 0 HTG sans le moindre message.
    C'est aussi le filtre déjà utilisé par la page d'un store.
  */
  const ordersResult = storeIds.length
    ? await supabase
        .from("orders")
        .select("id, status, total_price, created_at, store_id")
        .in("store_id", storeIds)
        .order("created_at", { ascending: false })
        .limit(2000)
    : { data: [], error: null };

  if (ordersResult.error) {
    console.error("[dashboard/seller] orders:", ordersResult.error.message);
  }

  const allOrders = ordersResult.data ?? [];

  const totalOrders = allOrders.length;
  const pendingOrders = allOrders.filter((order) => order.status === "pending").length;

  const monthStart = startOfCurrentMonth();

  // La carte annonce « ce mois-ci » : on additionne bien le mois en cours,
  // et non la totalité de l'historique comme auparavant.
  const monthRevenue = allOrders
    .filter(
      (order) =>
        order.status === "completed" &&
        typeof order.created_at === "string" &&
        order.created_at >= monthStart
    )
    .reduce((sum, order) => sum + (order.total_price ?? 0), 0);

  const totalRevenue = allOrders
    .filter((order) => order.status === "completed")
    .reduce((sum, order) => sum + (order.total_price ?? 0), 0);

  /*
    Les compteurs produits partaient d'une boucle `await` séquentielle :
    2 allers-retours par store, exécutés l'un après l'autre. Ils sont
    maintenant lancés en parallèle. On garde `count: "exact"` plutôt que
    de ramener les lignes : au-delà de 1000 produits, la limite par défaut
    de PostgREST fausserait silencieusement les totaux.
  */
  const perStoreCounts = await Promise.all(
    storeList.map(async (store) => {
      const [products, lowStock] = await Promise.all([
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("store_id", store.id),
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("store_id", store.id)
          .lte("stock", LOW_STOCK_THRESHOLD),
      ]);

      if (products.error) {
        console.error("[dashboard/seller] products:", products.error.message);
      }

      return {
        storeId: store.id,
        products: products.count ?? 0,
        lowStock: lowStock.count ?? 0,
        error: products.error ?? lowStock.error ?? null,
      };
    })
  );

  const storeProductCounts: Record<string, number> = {};
  const storeLowStockCounts: Record<string, number> = {};
  const storeOrderCounts: Record<string, number> = {};
  const storeRevenues: Record<string, number> = {};

  for (const entry of perStoreCounts) {
    storeProductCounts[entry.storeId] = entry.products;
    storeLowStockCounts[entry.storeId] = entry.lowStock;
  }

  for (const store of storeList) {
    const storeOrders = allOrders.filter((order) => order.store_id === store.id);

    storeOrderCounts[store.id] = storeOrders.length;
    storeRevenues[store.id] = storeOrders
      .filter((order) => order.status === "completed")
      .reduce((sum, order) => sum + (order.total_price ?? 0), 0);
  }

  const totalProducts = Object.values(storeProductCounts).reduce((a, b) => a + b, 0);
  const lowStockCount = Object.values(storeLowStockCounts).reduce((a, b) => a + b, 0);

  const missingStoreDocs = storeList.filter((store) => !store.legal_doc_url).length;
  const missingGlobalDocs = profile.address_verified ? 0 : 1;
  const totalMissingDocs = missingGlobalDocs + missingStoreDocs;

  const sortedByRevenue = [...storeList].sort(
    (a, b) => (storeRevenues[b.id] ?? 0) - (storeRevenues[a.id] ?? 0)
  );

  const bestStore = sortedByRevenue[0];
  const worstStore =
    sortedByRevenue.length > 1 ? sortedByRevenue[sortedByRevenue.length - 1] : undefined;

  const dataError =
    storesError ||
    ordersResult.error ||
    perStoreCounts.find((entry) => entry.error)?.error ||
    null;

  async function signOutAction() {
    "use server";

    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  const navSections = [
    {
      label: "Principal",
      items: [
        { label: "Vue globale", href: "/dashboard/seller", icon: LayoutDashboard, active: true, badge: 0 },
        { label: "Mes stores", href: "/dashboard/seller/stores", icon: StoreIcon, active: false, badge: 0 },
      ],
    },
    {
      label: "Gestion",
      items: [
        { label: "Documents", href: "/dashboard/seller/documents", icon: FileText, active: false, badge: totalMissingDocs },
        { label: "Finances", href: "/dashboard/seller/finance", icon: Wallet, active: false, badge: 0 },
        { label: "Analyses", href: "/dashboard/seller/analytics", icon: BarChart3, active: false, badge: 0 },
        { label: "Commandes", href: "/dashboard/seller/orders", icon: ShoppingCart, active: false, badge: pendingOrders },
        { label: "Livraisons", href: "/dashboard/seller/deliveries", icon: Truck, active: false, badge: 0 },
      ],
    },
    {
      label: "Croissance",
      items: [
        { label: "Accompagnement", href: "/dashboard/seller/support", icon: LifeBuoy, active: false, badge: 0 },
        { label: "Financement", href: "/dashboard/seller/financing", icon: Landmark, active: false, badge: 0 },
        { label: "Partenaires", href: "/dashboard/seller/partners", icon: Globe, active: false, badge: 0 },
      ],
    },
    {
      label: "Compte",
      items: [
        { label: "Notifications", href: "/dashboard/seller/notifications", icon: Bell, active: false, badge: pendingOrders },
        { label: "Paramètres", href: "/dashboard/seller/settings", icon: Settings, active: false, badge: 0 },
      ],
    },
  ];

  const kpis = [
    {
      label: "Stores actifs",
      value: String(storeCount),
      hint: `sur ${limits.maxStores} inclus dans l'offre ${planName}`,
      icon: StoreIcon,
    },
    {
      label: "Produits en ligne",
      value: String(totalProducts),
      hint: "tous stores confondus",
      icon: Package,
    },
    {
      label: "Commandes",
      value: String(totalOrders),
      hint: pendingOrders > 0 ? `${pendingOrders} en attente de traitement` : "aucune en attente",
      icon: ShoppingCart,
    },
  ];

  return (
    <main className="flex h-screen overflow-hidden bg-navy-50 font-sans text-[13px] text-navy-900 antialiased">
      {/* ------------------------------------------------------------------ */}
      {/* SIDEBAR                                                            */}
      {/* ------------------------------------------------------------------ */}
      <aside
        data-chrome="dark"
        className="hidden w-[264px] shrink-0 flex-col border-r border-white/5 bg-ink text-white lg:flex"
      >
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-[15px] font-bold">
            M
          </div>
          <div className="leading-tight">
            <p className="text-[17px] font-bold tracking-[0.14em]">MACHE</p>
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/40">
              Espace vendeur
            </p>
          </div>
        </div>

        <div className="mx-4 flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-[13px] font-semibold">
            {initialsOf(displayName, 1)}
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[13px] font-semibold">{displayName}</p>
            <p className="truncate text-[11px] text-white/45">{roleLabel}</p>
          </div>
        </div>

        <nav className="scrollbar-slim mt-5 flex-1 overflow-y-auto px-3 pb-4">
          {navSections.map((section) => (
            <div key={section.label} className="mb-6 last:mb-0">
              <p className="px-3 pb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-white/30">
                {section.label}
              </p>

              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={item.active ? "page" : undefined}
                        className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors ${
                          item.active
                            ? "bg-brand text-white"
                            : "text-white/60 hover:bg-white/[0.06] hover:text-white"
                        }`}
                      >
                        <Icon
                          size={17}
                          strokeWidth={1.75}
                          className={item.active ? "text-white" : "text-white/45 group-hover:text-white/80"}
                        />
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge > 0 && (
                          <span
                            className={`tnum rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                              item.active ? "bg-white/20 text-white" : "bg-brand text-white"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="mx-4 mb-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
          <p className="text-[13px] font-semibold">Besoin d&apos;aide&nbsp;?</p>
          <p className="mt-1 text-[11px] leading-relaxed text-white/45">
            Un conseiller MACHE peut vous accompagner sur votre activité.
          </p>
          <Link
            href="/dashboard/seller/support"
            className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-[12px] font-medium text-white/85 transition-colors hover:bg-white/10"
          >
            <LifeBuoy size={14} strokeWidth={1.75} />
            Contacter un conseiller
          </Link>
        </div>

        <div className="border-t border-white/[0.07] px-4 py-3">
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-[12px] font-medium text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <LogOut size={14} strokeWidth={1.75} />
              Se déconnecter
            </button>
          </form>
        </div>
      </aside>

      {/* ------------------------------------------------------------------ */}
      {/* COLONNE PRINCIPALE                                                 */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header
          data-chrome="app"
          className="flex h-16 shrink-0 items-center gap-4 border-b border-navy-100 bg-white px-4 sm:px-6"
        >
          {/* Marque visible en mobile, où la sidebar est masquée. */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-[13px] font-bold text-white">
              M
            </div>
          </div>

          <h1 className="text-[15px] font-semibold tracking-[-0.01em] text-navy-900">
            Vue globale
          </h1>

          <div className="ml-2 hidden max-w-[420px] flex-1 items-center gap-2 rounded-lg border border-navy-100 bg-navy-50/60 px-3 py-2 text-navy-400 md:flex">
            <Search size={15} strokeWidth={1.75} />
            <span className="text-[12px]">Rechercher un store, un produit, une commande…</span>
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <Link
              href="/dashboard/seller/notifications"
              aria-label={`Notifications${pendingOrders > 0 ? ` (${pendingOrders})` : ""}`}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-navy-100 text-navy-500 transition-colors hover:bg-navy-50"
            >
              <Bell size={16} strokeWidth={1.75} />
              {pendingOrders > 0 && (
                <span className="tnum absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[9px] font-semibold text-white">
                  {pendingOrders > 9 ? "9+" : pendingOrders}
                </span>
              )}
            </Link>

            <div className="hidden items-center gap-2.5 border-l border-navy-100 pl-3 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-[12px] font-semibold text-white">
                {initialsOf(displayName, 1)}
              </div>
              <div className="leading-tight">
                <p className="text-[12.5px] font-semibold text-navy-900">{firstName}</p>
                <p className="text-[11px] text-navy-400">Offre {planName}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation mobile : la sidebar est masquée sous 1024px. */}
        <div className="scrollbar-slim flex shrink-0 gap-2 overflow-x-auto border-b border-navy-100 bg-white px-4 py-2 lg:hidden">
          {navSections
            .flatMap((section) => section.items)
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  item.active
                    ? "bg-ink text-white"
                    : "bg-navy-50 text-navy-600 hover:bg-navy-100"
                }`}
              >
                {item.label}
                {item.badge > 0 && <span className="tnum ml-1.5 text-brand">{item.badge}</span>}
              </Link>
            ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1400px] space-y-6 p-4 sm:p-6">
            {dataError && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
              >
                <AlertTriangle size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-amber-600" />
                <div>
                  <p className="text-[13px] font-semibold text-amber-900">
                    Certaines données n&apos;ont pas pu être chargées
                  </p>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-amber-800">
                    Les totaux affichés sont peut-être incomplets. Détail&nbsp;:{" "}
                    <span className="font-medium">{dataError.message}</span>
                  </p>
                </div>
              </div>
            )}

            {/* ---------------------------------------------------------- */}
            {/* EN-TÊTE + KPI                                              */}
            {/* ---------------------------------------------------------- */}
            <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="rounded-2xl border border-navy-100 bg-white p-5 shadow-card sm:p-6">
                <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-navy-900 sm:text-[26px]">
                  Bonjour, {firstName}
                </h2>
                <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-navy-500">
                  Voici l&apos;état de votre activité sur MACHE aujourd&apos;hui.
                </p>

                <dl className="mt-6 grid gap-px overflow-hidden rounded-xl border border-navy-100 bg-navy-100 sm:grid-cols-3">
                  {kpis.map((kpi) => {
                    const Icon = kpi.icon;

                    return (
                      <div key={kpi.label} className="bg-white p-4">
                        <div className="flex items-center gap-2 text-navy-400">
                          <Icon size={15} strokeWidth={1.75} />
                          <dt className="text-[11px] font-medium uppercase tracking-[0.08em]">
                            {kpi.label}
                          </dt>
                        </div>
                        <dd className="tnum mt-2.5 text-[28px] font-semibold leading-none tracking-[-0.02em] text-navy-900">
                          {kpi.value}
                        </dd>
                        <p className="mt-1.5 text-[11.5px] leading-relaxed text-navy-400">
                          {kpi.hint}
                        </p>
                      </div>
                    );
                  })}
                </dl>
              </div>

              <div className="relative overflow-hidden rounded-2xl bg-ink p-5 text-white shadow-card sm:p-6">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand/20 blur-2xl"
                />

                <div className="relative">
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/40">
                    Revenus encaissés
                  </p>
                  <p className="tnum mt-3 text-[30px] font-semibold leading-none tracking-[-0.02em]">
                    {formatHTG(monthRevenue)}
                  </p>
                  <p className="mt-2 text-[12px] text-white/45">Mois en cours</p>

                  <div className="mt-5 space-y-2 border-t border-white/10 pt-4 text-[12px]">
                    <div className="flex items-center justify-between">
                      <span className="text-white/45">Total encaissé</span>
                      <span className="tnum font-medium">{formatHTG(totalRevenue)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/45">Commandes à traiter</span>
                      <span className="tnum font-medium">{pendingOrders}</span>
                    </div>
                  </div>

                  <Link
                    href="/dashboard/seller/finance"
                    className="mt-5 flex items-center justify-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-[12.5px] font-medium text-white transition-colors hover:bg-brand-strong"
                  >
                    Voir le rapport détaillé
                    <ArrowRight size={14} strokeWidth={2} />
                  </Link>
                </div>
              </div>
            </section>

            {/* ---------------------------------------------------------- */}
            {/* STORES                                                     */}
            {/* ---------------------------------------------------------- */}
            <section>
              <div className="mb-3 flex items-baseline justify-between gap-4">
                <div>
                  <h3 className="text-[16px] font-semibold tracking-[-0.01em] text-navy-900">
                    Mes stores
                  </h3>
                  <p className="mt-0.5 text-[12px] text-navy-400">
                    <span className="tnum">{storeCount}</span> sur{" "}
                    <span className="tnum">{limits.maxStores}</span> autorisés par votre offre
                  </p>
                </div>

                <Link
                  href="/dashboard/seller/stores"
                  className="flex shrink-0 items-center gap-1 text-[12.5px] font-medium text-brand transition-opacity hover:opacity-75"
                >
                  Tout voir
                  <ArrowRight size={14} strokeWidth={2} />
                </Link>
              </div>

              {storeCount === 0 && (
                <div className="rounded-2xl border border-navy-100 bg-white p-10 text-center shadow-card">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-navy-50 text-navy-400">
                    <StoreIcon size={22} strokeWidth={1.5} />
                  </div>
                  <p className="mt-4 text-[15px] font-semibold text-navy-900">
                    Vous n&apos;avez pas encore de store
                  </p>
                  <p className="mx-auto mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-navy-500">
                    Créez votre première boutique pour publier vos produits et
                    recevoir vos premières commandes.
                  </p>
                  <Link
                    href="/dashboard/seller/stores/new"
                    className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2.5 text-[12.5px] font-medium text-white transition-colors hover:bg-ink-soft"
                  >
                    <Plus size={15} strokeWidth={2} />
                    Créer mon premier store
                  </Link>
                </div>
              )}

              {storeCount > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {storeList.map((store) => {
                    const revenue = storeRevenues[store.id] ?? 0;
                    const orders = storeOrderCounts[store.id] ?? 0;
                    const lowStock = storeLowStockCounts[store.id] ?? 0;
                    const products = storeProductCounts[store.id] ?? 0;
                    const storeName = store.name?.trim() || "Store sans nom";

                    return (
                      <article
                        key={store.id}
                        className="group flex flex-col overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-card transition-shadow hover:shadow-card-hover"
                      >
                        <div className="relative h-20 bg-gradient-to-br from-navy-900 via-navy-800 to-brand-strong">
                          <div className="absolute -bottom-6 left-5 flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border-[3px] border-white bg-navy-800 text-[15px] font-semibold text-white shadow-sm">
                            {store.logo_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={store.logo_url}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              initialsOf(storeName)
                            )}
                          </div>

                          <span
                            className={`absolute right-3 top-3 rounded-full px-2 py-1 text-[10px] font-medium ${
                              store.is_verified
                                ? "bg-emerald-500/15 text-emerald-100 ring-1 ring-inset ring-emerald-400/30"
                                : "bg-amber-500/15 text-amber-100 ring-1 ring-inset ring-amber-400/30"
                            }`}
                          >
                            {store.is_verified ? "Vérifié" : "En attente"}
                          </span>
                        </div>

                        <div className="flex flex-1 flex-col p-5 pt-8">
                          <h4 className="truncate text-[15px] font-semibold tracking-[-0.01em] text-navy-900">
                            {storeName}
                          </h4>
                          <p className="mt-0.5 truncate text-[11.5px] text-navy-400">
                            mache.ht/store/{store.slug}
                          </p>

                          <dl className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-navy-100 bg-navy-100">
                            <div className="bg-white px-2 py-2.5 text-center">
                              <dt className="text-[10px] font-medium uppercase tracking-[0.06em] text-navy-400">
                                Ventes
                              </dt>
                              <dd className="tnum mt-1 text-[12px] font-semibold text-navy-900">
                                {htgFormatter.format(revenue)}
                              </dd>
                            </div>
                            <div className="bg-white px-2 py-2.5 text-center">
                              <dt className="text-[10px] font-medium uppercase tracking-[0.06em] text-navy-400">
                                Cmd.
                              </dt>
                              <dd className="tnum mt-1 text-[12px] font-semibold text-navy-900">
                                {orders}
                              </dd>
                            </div>
                            <div className="bg-white px-2 py-2.5 text-center">
                              <dt className="text-[10px] font-medium uppercase tracking-[0.06em] text-navy-400">
                                Stock bas
                              </dt>
                              <dd
                                className={`tnum mt-1 text-[12px] font-semibold ${
                                  lowStock > 0 ? "text-amber-600" : "text-navy-900"
                                }`}
                              >
                                {lowStock}
                              </dd>
                            </div>
                          </dl>

                          <p className="mt-3 text-[11.5px] text-navy-400">
                            <span className="tnum">{products}</span> produit
                            {products > 1 ? "s" : ""} sur{" "}
                            <span className="tnum">{limits.maxArticlesPerStore}</span> autorisés
                          </p>

                          <div className="mt-auto flex gap-2 pt-4">
                            <Link
                              href={`/dashboard/seller/stores/${store.id}`}
                              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-ink px-3 py-2.5 text-[12.5px] font-medium text-white transition-colors hover:bg-ink-soft"
                            >
                              Ouvrir
                              <ArrowUpRight size={14} strokeWidth={2} />
                            </Link>
                            <Link
                              href={`/dashboard/seller/stores/${store.id}/settings`}
                              aria-label={`Paramètres de ${storeName}`}
                              className="flex items-center justify-center rounded-lg border border-navy-100 px-3 text-navy-500 transition-colors hover:bg-navy-50"
                            >
                              <Settings size={15} strokeWidth={1.75} />
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}

                  {!storeLimitReached && (
                    <Link
                      href="/dashboard/seller/stores/new"
                      className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-navy-200 bg-white/50 p-6 text-center transition-colors hover:border-brand hover:bg-brand-soft/40"
                    >
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-50 text-navy-400">
                        <Plus size={20} strokeWidth={2} />
                      </span>
                      <span className="mt-4 text-[14px] font-semibold text-navy-900">
                        Ajouter un store
                      </span>
                      <span className="mt-1.5 max-w-[200px] text-[12px] leading-relaxed text-navy-400">
                        Il vous reste{" "}
                        <span className="tnum">{limits.maxStores - storeCount}</span> emplacement
                        {limits.maxStores - storeCount > 1 ? "s" : ""} disponible
                        {limits.maxStores - storeCount > 1 ? "s" : ""}.
                      </span>
                    </Link>
                  )}
                </div>
              )}
            </section>

            {/* ---------------------------------------------------------- */}
            {/* CONFORMITÉ & ALERTES                                       */}
            {/* ---------------------------------------------------------- */}
            <section className="grid gap-4 xl:grid-cols-3">
              <div className="rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-[14px] font-semibold text-navy-900">
                    Documents personnels
                  </h3>
                  {missingGlobalDocs > 0 && (
                    <span className="tnum rounded-full bg-brand-soft px-2 py-1 text-[10px] font-medium text-brand-strong">
                      {missingGlobalDocs} à compléter
                    </span>
                  )}
                </div>

                <ul className="mt-3 divide-y divide-navy-100">
                  {[
                    { label: "Pièce d'identité", ok: true },
                    { label: "Adresse personnelle", ok: Boolean(profile.address_verified) },
                    { label: "Contrat marketplace MACHE", ok: true },
                  ].map((doc) => (
                    <li key={doc.label} className="flex items-center justify-between py-3">
                      <span className="text-[12.5px] text-navy-700">{doc.label}</span>
                      <span
                        className={`text-[11.5px] font-medium ${
                          doc.ok ? "text-emerald-600" : "text-amber-600"
                        }`}
                      >
                        {doc.ok ? "Validé" : "À vérifier"}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/dashboard/seller/documents"
                  className="mt-3 flex items-center gap-1 text-[12.5px] font-medium text-brand transition-opacity hover:opacity-75"
                >
                  Gérer mes documents
                  <ArrowRight size={14} strokeWidth={2} />
                </Link>
              </div>

              <div className="rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-[14px] font-semibold text-navy-900">Documents par store</h3>
                  {missingStoreDocs > 0 && (
                    <span className="tnum rounded-full bg-brand-soft px-2 py-1 text-[10px] font-medium text-brand-strong">
                      {missingStoreDocs} à compléter
                    </span>
                  )}
                </div>

                {storeCount === 0 ? (
                  <p className="mt-4 text-[12.5px] leading-relaxed text-navy-400">
                    Aucun store pour le moment.
                  </p>
                ) : (
                  <ul className="mt-3 divide-y divide-navy-100">
                    {storeList.slice(0, 4).map((store) => {
                      const completed = store.legal_doc_url ? 4 : 2;
                      const total = 5;
                      const percent = Math.round((completed / total) * 100);

                      return (
                        <li key={store.id} className="py-3">
                          <div className="flex items-center justify-between gap-3">
                            <span className="truncate text-[12.5px] font-medium text-navy-800">
                              {store.name?.trim() || "Store sans nom"}
                            </span>
                            <span className="tnum shrink-0 text-[11.5px] text-navy-400">
                              {completed}/{total}
                            </span>
                          </div>

                          <div
                            role="progressbar"
                            aria-valuenow={percent}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            className="mt-2 h-1.5 overflow-hidden rounded-full bg-navy-100"
                          >
                            <div
                              className={`h-full rounded-full ${
                                percent >= 70 ? "bg-emerald-500" : "bg-amber-500"
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}

                <Link
                  href="/dashboard/seller/documents"
                  className="mt-3 flex items-center gap-1 text-[12.5px] font-medium text-brand transition-opacity hover:opacity-75"
                >
                  Documents par store
                  <ArrowRight size={14} strokeWidth={2} />
                </Link>
              </div>

              <div className="rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
                <h3 className="text-[14px] font-semibold text-navy-900">Points d&apos;attention</h3>

                <ul className="mt-3 divide-y divide-navy-100">
                  {[
                    {
                      count: lowStockCount,
                      title: "produits en stock faible",
                      hint: `Seuil d'alerte : ${LOW_STOCK_THRESHOLD} unités`,
                      href: "/dashboard/seller/stores",
                    },
                    {
                      count: missingStoreDocs,
                      title: "documents de store manquants",
                      hint: "Bloque la vérification de la boutique",
                      href: "/dashboard/seller/documents",
                    },
                    {
                      count: pendingOrders,
                      title: "commandes en attente",
                      hint: "À traiter rapidement",
                      href: "/dashboard/seller/orders",
                    },
                  ].map((alert) => (
                    <li key={alert.title}>
                      <Link
                        href={alert.href}
                        className="-mx-2 flex items-start gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-navy-50"
                      >
                        <span
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            alert.count > 0
                              ? "bg-amber-50 text-amber-600"
                              : "bg-navy-50 text-navy-300"
                          }`}
                        >
                          <AlertTriangle size={15} strokeWidth={1.75} />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[12.5px] font-medium text-navy-900">
                            <span className="tnum">{alert.count}</span> {alert.title}
                          </span>
                          <span className="mt-0.5 block text-[11.5px] text-navy-400">
                            {alert.hint}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* ---------------------------------------------------------- */}
            {/* ANALYSE & CROISSANCE                                       */}
            {/* ---------------------------------------------------------- */}
            <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr_1fr]">
              <div className="rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
                <h3 className="text-[14px] font-semibold text-navy-900">
                  Analyse globale de vos stores
                </h3>

                <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl border border-navy-100 p-3.5">
                    <dt className="text-[11px] font-medium uppercase tracking-[0.06em] text-navy-400">
                      Chiffre d&apos;affaires
                    </dt>
                    <dd className="tnum mt-2 text-[17px] font-semibold tracking-[-0.01em] text-navy-900">
                      {htgFormatter.format(totalRevenue)}
                    </dd>
                    <p className="mt-0.5 text-[11px] text-navy-400">HTG encaissés</p>
                  </div>

                  <div className="rounded-xl border border-navy-100 p-3.5">
                    <dt className="text-[11px] font-medium uppercase tracking-[0.06em] text-navy-400">
                      Store le plus fort
                    </dt>
                    <dd className="mt-2 truncate text-[14px] font-semibold text-navy-900">
                      {bestStore?.name?.trim() || "—"}
                    </dd>
                    <p className="tnum mt-0.5 text-[11px] text-navy-400">
                      {bestStore ? htgFormatter.format(storeRevenues[bestStore.id] ?? 0) : "0"} HTG
                    </p>
                  </div>

                  <div className="rounded-xl border border-navy-100 p-3.5">
                    <dt className="text-[11px] font-medium uppercase tracking-[0.06em] text-navy-400">
                      À surveiller
                    </dt>
                    <dd className="mt-2 truncate text-[14px] font-semibold text-navy-900">
                      {worstStore?.name?.trim() || "—"}
                    </dd>
                    <p className="tnum mt-0.5 text-[11px] text-navy-400">
                      {worstStore ? htgFormatter.format(storeRevenues[worstStore.id] ?? 0) : "0"} HTG
                    </p>
                  </div>

                  <div className="rounded-xl border border-navy-100 p-3.5">
                    <dt className="text-[11px] font-medium uppercase tracking-[0.06em] text-navy-400">
                      Stock critique
                    </dt>
                    <dd
                      className={`tnum mt-2 text-[17px] font-semibold tracking-[-0.01em] ${
                        lowStockCount > 0 ? "text-amber-600" : "text-navy-900"
                      }`}
                    >
                      {lowStockCount}
                    </dd>
                    <p className="mt-0.5 text-[11px] text-navy-400">produits concernés</p>
                  </div>
                </dl>

                <Link
                  href="/dashboard/seller/analytics"
                  className="mt-4 flex items-center gap-1 text-[12.5px] font-medium text-brand transition-opacity hover:opacity-75"
                >
                  Ouvrir les analyses détaillées
                  <ArrowRight size={14} strokeWidth={2} />
                </Link>
              </div>

              <div className="rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
                <h3 className="text-[14px] font-semibold text-navy-900">Accompagnement</h3>

                <ul className="mt-2 divide-y divide-navy-100">
                  {[
                    { title: "Centre d'aide", text: "Guides, vidéos et conseils" },
                    { title: "Formation vendeur", text: "Apprendre à booster vos ventes" },
                    { title: "Assistance vocale", text: "Écouter et gérer plus facilement" },
                  ].map((item) => (
                    <li key={item.title}>
                      <Link
                        href="/dashboard/seller/support"
                        className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-navy-50"
                      >
                        <span className="min-w-0">
                          <span className="block text-[12.5px] font-medium text-navy-900">
                            {item.title}
                          </span>
                          <span className="mt-0.5 block truncate text-[11.5px] text-navy-400">
                            {item.text}
                          </span>
                        </span>
                        <ArrowRight
                          size={14}
                          strokeWidth={2}
                          className="shrink-0 text-navy-300"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
                <h3 className="text-[14px] font-semibold text-navy-900">
                  Financement &amp; croissance
                </h3>
                <p className="mt-1.5 text-[12px] leading-relaxed text-navy-500">
                  Développez votre activité avec nos partenaires financiers et logistiques.
                </p>

                <ul className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    { icon: Landmark, label: "Fonds" },
                    { icon: Package, label: "Stock" },
                    { icon: Megaphone, label: "Publicité" },
                  ].map((item) => {
                    const Icon = item.icon;

                    return (
                      <li
                        key={item.label}
                        className="flex flex-col items-center gap-1.5 rounded-xl border border-navy-100 py-3 text-navy-600"
                      >
                        <Icon size={17} strokeWidth={1.75} className="text-navy-400" />
                        <span className="text-[11px] font-medium">{item.label}</span>
                      </li>
                    );
                  })}
                </ul>

                <Link
                  href="/dashboard/seller/financing"
                  className="mt-5 flex items-center justify-center gap-1.5 rounded-lg bg-ink px-4 py-2.5 text-[12.5px] font-medium text-white transition-colors hover:bg-ink-soft"
                >
                  Voir les offres
                  <ArrowRight size={14} strokeWidth={2} />
                </Link>
              </div>
            </section>

            {/* ---------------------------------------------------------- */}
            {/* BANDEAU CONSEILLER                                         */}
            {/* ---------------------------------------------------------- */}
            <section className="overflow-hidden rounded-2xl bg-navy-900 px-5 py-6 text-white sm:px-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="max-w-xl">
                  <h3 className="text-[18px] font-semibold tracking-[-0.01em]">
                    Besoin d&apos;un accompagnement personnalisé&nbsp;?
                  </h3>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/55">
                    Nos experts MACHE analysent votre activité et vous aident à
                    faire grandir votre business, gratuitement.
                  </p>
                </div>

                <Link
                  href="/dashboard/seller/support"
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-brand px-5 py-2.5 text-[12.5px] font-medium text-white transition-colors hover:bg-brand-strong"
                >
                  Parler à un conseiller
                  <ArrowRight size={14} strokeWidth={2} />
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
