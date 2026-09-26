/*
  PAGE : une demande de devis et la réponse du vendeur.

  Elle se lit avec le jeton reçu à la création, ou, pour un client
  connecté, parce que la demande est rattachée à son compte. Sans l'un ni
  l'autre, la page ne dit pas que la demande existe : le distinguer
  reviendrait à confirmer des identifiants à un inconnu.

  Accepter n'est pas payer. MACHÉ n'encaisse rien — le paiement se fait
  en main propre — et la page l'écrit là où l'acheteur clique, pas dans
  une note de bas de page.
*/

import { Link } from "next-view-transitions";
import { fetchQuote, QUOTE_LABELS } from "@/lib/medusa/quotes";
import { formatAmount } from "@/lib/format";
import { answerQuoteAction } from "../actions";

export const dynamic = "force-dynamic";

function dateFr(value: string | null): string | null {
  if (!value) return null;

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function QuotePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ jeton?: string; nouveau?: string; error?: string }>;
}) {
  const { id } = await params;
  const query = searchParams ? await searchParams : {};

  const token = query.jeton || null;

  const result = await fetchQuote(id, token);

  if (!result.ok) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-16">
        <h1 className="text-2xl font-bold text-[var(--mache-text)]">
          Demande introuvable
        </h1>
        <p className="mt-3 text-md leading-relaxed text-[var(--mache-muted)]">
          Ce lien ne correspond à aucune demande lisible. Il est peut-être
          incomplet : le lien de suivi contient une longue suite de
          caractères après « jeton= », et se casse quand il est recopié en
          deux morceaux.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-md font-bold text-white"
        >
          Retour au catalogue
        </Link>
      </main>
    );
  }

  const quote = result.data;

  const answered = quote.status === "answered";

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-12 sm:py-16">
      {query.nouveau && (
        <div className="mb-6 rounded-[8px] border border-[var(--mache-line)] bg-[var(--mache-primary-soft)] px-4 py-3 text-base leading-relaxed text-[var(--mache-text)]">
          <p className="font-semibold">Demande envoyée.</p>
          <p className="mt-1">
            {/*
              Le lien EST l'accès. Un acheteur sans compte qui ferme cet
              onglet sans l'avoir gardé ne retrouvera pas sa demande :
              autant le dire ici, une fois, clairement.
            */}
            Gardez l&apos;adresse de cette page : c&apos;est elle qui vous
            permettra de relire la réponse du vendeur.
          </p>
        </div>
      )}

      {query.error && (
        <div className="mb-6 rounded-[8px] border border-[#f2c2c8] bg-[#fdeaec] px-4 py-3 text-base text-[#b01124]">
          {decodeURIComponent(query.error)}
        </div>
      )}

      <p className="text-sm font-semibold uppercase tracking-label text-[var(--mache-muted)]">
        Devis nº {quote.displayId}
      </p>

      <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--mache-text)]">
        {quote.productTitle}
      </h1>

      <p className="mt-2 text-md text-[var(--mache-muted)]">
        {quote.quantity} unité{quote.quantity > 1 ? "s" : ""} demandée
        {quote.quantity > 1 ? "s" : ""} — {QUOTE_LABELS[quote.status]}.
      </p>

      {quote.message && (
        <div className="mt-6 rounded-[10px] border border-[var(--mache-line)] bg-white p-4">
          <p className="text-sm font-semibold text-[var(--mache-text)]">
            Votre demande
          </p>
          <p className="mt-1.5 whitespace-pre-line text-base leading-relaxed text-[var(--mache-muted)]">
            {quote.message}
          </p>
        </div>
      )}

      {quote.status === "pending" && (
        <p className="mt-6 text-base leading-relaxed text-[var(--mache-muted)]">
          Le vendeur a reçu votre demande. Il répond depuis son espace
          vendeur ; vous verrez sa proposition sur cette page.
        </p>
      )}

      {quote.quotedAmount !== null && (
        <div className="mt-6 rounded-[10px] border border-[var(--mache-line)] bg-white p-5">
          <p className="text-sm font-semibold uppercase tracking-label text-[var(--mache-muted)]">
            Proposition du vendeur
          </p>

          <p className="mt-2 text-3xl font-black text-[var(--mache-text)]">
            {formatAmount(quote.quotedAmount, quote.currencyCode)}
          </p>

          <p className="mt-1 text-sm text-[var(--mache-muted)]">
            Prix total pour {quote.quantity} unité
            {quote.quantity > 1 ? "s" : ""}.
          </p>

          {quote.sellerMessage && (
            <p className="mt-3 whitespace-pre-line text-base leading-relaxed text-[var(--mache-muted)]">
              {quote.sellerMessage}
            </p>
          )}

          {quote.validUntil && dateFr(quote.validUntil) && (
            <p className="mt-3 text-sm text-[var(--mache-muted)]">
              {quote.status === "expired"
                ? `Proposition valable jusqu'au ${dateFr(quote.validUntil)} — ce délai est passé.`
                : `Valable jusqu'au ${dateFr(quote.validUntil)}.`}
            </p>
          )}
        </div>
      )}

      {answered && (
        <div className="mt-6">
          <p className="text-base leading-relaxed text-[var(--mache-muted)]">
            Accepter ne déclenche aucun paiement : MACHÉ n&apos;encaisse
            rien, le règlement se fait avec le vendeur. Accepter lui dit
            que vous voulez cette commande à ce prix.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <form action={answerQuoteAction}>
              <input type="hidden" name="quote_id" value={quote.id} />
              <input type="hidden" name="token" value={token ?? ""} />
              <input type="hidden" name="action" value="accept" />
              <button
                type="submit"
                className="rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-md font-bold text-white transition-colors hover:bg-[var(--mache-primary-dark)]"
              >
                J&apos;accepte cette proposition
              </button>
            </form>

            <form action={answerQuoteAction}>
              <input type="hidden" name="quote_id" value={quote.id} />
              <input type="hidden" name="token" value={token ?? ""} />
              <input type="hidden" name="action" value="decline" />
              <button
                type="submit"
                className="rounded-[6px] border border-[var(--mache-line)] px-5 py-2.5 text-md font-semibold text-[var(--mache-muted)] transition-colors hover:border-[var(--mache-danger)] hover:text-[var(--mache-danger)]"
              >
                Je refuse
              </button>
            </form>
          </div>
        </div>
      )}

      {quote.status === "accepted" && (
        <p className="mt-6 rounded-[8px] border border-[var(--mache-line)] bg-[var(--mache-primary-soft)] px-4 py-3 text-base leading-relaxed text-[var(--mache-text)]">
          Le vendeur sait que vous acceptez sa proposition. La suite —
          livraison et règlement — se convient directement avec lui.
        </p>
      )}

      <div className="mt-8 flex flex-wrap gap-4 text-base">
        {quote.productId && (
          <Link href="/shop" className="font-semibold text-[var(--mache-primary)] hover:underline">
            Retour au catalogue
          </Link>
        )}

        <Link
          href="/dashboard/buyer/devis"
          className="font-semibold text-[var(--mache-primary)] hover:underline"
        >
          Mes demandes de devis
        </Link>
      </div>
    </main>
  );
}
