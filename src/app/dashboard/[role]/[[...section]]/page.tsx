import { notFound } from "next/navigation";

type RouteKey = "buyer" | "seller" | "agent" | "admin";

const dashboardStats = {
  buyer: [
    { label: "Commandes", value: "12" },
    { label: "Wishlist", value: "28" },
    { label: "Messages", value: "6" },
    { label: "Notifications", value: "14" }
  ],
  seller: [
    { label: "Ventes 30j", value: "$12,840" },
    { label: "Commandes", value: "96" },
    { label: "Balance disponible", value: "$3,920" },
    { label: "Produits actifs", value: "41" }
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
    content: Record<string, { title: string; lines: string[] }>;
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
      "": {
        title: "Résumé vendeur",
        lines: [
          "Suivi des ventes, commandes, wallet, promotions et conformité.",
          "Architecture seller_individual et seller_business compatible."
        ]
      },
      products: {
        title: "Produits",
        lines: [
          "Catalogue vendeur, statuts produits et visibilité.",
          "Statuts supportés : draft, submitted, auto_approved, manual_review, active, rejected, paused, archived."
        ]
      },
      "products/new": {
        title: "Nouveau produit",
        lines: [
          "Formulaire produit prêt à brancher sur Supabase.",
          "Publication auto si vendeur vérifié + documents valides + catégorie autorisée + infos complètes + aucune anomalie.",
          "Sinon : statut manual_review."
        ]
      },
      orders: {
        title: "Commandes vendeur",
        lines: [
          "Suivi des commandes, préparation, expédition, litiges et confirmations."
        ]
      },
      wallet: {
        title: "Wallet vendeur",
        lines: [
          "pending_balance, available_balance, reserved_balance, payouts et historique.",
          "L’argent passe en attente puis devient disponible après délai de sécurité ou confirmation de livraison."
        ]
      },
      payouts: {
        title: "Payouts",
        lines: [
          "Prévu pour payout à 7 ou 15 jours.",
          "Suspension possible si fraude, litige ou anomalie."
        ]
      },
      store: {
        title: "Boutique vendeur",
        lines: ["Personnalisation de la boutique, branding et visibilité vendeur."]
      },
      promotions: {
        title: "Promotions",
        lines: ["Gestion remises, campagnes et produits boostés."]
      },
      reviews: {
        title: "Avis vendeur",
        lines: ["Suivi des notes et modération liée au vendeur."]
      },
      messages: {
        title: "Messages vendeur",
        lines: ["Centre de communication buyer ↔ seller."]
      },
      settings: {
        title: "Paramètres vendeur",
        lines: ["Configuration boutique, sécurité et préférences."]
      },
      verification: {
        title: "Vérification vendeur",
        lines: ["Documents, conformité, identité et statut de validation."]
      },
      shipping: {
        title: "Shipping",
        lines: ["Règles d’expédition, délais, zones et frais."]
      }
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
        lines: [
          "Suivi des missions, statut public, code et activité terrain."
        ]
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

  const stats = dashboardStats[safeRole];

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
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {stat.label}
                </p>
                <p className="mt-3 text-2xl font-bold">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="card p-6">
            <div className="space-y-4">
              {page.lines.map((line) => (
                <div key={line} className="rounded-2xl border p-4">
                  <p className="text-sm text-neutral-600 dark:text-neutral-300">
                    {line}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
