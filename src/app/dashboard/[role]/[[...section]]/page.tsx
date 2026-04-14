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

function SellerSection({ type }: { type?: string }) {
  if (type === "seller_home") {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold">Commandes récentes</h3>
              <span className="text-xs text-[var(--mache-primary)]">Voir tout</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b">
                  <tr className="text-xs uppercase tracking-wide text-[var(--mache-muted)]">
                    <th className="px-2 py-3">Commande</th>
                    <th className="px-2 py-3">Client</th>
                    <th className="px-2 py-3">Total</th>
                    <th className="px-2 py-3">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["#MCH-2031", "Jean Pierre", "$120", "Livrée"],
                    ["#MCH-2030", "Marie B.", "$84", "En transit"],
                    ["#MCH-2029", "Carlos R.", "$210", "En attente"]
                  ].map((row) => (
                    <tr key={row[0]} className="border-b last:border-0">
                      {row.map((cell, i) => (
                        <td key={cell} className={`px-2 py-3 ${i === 0 ? "font-semibold" : ""}`}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <div className="card p-6">
              <h3 className="text-sm font-bold">Revenus — 7 jours</h3>
              <div className="mt-4 flex h-28 items-end gap-2">
                {[38, 60, 45, 80, 72, 90, 68].map((v, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-md bg-[var(--mache-primary)]/80"
                    style={{ height: `${v}%` }}
                  />
                ))}
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-sm font-bold">Top produits</h3>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between"><span>Robe artisanale</span><strong>$1,240</strong></div>
                <div className="flex justify-between"><span>Café premium</span><strong>$980</strong></div>
                <div className="flex justify-between"><span>Sac cuir Caraïbe</span><strong>$760</strong></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === "seller_products") {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          ["Robe artisanale", "Mode", "$79", "Actif"],
          ["Café premium", "Épicerie", "$18", "Actif"],
          ["Sac cuir Caraïbe", "Accessoires", "$120", "Stock bas"]
        ].map((p) => (
          <div key={p[0]} className="rounded-2xl border p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="badge">{p[1]}</span>
              <span className="text-xs text-[var(--mache-muted)]">{p[3]}</span>
            </div>
            <h3 className="font-semibold">{p[0]}</h3>
            <p className="mt-2 text-lg font-bold">{p[2]}</p>
          </div>
        ))}
      </div>
    );
  }

  if (type === "seller_ai_form") {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-[rgba(232,66,10,.2)] bg-[var(--mache-dark)] p-6 text-white">
          <h3 className="text-sm font-bold">Rédacteur IA</h3>
          <p className="mt-2 text-sm text-white/50">
            Génère un titre et une description à partir de quelques infos produit.
          </p>
          <textarea
            className="mt-4 min-h-24 w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none"
            placeholder="Ex: robe batik rouge, coton haïtien artisanal..."
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <button className="btn-primary">Générer la description</button>
            <button className="btn-secondary">Suggérer un titre</button>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="mb-4 text-sm font-bold">Formulaire produit</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <input className="input" placeholder="Nom produit" />
            <input className="input" placeholder="Prix" type="number" />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <select className="input">
              <option>Mode</option>
              <option>Épicerie</option>
              <option>Accessoires</option>
            </select>
            <input className="input" placeholder="Stock" type="number" />
            <input className="input" placeholder="Prix barré" type="number" />
          </div>
          <textarea className="input mt-4 min-h-28" placeholder="Description produit" />
          <div className="mt-4 flex gap-3">
            <button className="btn-primary">Publier le produit</button>
            <button className="btn-secondary">Annuler</button>
          </div>
        </div>
      </div>
    );
  }

  if (type === "seller_orders") {
    return (
      <div className="card p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b">
              <tr className="text-xs uppercase tracking-wide text-[var(--mache-muted)]">
                <th className="px-4 py-3">Commande</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Produit</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["#MCH-2031", "Jean Pierre", "Robe artisanale", "$120", "Livrée", "12/04"],
                ["#MCH-2030", "Marie Beauchamp", "Café premium", "$84", "En transit", "11/04"],
                ["#MCH-2029", "Carlos Rodriguez", "Sac cuir", "$210", "En attente", "10/04"]
              ].map((row) => (
                <tr key={row[0]} className="border-b last:border-0">
                  {row.map((cell, i) => (
                    <td key={cell} className={`px-4 py-3 ${i === 0 ? "font-semibold" : ""}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (type === "seller_wallet") {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card p-6"><p className="text-sm text-[var(--mache-muted)]">Pending balance</p><p className="mt-3 text-2xl font-bold">$1,240</p></div>
        <div className="card p-6"><p className="text-sm text-[var(--mache-muted)]">Available balance</p><p className="mt-3 text-2xl font-bold">$3,920</p></div>
        <div className="card p-6"><p className="text-sm text-[var(--mache-muted)]">Reserved balance</p><p className="mt-3 text-2xl font-bold">$540</p></div>
      </div>
    );
  }

  if (type === "seller_payouts") {
    return (
      <div className="space-y-4">
        <div className="card p-6">
          <h3 className="text-sm font-bold">Payout schedule</h3>
          <p className="mt-2 text-sm text-[var(--mache-muted)]">
            Prévu à J+7 ou J+15 selon conformité, litiges et score de risque.
          </p>
        </div>
        <div className="card p-6">
          <div className="flex justify-between text-sm"><span>Dernier payout</span><strong>$680</strong></div>
          <div className="mt-3 flex justify-between text-sm"><span>Statut</span><span>Paid</span></div>
        </div>
      </div>
    );
  }

  if (type === "seller_store") {
    return (
      <div className="space-y-4">
        <input className="input" placeholder="Nom de la boutique" />
        <textarea className="input min-h-28" placeholder="Description boutique" />
        <button className="btn-primary">Sauvegarder</button>
      </div>
    );
  }

  if (type === "seller_promotions") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-6"><h3 className="font-bold">Promotion active</h3><p className="mt-2 text-sm text-[var(--mache-muted)]">-20% sur collection mode</p></div>
        <div className="card p-6"><h3 className="font-bold">Produit boosté</h3><p className="mt-2 text-sm text-[var(--mache-muted)]">Mise en avant homepage prévue</p></div>
      </div>
    );
  }

  if (type === "seller_reviews") {
    return (
      <div className="space-y-4">
        {["Très bon produit", "Livraison correcte", "Belle qualité"].map((review) => (
          <div key={review} className="rounded-2xl border p-4">
            <p className="font-semibold">⭐ 5/5</p>
            <p className="mt-2 text-sm text-[var(--mache-muted)]">{review}</p>
          </div>
        ))}
      </div>
    );
  }

  if (type === "seller_clients") {
    return (
      <div className="card p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b">
              <tr className="text-xs uppercase tracking-wide text-[var(--mache-muted)]">
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Commandes</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Pays</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Jean Pierre", "jean@email.com", "5", "$625", "Haïti"],
                ["Marie Beauchamp", "marie.b@gmail.com", "3", "$280", "France"],
                ["Carlos Rodriguez", "carlos@email.com", "8", "$950", "R. Dom."]
              ].map((row) => (
                <tr key={row[0]} className="border-b last:border-0">
                  {row.map((cell, i) => (
                    <td key={cell} className={`px-4 py-3 ${i === 0 ? "font-semibold" : ""}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (type === "seller_settings") {
    return (
      <div className="space-y-4">
        <div className="card p-6">
          <h3 className="mb-4 text-sm font-bold">Informations boutique</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <input className="input" defaultValue="Mache Store" />
            <input className="input" defaultValue="store@mache.market" type="email" />
          </div>
          <textarea
            className="input mt-4 min-h-24"
            defaultValue="Boutique marketplace premium centrée sur Haïti et la diaspora."
          />
          <button className="btn-primary mt-4">Sauvegarder</button>
        </div>
      </div>
    );
  }

  if (type === "seller_verification") {
    return (
      <div className="space-y-4">
        <div className="card p-6"><h3 className="font-bold">Documents</h3><p className="mt-2 text-sm text-[var(--mache-muted)]">Identité, documents business, conformité et revue.</p></div>
        <div className="card p-6"><h3 className="font-bold">Statut</h3><p className="mt-2 text-sm text-[var(--mache-muted)]">Vérification en attente / approuvée selon contrôle.</p></div>
      </div>
    );
  }

  if (type === "seller_shipping") {
    return (
      <div className="space-y-4">
        <div className="card p-6"><h3 className="font-bold">Zones d’expédition</h3><p className="mt-2 text-sm text-[var(--mache-muted)]">Haïti, USA, Canada, France, diaspora.</p></div>
        <div className="card p-6"><h3 className="font-bold">Délais</h3><p className="mt-2 text-sm text-[var(--mache-muted)]">National, régional et international selon destination.</p></div>
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
                <p className="text-sm text-[var(--mache-muted)]">{stat.label}</p>
                <p className="mt-3 text-2xl font-bold">{stat.value}</p>
              </div>
            ))}
          </div>

          {safeRole === "seller" && page.type ? (
            <SellerSection type={page.type} />
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
