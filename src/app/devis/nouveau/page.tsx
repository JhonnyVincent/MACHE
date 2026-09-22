/*
  PAGE : demander un devis.

  Le formulaire est pré-rempli depuis la fiche produit : boutique,
  article, déclinaison. L'acheteur n'a donc à écrire que ce que le
  vendeur ne peut pas deviner — la quantité, qui il est, et ce qu'il
  attend.

  Il n'y a pas de compte à créer. Demander un prix est une question de
  trente secondes, et exiger une inscription pour la poser revient à ne
  pas la recevoir.
*/

import Link from "next/link";
import { SubmitButton } from "@/components/submit-button";
import { requestQuoteAction } from "../actions";
import { getCustomer } from "@/lib/medusa/customer";

export const dynamic = "force-dynamic";

const inputClass =
  "mt-1 w-full rounded-[6px] border border-[var(--mache-line)] bg-white px-3 py-2.5 text-md outline-none focus:border-[var(--mache-primary)]";

const labelClass = "text-sm font-semibold text-[var(--mache-text)]";

export default async function NewQuotePage({
  searchParams,
}: {
  searchParams?: Promise<{
    boutique?: string;
    article?: string;
    produit?: string;
    variante?: string;
    vendeur?: string;
    error?: string;
  }>;
}) {
  const query = searchParams ? await searchParams : {};

  const sellerId = (query.boutique || "").trim();
  const productTitle = (query.article || "").trim();

  /*
    Sans boutique ni article, il n'y a personne à qui adresser la
    demande. Plutôt qu'un formulaire qui échouera à l'envoi, on renvoie
    au catalogue en disant pourquoi.
  */
  if (!sellerId || !productTitle) {
    return (
      <main className="mx-auto w-full max-w-md px-4 py-16">
        <h1 className="text-2xl font-bold text-[var(--mache-text)]">
          Demande de devis
        </h1>
        <p className="mt-3 text-md leading-relaxed text-[var(--mache-muted)]">
          Une demande de devis part d&apos;un article et d&apos;une
          boutique précise. Ouvrez la fiche de l&apos;article qui vous
          intéresse, puis choisissez « Demander un devis » sous le nom du
          vendeur.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-md font-bold text-white"
        >
          Parcourir le catalogue
        </Link>
      </main>
    );
  }

  /* Le client connecté n'a pas à retaper ce que son compte contient déjà. */
  const customer = await getCustomer();

  const defaultName = customer
    ? [customer.firstName, customer.lastName].filter(Boolean).join(" ")
    : "";

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-12 sm:py-16">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--mache-text)]">
        Demander un devis
      </h1>

      <p className="mt-2 text-md text-[var(--mache-muted)]">
        Pour <strong className="text-[var(--mache-text)]">{productTitle}</strong>.
        Le vendeur vous répond avec un prix total pour la quantité que vous
        indiquez.
      </p>

      {/*
        Dit tout de suite ce que ce n'est pas. Un formulaire qui ressemble
        à une commande et n'en est pas une laisse croire à un achat
        conclu.
      */}
      <div className="mt-4 rounded-[8px] border border-[var(--mache-line)] bg-[var(--mache-primary-soft)] px-4 py-3 text-base leading-relaxed text-[var(--mache-text)]">
        Ceci n&apos;est pas une commande. Rien n&apos;est réservé et rien
        n&apos;est payé : vous demandez un prix, le vendeur vous répond,
        et vous décidez ensuite.
      </div>

      {query.error && (
        <div className="mt-4 rounded-[8px] border border-[#f2c2c8] bg-[#fdeaec] px-4 py-3 text-base text-[#b01124]">
          {decodeURIComponent(query.error)}
        </div>
      )}

      <form action={requestQuoteAction} className="mt-6 space-y-4">
        <input type="hidden" name="seller_id" value={sellerId} />
        <input type="hidden" name="product_title" value={productTitle} />
        <input type="hidden" name="product_id" value={query.produit || ""} />
        <input type="hidden" name="variant_id" value={query.variante || ""} />

        <div>
          <label htmlFor="quantity" className={labelClass}>
            Quantité souhaitée
          </label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            min={1}
            step={1}
            defaultValue={10}
            required
            className={inputClass}
          />
          <p className="mt-1 text-xs text-[var(--mache-muted)]">
            C&apos;est la quantité qui décide du prix : dites-la même
            approximativement.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="buyer_name" className={labelClass}>
              Votre nom
            </label>
            <input
              id="buyer_name"
              name="buyer_name"
              required
              defaultValue={defaultName}
              autoComplete="name"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="buyer_email" className={labelClass}>
              Adresse e-mail
            </label>
            <input
              id="buyer_email"
              name="buyer_email"
              type="email"
              required
              defaultValue={customer?.email ?? ""}
              autoComplete="email"
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="buyer_phone" className={labelClass}>
              Téléphone <span className="font-normal text-[var(--mache-muted)]">(facultatif)</span>
            </label>
            <input
              id="buyer_phone"
              name="buyer_phone"
              autoComplete="tel"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="buyer_company" className={labelClass}>
              Organisation <span className="font-normal text-[var(--mache-muted)]">(facultatif)</span>
            </label>
            <input
              id="buyer_company"
              name="buyer_company"
              autoComplete="organization"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="message" className={labelClass}>
            Votre demande <span className="font-normal text-[var(--mache-muted)]">(facultatif)</span>
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            maxLength={2000}
            placeholder="Délai souhaité, lieu de livraison, conditionnement…"
            className={inputClass}
          />
        </div>

        <SubmitButton
          className="w-full rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-md font-bold text-white transition-colors hover:bg-[var(--mache-primary-dark)]"
          pendingLabel="Envoi en cours…"
          pendingHint="Le backend commerce peut être en veille et mettre jusqu'à une minute à répondre. Ne quittez pas la page."
        >
          Envoyer la demande
        </SubmitButton>
      </form>

      <p className="mt-4 text-sm leading-relaxed text-[var(--mache-muted)]">
        Le vendeur voit votre nom, votre adresse e-mail et, si vous les
        renseignez, votre téléphone et votre organisation : c&apos;est ce
        qui lui permet de vous répondre.
      </p>
    </main>
  );
}
