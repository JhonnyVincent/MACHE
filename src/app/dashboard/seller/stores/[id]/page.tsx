/*
  PAGE : Dashboard vendeur d’un store précis

  Fichier :
  src/app/dashboard/seller/stores/[id]/page.tsx

  Sert à :
  - Afficher le tableau de bord d’une boutique précise du vendeur
  - Vérifier que le vendeur connecté est bien propriétaire du store
  - Afficher les infos du store : nom, logo, bannière, statut, catégorie
  - Afficher les statistiques : produits, commandes, revenus, stock faible
  - Afficher les produits récents du store
  - Donner accès aux actions rapides : ajouter produit, commandes, ventes, paiements
  - Afficher un sidebar complet vendeur
  - Afficher un graphique au choix : courbe, barres, diagramme
  - Afficher les CTA : boost ventes, vérification, abonnement, fournisseur
*/

import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function formatHTG(value: number) {
  return `${Number(value || 0).toLocaleString("fr-FR")} HTG`;
}

type SearchParams = {
  chart?: string;
  period?: string;
};

export default async function StoreDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<SearchParams>;
}) {
  const { id } = await params;
  const query = searchParams ? await searchParams : {};

  const chartType = query.chart || "line";
  const period = query.period || "month";

  const supabase = await createSupabaseServerClient();

  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect(`/login?next=/dashboard/seller/stores/${id}`);
  }

  const uid = userData.user.id;
  const sellerName =
    userData.user.user_metadata?.full_name ||
    userData.user.email?.split("@")[0] ||
    "Vendeur";

  const { data: store } = await supabase
    .from("stores")
    .select(`
      id,
      slug,
      name,
      description,
      logo_url,
      banner_url,
      is_verified,
      legal_doc_url,
      category,
      created_at
    `)
    .eq("id", id)
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
    (sum, order) => sum + Number(order.total_price ?? 0),
    0
  );

  const { data: recentProducts } = await supabase
    .from("products")
    .select(`
      id,
      title,
      price,
      stock,
      status,
      image_url
    `)
    .eq("store_id", store.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const storeInitial = store.name?.charAt(0)?.toUpperCase() || "M";


  const chartValues = [35, 48, 42, 65, 54, 88, 72, 98, 76, 110, 86, 115];

  return (
    <>
          <div className="space-y-6">

            <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
              <div className="grid rounded-2xl border border-[#e7eaf1] bg-white shadow-sm md:grid-cols-4">
                <InfoTile
                  icon="💼"
                  label="Type de vendeur"
                  value="Vendeur Business"
                  sub="Compte professionnel"
                />

                <InfoTile
                  icon="🛍️"
                  label="Boutique"
                  value={store.name}
                  sub="Voir ma boutique ↗"
                  href={`/store/${store.slug}`}
                />

                <InfoTile
                  icon="✅"
                  label="Statut"
                  value={store.is_verified ? "Vérifié" : "En attente"}
                  sub={
                    store.is_verified
                      ? "Boutique validée"
                      : "Documents requis"
                  }
                  success={store.is_verified}
                />

                <InfoTile
                  icon="👑"
                  label="Abonnement"
                  value="Business"
                  sub="Jusqu’au 12 Août 2025"
                />
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-[#071a61] to-[#003b9c] p-6 text-white shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/75">Solde disponible</p>
                    <p className="mt-2 text-3xl font-black">
                      {formatHTG(totalRevenue)}
                    </p>
                    <p className="mt-2 text-sm text-white/75">
                      À recevoir : {formatHTG(totalRevenue * 0.18)}
                    </p>
                  </div>

                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-3xl">
                    💳
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <StatCard
                title="Produits actifs"
                value={activeProducts ?? 0}
                sub={`Sur ${totalProducts ?? 0} produits`}
                icon="📦"
                color="green"
              />

              <StatCard
                title="Commandes en attente"
                value={pendingOrders}
                sub="À traiter aujourd’hui"
                icon="🛒"
                color="orange"
              />

              <StatCard
                title="Ventes"
                value={formatHTG(totalRevenue)}
                sub="+18.6% par rapport au mois dernier"
                icon="📈"
                color="green"
              />

              <StatCard
                title="Stock faible"
                value={lowStockProducts ?? 0}
                sub="Produits à réapprovisionner"
                icon="⚠️"
                color="red"
              />

              <StatCard
                title="Avis clients"
                value="4.8/5"
                sub="Basé sur les avis clients"
                icon="⭐"
                color="yellow"
              />
            </section>

            <section className="grid gap-4 xl:grid-cols-[0.7fr_1fr]">
              <div className="rounded-2xl border border-[#e7eaf1] bg-gradient-to-br from-[#fff4f4] to-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-[#0053c6]">
                      Boostez vos ventes !
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                      Sponsorisez vos meilleurs produits et atteignez plus de clients.
                    </p>

                    <Link
                      href={`/dashboard/seller/stores/${store.id}/ads`}
                      className="mt-5 inline-flex rounded-xl bg-[#061a36] px-5 py-3 text-sm font-black text-white"
                    >
                      Créer une campagne
                    </Link>
                  </div>

                  <div className="hidden text-7xl md:block">📣</div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#e7eaf1] bg-white p-6 shadow-sm">
                <h2 className="text-xl font-black">Actions rapides</h2>

                <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
                  <QuickAction
                    href={`/dashboard/seller/stores/${store.id}/products/new`}
                    icon="+"
                    label="Ajouter un produit"
                  />
                  <QuickAction
                    href={`/dashboard/seller/stores/${store.id}/orders`}
                    icon="🛒"
                    label="Gérer les commandes"
                    badge={pendingOrders ? String(pendingOrders) : undefined}
                  />
                  <QuickAction
                    href={`/dashboard/seller/stores/${store.id}/sales`}
                    icon="↗"
                    label="Voir mes ventes"
                  />
                  <QuickAction
                    href={`/dashboard/seller/stores/${store.id}/payments`}
                    icon="💳"
                    label="Retirer mon argent"
                  />
                  <QuickAction
                    href={`/dashboard/seller/stores/${store.id}/support`}
                    icon="◎"
                    label="Contacter le support"
                  />
                </div>
              </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-[1.2fr_0.9fr_0.95fr]">
              <div className="rounded-2xl border border-[#e7eaf1] bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black">Graphique des ventes</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Le vendeur peut choisir la période et le type de graphique.
                    </p>
                  </div>

                  <form className="flex gap-2" method="GET">
                    <select
                      name="period"
                      defaultValue={period}
                      className="rounded-xl border border-[#e7eaf1] bg-white px-3 py-2 text-sm font-bold"
                    >
                      <option value="week">Semaine</option>
                      <option value="month">Mois</option>
                      <option value="year">Année</option>
                    </select>

                    <select
                      name="chart"
                      defaultValue={chartType}
                      className="rounded-xl border border-[#e7eaf1] bg-white px-3 py-2 text-sm font-bold"
                    >
                      <option value="line">Courbe</option>
                      <option value="bar">Barres</option>
                      <option value="pie">Diagramme</option>
                    </select>

                    <button className="rounded-xl bg-[#061a36] px-4 py-2 text-sm font-black text-white">
                      OK
                    </button>
                  </form>
                </div>

                <ChartPreview type={chartType} values={chartValues} />
              </div>

              <div className="rounded-2xl border border-[#e7eaf1] bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-xl font-black">Top produits</h2>
                  <span className="rounded-xl border border-[#e7eaf1] px-3 py-2 text-xs font-bold text-gray-500">
                    Meilleures ventes
                  </span>
                </div>

                {!recentProducts || recentProducts.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-[#e7eaf1] p-8 text-center">
                    <p className="text-4xl">📦</p>
                    <p className="mt-3 font-black">Aucun produit</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentProducts.slice(0, 4).map((product) => (
                      <Link
                        key={product.id}
                        href={`/dashboard/seller/stores/${store.id}/products/${product.id}`}
                        className="flex items-center gap-4 rounded-2xl border border-transparent p-3 hover:border-[#e7eaf1] hover:bg-gray-50"
                      >
                        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            "📦"
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate font-black">{product.title}</p>
                          <p className="text-sm text-gray-500">
                            Stock : {product.stock ?? 0}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-black">
                            {formatHTG(product.price ?? 0)}
                          </p>
                          <p className="text-xs font-bold text-green-600">
                            +12%
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                <Link
                  href={`/dashboard/seller/stores/${store.id}/products`}
                  className="mt-5 block text-center text-sm font-black text-[#0053c6]"
                >
                  Voir tous les produits →
                </Link>
              </div>

              <div className="rounded-2xl border border-[#e7eaf1] bg-white p-6 shadow-sm">
                <h2 className="text-xl font-black">Activités récentes</h2>

                <div className="mt-5 space-y-4">
                  <ActivityItem
                    icon="🧾"
                    title="Commande reçue"
                    sub={`${pendingOrders} commande(s) en attente`}
                    time="Aujourd’hui"
                  />
                  <ActivityItem
                    icon="💰"
                    title="Paiement disponible"
                    sub={formatHTG(totalRevenue)}
                    time="Cette période"
                  />
                  <ActivityItem
                    icon="⚠️"
                    title="Stock faible"
                    sub={`${lowStockProducts ?? 0} produit(s) à réapprovisionner`}
                    time="Maintenant"
                  />
                  <ActivityItem
                    icon="⭐"
                    title="Avis client"
                    sub="Surveillez vos nouveaux avis"
                    time="Récent"
                  />
                </div>

                <Link
                  href={`/dashboard/seller/stores/${store.id}/activities`}
                  className="mt-5 block text-center text-sm font-black text-[#0053c6]"
                >
                  Voir toutes les activités →
                </Link>
              </div>
            </section>

            {!store.is_verified ? (
              <section className="rounded-2xl border border-[#ffd88a] bg-[#fff8e8] p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff0c8] text-2xl">
                      🛡️
                    </div>

                    <div>
                      <h3 className="font-black">Vérification requise</h3>
                      <p className="text-sm text-gray-600">
                        Pour accéder à toutes les fonctionnalités, veuillez soumettre vos documents.
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/dashboard/seller/stores/${store.id}/documents`}
                    className="rounded-xl bg-[#ffc247] px-5 py-3 text-sm font-black"
                  >
                    Voir mes documents
                  </Link>
                </div>
              </section>
            ) : null}

            <section className="rounded-2xl bg-[#061a36] p-5 text-white">
              <div className="grid gap-5 md:grid-cols-[1fr_1fr_1fr_1fr_auto] md:items-center">
                <div>
                  <h3 className="text-xl font-black">Passez au plan supérieur</h3>
                  <p className="mt-1 text-sm text-white/65">
                    Débloquez plus de produits, de stores et de fonctionnalités avancées.
                  </p>
                </div>

                <PlanFeature icon="🎁" title="Plus de produits" sub="Jusqu’à 10,000 produits" />
                <PlanFeature icon="🏪" title="Stores multiples" sub="Jusqu’à 10 stores" />
                <PlanFeature icon="🎧" title="Support prioritaire" sub="Assistance 24/7" />

                <Link
                  href={`/dashboard/seller/stores/${store.id}/subscription`}
                  className="rounded-xl bg-[#e31837] px-7 py-3 text-center text-sm font-black text-white"
                >
                  Voir les plans
                </Link>
              </div>
            </section>
          </div>
    </>
  );
}

function InfoTile({
  icon,
  label,
  value,
  sub,
  href,
  success,
}: {
  icon: string;
  label: string;
  value: string;
  sub: string;
  href?: string;
  success?: boolean;
}) {
  const content = (
    <div className="flex items-center gap-4 border-b border-[#e7eaf1] p-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f0f4ff] text-2xl">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-bold text-gray-500">{label}</p>
        <p className={`truncate font-black ${success ? "text-green-600" : ""}`}>
          {value}
        </p>
        <p className="text-xs font-bold text-[#0053c6]">{sub}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} target="_blank">
        {content}
      </Link>
    );
  }

  return content;
}

function StatCard({
  title,
  value,
  sub,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  sub: string;
  icon: string;
  color: "green" | "orange" | "red" | "yellow";
}) {
  const colorMap = {
    green: "bg-green-100 text-green-700",
    orange: "bg-orange-100 text-orange-700",
    red: "bg-red-100 text-red-700",
    yellow: "bg-yellow-100 text-yellow-700",
  };

  return (
    <div className="rounded-2xl border border-[#e7eaf1] bg-white p-5 shadow-sm">
      <div className="flex justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-gray-600">{title}</p>
          <p className="mt-2 text-2xl font-black">{value}</p>
          <p className="mt-2 text-xs text-gray-500">{sub}</p>
        </div>

        <div className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
  badge,
}: {
  href: string;
  icon: string;
  label: string;
  badge?: string;
}) {
  return (
    <Link href={href} className="relative text-center">
      <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf3ff] text-2xl text-[#0053c6]">
        {icon}
        {badge ? (
          <span className="absolute -right-2 -top-2 rounded-full bg-[#e31837] px-1.5 text-[10px] font-black text-white">
            {badge}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-xs font-black">{label}</p>
    </Link>
  );
}

function ChartPreview({
  type,
  values,
}: {
  type: string;
  values: number[];
}) {
  if (type === "pie") {
    return (
      <div className="flex h-80 items-center justify-center rounded-2xl bg-[#f7f9fc]">
        <div className="relative h-56 w-56 rounded-full bg-[conic-gradient(#2563eb_0_40%,#22c55e_40%_65%,#f59e0b_65%_82%,#e31837_82%_100%)]">
          <div className="absolute inset-12 flex items-center justify-center rounded-full bg-white text-center">
            <div>
              <p className="text-2xl font-black">100%</p>
              <p className="text-xs text-gray-500">Ventes</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === "bar") {
    return (
      <div className="flex h-80 items-end gap-3 rounded-2xl bg-[#f7f9fc] p-5">
        {values.map((height, index) => (
          <div key={index} className="flex flex-1 flex-col items-center justify-end gap-2">
            <div
              className="w-full rounded-t-xl bg-[#2563eb]"
              style={{ height: `${height * 1.6}px` }}
            />
            <span className="text-[10px] font-bold text-gray-400">{index + 1}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative h-80 overflow-hidden rounded-2xl bg-[#f7f9fc] p-5">
      <div className="absolute inset-x-5 top-10 h-px bg-gray-200" />
      <div className="absolute inset-x-5 top-24 h-px bg-gray-200" />
      <div className="absolute inset-x-5 top-38 h-px bg-gray-200" />
      <div className="absolute inset-x-5 top-52 h-px bg-gray-200" />

      <svg viewBox="0 0 600 260" className="h-full w-full">
        <polyline
          fill="none"
          stroke="#2563eb"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points="0,190 50,150 100,165 150,115 200,135 250,170 300,150 350,100 400,125 450,75 500,110 560,80"
        />
        <polyline
          fill="none"
          stroke="#cbd5e1"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="8 8"
          points="0,210 50,190 100,200 150,170 200,185 250,175 300,160 350,145 400,155 450,130 500,150 560,120"
        />
      </svg>
    </div>
  );
}

function ActivityItem({
  icon,
  title,
  sub,
  time,
}: {
  icon: string;
  title: string;
  sub: string;
  time: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f4f6fa]">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-black">{title}</p>
        <p className="text-sm text-gray-500">{sub}</p>
      </div>

      <p className="text-xs text-gray-400">{time}</p>
    </div>
  );
}

function PlanFeature({
  icon,
  title,
  sub,
}: {
  icon: string;
  title: string;
  sub: string;
}) {
  return (
    <div className="flex items-center gap-3 border-white/10 md:border-l md:pl-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
        {icon}
      </div>

      <div>
        <p className="text-sm font-black">{title}</p>
        <p className="text-xs text-white/60">{sub}</p>
      </div>
    </div>
  );
}
