/*
  PAGE VENDEUR : « Fournisseurs ».

  Un vendeur qui cherche de quoi revendre — un particulier, une boutique —
  trouve ici les grossistes et les marques de MACHE. C'est le même
  annuaire que « Trouver un fournisseur » sur le site ; ici, il est sous
  la main du vendeur qui travaille dans le panneau.

  Chaque fournisseur renvoie vers sa vitrine sur le site, où l'on choisit
  un produit et demande un devis. Le vendeur y est reconnu : il n'a pas
  à se reconnecter (il arrive du site avec « Ouvrir mon panneau vendeur »).

  Le profil est une DÉCLARATION du vendeur, pas un contrôle de MACHE : la
  page le dit en tête de liste.

  Note de style : React seul, comme les autres pages MACHE du panneau
  (voir routes/devis/page.tsx).
*/

import { useEffect, useMemo, useState } from "react";

declare const __BACKEND_URL__: string;

export const config = {
  label: "Fournisseurs",
  rank: 3,
};

type Supplier = {
  id: string;
  name: string;
  handle: string;
  description: string | null;
  logo: string | null;
  profile: "fournisseur" | "marque" | null;
  minimum_order: number | null;
  url: string | null;
};

const FILTERS: Array<{ key: "tous" | "fournisseur" | "marque"; label: string }> = [
  { key: "tous", label: "Tous" },
  { key: "fournisseur", label: "Grossistes" },
  { key: "marque", label: "Marques" },
];

const PROFILE_LABEL: Record<string, string> = { fournisseur: "Grossiste", marque: "Marque" };

const chip = (active: boolean) =>
  ({
    padding: "6px 14px",
    borderRadius: 999,
    border: `1px solid ${active ? "#111827" : "#d1d5db"}`,
    background: active ? "#111827" : "#ffffff",
    color: active ? "#ffffff" : "#111827",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
  }) as const;

const FournisseursPage = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [filter, setFilter] = useState<"tous" | "fournisseur" | "marque">("tous");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let alive = true;
    const base = typeof __BACKEND_URL__ === "string" ? __BACKEND_URL__ : "";

    fetch(`${base}/vendor/suppliers`, { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) throw new Error(String(response.status));
        return (await response.json()) as { suppliers?: Supplier[] };
      })
      .then((payload) => {
        if (!alive) return;
        setSuppliers(payload.suppliers ?? []);
        setState("ok");
      })
      .catch(() => alive && setState("error"));

    return () => {
      alive = false;
    };
  }, []);

  const shown = useMemo(() => {
    const term = search.trim().toLowerCase();

    return suppliers.filter(
      (supplier) =>
        (filter === "tous" || supplier.profile === filter) &&
        (!term || `${supplier.name} ${supplier.description ?? ""}`.toLowerCase().includes(term))
    );
  }, [suppliers, filter, search]);

  return (
    <div style={{ background: "#f9fafb", minHeight: "100vh" }}>
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px 48px", color: "#111827" }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Fournisseurs</h1>

      <p style={{ marginTop: 8, fontSize: 15, lineHeight: 1.6, color: "#4b5563" }}>
        Vous cherchez de quoi revendre ? Voici les <strong>grossistes</strong> (ils vendent par quantité) et les{" "}
        <strong>marques</strong> (elles confient leurs produits à des revendeurs). Ouvrez leur vitrine, choisissez un
        produit et demandez un devis : ils vous répondent avec un prix pour votre quantité.
      </p>

      <p style={{ marginTop: 4, fontSize: 13, color: "#6b7280" }}>
        Ces profils sont déclarés par les vendeurs eux-mêmes : MACHE ne les a pas tous vérifiés.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginTop: 16 }}>
        {FILTERS.map((entry) => (
          <button key={entry.key} type="button" onClick={() => setFilter(entry.key)} style={chip(filter === entry.key)}>
            {entry.label}
          </button>
        ))}

        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Chercher un fournisseur…"
          aria-label="Chercher un fournisseur"
          style={{
            marginLeft: "auto",
            minWidth: 220,
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            fontSize: 14,
          }}
        />
      </div>

      {state === "loading" && <p style={{ marginTop: 24, color: "#6b7280" }}>Chargement…</p>}

      {state === "error" && (
        <p style={{ marginTop: 24, padding: "12px 14px", borderRadius: 10, background: "#fdeaec", color: "#b01124" }}>
          La liste ne peut pas être affichée pour le moment. Rechargez la page dans quelques instants.
        </p>
      )}

      {state === "ok" && shown.length === 0 && (
        <div style={{ marginTop: 24, padding: "18px 20px", borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff" }}>
          <p style={{ margin: 0, fontWeight: 700 }}>
            {suppliers.length === 0
              ? "Aucun grossiste ni aucune marque ne s'est encore déclaré sur MACHE."
              : "Aucun fournisseur ne correspond à votre recherche."}
          </p>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: "#4b5563" }}>
            Vous pouvez aussi demander un devis à n&apos;importe quelle boutique, depuis la fiche d&apos;un de ses produits.
          </p>
        </div>
      )}

      <ul style={{ listStyle: "none", padding: 0, margin: "20px 0 0", display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
        {shown.map((supplier) => (
          <li key={supplier.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px", background: "#fff", display: "flex", flexDirection: "column" }}>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
              {supplier.name}{" "}
              <span style={{ fontSize: 12, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: "#f3f4f6", color: "#4b5563" }}>
                {PROFILE_LABEL[supplier.profile ?? ""] ?? "Fournisseur"}
              </span>
            </p>

            {supplier.description && (
              <p style={{ margin: "6px 0 0", fontSize: 14, lineHeight: 1.55, color: "#4b5563", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {supplier.description}
              </p>
            )}

            {supplier.minimum_order !== null && (
              <p style={{ margin: "8px 0 0", fontSize: 13, fontWeight: 600 }}>
                Commande minimum : {new Intl.NumberFormat("fr-FR").format(supplier.minimum_order)} HTG
              </p>
            )}

            {supplier.url && (
              <a
                href={supplier.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginTop: "auto", paddingTop: 12, color: "#d41834", fontWeight: 700, fontSize: 14, textDecoration: "none" }}
              >
                Voir ses produits et demander un devis →
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
    </div>
  );
};

export default FournisseursPage;
