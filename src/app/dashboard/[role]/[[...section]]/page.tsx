import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  createProductAction,
  deleteProductAction,
  pauseProductAction,
  publishProductAction,
  createWidgetAction,
  toggleWidgetAction,
  deleteWidgetAction
} from "./actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canAccessDashboard } from "@/lib/authz";

type RouteKey = "buyer" | "seller" | "agent" | "admin" | "partner";

type SellerProduct = {
  id: string;
  title: string;
  price: number;
  category: string | null;
  status: string | null;
  stock: number | null;
  shipping_method: string | null;
};

type AdminStats = {
  users: number;
  products: number;
  widgets: number;
  vendors: number;
  partners: number;
};

type SiteWidget = {
  id: string;
  page: string;
  zone: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  button_text: string | null;
  button_href: string | null;
  position: number | null;
  is_active: boolean | null;
};

const dashboardConfig: Record<
  RouteKey,
  {
    label: string;
    nav: Array<{ slug: string; label: string }>;
    content: Record<string, { title: string; type?: string }>;
  }
> = {
  buyer: {
    label: "Dashboard Buyer",
    nav: [
      { slug: "", label: "Résumé" },
      { slug: "messages", label: "Messages" }
    ],
    content: {
      "": { title: "Résumé du compte" },
      messages: { title: "Messages" }
    }
  },

  seller: {
    label: "Dashboard Seller",
    nav: [
      { slug: "", label: "Résumé" },
      { slug: "products", label: "Produits" },
      { slug: "products/new", label: "Ajouter produit" }
    ],
    content: {
      "": { title: "Résumé vendeur", type: "seller_home" },
      products: { title: "Mes produits", type: "seller_products" },
      "products/new": { title: "Ajouter un produit", type: "seller_ai_form" }
    }
  },

  admin: {
    label: "Dashboard Admin",
    nav: [
      { slug: "", label: "Résumé" },
      { slug: "widgets", label: "Widgets" },
      { slug: "theme", label: "Thème" },
      { slug: "users", label: "Utilisateurs" },
      { slug: "vendors", label: "Vendeurs" },
      { slug: "partners", label: "Partenaires" },
      { slug: "products", label: "Produits" }
    ],
    content: {
      "": { title: "Centre de contrôle Maché", type: "admin_home" },
      widgets: { title: "Gestion des widgets", type: "admin_widgets" },
      theme: { title: "Thème et couleurs", type: "admin_theme" },
      users: { title: "Utilisateurs", type: "admin_users" },
      vendors: { title: "Vendeurs", type: "admin_vendors" },
      partners: { title: "Partenaires", type: "admin_partners" },
      products: { title: "Produits", type: "admin_products" }
    }
  },

  agent: {
    label: "Dashboard Agent",
    nav: [{ slug: "", label: "Résumé" }],
    content: {
      "": { title: "Espace agent", type: "agent_home" }
    }
  },

  partner: {
    label: "Dashboard Partenaire",
    nav: [{ slug: "", label: "Résumé" }],
    content: {
      "": { title: "Espace partenaire", type: "partner_home" }
    }
  }
};

function SellerSection({
  type,
  products = []
}: {
  type?: string;
  products?: SellerProduct[];
}) {
  if (type === "seller_home") {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-bold">Bienvenue vendeur</h3>
        <p className="mt-2 text-slate-500">
          Gérez vos produits, vos commandes et votre boutique.
        </p>

        <div className="mt-6 flex gap-3">
          <Link href="/dashboard/seller/products/new" className="btn-primary">
            Ajouter produit
          </Link>

          <Link href="/dashboard/seller/products" className="btn-secondary">
            Voir produits
          </Link>
        </div>
      </div>
    );
  }

  if (type === "seller_products") {
    return (
      <div className="grid gap-4">
        {products.length === 0 && (
          <div className="card p-6">
            <p className="text-slate-500">Aucun produit pour le moment.</p>
          </div>
        )}

        {products.map((p) => (
          <div key={p.id} className="card p-4">
            <h3 className="font-bold">{p.title}</h3>
            <p className="text-slate-500">${p.price}</p>

            <div className="mt-3 flex flex-wrap gap-3">
              {p.status !== "active" ? (
                <form action={publishProductAction}>
                  <input type="hidden" name="product_id" value={p.id} />
                  <button className="btn-primary">Publier</button>
                </form>
              ) : (
                <form action={pauseProductAction}>
                  <input type="hidden" name="product_id" value={p.id} />
                  <button className="btn-secondary">Pause</button>
                </form>
              )}

              <form action={deleteProductAction}>
                <input type="hidden" name="product_id" value={p.id} />
                <button className="font-bold text-red-500">Supprimer</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "seller_ai_form") {
    return (
      <form action={createProductAction} className="card space-y-4 p-6">
        <input name="title" placeholder="Nom produit" className="input" />
        <input name="price" placeholder="Prix" type="number" className="input" />
        <input name="category" placeholder="Catégorie" className="input" />
        <input
          name="image_1"
          placeholder="URL image principale"
          className="input"
        />
        <button className="btn-primary">Créer</button>
      </form>
    );
  }

  return null;
}

function AdminSection({
  type,
  stats,
  isSuperAdmin,
  widgets = []
}: {
  type?: string;
  stats: AdminStats;
  isSuperAdmin: boolean;
  widgets?: SiteWidget[];
}) {
  if (type === "admin_home") {
    return (
      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-5">
          <div className="card p-5">
            <p className="text-sm text-slate-500">Utilisateurs</p>
            <p className="text-3xl font-black">{stats.users}</p>
          </div>

          <div className="card p-5">
            <p className="text-sm text-slate-500">Produits</p>
            <p className="text-3xl font-black">{stats.products}</p>
          </div>

          <div className="card p-5">
            <p className="text-sm text-slate-500">Widgets</p>
            <p className="text-3xl font-black">{stats.widgets}</p>
          </div>

          <div className="card p-5">
            <p className="text-sm text-slate-500">Vendeurs</p>
            <p className="text-3xl font-black">{stats.vendors}</p>
          </div>

          <div className="card p-5">
            <p className="text-sm text-slate-500">Partenaires</p>
            <p className="text-3xl font-black">{stats.partners}</p>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-xl font-black">
            {isSuperAdmin ? "Accès Super Admin" : "Accès Admin"}
          </h3>
          <p className="mt-2 text-slate-500">
            {isSuperAdmin
              ? "Vous avez accès total au site, aux permissions, aux widgets et aux comptes."
              : "Vous avez accès aux sections autorisées par le Super Admin."}
          </p>
        </div>
      </div>
    );
  }

  if (type === "admin_widgets") {
    return (
      <div className="grid gap-6">
        <form action={createWidgetAction} className="card grid gap-4 p-6">
          <h3 className="text-xl font-black">Créer un widget</h3>

          <div className="grid gap-3 md:grid-cols-3">
            <input
              name="page"
              placeholder="page: home"
              defaultValue="home"
              className="input"
            />
            <input
              name="zone"
              placeholder="zone: hero, newsletter..."
              className="input"
            />
            <input
              name="type"
              placeholder="type: banner, cta_block..."
              className="input"
            />
          </div>

          <input name="title" placeholder="Titre" className="input" />
          <input name="subtitle" placeholder="Sous-titre" className="input" />

          <textarea
            name="description"
            placeholder="Description"
            className="input min-h-28"
          />

          <input name="image_url" placeholder="URL image" className="input" />

          <div className="grid gap-3 md:grid-cols-3">
            <input
              name="button_text"
              placeholder="Texte bouton"
              className="input"
            />
            <input
              name="button_href"
              placeholder="Lien bouton"
              className="input"
            />
            <input
              name="position"
              type="number"
              placeholder="Position"
              className="input"
            />
          </div>

          <button className="btn-primary w-fit">Créer le widget</button>
        </form>

        <div className="grid gap-4">
          {widgets.length === 0 && (
            <div className="card p-6 text-slate-500">
              Aucun widget pour le moment.
            </div>
          )}

          {widgets.map((widget) => (
            <div key={widget.id} className="card p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#fff1f1] px-3 py-1 text-xs font-black text-[#d20a1e]">
                      {widget.page}
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                      {widget.zone}
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                      {widget.type}
                    </span>
                  </div>

                  <h3 className="mt-3 text-xl font-black text-[#071f3d]">
                    {widget.title || "Sans titre"}
                  </h3>

                  {widget.subtitle && (
                    <p className="mt-1 font-bold text-slate-600">
                      {widget.subtitle}
                    </p>
                  )}

                  {widget.description && (
                    <p className="mt-2 text-sm text-slate-500">
                      {widget.description}
                    </p>
                  )}

                  {widget.button_text && (
                    <p className="mt-2 text-sm font-bold text-[#d20a1e]">
                      Bouton : {widget.button_text} →{" "}
                      {widget.button_href || "aucun lien"}
                    </p>
                  )}

                  <p className="mt-3 text-xs text-slate-400">
                    Position : {widget.position ?? 0} — Statut :{" "}
                    {widget.is_active ? "Actif" : "Inactif"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <form action={toggleWidgetAction}>
                    <input type="hidden" name="widget_id" value={widget.id} />
                    <input
                      type="hidden"
                      name="is_active"
                      value={String(Boolean(widget.is_active))}
                    />
                    <button className="btn-secondary">
                      {widget.is_active ? "Désactiver" : "Activer"}
                    </button>
                  </form>

                  <form action={deleteWidgetAction}>
                    <input type="hidden" name="widget_id" value={widget.id} />
                    <button className="font-bold text-red-500">
                      Supprimer
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "admin_theme") {
    return (
      <div className="card p-6">
        <h3 className="text-xl font-black">Thème dynamique</h3>
        <p className="mt-2 text-slate-500">
          Ici on va permettre de changer les couleurs selon les saisons sans
          recoder le site.
        </p>
      </div>
    );
  }

  if (type === "admin_users") {
    return (
      <div className="card p-6">
        <h3 className="text-xl font-black">Gestion utilisateurs</h3>
        <p className="mt-2 text-slate-500">
          Ici on pourra bannir, débloquer, accepter des comptes et modifier les
          rôles.
        </p>
      </div>
    );
  }

  if (type === "admin_vendors") {
    return (
      <div className="card p-6">
        <h3 className="text-xl font-black">Gestion vendeurs</h3>
        <p className="mt-2 text-slate-500">
          Ici on gérera les vendeurs particuliers, entreprises, vérifications et
          boutiques.
        </p>
      </div>
    );
  }

  if (type === "admin_partners") {
    return (
      <div className="card p-6">
        <h3 className="text-xl font-black">Gestion partenaires</h3>
        <p className="mt-2 text-slate-500">
          Ici on reliera les partenaires aux vendeurs, comme livraison,
          financement, export/import et services.
        </p>
      </div>
    );
  }

  if (type === "admin_products") {
    return (
      <div className="card p-6">
        <h3 className="text-xl font-black">Gestion produits</h3>
        <p className="mt-2 text-slate-500">
          Ici on pourra approuver, mettre en avant, sponsoriser, masquer ou
          supprimer des produits.
        </p>
      </div>
    );
  }

  return null;
}

export default async function DashboardRoute({
  params
}: {
  params: Promise<{ role: string; section?: string[] }>;
}) {
  const { role, section = [] } = await params;
  const safeRole = role as RouteKey;

  if (!dashboardConfig[safeRole]) notFound();

  const supabase = await createSupabaseServerClient();

  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role,is_primary_super_admin")
    .eq("id", userData.user.id)
    .single();

  if (!profile?.role) redirect("/login");

  if (!canAccessDashboard(profile.role, safeRole)) {
    if (
      profile.role === "seller_individual" ||
      profile.role === "seller_business"
    ) {
      redirect("/dashboard/seller");
    }

    if (profile.role === "super_admin" || profile.role === "admin") {
      redirect("/dashboard/admin");
    }

    if (profile.role === "partner") {
      redirect("/dashboard/partner");
    }

    if (profile.role === "agent") {
      redirect("/dashboard/agent");
    }

    redirect("/dashboard/buyer");
  }

  const key = section.join("/");
  const page =
    dashboardConfig[safeRole].content[key] ??
    dashboardConfig[safeRole].content[""];

  let sellerProducts: SellerProduct[] = [];

  if (safeRole === "seller") {
    const { data } = await supabase
      .from("products")
      .select("id,title,price,category,status,stock,shipping_method")
      .eq("seller_id", userData.user.id)
      .order("created_at", { ascending: false });

    sellerProducts = data || [];
  }

  let adminStats: AdminStats = {
    users: 0,
    products: 0,
    widgets: 0,
    vendors: 0,
    partners: 0
  };

  if (safeRole === "admin") {
    const [
      usersCount,
      productsCount,
      widgetsCount,
      vendorsCount,
      partnersCount
    ] = await Promise.all([
      supabase.from("users").select("id", { count: "exact", head: true }),
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("site_widgets").select("id", { count: "exact", head: true }),
      supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .in("role", ["seller_individual", "seller_business"]),
      supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("role", "partner")
    ]);

    adminStats = {
      users: usersCount.count ?? 0,
      products: productsCount.count ?? 0,
      widgets: widgetsCount.count ?? 0,
      vendors: vendorsCount.count ?? 0,
      partners: partnersCount.count ?? 0
    };
  }

  let widgets: SiteWidget[] = [];

  if (safeRole === "admin" && page.type === "admin_widgets") {
    const { data } = await supabase
      .from("site_widgets")
      .select(
        "id,page,zone,type,title,subtitle,description,button_text,button_href,position,is_active"
      )
      .order("page", { ascending: true })
      .order("position", { ascending: true });

    widgets = data || [];
  }

  return (
    <main className="container-page py-10">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-[#d20a1e]">
            {dashboardConfig[safeRole].label}
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.03em] text-[#071f3d]">
            {page.title}
          </h1>
        </div>
      </div>

      <nav className="mb-8 flex flex-wrap gap-3">
        {dashboardConfig[safeRole].nav.map((item) => {
          const href = item.slug
            ? `/dashboard/${safeRole}/${item.slug}`
            : `/dashboard/${safeRole}`;

          const active = key === item.slug;

          return (
            <Link
              key={item.slug || "home"}
              href={href}
              className={`rounded-xl px-4 py-3 text-sm font-black transition-all ${
                active
                  ? "bg-[#d20a1e] text-white"
                  : "bg-white text-[#071f3d] hover:bg-[#fff1f1] hover:text-[#d20a1e]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {safeRole === "seller" && page.type && (
        <SellerSection type={page.type} products={sellerProducts} />
      )}

      {safeRole === "admin" && page.type && (
        <AdminSection
          type={page.type}
          stats={adminStats}
          isSuperAdmin={profile.role === "super_admin"}
          widgets={widgets}
        />
      )}

      {safeRole === "buyer" && (
        <div className="card p-6">
          <p>Dashboard acheteur.</p>
        </div>
      )}

      {safeRole === "agent" && (
        <div className="card p-6">
          <p>Espace agent Maché.</p>
        </div>
      )}

      {safeRole === "partner" && (
        <div className="card p-6">
          <p>Espace partenaire Maché.</p>
        </div>
      )}
    </main>
  );
}
