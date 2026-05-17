import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const SELLER_ROLES = [
  "seller_individual",
  "seller_business",
  "supplier",
  "official_brand",
];

const ROLE_LABELS: Record<string, string> = {
  seller_individual: "Vendeur particulier",
  seller_business: "Vendeur business",
  supplier: "Fournisseur",
  official_brand: "Marque officielle",
};

const ROLE_LIMITS: Record<string, { products: number; ads: boolean; analytics: boolean; invoices: boolean }> = {
  seller_individual: { products: 10, ads: false, analytics: false, invoices: false },
  seller_business: { products: 500, ads: true, analytics: true, invoices: true },
  supplier: { products: 500, ads: true, analytics: true, invoices: true },
  official_brand: { products: 99999, ads: true, analytics: true, invoices: true },
};

export default async function SellerDashboardPage() {
  const supabase = await createSupabaseServerClient();

  // 1. Vérifier la session
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect("/login?next=/dashboard/seller");
  }

  // 2. Vérifier le profil vendeur
  const { data: profile } = await supabase
    .from("users")
    .select("role, full_name, email")
    .eq("id", userData.user.id)
    .single();

  if (!profile || !SELLER_ROLES.includes(profile.role)) {
    redirect(`/login?error=${encodeURIComponent("Ce compte n'est pas un compte vendeur.")}`);
  }

  const limits = ROLE_LIMITS[profile.role];
  const roleLabel = ROLE_LABELS[profile.role];
  const displayName = profile.full_name || userData.user.email || "Vendeur";
  const isUnlimited = limits.products >= 99999;

  // 3. Stats produits
  const { count: totalProducts } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("seller_id", userData.user.id);

  const { count: activeProducts } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("seller_id", userData.user.id)
    .eq("status", "active");

  const { count: draftProducts } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("seller_id", userData.user.id)
    .eq("status", "draft");

  // 4. Stats commandes
  const { count: totalOrders } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("seller_id", userData.user.id);

  const { count: pendingOrders } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("seller_id", userData.user.id)
    .eq("status", "pending");

  // 5. Produits récents
  const { data: recentProducts } = await supabase
    .from("products")
    .select("id, title, price, stock, status, sales_count, image_url")
    .eq("seller_id", userData.user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  // 6. Boutique du vendeur
  const { data: store } = await supabase
    .from("stores")
    .select("id, slug, name, is_verified")
    .eq("owner_id", userData.user.id)
    .maybeSingle();

  const productCount = totalProducts ?? 0;
  const productLimitDisplay = isUnlimited ? "∞" : limits.products;
  const limitReached = !isUnlimited && productCount >= limits.products;

  return (
    <main className="min-h-screen bg-neutral-50">
      {/* Top bar */}
      <div className="bg-[#071f3d] text-white">
        <div className="container-page flex flex-col gap-3 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-white/50">
              Espace vendeur
            </p>
            <h1 className="mt-1 text-2xl font-black">
              Bonjour, {displayName} 👋
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">
                {roleLabel}
              </span>
              {store?.is_verified ? (
                <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-bold text-green-300">
                  ✓ Vérifié
                </span>
              ) : (
                <span className="rounded-full bg-orange-500/20 px-3 py-1 text-xs font-bold text-orange-300">
                  ⏳ En attente de vérification
                </span>
              )}
              {profile.role === "official_brand" && (
                <span className="rounded-full bg-yellow-400/20 px-3 py-1 text-xs font-bold text-yellow-300">
                  ⭐ Marque officielle
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {!limitReached ? (
              <Link href="/dashboard/seller/products/new" className="btn-primary text-sm">
                + Ajouter un produit
              </Link>
            ) : (
              <span className="rounded-2xl bg-red-500/20 px-4 py-2 text-xs font-bold text-red-300">
                Limite {productLimitDisplay} produits atteinte
              </span>
            )}
            {store?.slug && (
              <Link
                href={`/store/${store.slug}`}
                className="btn-secondary border-white/20 text-sm text-white"
                target="_blank"
              >
                Voir ma boutique →
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="container-page py-8">
        {/* Stats rapides */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="card p-5">
            <p className="text-sm text-neutral-500">Produits actifs</p>
            <p className="mt-1 text-3xl font-black text-[var(--mache-primary)]">
              {activeProducts ?? 0}
              <span className="ml-1 text-base font-medium text-neutral-400">
                / {productLimitDisplay}
              </span>
            </p>
            {limitReached && (
              <p className="mt-1 text-xs font-bold text-red-500">Limite atteinte</p>
            )}
          </div>

          <div className="card p-5">
            <p className="text-sm text-neutral-500">Brouillons</p>
            <p className="mt-1 text-3xl font-black">{draftProducts ?? 0}</p>
          </div>

          <div className="card p-5">
            <p className="text-sm text-neutral-500">Commandes totales</p>
            <p className="mt-1 text-3xl font-black">{totalOrders ?? 0}</p>
          </div>

          <div className="card p-5">
            <p className="text-sm text-neutral-500">En attente</p>
            <p className="mt-1 text-3xl font-black text-orange-500">
              {pendingOrders ?? 0}
            </p>
          </div>
        </div>

        {/* Menu rapide */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[
            {
              title: "Mes produits",
              text: "Gérer votre catalogue et vos stocks.",
              href: "/dashboard/seller/products",
              icon: "📦",
              locked: false,
            },
            {
              title: "Commandes",
              text: "Voir et traiter les commandes reçues.",
              href: "/dashboard/seller/orders",
              icon: "🛒",
              locked: false,
            },
            {
              title: "Mes ventes",
              text: "Revenus, historique et chiffre d'affaires.",
              href: "/dashboard/seller/sales",
              icon: "💰",
              locked: false,
            },
            {
              title: "Publicité",
              text: "Sponsoriser vos produits pour plus de visibilité.",
              href: "/dashboard/seller/ads",
              icon: "📣",
              locked: !limits.ads,
            },
            {
              title: "Statistiques",
              text: "Analyses et performances de votre boutique.",
              href: "/dashboard/seller/analytics",
              icon: "📊",
              locked: !limits.analytics,
            },
            {
              title: "Ma boutique",
              text: "Modifier votre page publique vendeur.",
              href: "/dashboard/seller/store",
              icon: "🏪",
              locked: false,
            },
            {
              title: "Livraisons",
              text: "Suivre les expéditions et statuts colis.",
              href: "/dashboard/seller/delivery",
              icon: "🚚",
              locked: false,
            },
            {
              title: "Factures",
              text: "Générer et télécharger vos factures.",
              href: "/dashboard/seller/invoices",
              icon: "🧾",
              locked: !limits.invoices,
            },
            {
              title: "Vérification",
              text: "Soumettre vos documents pour être vérifié.",
              href: "/dashboard/seller/verification",
              icon: "✅",
              locked: false,
            },
          ].map((item) => (
            <Link
              key={item.title}
              href={item.locked ? "#" : item.href}
              className={`card group relative p-6 transition hover:-translate-y-1 hover:shadow-lg ${
                item.locked ? "cursor-not-allowed opacity-60" : ""
              }`}
              onClick={item.locked ? (e) => e.preventDefault() : undefined}
            >
              {item.locked && (
                <span className="absolute right-4 top-4 rounded-full bg-neutral-100 px-2 py-1 text-xs font-black text-neutral-400">
                  🔒 Business
                </span>
              )}
              <span className="text-3xl">{item.icon}</span>
              <h3
                className={`mt-4 text-lg font-black ${
                  !item.locked ? "group-hover:text-[var(--mache-primary)]" : ""
                }`}
              >
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-neutral-500">{item.text}</p>
              {item.locked ? (
                <p className="mt-4 text-xs font-bold text-neutral-400">
                  Réservé au plan Business
                </p>
              ) : (
                <p className="mt-4 text-sm font-black text-[var(--mache-primary)]">
                  Accéder →
                </p>
              )}
            </Link>
          ))}
        </div>

        {/* Produits récents */}
        <div className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black">Produits récents</h2>
            <Link
              href="/dashboard/seller/products"
              className="text-sm font-bold text-[var(--mache-primary)]"
            >
              Voir tout →
            </Link>
          </div>

          {!recentProducts || recentProducts.length === 0 ? (
            <div className="mt-6 rounded-3xl border-2 border-dashed p-12 text-center">
              <p className="text-4xl">📦</p>
              <p className="mt-4 text-lg font-black">Aucun produit encore</p>
              <p className="mt-2 text-sm text-neutral-500">
                Ajoutez votre premier produit pour commencer à vendre sur Maché.
              </p>
              {!limitReached && (
                <Link
                  href="/dashboard/seller/products/new"
                  className="btn-primary mt-6 inline-block"
                >
                  + Ajouter un produit
                </Link>
              )}
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-3xl border bg-white">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="p-4 text-left font-black">Produit</th>
                    <th className="hidden p-4 text-left font-black sm:table-cell">Prix</th>
                    <th className="hidden p-4 text-left font-black md:table-cell">Stock</th>
                    <th className="hidden p-4 text-left font-black md:table-cell">Ventes</th>
                    <th className="p-4 text-left font-black">Statut</th>
                    <th className="p-4 text-left font-black">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentProducts.map((product) => (
                    <tr key={product.id} className="border-t hover:bg-neutral-50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.title}
                              className="h-10 w-10 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-lg">
                              📦
                            </div>
                          )}
                          <span className="font-medium">{product.title}</span>
                        </div>
                      </td>
                      <td className="hidden p-4 text-neutral-500 sm:table-cell">
                        {product.price.toLocaleString()} HTG
                      </td>
                      <td className="hidden p-4 text-neutral-500 md:table-cell">
                        {product.stock}
                      </td>
                      <td className="hidden p-4 text-neutral-500 md:table-cell">
                        {product.sales_count ?? 0}
                      </td>
                      <td className="p-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${
                            product.status === "active"
                              ? "bg-green-50 text-green-700"
                              : product.status === "draft"
                              ? "bg-orange-50 text-orange-700"
                              : product.status === "paused"
                              ? "bg-neutral-100 text-neutral-500"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          {product.status === "active"
                            ? "Actif"
                            : product.status === "draft"
                            ? "Brouillon"
                            : product.status === "paused"
                            ? "Pausé"
                            : product.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <Link
                          href={`/dashboard/seller/products/${product.id}/edit`}
                          className="text-xs font-bold text-[var(--mache-primary)] hover:underline"
                        >
                          Modifier
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Upgrade banner pour vendeur particulier */}
        {profile.role === "seller_individual" && (
          <div className="mt-10 overflow-hidden rounded-3xl bg-gradient-to-r from-[#071f3d] to-[#d20a1e] p-8 text-white">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-white/60">
                  Plan actuel : Gratuit
                </p>
                <h3 className="mt-2 text-2xl font-black">
                  Passez au plan Business
                </h3>
                <p className="mt-2 text-sm text-white/70">
                  Débloquez la publicité, les statistiques avancées, les factures et plus de produits.
                </p>
              </div>
              <Link href="/dashboard/seller/subscription" className="btn-primary shrink-0">
                Voir les plans →
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
