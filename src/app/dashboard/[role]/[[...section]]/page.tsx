import { notFound } from "next/navigation";
import {
  createProductAction,
  deleteProductAction,
  pauseProductAction,
  publishProductAction
} from "./actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteKey = "buyer" | "seller" | "agent" | "admin";

type SellerProduct = {
  id: string;
  title: string;
  price: number;
  category: string | null;
  status: string | null;
  stock: number | null;
  shipping_method: string | null;
};

const dashboardStats = {
  buyer: [
    { label: "Commandes", value: "12" },
    { label: "Wishlist", value: "28" },
    { label: "Messages", value: "6" },
    { label: "Notifications", value: "14" }
  ],
  seller: [
    { label: "Ventes 30j", value: "$0" },
    { label: "Commandes", value: "0" },
    { label: "Balance disponible", value: "$0" },
    { label: "Produits actifs", value: "0" }
  ],
  agent: [
    { label: "Vérifications", value: "24" },
    { label: "Missions", value: "8" },
    { label: "Code actif", value: "Oui" },
    { label: "Statut public", value: "Actif" }
  ],
  admin: [
    { label: "GMV 30j", value: "$284,000" },
    { label: "Nouveaux vendeurs", value: "42" },
    { label: "Fraudes ouvertes", value: "11" },
    { label: "Commissions", value: "$18,420" }
  ]
};

const dashboardConfig: Record<
  RouteKey,
  {
    label: string;
    nav: Array<{ slug: string; label: string }>;
    content: Record<string, { title: string; type?: string; lines?: string[] }>;
  }
> = {
  buyer: {
    label: "Dashboard Buyer",
    nav: [
      { slug: "", label: "Résumé" },
      { slug: "orders", label: "Orders" },
      { slug: "wishlist", label: "Wishlist" },
      { slug: "messages", label: "Messages" },
      { slug: "profile", label: "Profile" },
      { slug: "addresses", label: "Addresses" },
      { slug: "notifications", label: "Notifications" }
    ],
    content: {
      "": {
        title: "Résumé du compte",
        lines: [
          "Vue générale de l’activité buyer.",
          "Structure prête pour commandes, wishlist, messagerie et notifications.",
          "Compatibilité directe avec Supabase Auth et profils utilisateurs."
        ]
      },
      orders: {
        title: "Commandes",
        lines: [
          "Historique des commandes, statuts, paiements et livraisons.",
          "Tables orders, order_items, payments, shipments et invoices prévues."
        ]
      },
      wishlist: {
        title: "Wishlist",
        lines: [
          "Architecture fonctionnelle via wishlists et wishlist_items.",
          "Ajout et retrait de produits prêts côté structure."
        ]
      },
      messages: {
        title: "Messages",
        lines: [
          "UI chat buyer ↔ seller prête pour conversations et messages.",
          "Statut de lecture et notifications prévus."
        ]
      },
      profile: {
        title: "Profil",
        lines: ["Données personnelles, sécurité compte et informations utilisateur."]
      },
      addresses: {
        title: "Adresses",
        lines: ["Gestion des adresses de livraison et de facturation."]
      },
      notifications: {
        title: "Notifications",
        lines: ["Centre de notifications utilisateur prêt pour commandes et messages."]
      }
    }
  },

  seller: {
    label: "Dashboard Seller",
    nav: [
      { slug: "", label: "Résumé" },
      { slug: "products", label: "Products" },
      { slug: "products/new", label: "New Product" },
      { slug: "orders", label: "Orders" },
      { slug: "wallet", label: "Wallet" },
      { slug: "payouts", label: "Payouts" },
      { slug: "store", label: "Store" },
      { slug: "promotions", label: "Promotions" },
      { slug: "reviews", label: "Reviews" },
      { slug: "messages", label: "Messages" },
      { slug: "settings", label: "Settings" },
      { slug: "verification", label: "Verification" },
      { slug: "shipping", label: "Shipping" }
    ],
    content: {
      "": { title: "Résumé vendeur", type: "seller_home" },
      products: { title: "Mes produits", type: "seller_products" },
      "products/new": { title: "Ajouter un produit", type: "seller_ai_form" },
      orders: { title: "Commandes vendeur", type: "seller_orders" },
      wallet: { title: "Wallet vendeur", type: "seller_wallet" },
      payouts: { title: "Payouts", type: "seller_payouts" },
      store: { title: "Boutique vendeur", type: "seller_store" },
      promotions: { title: "Promotions", type: "seller_promotions" },
      reviews: { title: "Avis vendeur", type: "seller_reviews" },
      messages: { title: "Messages & clients", type: "seller_clients" },
      settings: { title: "Paramètres boutique", type: "seller_settings" },
      verification: { title: "Vérification vendeur", type: "seller_verification" },
      shipping: { title: "Shipping", type: "seller_shipping" }
    }
  },

  agent: {
    label: "Dashboard Agent",
    nav: [
      { slug: "", label: "Résumé" },
      { slug: "profile", label: "Profile" },
      { slug: "verifications", label: "Verifications" },
      { slug: "code", label: "Code" }
    ],
    content: {
      "": {
        title: "Vue agent",
        lines: ["Suivi des missions, statut public, code et activité terrain."]
      },
      profile: {
        title: "Profil agent",
        lines: ["Informations publiques, zone, statut et identité visuelle."]
      },
      verifications: {
        title: "Vérifications terrain",
        lines: ["Rapports, missions, validations et suivi historique."]
      },
      code: {
        title: "Code agent",
        lines: ["Code public vérifiable via la page /verify-agent."]
      }
    }
  },

  admin: {
    label: "Dashboard Admin",
    nav: [
      { slug: "", label: "Résumé" },
      { slug: "users", label: "Users" },
      { slug: "vendors", label: "Vendors" },
      { slug: "agents", label: "Agents" },
      { slug: "products", label: "Products" },
      { slug: "orders", label: "Orders" },
      { slug: "payments", label: "Payments" },
      { slug: "refunds", label: "Refunds" },
      { slug: "commissions", label: "Commissions" },
      { slug: "categories", label: "Categories" },
      { slug: "reviews", label: "Reviews" },
      { slug: "content", label: "Content" },
      { slug: "notifications", label: "Notifications" },
      { slug: "export", label: "Export" },
      { slug: "fraud", label: "Fraud" },
      { slug: "logs", label: "Logs" }
    ],
    content: {
      "": {
        title: "Analytics globales",
        lines: [
          "GMV, commissions, fraudes ouvertes, croissance vendeur et activité marketplace.",
          "Architecture admin complète, mockée mais prête à connecter."
        ]
      },
      users: { title: "Utilisateurs", lines: ["Gestion des users et rôles."] },
      vendors: { title: "Vendeurs", lines: ["Gestion vendeurs, documents et risque."] },
      agents: { title: "Agents", lines: ["Validation agents et statut public."] },
      products: { title: "Produits", lines: ["Contrôle catalogue, modération et blocages."] },
      orders: { title: "Commandes", lines: ["Supervision commandes, états et anomalies."] },
      payments: { title: "Paiements", lines: ["Suivi paiements, providers et statuts."] },
      refunds: { title: "Remboursements", lines: ["Validation, suivi et audit."] },
      commissions: { title: "Commissions", lines: ["Commissions marketplace et reporting."] },
      categories: { title: "Catégories", lines: ["Gestion arborescence catégories."] },
      reviews: { title: "Avis", lines: ["Modération reviews et abus."] },
      content: { title: "Contenu", lines: ["Gestion pages et contenus administrés."] },
      notifications: { title: "Notifications", lines: ["Campagnes système et alertes."] },
      export: { title: "Export", lines: ["Pilotage export, fournisseurs, conformité."] },
      fraud: { title: "Fraude", lines: ["Fraud flags, scores de risque, blocages."] },
      logs: { title: "Logs", lines: ["Historique admin et audit trail."] }
    }
  }
};

function getShippingLabel(method: string | null) {
  if (method === "mache") return "Livraison Maché";
  if (method === "partner") return "Livraison partenaire";
  return "Livraison vendeur";
}

function SellerSection({
  type,
  products = []
}: {
  type?: string;
  products?: SellerProduct[];
}) {
  if (type === "seller_ai_form") {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-[rgba(232,66,10,.2)] bg-[var(--mache-dark)] p-6 text-white">
          <h3 className="text-sm font-bold">Ajouter un produit</h3>
          <p className="mt-2 text-sm text-white/50">
            Crée un produit réel dans Supabase avec images, stock et livraison.
            Il sera enregistré en brouillon.
          </p>
        </div>

        <form action={createProductAction} className="card p-6">
          <h3 className="mb-4 text-sm font-bold">Formulaire produit</h3>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              name="title"
              className="input"
              placeholder="Nom produit"
              required
            />

            <input
              name="price"
              className="input"
              placeholder="Prix"
              type="number"
              step="0.01"
              required
            />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <select name="category" className="input">
              <option value="Mode">Mode</option>
              <option value="Épicerie">Épicerie</option>
              <option value="Accessoires">Accessoires</option>
              <option value="Maison">Maison</option>
              <option value="Beauté">Beauté</option>
              <option value="Autre">Autre</option>
            </select>

            <input
              name="stock"
              className="input"
              placeholder="Stock disponible"
              type="number"
              min="0"
              defaultValue="1"
              required
            />
          </div>

          <textarea
            name="description"
            className="input mt-4 min-h-28"
            placeholder="Description produit"
          />

          <div className="mt-6 rounded-2xl border p-4">
            <h4 className="text-sm font-bold">Images du produit</h4>
            <p className="mt-1 text-xs text-[var(--mache-muted)]">
              Minimum 1 image, maximum 10 images. Colle les URLs des images.
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                name="image_1"
                className="input"
                placeholder="Image principale URL obligatoire"
                required
              />

              {Array.from({ length: 9 }).map((_, index) => (
                <input
                  key={index}
                  name={`image_${index + 2}`}
                  className="input"
                  placeholder={`Image ${index + 2} URL optionnelle`}
                />
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border p-4">
            <h4 className="text-sm font-bold">Livraison</h4>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <select
                name="shipping_method"
                className="input"
                defaultValue="seller"
              >
                <option value="mache">Livraison par Maché</option>
                <option value="partner">Livraison par partenaire</option>
                <option value="seller">Livraison par le vendeur</option>
              </select>

              <input
                name="shipping_note"
                className="input"
                placeholder="Note livraison optionnelle"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button type="submit" className="btn-primary">
              Enregistrer le produit
            </button>

            <a href="/dashboard/seller/products" className="btn-secondary">
              Annuler
            </a>
          </div>
        </form>
      </div>
    );
  }

  if (type === "seller_products") {
    if (products.length === 0) {
      return (
        <div className="card p-6">
          <p className="text-sm text-[var(--mache-muted)]">
            Tu n’as pas encore ajouté de produit.
          </p>

          <a
            href="/dashboard/seller/products/new"
            className="btn-primary mt-4 inline-flex"
          >
            Ajouter mon premier produit
          </a>
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {products.map((p) => (
          <div key={p.id} className="rounded-2xl border p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="badge">{p.category || "Autre"}</span>
              <span className="text-xs text-[var(--mache-muted)]">
                {p.status || "draft"}
              </span>
            </div>

            <h3 className="font-semibold">{p.title}</h3>
            <p className="mt-2 text-lg font-bold">${p.price}</p>

            <div className="mt-3 grid gap-1 text-xs text-[var(--mache-muted)]">
              <p>Stock : {p.stock ?? 0}</p>
              <p>{getShippingLabel(p.shipping_method)}</p>
            </div>

            <div className="mt-4 grid gap-2">
              {p.status !== "active" ? (
                <form action={publishProductAction}>
                  <input type="hidden" name="product_id" value={p.id} />
                  <button type="submit" className="btn-primary w-full">
                    Publier
                  </button>
                </form>
              ) : (
                <form action={pauseProductAction}>
                  <input type="hidden" name="product_id" value={p.id} />
                  <button type="submit" className="btn-secondary w-full">
                    Mettre en pause
                  </button>
                </form>
              )}

              <a
                href={`/product/${p.id}`}
                className="btn-secondary w-full justify-center text-center"
              >
                Voir la fiche
              </a>

              <form action={deleteProductAction}>
                <input type="hidden" name="product_id" value={p.id} />
                <button
                  type="submit"
                  className="w-full rounded-xl border border-red-200 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50"
                >
                  Supprimer
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "seller_home") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-6">
          <h3 className="text-lg font-bold">Bienvenue dans ton espace vendeur</h3>
          <p className="mt-2 text-sm text-[var(--mache-muted)]">
            Gère ta boutique, tes produits, tes commandes, ta livraison, ton wallet
            et tes documents.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/dashboard/seller/products/new" className="btn-primary">
              Ajouter un produit
            </a>

            <a href="/dashboard/seller/products" className="btn-secondary">
              Voir mes produits
            </a>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-bold">Prochaines sections</h3>
          <div className="mt-4 grid gap-3 text-sm text-[var(--mache-muted)]">
            <p>📦 Stock et variantes</p>
            <p>🚚 Livraison Maché / partenaire / vendeur</p>
            <p>💳 Portefeuille et virements</p>
            <p>📄 Factures</p>
            <p>📢 Publicité produits</p>
            <p>🏪 Personnalisation boutique</p>
            <p>✅ Documents et vérification</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <p className="text-sm text-[var(--mache-muted)]">
        Section vendeur prête à connecter.
      </p>
    </div>
  );
}

export default async function DashboardRoute({
  params
}: {
  params: Promise<{ role: string; section?: string[] }>;
}) {
  const { role, section = [] } = await params;
  const safeRole = role as RouteKey;

  if (!dashboardConfig[safeRole]) notFound();

  const key = section.join("/");
  const page =
    dashboardConfig[safeRole].content[key] ??
    dashboardConfig[safeRole].content[""];

  const navItems = dashboardConfig[safeRole].nav.map((item) => ({
    label: item.label,
    path: `/dashboard/${safeRole}${item.slug ? `/${item.slug}` : ""}`
  }));

  let sellerProducts: SellerProduct[] = [];

  if (safeRole === "seller") {
    const supabase = await createSupabaseServerClient();

    const { data: userData } = await supabase.auth.getUser();

    if (userData.user) {
      const { data } = await supabase
        .from("products")
        .select("id,title,price,category,status,stock,shipping_method")
        .eq("seller_id", userData.user.id)
        .order("created_at", { ascending: false });

      sellerProducts = data || [];
    }
  }

  const activeProducts = sellerProducts.filter((p) => p.status === "active");

  const stats =
    safeRole === "seller"
      ? [
          { label: "Ventes 30j", value: "$0" },
          { label: "Commandes", value: "0" },
          { label: "Balance disponible", value: "$0" },
          { label: "Produits actifs", value: String(activeProducts.length) }
        ]
      : dashboardStats[safeRole];

  return (
    <main className="container-page py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="badge">{dashboardConfig[safeRole].label}</span>
          <h1 className="mt-3 text-3xl font-bold">{page.title}</h1>
        </div>

        <a href="/shop" className="btn-secondary">
          Retour boutique
        </a>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="card p-4">
          <nav className="space-y-2 text-sm">
            {navItems.map((item) => (
              <a
                key={item.path}
                href={item.path}
                className="block rounded-2xl px-4 py-3 transition hover:bg-black/5 dark:hover:bg-white/5"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="card p-6">
                <p className="text-sm text-[var(--mache-muted)]">{stat.label}</p>
                <p className="mt-3 text-2xl font-bold">{stat.value}</p>
              </div>
            ))}
          </div>

          {safeRole === "seller" && page.type ? (
            <SellerSection type={page.type} products={sellerProducts} />
          ) : (
            <div className="card p-6">
              <div className="space-y-4">
                {page.lines?.map((line) => (
                  <div key={line} className="rounded-2xl border p-4">
                    <p className="text-sm text-[var(--mache-muted)]">{line}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
