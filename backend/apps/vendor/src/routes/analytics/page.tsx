/*
  PAGE VENDEUR : les chiffres de la boutique.

  Pourquoi elle existe

  Ni Medusa ni Mercur n'affichent de statistiques vendeur. Un commerçant
  pouvait parcourir ses commandes une par une sans jamais savoir combien
  il avait vendu ce mois-ci, ni quel article partait. Tenir une boutique
  sans ce chiffre, c'est travailler à l'aveugle.

  Ce qu'elle refuse de faire

  Combler un vide. Sans vente sur la période, elle le dit — elle
  n'affiche ni moyenne, ni projection, ni exemple. Un tableau de bord
  qui montre des courbes inventées à une boutique qui n'a rien vendu
  lui fait prendre des décisions sur du vide.

  Et elle n'additionne pas les devises entre elles : des gourdes plus
  des dollars ne font pas une somme d'argent.

  Note de style

  Uniquement du React : les composants d'interface de Medusa ne sont pas
  déclarés comme dépendance de cette application, et un import qui ne se
  résout qu'à la compilation casserait le panneau entier plutôt que
  cette seule page.
*/

import { useCallback, useEffect, useState } from "react";

declare const __BACKEND_URL__: string;

export const config = {
  label: "Chiffres",
};

type Currency = {
  currency_code: string;
  revenue: number;
  orders: number;
  average: number | null;
  previous_revenue: number;
  previous_orders: number;
};

type Analytics = {
  period: { days: number; from: string; to: string };
  currencies: Currency[];
  top_products: { title: string; quantity: number; orders: number }[];
  awaiting: number;
  orders: number;
  truncated: boolean;
};

const PERIODS = [
  { days: 7, label: "7 jours" },
  { days: 30, label: "30 jours" },
  { days: 90, label: "90 jours" },
  { days: 365, label: "1 an" },
];

function money(amount: number, code: string): string {
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: code.toUpperCase(),
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${new Intl.NumberFormat("fr-FR", {
      maximumFractionDigits: 0,
    }).format(amount)} ${code.toUpperCase()}`;
  }
}

/*
  L'évolution par rapport à la période précédente.

  Elle n'est rendue que si cette période précédente a existé
  commercialement. Passer de zéro à une vente n'est pas « +100 % » :
  c'est la première vente, et le pourcentage le déguiserait en
  progression comparable aux autres.
*/
function evolution(current: number, previous: number): string | null {
  if (previous <= 0) return null;

  const change = Math.round(((current - previous) / previous) * 100);

  if (change === 0) return "stable";

  return `${change > 0 ? "+" : ""}${change} %`;
}

async function api(path: string) {
  const base = typeof __BACKEND_URL__ === "string" ? __BACKEND_URL__ : "";

  const response = await fetch(`${base}${path}`, {
    credentials: "include",
    headers: { "content-type": "application/json" },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      (body as { message?: string }).message ||
        `Le serveur a répondu ${response.status}.`
    );
  }

  return body;
}

const box: React.CSSProperties = {
  border: "1px solid #e4e4e7",
  borderRadius: 8,
  background: "#fff",
  padding: 16,
};

const tab = (active: boolean): React.CSSProperties => ({
  border: "1px solid",
  borderColor: active ? "#18181b" : "#d4d4d8",
  background: active ? "#18181b" : "#fff",
  color: active ? "#fff" : "#3f3f46",
  borderRadius: 6,
  padding: "6px 12px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
});

export default function VendorAnalyticsPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (period: number) => {
    setLoading(true);
    setError(null);

    try {
      setData((await api(`/vendor/analytics?days=${period}`)) as Analytics);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(days);
  }, [days, load]);

  const nothing = data && data.orders === 0;

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Chiffres</h1>

      <p style={{ color: "#52525b", fontSize: 14, marginTop: 6 }}>
        Vos ventes, calculées sur vos commandes réelles.
      </p>

      <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
        {PERIODS.map((period) => (
          <button
            key={period.days}
            type="button"
            style={tab(period.days === days)}
            onClick={() => setDays(period.days)}
          >
            {period.label}
          </button>
        ))}
      </div>

      {loading && (
        <p style={{ color: "#71717a", fontSize: 14, marginTop: 24 }}>
          Chargement…
        </p>
      )}

      {error && (
        <div style={{ ...box, marginTop: 16, borderColor: "#fecaca", background: "#fef2f2" }}>
          <p style={{ margin: 0, color: "#b91c1c", fontSize: 14 }}>{error}</p>
        </div>
      )}

      {data && !loading && !error && (
        <>
          {data.truncated && (
            <div style={{ ...box, marginTop: 16, borderColor: "#fde68a", background: "#fffbeb" }}>
              <p style={{ margin: 0, fontSize: 13, color: "#92400e" }}>
                Votre boutique dépasse le volume que cette page sait
                additionner. Les totaux ci-dessous ne portent pas sur
                toutes vos commandes.
              </p>
            </div>
          )}

          {nothing ? (
            /*
              Aucune vente. On le dit, et on s'arrête là : pas de
              graphique vide, pas de « 0 % » présenté comme un résultat.
            */
            <div style={{ ...box, marginTop: 16 }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
                Aucune vente sur cette période.
              </p>
              <p style={{ margin: "6px 0 0", fontSize: 14, color: "#52525b" }}>
                Essayez une période plus longue. Si votre boutique vient
                d’ouvrir, c’est attendu : les chiffres apparaîtront à
                votre première commande.
              </p>
            </div>
          ) : (
            <>
              {data.currencies.map((currency) => {
                const change = evolution(currency.revenue, currency.previous_revenue);

                return (
                  <div key={currency.currency_code} style={{ ...box, marginTop: 16 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#71717a", textTransform: "uppercase", letterSpacing: ".06em" }}>
                      Chiffre d’affaires — {currency.currency_code.toUpperCase()}
                    </p>

                    <p style={{ margin: "6px 0 0", fontSize: 30, fontWeight: 800 }}>
                      {money(currency.revenue, currency.currency_code)}
                    </p>

                    {change && (
                      <p style={{ margin: "4px 0 0", fontSize: 13, color: "#52525b" }}>
                        {change} par rapport aux {data.period.days} jours
                        précédents
                      </p>
                    )}

                    <div style={{ display: "flex", gap: 24, marginTop: 16, flexWrap: "wrap" }}>
                      <div>
                        <p style={{ margin: 0, fontSize: 12, color: "#71717a" }}>
                          Commandes
                        </p>
                        <p style={{ margin: "2px 0 0", fontSize: 18, fontWeight: 700 }}>
                          {currency.orders}
                        </p>
                      </div>

                      <div>
                        <p style={{ margin: 0, fontSize: 12, color: "#71717a" }}>
                          Panier moyen
                        </p>
                        <p style={{ margin: "2px 0 0", fontSize: 18, fontWeight: 700 }}>
                          {/*
                            Sans commande, il n'y a pas de panier moyen.
                            Zéro se lirait « les clients dépensent
                            zéro ».
                          */}
                          {currency.average === null
                            ? "—"
                            : money(currency.average, currency.currency_code)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {data.currencies.length > 1 && (
                <p style={{ fontSize: 12, color: "#71717a", marginTop: 8 }}>
                  Vos ventes sont dans plusieurs devises. Elles ne sont pas
                  additionnées : leur somme ne correspondrait à aucun
                  montant réel.
                </p>
              )}

              {data.awaiting > 0 && (
                <div style={{ ...box, marginTop: 16, borderColor: "#fde68a", background: "#fffbeb" }}>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#92400e" }}>
                    {data.awaiting} commande{data.awaiting > 1 ? "s" : ""} à
                    préparer
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "#92400e" }}>
                    Elles sont payées ou en attente de règlement, et pas
                    encore expédiées.
                  </p>
                </div>
              )}

              {data.top_products.length > 0 && (
                <div style={{ ...box, marginTop: 16 }}>
                  <p style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 700 }}>
                    Ce qui part le mieux
                  </p>

                  {data.top_products.map((product, index) => (
                    <div
                      key={product.title}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        padding: "8px 0",
                        borderTop: index === 0 ? "none" : "1px solid #f4f4f5",
                        fontSize: 14,
                      }}
                    >
                      <span>{product.title}</span>
                      <span style={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                        {product.quantity} vendu
                        {product.quantity > 1 ? "s" : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
