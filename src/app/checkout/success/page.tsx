/*
  PAGE : commande confirmée

  Le récapitulatif vient d'un cookie httpOnly déposé au moment de la
  finalisation, jamais de l'URL : un montant lu depuis l'adresse de la
  page serait modifiable par le visiteur, qui pourrait alors afficher un
  total n'ayant jamais existé et s'en servir comme preuve.

  Ce que la page annonce est ce qui s'est réellement passé : des commandes
  créées, un paiement EN ATTENTE, encaissé à la livraison. Aucune commande
  n'est présentée comme payée.
*/

import Link from "next/link";
import { cookies } from "next/headers";
import { formatAmount } from "@/lib/medusa/catalog";

export const dynamic = "force-dynamic";

const CONFIRMATION_COOKIE = "mache_last_order";

type Confirmation = {
  orderGroupId: string;
  sellerCount: number;
  total: number;
  currency: string;
};

export default async function CheckoutSuccessPage() {
  const store = await cookies();
  const raw = store.get(CONFIRMATION_COOKIE)?.value;

  let confirmation: Confirmation | null = null;

  if (raw) {
    try {
      confirmation = JSON.parse(raw) as Confirmation;
    } catch {
      /* Cookie illisible : on retombe sur le message générique. */
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-14">
      <div className="rounded-[12px] border border-[#b7dfc9] bg-[#f4fbf7] p-6 text-center">
        <p className="text-4xl" aria-hidden="true">✓</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#046c4e]">
          Commande enregistrée
        </h1>

        {confirmation ? (
          <p className="mx-auto mt-3 max-w-md text-md leading-relaxed text-[var(--mache-muted)]">
            {confirmation.sellerCount > 1 ? (
              <>
                Votre panier contenait des articles de{" "}
                <strong>{confirmation.sellerCount} boutiques</strong> : il a
                donné lieu à {confirmation.sellerCount} commandes, une par
                vendeur. Chacune vous sera livrée séparément.
              </>
            ) : (
              <>Votre commande a été transmise au vendeur.</>
            )}
          </p>
        ) : (
          <p className="mx-auto mt-3 max-w-md text-md leading-relaxed text-[var(--mache-muted)]">
            Votre commande a bien été enregistrée.
          </p>
        )}
      </div>

      {confirmation && (
        <dl className="mt-5 space-y-2 rounded-[10px] border border-[var(--mache-line)] bg-white p-4 text-base">
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--mache-muted)]">Référence</dt>
            <dd className="font-mono tabular-nums text-sm font-semibold">
              {confirmation.orderGroupId}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-[var(--mache-line)] pt-2">
            <dt className="text-[var(--mache-muted)]">Montant total</dt>
            <dd className="font-black">
              {formatAmount(confirmation.total, confirmation.currency)}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-[var(--mache-line)] pt-2">
            <dt className="text-[var(--mache-muted)]">Paiement</dt>
            <dd className="font-semibold text-[#946200]">
              À régler à la livraison
            </dd>
          </div>
        </dl>
      )}

      <div className="mt-5 rounded-[10px] border border-[#f3d9a5] bg-[#fdf6e8] p-4">
        <h2 className="text-md font-bold text-[var(--mache-text)]">
          Rien n&apos;a été prélevé
        </h2>
        <p className="mt-1.5 text-base leading-relaxed text-[var(--mache-muted)]">
          Aucun paiement n&apos;a été encaissé et aucune donnée bancaire ne
          vous a été demandée. Vous réglerez en main propre à la réception,
          après avoir vérifié le colis.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-2.5">
        <Link
          href="/shop"
          className="rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-md font-bold text-white transition-colors hover:bg-[var(--mache-primary-dark)]"
        >
          Continuer mes achats
        </Link>
        <Link
          href="/legal/shipping"
          className="rounded-[6px] border border-[var(--mache-line)] px-5 py-2.5 text-md font-bold text-[var(--mache-text)] hover:border-[var(--mache-primary)]"
        >
          Comment se passe la livraison
        </Link>
      </div>
    </main>
  );
}
