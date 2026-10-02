/*
  PAGE VENDEUR : « Revendeurs » (pour une marque).

  Une marque choisit qui peut revendre ses produits : elle autorise une
  boutique sur un ou plusieurs de ses produits, et peut retirer
  l'autorisation. Une boutique non autorisée ne peut pas proposer ces
  produits.

  Les règles sont vérifiées par le serveur (route /vendor/brand/authorize) :
  seule une boutique « marque » peut autoriser, et seulement sur ses
  produits. Cette page ne fait que les présenter.
*/

import { useCallback, useEffect, useState } from "react";

declare const __BACKEND_URL__: string;

export const config = {
  label: "Revendeurs",
  rank: 4,
};

type Product = { id: string; title: string; authorized: Array<{ id: string; name: string }> };
type Candidate = { id: string; name: string };
type Data = { brand: boolean; products: Product[]; candidates: Candidate[] };
type Incoming = { id: string; reseller_name: string; product_title: string; message: string | null };
type Catalog = { id: string; title: string; brand_name: string; authorized: boolean; request: string | null };

async function call(path: string, init?: RequestInit) {
  const base = typeof __BACKEND_URL__ === "string" ? __BACKEND_URL__ : "";
  const response = await fetch(`${base}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) throw new Error(typeof payload?.message === "string" ? payload.message : String(response.status));

  return payload;
}

const box = { border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px", background: "#ffffff" } as const;

const RevendeursPage = () => {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [seller, setSeller] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [incoming, setIncoming] = useState<Incoming[]>([]);
  const [catalog, setCatalog] = useState<Catalog[]>([]);

  const load = useCallback(() => {
    call("/vendor/brand/products")
      .then((next) => setData(next as Data))
      .catch((e) => setError(e.message));
    call("/vendor/brand/requests")
      .then((next) => setIncoming((next as { requests?: Incoming[] }).requests ?? []))
      .catch(() => setIncoming([]));
    call("/vendor/brand/catalog")
      .then((next) => setCatalog((next as { products?: Catalog[] }).products ?? []))
      .catch(() => setCatalog([]));
  }, []);

  useEffect(load, [load]);

  const send = async (sellerId: string, productIds: string[], action: "add" | "remove") => {
    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      await call("/vendor/brand/authorize", {
        method: "POST",
        body: JSON.stringify({ seller_id: sellerId, product_ids: productIds, action }),
      });
      setNotice(action === "add" ? "Revendeur autorisé." : "Autorisation retirée.");
      setPicked([]);
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const decide = async (id: string, action: "approve" | "decline") => {
    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      await call(`/vendor/brand/requests/${id}`, { method: "POST", body: JSON.stringify({ action }) });
      setNotice(action === "approve" ? "Demande acceptée : le revendeur est autorisé." : "Demande refusée.");
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const ask = async (productId: string) => {
    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      await call("/vendor/brand/requests", { method: "POST", body: JSON.stringify({ product_id: productId }) });
      setNotice("Demande envoyée à la marque. Vous serez prévenu par e-mail de sa réponse.");
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ background: "#f9f7f4", minHeight: "100vh", color: "#111827" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px 48px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Revendeurs</h1>

        {error && <p style={{ padding: "10px 14px", borderRadius: 10, background: "#fee2e2", color: "#7f1d1d", fontSize: 14 }}>{error}</p>}
        {notice && <p style={{ padding: "10px 14px", borderRadius: 10, background: "#dcfce7", color: "#14532d", fontSize: 14 }}>{notice}</p>}

        {data && !data.brand && (
          <p style={{ marginTop: 12, fontSize: 15, color: "#4b5563" }}>
            Une marque choisit ici qui peut revendre ses produits. Vous pouvez demander l&apos;autorisation de revendre
            les produits d&apos;une marque ci-dessous.
          </p>
        )}

        {data?.brand && incoming.length > 0 && (
          <div style={{ ...box, marginTop: 16 }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Demandes reçues ({incoming.length})</h2>
            {incoming.map((request) => (
              <div key={request.id} style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #f3f4f6" }}>
                <p style={{ margin: 0, fontSize: 14 }}>
                  <strong>{request.reseller_name}</strong> veut revendre <strong>{request.product_title}</strong>
                </p>
                {request.message && <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6b7280" }}>{request.message}</p>}
                <div style={{ marginTop: 6, display: "flex", gap: 8 }}>
                  <button type="button" disabled={busy} onClick={() => decide(request.id, "approve")} style={{ padding: "7px 14px", borderRadius: 8, background: "#15803d", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer" }}>
                    Accepter
                  </button>
                  <button type="button" disabled={busy} onClick={() => decide(request.id, "decline")} style={{ padding: "7px 14px", borderRadius: 8, background: "#fff", color: "#111827", fontWeight: 700, border: "1px solid #d1d5db", cursor: "pointer" }}>
                    Refuser
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {data?.brand && (
          <>
            <p style={{ marginTop: 8, fontSize: 15, color: "#4b5563" }}>
              Choisissez les boutiques qui peuvent revendre vos produits. Une boutique non autorisée ne peut pas les
              proposer.
            </p>

            {data.products.length === 0 ? (
              <p style={{ ...box, marginTop: 16, fontSize: 14, color: "#4b5563" }}>
                Vous n&apos;avez pas encore de produit à confier. Ajoutez un produit : il apparaîtra ici.
              </p>
            ) : (
              <>
                <div style={{ ...box, marginTop: 16 }}>
                  <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Autoriser un revendeur</h2>
                  <label style={{ display: "block", marginTop: 10, fontSize: 14, fontWeight: 700 }}>
                    Boutique
                    <select
                      value={seller}
                      onChange={(e) => setSeller(e.target.value)}
                      style={{ display: "block", marginTop: 4, width: "100%", maxWidth: 380, padding: "8px 10px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", color: "#111827" }}
                    >
                      <option value="">Choisir une boutique…</option>
                      {data.candidates.map((candidate) => (
                        <option key={candidate.id} value={candidate.id}>{candidate.name}</option>
                      ))}
                    </select>
                  </label>

                  <p style={{ margin: "12px 0 4px", fontSize: 14, fontWeight: 700 }}>Sur quels produits ?</p>
                  {data.products.map((product) => (
                    <label key={product.id} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14, padding: "2px 0" }}>
                      <input
                        type="checkbox"
                        checked={picked.includes(product.id)}
                        onChange={() => setPicked(picked.includes(product.id) ? picked.filter((id) => id !== product.id) : [...picked, product.id])}
                      />
                      {product.title}
                    </label>
                  ))}

                  <button
                    type="button"
                    disabled={busy || !seller || picked.length === 0}
                    onClick={() => send(seller, picked, "add")}
                    style={{ marginTop: 12, padding: "9px 16px", borderRadius: 8, background: "#d41834", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer", opacity: busy || !seller || picked.length === 0 ? 0.5 : 1 }}
                  >
                    Autoriser
                  </button>
                </div>

                <h2 style={{ fontSize: 18, fontWeight: 800, margin: "24px 0 8px" }}>Mes produits et leurs revendeurs</h2>
                <div style={{ display: "grid", gap: 10 }}>
                  {data.products.map((product) => (
                    <div key={product.id} style={box}>
                      <p style={{ margin: 0, fontWeight: 800 }}>{product.title}</p>
                      {product.authorized.length === 0 ? (
                        <p style={{ margin: "4px 0 0", fontSize: 14, color: "#6b7280" }}>Aucun revendeur autorisé.</p>
                      ) : (
                        <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {product.authorized.map((reseller) => (
                            <span key={reseller.id} style={{ display: "inline-flex", gap: 6, alignItems: "center", background: "#eef2ff", color: "#1e3a8a", borderRadius: 999, padding: "4px 10px", fontSize: 13, fontWeight: 700 }}>
                              {reseller.name}
                              <button
                                type="button"
                                aria-label={`Retirer ${reseller.name}`}
                                disabled={busy}
                                onClick={() => send(reseller.id, [product.id], "remove")}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "#1e3a8a", fontWeight: 800 }}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {catalog.length > 0 && (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: "28px 0 8px" }}>Produits de marque à revendre</h2>
            <p style={{ margin: "0 0 10px", fontSize: 14, color: "#4b5563" }}>
              Demandez à la marque l&apos;autorisation de proposer ses produits dans votre boutique.
            </p>
            <div style={{ display: "grid", gap: 10 }}>
              {catalog.map((product) => (
                <div key={product.id} style={{ ...box, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 800 }}>{product.title}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6b7280" }}>Marque : {product.brand_name}</p>
                  </div>
                  {product.authorized ? (
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>✓ Autorisé : créez votre offre</span>
                  ) : product.request === "pending" ? (
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#6b7280" }}>Demande en attente</span>
                  ) : (
                    <button type="button" disabled={busy} onClick={() => ask(product.id)} style={{ padding: "8px 14px", borderRadius: 8, background: "#d41834", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer" }}>
                      {product.request === "declined" ? "Redemander" : "Demander l'autorisation"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RevendeursPage;
