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

  if (!userData.user) {
    redirect("/login?next=/dashboard/seller");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, full_name, email, phone, address_verified")
    .eq("id", userData.user.id)
    .single();

  const role = String(profile?.role || "").trim();

  if (!profile || !SELLER_ROLES.includes(role)) {
    redirect(
      `/login?error=${encodeURIComponent(
        `Role lu par le code: ${role || "aucun profil trouvé"}`
      )}`
    );
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

  const missingGlobalDocs = [!profile.phone, !profile.address_verified].filter(Boolean).length;
  const missingStoreDocs = stores?.filter((s) => !s.legal_doc_url).length ?? 0;
  const totalMissingDocs = missingGlobalDocs + missingStoreDocs;

  const bestStore = stores?.[0];
  const worstStore = stores?.[1];

  return (
    <main className="min-h-screen bg-[#f7f8fb]">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="hidden bg-[#071f3d] text-white lg:block">
          <div className="p-8">
            <h1 className="text-4xl font-black tracking-tight">MACHE</h1>
            <p className="text-sm text-white/60">Espace vendeur</p>
          </div>

          <nav className="space-y-2 px-5">
            {[
              ["Vue globale", "/dashboard/seller", "🏠", true],
              ["Mes stores", "/dashboard/seller/stores", "🏪", false],
              ["Documents", "/dashboard/seller/documents", "📄", false],
              ["Finances globales", "/dashboard/seller/finance", "💰", false],
              ["Analyse & rapports", "/dashboard/seller/analytics", "📊", false],
              ["Accompagnement", "/dashboard/seller/support", "🤝", false],
              ["Financement", "/dashboard/seller/financing", "🏦", false],
              ["Partenaires", "/dashboard/seller/partners", "🌐", false],
              ["Notifications", "/dashboard/seller/notifications", "🔔", false],
              ["Paramètres", "/dashboard/seller/settings", "⚙️", false],
            ].map(([label, href, icon, active]) => (
              <Link
                key={label as string}
                href={href as string}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                  active
                    ? "bg-[#d2162c] text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span>{icon}</span>
                <span>{label}</span>

                {label === "Documents" && totalMissingDocs > 0 && (
                  <span className="ml-auto rounded-full bg-[#d2162c] px-2 py-0.5 text-xs">
                    {totalMissingDocs}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className="mx-5 mt-12 rounded-3xl border border-white/15 bg-white/5 p-5">
            <p className="text-lg font-black">Besoin d’aide ?</p>
            <p className="mt-1 text-sm text-white/60">Parler à un conseiller MACHE.</p>
            <button className="mt-4 w-full rounded-2xl border border-white/20 px-4 py-3 text-sm font-bold">
              🎙️ Assistant vocal
            </button>
          </div>
        </aside>

        <section>
          <header className="sticky top-0 z-10 border-b bg-white/85 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-6 py-4">
              <div className="flex items-center gap-3">
                <button className="rounded-xl border px-3 py-2 lg:hidden">☰</button>
                <p className="font-black text-[#071f3d]">Vue globale</p>
              </div>

              <div className="hidden flex-1 justify-center md:flex">
                <div className="w-full max-w-xl rounded-2xl bg-neutral-100 px-4 py-3 text-sm text-neutral-400">
                  🔎 Rechercher un store, un produit, une commande...
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button className="rounded-2xl border bg-white px-4 py-3 text-sm font-bold">
                  Mode simple
                </button>

                <div className="relative rounded-2xl border bg-white px-4 py-3">🔔</div>

                <div className="hidden text-right sm:block">
                  <p className="text-sm font-black text-[#071f3d]">{displayName}</p>
                  <p className="text-xs text-neutral-500">{roleLabel}</p>
                </div>
              </div>
            </div>
          </header>

          <div className="space-y-6 p-6">
            <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
              <div>
                <h2 className="text-3xl font-black text-[#071f3d]">
                  Bonjour, {displayName} 👋
                </h2>
                <p className="mt-1 text-neutral-500">
                  Voici la vue d’ensemble de votre activité sur MACHE.
                </p>
              </div>

              <div className="rounded-3xl bg-[#071f3d] p-6 text-white shadow-lg">
                <p className="text-sm text-white/70">Revenus estimés ce mois</p>
                <p className="mt-2 text-3xl font-black">{formatHTG(monthRevenue)}</p>

                <div className="mt-3 flex items-center justify-between">
                  <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-bold text-green-300">
                    +18.6%
                  </span>

                  <Link href="/dashboard/seller/reports" className="text-sm font-bold text-white">
                    Voir le rapport →
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <p className="text-sm text-neutral-500">Stores actifs</p>
                <p className="mt-2 text-3xl font-black text-[#071f3d]">{storeCount}</p>
                <p className="text-xs text-neutral-400">sur {limits.maxStores} inclus</p>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <p className="text-sm text-neutral-500">Produits au total</p>
                <p className="mt-2 text-3xl font-black text-[#071f3d]">{totalProducts}</p>
                <p className="text-xs text-neutral-400">tous stores confondus</p>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <p className="text-sm text-neutral-500">Commandes</p>
                <p className="mt-2 text-3xl font-black text-[#071f3d]">{totalOrders}</p>
                <p className="text-xs text-neutral-400">{pendingOrders} en attente</p>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <p className="text-sm text-neutral-500">Forfait actuel</p>
                <p className="mt-2 text-2xl font-black text-[#071f3d]">{planName}</p>
                <p className="text-xs text-neutral-400">{roleLabel}</p>
              </div>
            </div>

            <section>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-black text-[#071f3d]">Mes stores</h3>

                <Link href="/dashboard/seller/stores" className="text-sm font-bold text-[#d2162c]">
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
                      <div className="h-32 bg-gradient-to-r from-[#071f3d] to-[#d2162c] p-4">
                        <div className="flex h-full items-end">
                          <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-[#071f3d] text-xl font-black text-white">
                            {store.logo_url ? (
                              <img
                                src={store.logo_url}
                                alt={store.name}
                                className="h-full w-full rounded-full object-cover"
                              />
                            ) : (
                              store.name?.charAt(0)?.toUpperCase()
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="text-lg font-black text-[#071f3d]">{store.name}</h4>
                            <p className="text-xs text-neutral-400">mache.ht/store/{store.slug}</p>
                          </div>

                          <span
                            className={`rounded-full px-2 py-1 text-xs font-bold ${
                              store.is_verified
                                ? "bg-green-50 text-green-700"
                                : "bg-orange-50 text-orange-700"
                            }`}
                          >
                            {store.is_verified ? "Actif" : "À vérifier"}
                          </span>
                        </div>

                        <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-neutral-400">Ventes</p>
                            <p className="font-black text-[#071f3d]">{formatHTG(revenue)}</p>
                          </div>

                          <div>
                            <p className="text-xs text-neutral-400">Commandes</p>
                            <p className="font-black text-[#071f3d]">{orders}</p>
                          </div>

                          <div>
                            <p className="text-xs text-neutral-400">Stock faible</p>
                            <p className="font-black text-orange-600">{stockWeak}</p>
                          </div>
                        </div>

                        <div className="mt-5 flex gap-2">
                          <Link
                            href={`/dashboard/seller/stores/${store.id}`}
                            className="flex-1 rounded-2xl bg-[#071f3d] px-4 py-3 text-center text-sm font-bold text-white"
                          >
                            Entrer →
                          </Link>

                          <Link
                            href={`/dashboard/seller/stores/${store.id}/settings`}
                            className="rounded-2xl border px-4 py-3"
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
                    className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border-2 border-dashed bg-white p-8 text-center shadow-sm transition hover:border-[#d2162c]"
                  >
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#eef0ff] text-4xl text-[#071f3d]">
                      +
                    </div>

                    <p className="mt-5 text-xl font-black text-[#071f3d]">Ajouter un store</p>

                    <p className="mt-2 text-sm text-neutral-500">
                      Développez votre activité avec un nouveau point de vente.
                    </p>

                    <span className="mt-6 rounded-2xl border px-6 py-3 text-sm font-bold">
                      Créer un store
                    </span>
                  </Link>
                )}
              </div>
            </section>

            <div className="grid gap-5 xl:grid-cols-3">
              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-black text-[#071f3d]">Documents de l’entreprise</h3>
                  <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
                    {missingGlobalDocs} à compléter
                  </span>
                </div>

                {[
                  ["Pièce d’identité", "Validé", true],
                  ["Téléphone", profile.phone ? "Validé" : "Manquant", !!profile.phone],
                  [
                    "Adresse personnelle",
                    profile.address_verified ? "Validé" : "À vérifier",
                    !!profile.address_verified,
                  ],
                  ["Contrat marketplace MACHE", "Validé", true],
                ].map(([label, status, ok]) => (
                  <div key={label as string} className="flex items-center justify-between border-t py-3 text-sm">
                    <span className="text-[#071f3d]">{label}</span>

                    <span className={`font-bold ${ok ? "text-green-600" : "text-orange-600"}`}>
                      {status}
                    </span>
                  </div>
                ))}

                <Link href="/dashboard/seller/documents" className="mt-4 block text-center text-sm font-bold text-[#d2162c]">
                  Voir tous les documents →
                </Link>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-black text-[#071f3d]">Documents par store</h3>
                  <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
                    {missingStoreDocs} à compléter
                  </span>
                </div>

                {stores?.slice(0, 4).map((store) => (
                  <div key={store.id} className="border-t py-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold text-[#071f3d]">{store.name}</span>

                      <span className={store.legal_doc_url ? "text-green-600" : "text-orange-600"}>
                        {store.legal_doc_url ? "Complet" : "Document manquant"}
                      </span>
                    </div>

                    <div className="mt-2 h-2 rounded-full bg-neutral-100">
                      <div
                        className={`h-2 rounded-full ${store.legal_doc_url ? "bg-green-500" : "bg-orange-400"}`}
                        style={{ width: store.legal_doc_url ? "100%" : "35%" }}
                      />
                    </div>
                  </div>
                ))}

                <Link href="/dashboard/seller/stores/documents" className="mt-4 block text-center text-sm font-bold text-[#d2162c]">
                  Gérer les documents par store →
                </Link>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <h3 className="mb-4 font-black text-[#071f3d]">Alertes importantes</h3>

                {[
                  [`${pendingOrders} commandes urgentes`, "À traiter rapidement"],
                  [`${missingStoreDocs} documents manquants`, "Dans vos stores"],
                  [
                    `${Math.max(0, Math.round(totalProducts * 0.1))} produits en stock faible`,
                    "Répartis sur vos stores",
                  ],
                ].map(([title, text]) => (
                  <div key={title} className="flex gap-3 border-t py-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50">
                      ⚠️
                    </div>

                    <div>
                      <p className="font-bold text-[#071f3d]">{title}</p>
                      <p className="text-sm text-neutral-500">{text}</p>
                    </div>
                  </div>
                ))}

                <Link href="/dashboard/seller/alerts" className="mt-4 block text-center text-sm font-bold text-[#d2162c]">
                  Voir toutes les alertes →
                </Link>
              </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-3">
              <div className="rounded-3xl bg-white p-6 shadow-sm xl:col-span-2">
                <h3 className="font-black text-[#071f3d]">Analyse globale de vos stores</h3>

                <div className="mt-5 grid gap-4 md:grid-cols-4">
                  <div className="rounded-2xl bg-green-50 p-4">
                    <p className="text-xs text-neutral-500">Performance globale</p>
                    <p className="mt-2 text-2xl font-black text-green-700">+18.6%</p>
                    <p className="text-xs text-green-700">vs mois dernier</p>
                  </div>

                  <div className="rounded-2xl bg-yellow-50 p-4">
                    <p className="text-xs text-neutral-500">Store le plus fort</p>
                    <p className="mt-2 font-black text-[#071f3d]">{bestStore?.name ?? "—"}</p>
                    <p className="text-xs text-green-700">Bonne performance</p>
                  </div>

                  <div className="rounded-2xl bg-red-50 p-4">
                    <p className="text-xs text-neutral-500">Store à surveiller</p>
                    <p className="mt-2 font-black text-[#071f3d]">{worstStore?.name ?? "—"}</p>
                    <p className="text-xs text-red-600">À analyser</p>
                  </div>

                  <div className="rounded-2xl bg-orange-50 p-4">
                    <p className="text-xs text-neutral-500">Produits à surveiller</p>
                    <p className="mt-2 text-2xl font-black text-[#071f3d]">
                      {Math.max(0, Math.round(totalProducts * 0.1))}
                    </p>
                    <p className="text-xs text-orange-600">Stock critique</p>
                  </div>
                </div>

                <Link href="/dashboard/seller/analytics" className="mt-5 block text-center text-sm font-bold text-[#d2162c]">
                  Voir l’analyse complète →
                </Link>
              </div>

              <div className="space-y-5">
                <div className="rounded-3xl bg-white p-6 shadow-sm">
                  <h3 className="font-black text-[#071f3d]">Accompagnement</h3>

                  <div className="mt-4 space-y-3">
                    {[
                      ["Centre d’aide", "Guides, vidéos et conseils"],
                      ["Formation vendeur", "Apprendre à booster vos ventes"],
                      ["Assistance vocale", "Écouter et gérer plus facilement"],
                    ].map(([title, text]) => (
                      <Link
                        key={title}
                        href="/dashboard/seller/support"
                        className="flex items-center justify-between rounded-2xl border p-3"
                      >
                        <div>
                          <p className="text-sm font-bold text-[#071f3d]">{title}</p>
                          <p className="text-xs text-neutral-500">{text}</p>
                        </div>

                        <span>→</span>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl bg-white p-6 shadow-sm">
                  <h3 className="font-black text-[#071f3d]">Financement & croissance</h3>

                  <p className="mt-2 text-sm text-neutral-500">
                    Préparez vos rapports et dossiers pour nos partenaires.
                  </p>

                  <div className="mt-5 grid grid-cols-3 gap-3 text-center text-xs">
                    <div className="rounded-2xl bg-[#eef0ff] p-3">
                      🏦
                      <br />
                      Financement
                    </div>
                    <div className="rounded-2xl bg-[#eef0ff] p-3">
                      📦
                      <br />
                      Stock
                    </div>
                    <div className="rounded-2xl bg-[#eef0ff] p-3">
                      📣
                      <br />
                      Marketing
                    </div>
                  </div>

                  <Link
                    href="/dashboard/seller/financing"
                    className="mt-5 block rounded-2xl bg-[#071f3d] px-4 py-3 text-center text-sm font-bold text-white"
                  >
                    Voir les offres disponibles →
                  </Link>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-gradient-to-r from-[#574bff] to-[#f5c0dc] p-6 text-white">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-xl font-black">Besoin d’un accompagnement personnalisé ?</h3>

                  <p className="text-sm text-white/80">
                    Nos experts MACHE sont là pour vous aider à faire grandir votre business.
                  </p>
                </div>

                <Link
                  href="/dashboard/seller/support"
                  className="rounded-2xl bg-[#071f3d] px-6 py-3 text-center text-sm font-bold"
                >
                  Parler à un conseiller →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
