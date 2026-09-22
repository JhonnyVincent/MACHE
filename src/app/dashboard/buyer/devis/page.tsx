/*
  PAGE : mes demandes de devis.

  Elle ne montre que les demandes faites en étant connecté : c'est le
  rattachement au compte qui les retrouve. Une demande envoyée sans
  compte se relit par le lien reçu à l'envoi, et la page le dit plutôt
  que de laisser croire qu'elle a disparu.
*/

import Link from "next/link";
import { getCustomer } from "@/lib/medusa/customer";
import { fetchMyQuotes, QUOTE_LABELS, type QuoteStatus } from "@/lib/medusa/quotes";
import { formatAmount } from "@/lib/format";
import { formatDate } from "@/lib/seller";
import {
  PageHeader, Panel, Table, Row, Cell, Badge, Button, EmptyState, Notice,
} from "@/components/seller/ui";
import { reportOutage } from "@/lib/medusa/outage";

export const dynamic = "force-dynamic";

/*
  La couleur ne dit rien que le texte ne dise déjà : « proposition
  reçue » est une bonne nouvelle, « expirée » une mauvaise, et une
  demande sans réponse n'est ni l'une ni l'autre.
*/
const TONES: Record<QuoteStatus, "neutral" | "success" | "warning" | "danger"> = {
  pending: "neutral",
  answered: "success",
  accepted: "success",
  declined: "danger",
  expired: "warning",
};

export default async function BuyerQuotesPage() {
  const customer = await getCustomer();

  if (!customer) {
    return (
      <>
        <PageHeader title="Mes devis" />
        <Panel padded={false}>
          <EmptyState
            title="Connectez-vous"
            description="Les demandes faites depuis votre compte sont retrouvées ici. Une demande envoyée sans compte se relit par le lien reçu au moment de l'envoi."
            action={
              <Button href="/compte/connexion?next=/dashboard/buyer/devis" variant="primary">
                Se connecter
              </Button>
            }
          />
        </Panel>
      </>
    );
  }

  const result = await fetchMyQuotes();

  if (!result.ok) reportOutage("devis", result.reason);

  const quotes = result.ok ? result.data : [];

  return (
    <>
      <PageHeader
        title="Mes devis"
        subtitle="Les prix demandés aux boutiques, et leurs réponses."
        actions={<Button href="/shop">Voir le catalogue</Button>}
      />

      <div className="space-y-4">
        {!result.ok && (
          <Notice tone="warning" title="Devis indisponibles">
            Vos demandes ne peuvent pas être affichées pour le moment.
            Rien n&apos;est perdu : réessayez dans quelques minutes.
          </Notice>
        )}

        <Panel padded={false}>
          {quotes.length === 0 ? (
            <EmptyState
              title="Aucune demande"
              description="Sur la fiche d'un article, « Demander un devis » vous permet d'obtenir un prix pour une quantité précise."
              action={<Button href="/shop" variant="primary">Voir le catalogue</Button>}
            />
          ) : (
            <Table
              columns={[
                { key: "n", label: "Devis" },
                { key: "a", label: "Article" },
                { key: "q", label: "Quantité", align: "right" },
                { key: "d", label: "Demandé le" },
                { key: "s", label: "État" },
                { key: "m", label: "Proposition", align: "right" },
                { key: "x", label: "", align: "right", width: "80px" },
              ]}
            >
              {quotes.map((quote) => (
                <Row key={quote.id}>
                  <Cell strong>nº {quote.displayId}</Cell>
                  <Cell>{quote.productTitle}</Cell>
                  <Cell align="right" numeric muted>{quote.quantity}</Cell>
                  <Cell muted>{formatDate(quote.createdAt)}</Cell>
                  <Cell>
                    <Badge tone={TONES[quote.status]}>
                      {QUOTE_LABELS[quote.status]}
                    </Badge>
                  </Cell>
                  <Cell align="right" numeric strong>
                    {/*
                      Un tiret tant que le vendeur n'a pas chiffré.
                      Afficher un zéro ferait lire « gratuit ».
                    */}
                    {quote.quotedAmount === null
                      ? "—"
                      : formatAmount(quote.quotedAmount, quote.currencyCode)}
                  </Cell>
                  <Cell align="right">
                    <Button href={`/devis/${quote.id}`} size="sm">
                      Détail
                    </Button>
                  </Cell>
                </Row>
              ))}
            </Table>
          )}
        </Panel>

        <Notice tone="info" title="Un devis n'est pas une commande">
          Demander un prix n&apos;engage à rien, et accepter une
          proposition ne déclenche aucun paiement : MACHÉ n&apos;encaisse
          pas, le règlement se convient avec le vendeur.{" "}
          <Link href="/legal/terms" className="font-medium text-[#d2162c] hover:underline">
            Conditions d&apos;utilisation
          </Link>
        </Notice>
      </div>
    </>
  );
}
