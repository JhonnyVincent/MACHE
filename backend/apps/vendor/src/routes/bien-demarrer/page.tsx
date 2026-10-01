/*
  PAGE VENDEUR : « Bien démarrer ».

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
  label: "Bien démarrer",
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
};

const EMPTY: Status = {
  sellerName: null,
  hasAddress: null,
  hasPhone: null,
  offers: null,
  shippingOptions: null,
  orders: null,
  pendingQuotes: null,
  status: null,
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

async function loadStatus(): Promise<Status> {
  const [me, offers, shipping, orders, quotes] = await Promise.all([
    read<{ seller?: Record<string, unknown> }>("/vendor/sellers/me"),
    read<Count>("/vendor/offers?limit=1&fields=id"),
    read<Count>("/vendor/shipping-options?limit=1&fields=id"),
    read<Count>("/vendor/orders?limit=1&fields=id"),
    read<{ quotes?: Array<{ status?: string }> }>("/vendor/quotes"),
  ]);

  const seller = me?.seller ?? null;
  const address = (seller?.address ?? null) as Record<string, unknown> | null;

  return {
    sellerName: typeof seller?.name === "string" ? seller.name : null,
    hasAddress: seller ? Boolean(address && (address.address_1 || address.city)) : null,
    hasPhone: seller ? Boolean(seller.phone) : null,
    offers: typeof offers?.count === "number" ? offers.count : null,
    shippingOptions: typeof shipping?.count === "number" ? shipping.count : null,
    orders: typeof orders?.count === "number" ? orders.count : null,
    pendingQuotes: quotes?.quotes ? quotes.quotes.filter((quote) => quote.status === "pending").length : null,
    status: typeof seller?.status === "string" ? seller.status : null,
  };
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

const card = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "16px 18px",
  background: "#ffffff",
  display: "flex",
  gap: 14,
  alignItems: "flex-start",
} as const;

const button = {
  display: "inline-block",
  marginTop: 10,
  padding: "9px 16px",
  borderRadius: 8,
  background: "#d41834",
  color: "#ffffff",
  fontWeight: 700,
  fontSize: 14,
  textDecoration: "none",
} as const;

const BienDemarrerPage = () => {
  const [status, setStatus] = useState<Status>(EMPTY);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;

    loadStatus().then((next) => {
      if (alive) {
        setStatus(next);
        setLoaded(true);
      }
    });

    return () => {
      alive = false;
    };
  }, []);

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
      why: "Sans mode de livraison, un client ne peut pas terminer sa commande. Indiquez votre lieu et vos zones (Paramètres → Lieux et livraison).",
      done: status.shippingOptions === null ? null : status.shippingOptions > 0,
      href: "/seller/settings/locations",
      action: "Régler la livraison",
    },
    {
      title: "Mettre en vente votre premier produit",
      why: "Un titre clair, une bonne photo, le prix en gourdes et le stock. Vous pourrez en ajouter d'autres ensuite.",
      done: status.offers === null ? null : status.offers > 0,
      href: "/seller/products/create",
      action: "Ajouter un produit",
    },
    {
      title: "Suivre vos commandes",
      why: "Vous recevez aussi un e-mail à chaque nouvelle commande. Appelez le client au numéro indiqué pour organiser la livraison.",
      done: status.orders === null ? null : status.orders > 0,
      href: "/seller/orders",
      action: "Voir mes commandes",
    },
  ];

  const pending = status.pendingQuotes ?? 0;

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 16px 48px", fontFamily: "inherit", color: "#111827" }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>
        Bienvenue{status.sellerName ? `, ${status.sellerName}` : ""}
      </h1>

      <p style={{ marginTop: 8, fontSize: 15, lineHeight: 1.6, color: "#4b5563" }}>
        Voici les étapes pour commencer à vendre sur MACHE. Faites-les dans l&apos;ordre ; une coche verte
        apparaît quand une étape est faite.
      </p>

      {status.status && status.status !== "open" && (
        <p style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: "#fef3c7", color: "#78350f", fontSize: 14 }}>
          Votre boutique attend l&apos;approbation de MACHE. Vous pouvez tout préparer dès maintenant : elle
          apparaîtra dans le catalogue une fois approuvée, et vous serez prévenu par e-mail.
        </p>
      )}

      <ol style={{ listStyle: "none", padding: 0, margin: "20px 0 0", display: "grid", gap: 12 }}>
        {steps.map((step, index) => (
          <li key={step.title} style={card}>
            <Check done={loaded ? step.done : null} />
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                {index + 1}. {step.title}
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 14, lineHeight: 1.55, color: "#4b5563" }}>{step.why}</p>
              <a href={step.href} style={button}>
                {step.action}
              </a>
            </div>
          </li>
        ))}
      </ol>

      <h2 style={{ fontSize: 18, fontWeight: 800, marginTop: 32 }}>Ensuite, au quotidien</h2>

      <ul style={{ paddingLeft: 18, fontSize: 14, lineHeight: 1.8, color: "#374151" }}>
        <li>
          <a href="/seller/devis" style={{ color: "#d41834", fontWeight: 700 }}>Devis</a> : des acheteurs vous
          demandent un prix pour une quantité.
          {pending > 0 ? ` ${pending} demande${pending > 1 ? "s" : ""} attend${pending > 1 ? "ent" : ""} votre réponse.` : ""}
        </li>
        <li>
          <a href="/seller/fournisseurs" style={{ color: "#d41834", fontWeight: 700 }}>Fournisseurs</a> : cherchez un
          grossiste ou une marque pour revendre leurs produits.
        </li>
        <li>
          <a href="/seller/reviews" style={{ color: "#d41834", fontWeight: 700 }}>Avis</a> : lisez ce que disent vos
          clients et répondez-leur.
        </li>
        <li>
          <a href="/seller/payouts" style={{ color: "#d41834", fontWeight: 700 }}>Versements</a> et{" "}
          <a href="/seller/analytics" style={{ color: "#d41834", fontWeight: 700 }}>Chiffres</a> : ce que vous avez
          vendu.
        </li>
      </ul>

      <p style={{ marginTop: 24, fontSize: 13, color: "#6b7280" }}>
        Besoin d&apos;aide ? Écrivez à l&apos;équipe MACHE depuis la page « Nous écrire » du site. La langue du
        panneau se change dans Paramètres → Profil.
      </p>
    </div>
  );
};

export default BienDemarrerPage;
