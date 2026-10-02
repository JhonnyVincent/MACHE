/*
  PAGE VENDEUR : « Applications ».

  Chaque vendeur choisit les outils qu'il veut relier à sa boutique,
  sans créer de compte en plus (importer sa boutique Shopify, trouver
  des produits chez un fournisseur, expédier avec un transporteur…).

  Deux états seulement, et honnêtes :
  - « Disponible » (`live: true`) : l'outil marche, le vendeur l'active ;
  - sinon « Je suis intéressé » : on note l'envie du vendeur. MACHE voit
    combien de boutiques veulent chaque outil et construit en priorité
    les plus demandés. Rien n'est présenté comme relié s'il ne l'est pas.

  Le choix est gardé dans la fiche de la boutique (`metadata.apps`), que
  le vendeur peut écrire. Pour ouvrir un outil : `live: true` et un `href`.
*/

import { useEffect, useState } from "react";

declare const __BACKEND_URL__: string;

export const config = {
  label: "Applications",
  rank: 11,
};

type App = { id: string; name: string; text: string; group: string; live?: boolean; href?: string };

const APPS: App[] = [
  { group: "Importer ma boutique", id: "shopify", name: "Shopify", text: "Retrouvez ici les produits de votre boutique Shopify." },
  { group: "Importer ma boutique", id: "woocommerce", name: "WooCommerce", text: "Retrouvez ici les produits de votre site WooCommerce." },
  { group: "Trouver des produits", id: "alibaba", name: "Alibaba.com", text: "Des produits en gros, à revendre." },
  { group: "Trouver des produits", id: "aliexpress", name: "AliExpress", text: "Des produits à revendre, sans stock." },
  { group: "Trouver des produits", id: "cjdropshipping", name: "CJ Dropshipping", text: "Produits, entrepôts et suivi des colis." },
  { group: "Trouver des produits", id: "syncee", name: "Syncee", text: "Un réseau de fournisseurs, en gros ou en dropshipping." },
  { group: "Trouver des produits", id: "spocket", name: "Spocket", text: "Fournisseurs États-Unis et Europe, livraison rapide." },
  { group: "Trouver des produits", id: "printful", name: "Printful / Printify", text: "Vos créations imprimées à la demande." },
  { group: "Livraison", id: "transporteurs", name: "Transporteurs", text: "Expédier avec un transporteur, depuis vos commandes." },
  { group: "Statistiques et visibilité", id: "analytics", name: "Google Analytics", text: "Voir d'où viennent vos visiteurs." },
  { group: "Statistiques et visibilité", id: "seo", name: "Référencement (SEO)", text: "Mieux apparaître sur Google." },
];

const GROUPS = Array.from(new Set(APPS.map((app) => app.group)));

type Choices = Record<string, string>;

async function call(path: string, init?: RequestInit) {
  const base = typeof __BACKEND_URL__ === "string" ? __BACKEND_URL__ : "";
  const response = await fetch(`${base}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!response.ok) throw new Error(String(response.status));

  return response.json();
}

const ApplicationsPage = () => {
  const [choices, setChoices] = useState<Choices>({});
  const [metadata, setMetadata] = useState<Record<string, unknown>>({});
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    call("/vendor/sellers/me")
      .then((data) => {
        const meta = (data?.seller?.metadata ?? {}) as Record<string, unknown>;
        setMetadata(meta);
        const apps = meta.apps;
        setChoices(apps && typeof apps === "object" ? (apps as Choices) : {});
        setReady(true);
      })
      .catch(() => {
        setError(true);
        setReady(true);
      });
  }, []);

  const toggle = async (id: string) => {
    const next = { ...choices };
    if (next[id]) delete next[id];
    else next[id] = new Date().toISOString().slice(0, 10);

    setBusy(id);
    setError(false);

    try {
      /* On renvoie les autres clés de la fiche telles qu'elles sont : seule « apps » change. */
      await call("/vendor/sellers/me", {
        method: "POST",
        body: JSON.stringify({ metadata: { ...metadata, apps: next } }),
      });
      setChoices(next);
      setMetadata({ ...metadata, apps: next });
    } catch {
      setError(true);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div style={{ background: "#f9f7f4", minHeight: "100vh", color: "#111827" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px 48px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Applications</h1>
        <p style={{ marginTop: 8, fontSize: 15, color: "#4b5563" }}>
          Choisissez les outils que vous voulez relier à votre boutique. Ceux qui ne sont pas encore prêts :
          dites-nous que vous les voulez, nous construisons d&apos;abord les plus demandés.
        </p>

        {error && (
          <p style={{ padding: "10px 14px", borderRadius: 10, background: "#fee2e2", color: "#7f1d1d", fontSize: 14 }}>
            Votre choix n&apos;a pas pu être enregistré. Réessayez.
          </p>
        )}

        {GROUPS.map((group) => (
          <section key={group} style={{ marginTop: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 10px" }}>{group}</h2>
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
              {APPS.filter((app) => app.group === group).map((app) => {
                const chosen = Boolean(choices[app.id]);

                return (
                  <div key={app.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px", background: "#ffffff" }}>
                    <p style={{ margin: 0, fontWeight: 800 }}>{app.name}</p>
                    <p style={{ margin: "4px 0 10px", fontSize: 14, color: "#4b5563" }}>{app.text}</p>
                    {app.live && app.href ? (
                      <a href={app.href} style={{ color: "#d41834", fontWeight: 700, textDecoration: "none" }}>Ouvrir →</a>
                    ) : (
                      <>
                        <button
                          type="button"
                          disabled={!ready || busy === app.id}
                          onClick={() => toggle(app.id)}
                          style={{
                            padding: "8px 14px",
                            borderRadius: 8,
                            fontWeight: 700,
                            fontSize: 14,
                            cursor: "pointer",
                            border: chosen ? "1px solid #15803d" : "1px solid #d41834",
                            background: chosen ? "#f0fdf4" : "#d41834",
                            color: chosen ? "#15803d" : "#ffffff",
                          }}
                        >
                          {chosen ? "✓ Intéressé · Annuler" : "Je suis intéressé"}
                        </button>
                        <p style={{ margin: "8px 0 0", fontSize: 12, color: "#6b7280" }}>Pas encore disponible.</p>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default ApplicationsPage;
