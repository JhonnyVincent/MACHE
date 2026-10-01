/*
  PAGE VENDEUR : « Accueil » (adresse /seller/bien-demarrer).

  Le vendeur compose lui-même son accueil : des blocs (widgets) qu'il
  affiche, masque et range. Le choix est gardé dans son navigateur.

  Pourquoi elle existe

  Le panneau Mercur est complet mais pensé pour des équipes e-commerce :
  une vendeuse de Jacmel qui l'ouvre pour la première fois voit une
  liste de rubriques (Offres, Inventaire, Listes de prix…) sans savoir
  par où commencer. Cette page est la première du menu et dit, dans
  l'ordre, les quelques gestes qui comptent — avec, pour chacun, s'il
  est déjà fait.

  Ce qu'elle lit

  Uniquement des comptes (combien de produits en vente, de modes de
  livraison, de commandes, de devis en attente) et la fiche de la
  boutique. Une lecture qui échoue n'invente rien : l'étape s'affiche
  sans coche, avec son bouton.

  Note de style

  Comme les pages Devis et Chiffres : React seul, sans les composants
  d'interface de Medusa (voir routes/devis/page.tsx).
*/

import { useEffect, useState } from "react";

declare const __BACKEND_URL__: string;

export const config = {
  label: "Accueil",
  rank: 0,
};

type Status = {
  sellerName: string | null;
  hasAddress: boolean | null;
  hasPhone: boolean | null;
  offers: number | null;
  shippingOptions: number | null;
  orders: number | null;
  pendingQuotes: number | null;
  status: string | null;
  awaiting: number | null;
  weekOrders: number | null;
  weekRevenue: string | null;
  profile: Profile | null;
  minOrder: number;
  resellers: Reseller[] | null;
  resellerProducts: number | null;
};

type Reseller = { id: string; name: string; handle: string; shared_products: number; examples: string[] };

const EMPTY: Status = {
  sellerName: null,
  hasAddress: null,
  hasPhone: null,
  offers: null,
  shippingOptions: null,
  orders: null,
  pendingQuotes: null,
  status: null,
  profile: null,
  minOrder: 0,
  resellers: null,
  resellerProducts: null,
  awaiting: null,
  weekOrders: null,
  weekRevenue: null,
};

async function read<T>(path: string): Promise<T | null> {
  const base = typeof __BACKEND_URL__ === "string" ? __BACKEND_URL__ : "";

  try {
    const response = await fetch(`${base}${path}`, { credentials: "include" });

    if (!response.ok) return null;

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

type Count = { count?: number };

/*
  Le profil déclaré par le vendeur : vendeur, grossiste (« fournisseur »)
  ou marque. Les anciens profils « particulier » et « business » sont des
  vendeurs. Sans profil déclaré, rien n'est supposé.
*/
type Profile = "vendeur" | "fournisseur" | "marque";

function readProfile(metadata: unknown): Profile | null {
  const raw = (metadata as Record<string, unknown> | undefined)?.profile;

  if (raw === "fournisseur" || raw === "marque") return raw;
  if (raw === "vendeur" || raw === "particulier" || raw === "business") return "vendeur";

  return null;
}

const PROFILE_TEXT: Record<Profile, { title: string; text: string }> = {
  vendeur: {
    title: "Vous êtes vendeur",
    text: "Vos produits sont visibles de tous les acheteurs. Vous pouvez aussi acheter auprès des grossistes et des marques.",
  },
  fournisseur: {
    title: "Vous êtes grossiste",
    text: "Vous vendez par quantité. Vos produits et vos prix sont réservés aux vendeurs et aux comptes professionnels : le public ne vous voit pas.",
  },
  marque: {
    title: "Vous êtes une marque",
    text: "Vous créez un produit et le confiez à des revendeurs. Votre marque est visible du public et des vendeurs, et vous pouvez aussi vendre vous-même.",
  },
};

async function loadStatus(): Promise<Status> {
  const [me, offers, shipping, orders, quotes, week] = await Promise.all([
    read<{ seller?: Record<string, unknown> }>("/vendor/sellers/me"),
    read<Count>("/vendor/offers?limit=1&fields=id"),
    read<Count>("/vendor/shipping-options?limit=1&fields=id"),
    read<Count>("/vendor/orders?limit=1&fields=id"),
    read<{ quotes?: Array<{ status?: string }> }>("/vendor/quotes"),
    read<{ awaiting?: number; orders?: number; currencies?: Array<{ currency_code: string; revenue: number }> }>("/vendor/analytics?days=7"),
  ]);

  const seller = me?.seller ?? null;
  const address = (seller?.address ?? null) as Record<string, unknown> | null;

  const status: Status = {
    sellerName: typeof seller?.name === "string" ? seller.name : null,
    hasAddress: seller ? Boolean(address && (address.address_1 || address.city)) : null,
    hasPhone: seller ? Boolean(seller.phone) : null,
    offers: typeof offers?.count === "number" ? offers.count : null,
    shippingOptions: typeof shipping?.count === "number" ? shipping.count : null,
    orders: typeof orders?.count === "number" ? orders.count : null,
    pendingQuotes: quotes?.quotes ? quotes.quotes.filter((quote) => quote.status === "pending").length : null,
    status: typeof seller?.status === "string" ? seller.status : null,
    profile: readProfile(seller?.metadata),
    minOrder: Math.max(0, Math.floor(Number((seller?.metadata as Record<string, unknown> | undefined)?.min_order)) || 0),
    awaiting: typeof week?.awaiting === "number" ? week.awaiting : null,
    weekOrders: typeof week?.orders === "number" ? week.orders : null,
    weekRevenue: week?.currencies
      ? week.currencies.length === 0
        ? "0"
        : week.currencies.map((c) => `${Math.round(c.revenue).toLocaleString("fr-FR")} ${c.currency_code.toUpperCase()}`).join(" + ")
      : null,
    resellers: null,
    resellerProducts: null,
  };

  /* Les revendeurs ne sont lus que pour une marque : c'est elle qui en a. */
  if (status.profile === "marque") {
    const data = await read<{ resellers?: Reseller[]; products?: number }>("/vendor/resellers");

    if (data?.resellers) {
      status.resellers = data.resellers;
      status.resellerProducts = typeof data.products === "number" ? data.products : null;
    }
  }

  return status;
}

type Step = {
  title: string;
  why: string;
  done: boolean | null;
  href: string;
  action: string;
};

function Check({ done }: { done: boolean | null }) {
  const style = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    borderRadius: 999,
    flexShrink: 0,
    fontWeight: 700,
    fontSize: 15,
    background: done ? "#15803d" : "#f3f4f6",
    color: done ? "#ffffff" : "#6b7280",
    border: done ? "none" : "1px solid #d1d5db",
  } as const;

  return <span style={style} aria-label={done ? "Fait" : "À faire"}>{done ? "✓" : "•"}</span>;
}

type WidgetId = "premiers-pas" | "demandes" | "ventes" | "grossiste" | "boutique" | "pub" | "avis" | "gros" | "marque";

const ALL_WIDGETS: Array<{ id: WidgetId; label: string }> = [
  { id: "premiers-pas", label: "Premiers pas" },
  { id: "demandes", label: "Demandes à traiter" },
  { id: "ventes", label: "Mes ventes" },
  { id: "grossiste", label: "Trouver un grossiste" },
  { id: "boutique", label: "Ma boutique" },
  { id: "pub", label: "Mettre un produit en avant" },
  { id: "avis", label: "Avis clients" },
  { id: "gros", label: "Vendre en gros" },
  { id: "marque", label: "Ma marque et mes revendeurs" },
];

/* Les blocs propres à un profil n'apparaissent que pour ce profil. */
const ONLY_FOR: Partial<Record<WidgetId, Profile>> = { gros: "fournisseur", marque: "marque" };

/* L'ordre de départ change avec le profil : un grossiste commence par ses demandes de devis. */
function defaultOrder(profile: Profile | null): WidgetId[] {
  const all = ALL_WIDGETS.map((w) => w.id);
  const first: WidgetId[] = profile === "fournisseur" ? ["demandes", "gros"] : profile === "marque" ? ["marque", "demandes"] : [];

  return [...first, ...all.filter((id) => !first.includes(id))];
}

type Layout = { order: WidgetId[]; hidden: WidgetId[] };

const DEFAULT_LAYOUT: Layout = { order: ALL_WIDGETS.map((w) => w.id), hidden: [] };
const STORAGE_KEY = "mache.accueil.v1";

/* Le stockage du navigateur peut être absent ou vide : l'accueil s'affiche alors par défaut. */
function readLayout(profile: Profile | null): Layout {
  try {
    const raw = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
    const known = ALL_WIDGETS.map((w) => w.id);
    const order = Array.isArray(raw?.order) ? raw.order.filter((id: WidgetId) => known.includes(id)) : [];
    const saved = order.length > 0;
    const hidden = Array.isArray(raw?.hidden) ? raw.hidden.filter((id: WidgetId) => known.includes(id)) : [];
    /* Un bloc ajouté plus tard à la liste apparaît en fin d'accueil. */
    if (!saved) return { order: defaultOrder(profile), hidden };
    for (const id of known) if (!order.includes(id)) order.push(id);
    return { order, hidden };
  } catch {
    return DEFAULT_LAYOUT;
  }
}

function saveLayout(layout: Layout) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch {
    /* sans stockage, le choix dure le temps de la visite */
  }
}

/*
  Visite guidée : quelques cartes, une par rubrique utile, qu'on peut
  suivre ou passer d'un clic. Elle s'ouvre à la première visite, puis
  reste disponible par le bouton « Visite guidée ».
*/
const TOUR: Array<{ title: string; text: string; href: string; action: string }> = [
  {
    title: "Gérer vos commandes",
    text: "Quand un client commande, vous recevez un e-mail et la commande apparaît ici. Appelez le client pour organiser la livraison, puis marquez-la comme envoyée.",
    href: "/seller/orders",
    action: "Voir mes commandes",
  },
  {
    title: "Voir qui vous a contacté",
    text: "Les acheteurs et les autres vendeurs vous demandent un prix pour une quantité : ce sont les devis. Répondez avec un prix total, ils reçoivent votre réponse par e-mail.",
    href: "/seller/devis",
    action: "Ouvrir les devis",
  },
  {
    title: "Ajouter vos produits",
    text: "Un titre clair, une bonne photo, le prix en gourdes et le stock. C'est ce qui fait vendre.",
    href: "/seller/products",
    action: "Mes produits",
  },
  {
    title: "Trouver un grossiste ou une marque",
    text: "Vous cherchez de quoi revendre ? Les grossistes et les marques ne sont visibles que des vendeurs. Contactez-les et demandez un devis.",
    href: "/seller/fournisseurs",
    action: "Chercher un fournisseur",
  },
  {
    title: "Suivre votre argent",
    text: "Vos ventes, les chiffres de la période et vos versements sont dans « Chiffres » et « Versements ».",
    href: "/seller/analytics",
    action: "Voir mes chiffres",
  },
];

const TOUR_KEY = "mache.visite.v1";

const widgetBox = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "16px 18px",
  background: "#ffffff",
} as const;

const taskCard = {
  ...{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 16px", background: "#ffffff" },
  display: "flex",
  flexDirection: "column",
  gap: 4,
  color: "#111827",
  textDecoration: "none",
  fontSize: 14,
} as const;

const linkStyle = { color: "#d41834", fontWeight: 700, textDecoration: "none" } as const;

function Widget({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={widgetBox}>
      <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{title}</h2>
      <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.6, color: "#374151" }}>{children}</div>
    </section>
  );
}

function Count({ value, label }: { value: number | null; label: string }) {
  return (
    <p style={{ margin: "0 0 6px" }}>
      <span style={{ fontSize: 28, fontWeight: 800, color: "#111827" }}>{value === null ? "–" : value}</span>{" "}
      {label}
    </p>
  );
}

const BienDemarrerPage = () => {
  const [status, setStatus] = useState<Status>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [layout, setLayout] = useState<Layout>(DEFAULT_LAYOUT);
  const [editing, setEditing] = useState(false);
  const [tour, setTour] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;


    /* La visite s'ouvre une seule fois ; sans stockage, elle ne s'impose pas. */
    try {
      if (!window.localStorage.getItem(TOUR_KEY)) setTour(0);
    } catch {
      /* rien */
    }

    loadStatus().then((next) => {
      if (alive) {
        setStatus(next);
        setLayout(readLayout(next.profile));
        setLoaded(true);
      }
    });

    return () => {
      alive = false;
    };
  }, []);

  const closeTour = () => {
    setTour(null);
    try {
      window.localStorage.setItem(TOUR_KEY, "1");
    } catch {
      /* rien */
    }
  };

  const update = (next: Layout) => {
    setLayout(next);
    saveLayout(next);
  };

  const toggle = (id: WidgetId) =>
    update({
      ...layout,
      hidden: layout.hidden.includes(id) ? layout.hidden.filter((h) => h !== id) : [...layout.hidden, id],
    });

  const move = (id: WidgetId, delta: number) => {
    const order = [...layout.order];
    const from = order.indexOf(id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= order.length) return;
    [order[from], order[to]] = [order[to], order[from]];
    update({ ...layout, order });
  };

  const steps: Step[] = [
    {
      title: "Compléter la fiche de votre boutique",
      why: "Adresse et téléphone : les clients et les livreurs doivent pouvoir vous joindre.",
      done: status.hasAddress === null ? null : Boolean(status.hasAddress && status.hasPhone),
      href: "/seller/settings/store",
      action: "Ouvrir ma boutique",
    },
    {
      title: "Dire où vous livrez",
      why: "Sans mode de livraison, un client ne peut pas terminer sa commande (Paramètres → Lieux et livraison).",
      done: status.shippingOptions === null ? null : status.shippingOptions > 0,
      href: "/seller/settings/locations",
      action: "Régler la livraison",
    },
    {
      title: "Mettre en vente votre premier produit",
      why: "Un titre clair, une bonne photo, le prix en gourdes et le stock.",
      done: status.offers === null ? null : status.offers > 0,
      href: "/seller/products/create",
      action: "Ajouter un produit",
    },
    {
      title: "Suivre vos commandes",
      why: "Vous recevez aussi un e-mail à chaque nouvelle commande. Appelez le client pour organiser la livraison.",
      done: status.orders === null ? null : status.orders > 0,
      href: "/seller/orders",
      action: "Voir mes commandes",
    },
  ];

  const pending = status.pendingQuotes ?? 0;

  const blocks: Record<WidgetId, React.ReactNode> = {
    "premiers-pas": (
      <Widget title="Premiers pas">
        <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
          {steps.map((step, index) => (
            <li key={step.title} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <Check done={loaded ? step.done : null} />
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 700 }}>
                  {index + 1}. {step.title}
                </p>
                <p style={{ margin: "2px 0 0", color: "#4b5563" }}>{step.why}</p>
                <a href={step.href} style={linkStyle}>
                  {step.action} →
                </a>
              </div>
            </li>
          ))}
        </ol>
      </Widget>
    ),
    demandes: (
      <Widget title="Demandes à traiter">
        <Count value={status.pendingQuotes} label={pending > 1 ? "demandes de devis attendent votre réponse" : "demande de devis attend votre réponse"} />
        <p style={{ margin: 0 }}>
          Elles viennent d&apos;acheteurs et d&apos;autres vendeurs. Répondez avec un prix pour la quantité demandée.
        </p>
        <a href="/seller/devis" style={linkStyle}>Ouvrir les devis →</a>
      </Widget>
    ),
    ventes: (
      <Widget title="Mes ventes">
        <Count value={status.orders} label="commandes reçues" />
        <a href="/seller/orders" style={linkStyle}>Voir mes commandes →</a>
        <br />
        <a href="/seller/analytics" style={linkStyle}>Voir mes chiffres →</a>
        <br />
        <a href="/seller/payouts" style={linkStyle}>Mes versements →</a>
      </Widget>
    ),
    grossiste: (
      <Widget title="Trouver un grossiste ou une marque">
        <p style={{ margin: "0 0 6px" }}>
          Les grossistes vendent par quantité et ne sont visibles que des vendeurs comme vous. Les marques
          vous confient leurs produits à revendre. Contactez-les, demandez un devis, puis revendez sur votre
          boutique.
        </p>
        <a href="/seller/fournisseurs" style={linkStyle}>Chercher un fournisseur →</a>
      </Widget>
    ),
    boutique: (
      <Widget title="Ma boutique">
        <Count value={status.offers} label="produits en vente" />
        <a href="/seller/products" style={linkStyle}>Mes produits →</a>
        <br />
        <a href="/seller/settings/store" style={linkStyle}>Fiche de la boutique →</a>
        <br />
        <a href="/seller/settings/users" style={linkStyle}>Mon équipe →</a>
      </Widget>
    ),
    pub: (
      <Widget title="Mettre un produit en avant">
        <p style={{ margin: "0 0 6px" }}>
          La publicité et les produits sponsorisés ne sont pas encore ouverts. Écrivez-nous si vous voulez
          mettre un produit en avant : nous étudions chaque demande avec vous.
        </p>
        <a href="/contact" style={linkStyle}>Écrire à MACHE →</a>
      </Widget>
    ),
    avis: (
      <Widget title="Avis clients">
        <p style={{ margin: "0 0 6px" }}>Lisez ce que disent vos clients et répondez-leur.</p>
        <a href="/seller/reviews" style={linkStyle}>Voir les avis →</a>
      </Widget>
    ),
    gros: (
      <Widget title="Vendre en gros">
        <p style={{ margin: "0 0 6px" }}>
          {status.minOrder > 0
            ? `Commande minimum : ${status.minOrder.toLocaleString("fr-FR")} HTG.`
            : "Vous n'avez pas fixé de commande minimum : vous pouvez le faire depuis votre profil sur le site."}{" "}
          Dans chaque produit, ajoutez des prix selon la quantité.
        </p>
        <p style={{ margin: "0 0 6px" }}>Les vendeurs et les comptes professionnels vous demandent des devis : répondez avec un prix pour la quantité demandée.</p>
        <a href="/seller/devis" style={linkStyle}>Ouvrir les devis →</a>
        <br />
        <a href="/seller/products" style={linkStyle}>Mes produits et leurs prix →</a>
      </Widget>
    ),
    marque: (
      <Widget title="Ma marque et mes revendeurs">
        {status.resellers === null ? (
          <p style={{ margin: "0 0 6px" }}>Chargement de vos revendeurs…</p>
        ) : status.resellers.length === 0 ? (
          <p style={{ margin: "0 0 6px" }}>
            Aucun revendeur ne propose encore vos produits. Quand un vendeur propose une offre sur un de vos produits,
            il apparaît ici, avec votre nom de marque sur sa fiche.
          </p>
        ) : (
          <>
            <Count value={status.resellers.length} label={status.resellers.length > 1 ? "revendeurs proposent vos produits" : "revendeur propose vos produits"} />
            <ul style={{ margin: "0 0 8px", paddingLeft: 18 }}>
              {status.resellers.slice(0, 5).map((reseller) => (
                <li key={reseller.id}>
                  <strong>{reseller.name}</strong> · {reseller.shared_products} produit{reseller.shared_products > 1 ? "s" : ""}
                  {reseller.examples.length > 0 ? ` (${reseller.examples.join(", ")})` : ""}
                </li>
              ))}
            </ul>
          </>
        )}
        <a href="/seller/revendeurs" style={linkStyle}>Choisir mes revendeurs →</a>
        <br />
        <a href="/seller/devis" style={linkStyle}>Voir les demandes des revendeurs →</a>
      </Widget>
    ),
  };

  const visible = layout.order.filter(
    (id) => !layout.hidden.includes(id) && (!ONLY_FOR[id] || ONLY_FOR[id] === status.profile)
  );

  return (
    <div style={{ background: "#f9f7f4", minHeight: "100vh" }}>
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "24px 16px 48px", fontFamily: "inherit", color: "#111827" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>
          Bienvenue{status.sellerName ? `, ${status.sellerName}` : ""}
        </h1>
        <button
          type="button"
          onClick={() => setTour(0)}
          style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", marginLeft: "auto", marginRight: 8 }}
        >
          Visite guidée
        </button>
        <button
          type="button"
          onClick={() => setEditing(!editing)}
          style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
        >
          {editing ? "Terminer" : "Personnaliser mon accueil"}
        </button>
      </div>

      {status.profile && (
        <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: "#eef2ff", color: "#1e3a8a", fontSize: 14 }}>
          <strong>{PROFILE_TEXT[status.profile].title}.</strong> {PROFILE_TEXT[status.profile].text}
        </div>
      )}

      {status.status && status.status !== "open" && (
        <p style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: "#fef3c7", color: "#78350f", fontSize: 14 }}>
          Votre boutique attend l&apos;approbation de MACHE. Vous pouvez tout préparer dès maintenant : elle
          apparaîtra dans le catalogue une fois approuvée, et vous serez prévenu par e-mail.
        </p>
      )}

      <h2 style={{ fontSize: 20, fontWeight: 800, margin: "24px 0 10px" }}>Principales tâches</h2>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        <a href="/seller/orders" style={taskCard}>
          <strong>Commandes →</strong>
          <span>{status.awaiting === null ? "–" : status.awaiting} à préparer ou à envoyer</span>
        </a>
        <a href="/seller/devis" style={taskCard}>
          <strong>Demandes de devis →</strong>
          <span>{status.pendingQuotes === null ? "–" : status.pendingQuotes} à traiter (acheteurs et vendeurs)</span>
        </a>
        <a href="/seller/products" style={taskCard}>
          <strong>Produits →</strong>
          <span>{status.offers === null ? "–" : status.offers} en vente</span>
        </a>
      </div>

      <h2 style={{ fontSize: 20, fontWeight: 800, margin: "28px 0 10px" }}>Statistiques</h2>
      <div style={{ ...widgetBox, display: "flex", flexWrap: "wrap", gap: 28 }}>
        <p style={{ margin: 0, fontSize: 13, color: "#6b7280", flexBasis: "100%" }}>Les 7 derniers jours</p>
        <div>
          <div style={{ fontSize: 13, color: "#6b7280" }}>Commandes</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{status.weekOrders === null ? "–" : status.weekOrders}</div>
        </div>
        <div>
          <div style={{ fontSize: 13, color: "#6b7280" }}>Revenu</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{status.weekRevenue === null ? "–" : status.weekRevenue}</div>
        </div>
        <a href="/seller/analytics" style={{ ...linkStyle, alignSelf: "flex-end" }}>Voir tout →</a>
      </div>

      <h2 style={{ fontSize: 20, fontWeight: 800, margin: "28px 0 4px" }}>Mon accueil</h2>
      {editing && (
        <div style={{ ...widgetBox, marginTop: 16, background: "#f9fafb" }}>
          <p style={{ margin: "0 0 8px", fontSize: 14, color: "#4b5563" }}>
            Cochez les blocs à afficher et changez leur ordre avec les flèches.
          </p>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6 }}>
            {layout.order.filter((id) => !ONLY_FOR[id] || ONLY_FOR[id] === status.profile).map((id, index, applicable) => (
              <li key={id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                  <input type="checkbox" checked={!layout.hidden.includes(id)} onChange={() => toggle(id)} />
                  {ALL_WIDGETS.find((w) => w.id === id)?.label}
                </label>
                <button type="button" aria-label="Monter" disabled={index === 0} onClick={() => move(id, -1)}>↑</button>
                <button type="button" aria-label="Descendre" disabled={index === applicable.length - 1} onClick={() => move(id, 1)}>↓</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ marginTop: 16, display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        {visible.map((id) => (
          <div key={id}>{blocks[id]}</div>
        ))}
      </div>

      {visible.length === 0 && (
        <p style={{ marginTop: 16, fontSize: 14, color: "#6b7280" }}>
          Aucun bloc affiché. Cliquez sur « Personnaliser mon accueil » pour en choisir.
        </p>
      )}

      {tour !== null && (
        <div
          role="dialog"
          aria-label="Visite guidée"
          style={{ position: "fixed", right: 20, bottom: 20, width: 340, maxWidth: "calc(100vw - 40px)", background: "#2f5fd0", color: "#ffffff", borderRadius: 12, padding: "16px 18px", boxShadow: "0 8px 30px rgba(0,0,0,.25)", zIndex: 50 }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, opacity: 0.85 }}>
            <span>Étape {tour + 1} sur {TOUR.length}</span>
            <button type="button" aria-label="Fermer" onClick={closeTour} style={{ background: "none", border: "none", color: "#fff", fontSize: 18, cursor: "pointer" }}>×</button>
          </div>
          <p style={{ margin: "6px 0 4px", fontSize: 17, fontWeight: 800 }}>{TOUR[tour].title}</p>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55 }}>{TOUR[tour].text}</p>
          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            <a href={TOUR[tour].href} style={{ padding: "8px 12px", borderRadius: 8, background: "#fff", color: "#1e3a8a", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
              {TOUR[tour].action}
            </a>
            {tour < TOUR.length - 1 ? (
              <button type="button" onClick={() => setTour(tour + 1)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #fff", background: "transparent", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                Suivant
              </button>
            ) : (
              <button type="button" onClick={closeTour} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #fff", background: "transparent", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                Terminer
              </button>
            )}
            <button type="button" onClick={closeTour} style={{ padding: "8px 4px", background: "none", border: "none", color: "#fff", textDecoration: "underline", fontSize: 13, cursor: "pointer" }}>
              Passer la visite
            </button>
          </div>
        </div>
      )}

      <p style={{ marginTop: 24, fontSize: 13, color: "#6b7280" }}>
        Besoin d&apos;aide ? Écrivez à l&apos;équipe MACHE depuis la page « Nous écrire » du site. La langue du
        panneau se change dans Paramètres → Profil.
      </p>
    </div>
    </div>
  );
};

export default BienDemarrerPage;
