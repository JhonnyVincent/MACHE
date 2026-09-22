/*
  PAGE VENDEUR : les demandes de devis reçues.

  Pourquoi elle existe

  Le backend enregistre les demandes, mais un vendeur ne lit pas une API.
  Sans cet écran, chaque demande serait reçue et jamais vue : l'acheteur
  attendrait une réponse que personne ne sait qu'il attend.

  Ce qu'elle affiche

  Ce que l'acheteur a demandé et comment le joindre. Le vendeur répond
  avec un prix TOTAL pour la quantité demandée — c'est la forme dans
  laquelle une négociation se conclut ici, « 200 sacs, 180 000 gourdes »,
  et c'est ce que l'acheteur compare.

  Note de style

  Cet écran n'utilise que React : les composants d'interface de Medusa ne
  sont pas déclarés comme dépendance de cette application, et un import
  qui ne se résout qu'à la compilation casserait le panneau entier plutôt
  que cette seule page.
*/

import { useCallback, useEffect, useState } from "react";

declare const __BACKEND_URL__: string;

export const config = {
  label: "Devis",
};

type Quote = {
  id: string;
  display_id: number;
  status: "pending" | "answered" | "accepted" | "declined" | "expired";
  product_title: string;
  quantity: number;
  message: string | null;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string | null;
  buyer_company: string | null;
  seller_message: string | null;
  quoted_amount: number | null;
  currency_code: string | null;
  valid_until: string | null;
  created_at: string;
};

/*
  Les libellés disent ce qui s'est passé, pas ce qu'on espère :
  « L'acheteur attend votre prix » nomme l'action à faire, là où
  « En attente » laisse croire que quelqu'un d'autre s'en occupe.
*/
const LABELS: Record<Quote["status"], string> = {
  pending: "L’acheteur attend votre prix",
  answered: "Prix envoyé, réponse en attente",
  accepted: "L’acheteur a accepté",
  declined: "Refusé",
  expired: "Votre proposition a expiré",
};

const COLORS: Record<Quote["status"], string> = {
  pending: "#b45309",
  answered: "#1d4ed8",
  accepted: "#15803d",
  declined: "#b91c1c",
  expired: "#6b7280",
};

function money(quote: Quote): string {
  if (quote.quoted_amount === null || quote.quoted_amount === undefined) {
    /* Un tiret, pas un zéro : zéro se lirait « gratuit ». */
    return "—";
  }

  const code = (quote.currency_code || "HTG").toUpperCase();

  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 0,
    }).format(quote.quoted_amount);
  } catch {
    return `${quote.quoted_amount} ${code}`;
  }
}

async function api(path: string, init?: RequestInit) {
  const base = typeof __BACKEND_URL__ === "string" ? __BACKEND_URL__ : "";

  const response = await fetch(`${base}${path}`, {
    ...init,
    credentials: "include",
    headers: { "content-type": "application/json", ...(init?.headers || {}) },
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
  marginBottom: 12,
};

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #d4d4d8",
  borderRadius: 6,
  padding: "8px 10px",
  fontSize: 14,
  marginTop: 4,
};

const button: React.CSSProperties = {
  border: "1px solid #18181b",
  background: "#18181b",
  color: "#fff",
  borderRadius: 6,
  padding: "8px 14px",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};

const ghost: React.CSSProperties = {
  ...button,
  background: "#fff",
  color: "#3f3f46",
  border: "1px solid #d4d4d8",
};

function Answer({
  quote,
  onDone,
}: {
  quote: Quote;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(quote.currency_code || "HTG");
  const [validUntil, setValidUntil] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(action: "answer" | "decline") {
    setBusy(true);
    setError(null);

    try {
      await api(`/vendor/quotes/${quote.id}`, {
        method: "POST",
        body: JSON.stringify(
          action === "decline"
            ? { action, seller_message: message || null }
            : {
                action,
                quoted_amount: Number(amount),
                currency_code: currency,
                valid_until: validUntil || null,
                seller_message: message || null,
              }
        ),
      });

      onDone();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ marginTop: 12, borderTop: "1px solid #f4f4f5", paddingTop: 12 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <label style={{ fontSize: 13, fontWeight: 600, flex: "1 1 160px" }}>
          Prix total pour {quote.quantity} unité{quote.quantity > 1 ? "s" : ""}
          <input
            style={input}
            type="number"
            min={1}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="180000"
          />
        </label>

        <label style={{ fontSize: 13, fontWeight: 600, flex: "0 1 110px" }}>
          Devise
          <input
            style={input}
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
          />
        </label>

        <label style={{ fontSize: 13, fontWeight: 600, flex: "0 1 180px" }}>
          Valable jusqu’au
          <input
            style={input}
            type="date"
            value={validUntil}
            onChange={(event) => setValidUntil(event.target.value)}
          />
        </label>
      </div>

      <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginTop: 12 }}>
        Message à l’acheteur
        <textarea
          style={{ ...input, minHeight: 70 }}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Délai, conditions de livraison, conditionnement…"
        />
      </label>

      {error && (
        <p style={{ color: "#b91c1c", fontSize: 13, marginTop: 8 }}>{error}</p>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button
          type="button"
          style={button}
          disabled={busy || !amount}
          onClick={() => send("answer")}
        >
          Envoyer ce prix
        </button>

        <button
          type="button"
          style={ghost}
          disabled={busy}
          onClick={() => send("decline")}
        >
          Je ne peux pas répondre
        </button>
      </div>

      <p style={{ fontSize: 12, color: "#71717a", marginTop: 8 }}>
        Un devis n’est pas une commande : rien n’est réservé et aucun
        paiement n’est déclenché. L’acheteur accepte ou refuse, et la
        suite se convient avec lui.
      </p>
    </div>
  );
}

export default function VendorQuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const body = (await api("/vendor/quotes")) as { quotes?: Quote[] };
      setQuotes(body.quotes ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Devis</h1>

      <p style={{ color: "#52525b", fontSize: 14, marginTop: 6 }}>
        Les demandes de prix reçues pour votre boutique. Un acheteur vous
        indique une quantité, vous répondez par un prix total.
      </p>

      {loading && (
        <p style={{ color: "#71717a", fontSize: 14, marginTop: 24 }}>
          Chargement…
        </p>
      )}

      {error && (
        <div style={{ ...box, borderColor: "#fecaca", background: "#fef2f2" }}>
          <p style={{ margin: 0, color: "#b91c1c", fontSize: 14 }}>{error}</p>
        </div>
      )}

      {!loading && !error && quotes.length === 0 && (
        <div style={box}>
          <p style={{ margin: 0, fontSize: 14, color: "#52525b" }}>
            Aucune demande pour le moment. Les acheteurs demandent un devis
            depuis la fiche d’un de vos articles, sous le nom de votre
            boutique.
          </p>
        </div>
      )}

      {quotes.map((quote) => (
        <div key={quote.id} style={box}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>
                {quote.product_title} — {quote.quantity} unité
                {quote.quantity > 1 ? "s" : ""}
              </p>

              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#52525b" }}>
                Devis nº {quote.display_id} ·{" "}
                {new Date(quote.created_at).toLocaleDateString("fr-FR")}
              </p>
            </div>

            <div style={{ textAlign: "right" }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: COLORS[quote.status],
                }}
              >
                {LABELS[quote.status]}
              </span>

              <p style={{ margin: "4px 0 0", fontSize: 15, fontWeight: 700 }}>
                {money(quote)}
              </p>
            </div>
          </div>

          <div style={{ marginTop: 10, fontSize: 13, color: "#3f3f46" }}>
            <p style={{ margin: 0 }}>
              {quote.buyer_name}
              {quote.buyer_company ? ` — ${quote.buyer_company}` : ""}
            </p>
            <p style={{ margin: "2px 0 0", color: "#52525b" }}>
              {quote.buyer_email}
              {quote.buyer_phone ? ` · ${quote.buyer_phone}` : ""}
            </p>
          </div>

          {quote.message && (
            <p
              style={{
                marginTop: 10,
                fontSize: 13,
                color: "#3f3f46",
                whiteSpace: "pre-line",
                background: "#fafafa",
                borderRadius: 6,
                padding: 10,
              }}
            >
              {quote.message}
            </p>
          )}

          {quote.seller_message && (
            <p style={{ marginTop: 10, fontSize: 13, color: "#52525b" }}>
              Votre réponse : {quote.seller_message}
            </p>
          )}

          {/*
            Une demande sur laquelle l'acheteur s'est prononcé ne se
            réécrit pas : le prix qu'il a lu doit rester celui qu'il a
            accepté ou refusé. Le backend le refuse aussi, mais ne pas
            proposer le formulaire évite de faire espérer.
          */}
          {(quote.status === "pending" ||
            quote.status === "answered" ||
            quote.status === "expired") &&
            (open === quote.id ? (
              <Answer
                quote={quote}
                onDone={() => {
                  setOpen(null);
                  void load();
                }}
              />
            ) : (
              <button
                type="button"
                style={{ ...ghost, marginTop: 12 }}
                onClick={() => setOpen(quote.id)}
              >
                {quote.status === "pending" ? "Répondre" : "Modifier ma réponse"}
              </button>
            ))}
        </div>
      ))}
    </div>
  );
}
