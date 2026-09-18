/*
  PAGE : commander

  Une seule page, dont les sections s'ouvrent à mesure que le panier
  avance. L'état vient du panier Medusa lui-même — e-mail, adresse,
  méthodes de livraison retenues — et non d'une session parallèle qui
  finirait par diverger de la commande réelle.

  La livraison se choisit PAR VENDEUR : sur une marketplace, chaque
  boutique expédie depuis son propre entrepôt. Un panier de deux boutiques
  demande donc deux choix, et les frais s'additionnent.
*/

import Link from "next/link";
import { redirect } from "next/navigation";
import { getCart } from "@/lib/medusa/cart";
import { getCheckoutState } from "@/lib/medusa/checkout";
import { formatAmount } from "@/lib/medusa/catalog";
import { saveAddressAction, chooseShippingAction, placeOrderAction } from "./actions";

export const dynamic = "force-dynamic";

/* Pays proposés : là où MACHÉ livre ou expédie aujourd'hui. */
const COUNTRIES = [
  { code: "ht", label: "Haïti" },
  { code: "fr", label: "France" },
  { code: "us", label: "États-Unis" },
  { code: "ca", label: "Canada" },
];

function Step({
  number,
  title,
  done,
  children,
}: {
  number: number;
  title: string;
  done?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[10px] border border-[var(--mache-line)] bg-white">
      <header className="flex items-center gap-2.5 border-b border-[var(--mache-line)] px-4 py-3">
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold ${
            done
              ? "bg-[var(--mache-success)] text-white"
              : "bg-[var(--mache-text)] text-white"
          }`}
        >
          {done ? "✓" : number}
        </span>
        <h2 className="text-md font-bold text-[var(--mache-text)]">{title}</h2>
      </header>

      <div className="p-4">{children}</div>
    </section>
  );
}

const inputClass =
  "w-full rounded-[6px] border border-[var(--mache-line)] bg-white px-3 py-2 text-md outline-none focus:border-[var(--mache-primary)]";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const query = searchParams ? await searchParams : {};

  const cart = await getCart();

  /* Un panier vide n'a rien à commander : on renvoie au catalogue. */
  if (!cart || cart.lines.length === 0) redirect("/cart");

  const stateResult = await getCheckoutState();

  if (!stateResult.ok) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-14">
        <h1 className="text-2xl font-bold text-[var(--mache-text)]">
          Commande indisponible
        </h1>
        <p className="mt-3 text-md leading-relaxed text-[var(--mache-muted)]">
          {stateResult.reason}
        </p>
        <Link
          href="/cart"
          className="mt-6 inline-block rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-md font-bold text-white"
        >
          Retour au panier
        </Link>
      </main>
    );
  }

  const state = stateResult.data;

  return (
    <main className="bg-[var(--mache-bg)] pb-10">
      <div className="container-page py-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--mache-text)] sm:text-3xl">
          Commander
        </h1>

        {query.error && (
          <div className="mt-4 rounded-[8px] border border-[#f2c2c8] bg-[#fdeaec] px-4 py-3 text-base text-[#b01124]">
            {decodeURIComponent(query.error)}
          </div>
        )}

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            {/* 1. Coordonnées et adresse */}
            <Step number={1} title="Livraison" done={state.hasAddress && state.hasEmail}>
              <form action={saveAddressAction} className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="email" className="text-sm font-semibold text-[var(--mache-text)]">
                    Adresse e-mail *
                  </label>
                  <input id="email" name="email" type="email" required className={`mt-1 ${inputClass}`} />
                  <p className="mt-1 text-xs text-[var(--mache-muted)]">
                    Elle sert à vous envoyer la confirmation et le suivi.
                  </p>
                </div>

                <div>
                  <label htmlFor="first_name" className="text-sm font-semibold text-[var(--mache-text)]">
                    Prénom *
                  </label>
                  <input id="first_name" name="first_name" required className={`mt-1 ${inputClass}`} />
                </div>

                <div>
                  <label htmlFor="last_name" className="text-sm font-semibold text-[var(--mache-text)]">
                    Nom *
                  </label>
                  <input id="last_name" name="last_name" required className={`mt-1 ${inputClass}`} />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="address_1" className="text-sm font-semibold text-[var(--mache-text)]">
                    Adresse *
                  </label>
                  <input id="address_1" name="address_1" required className={`mt-1 ${inputClass}`} />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="address_2" className="text-sm font-semibold text-[var(--mache-text)]">
                    Complément — repère, étage
                  </label>
                  <input id="address_2" name="address_2" className={`mt-1 ${inputClass}`} />
                </div>

                <div>
                  <label htmlFor="city" className="text-sm font-semibold text-[var(--mache-text)]">
                    Ville *
                  </label>
                  <input id="city" name="city" required className={`mt-1 ${inputClass}`} />
                </div>

                <div>
                  <label htmlFor="province" className="text-sm font-semibold text-[var(--mache-text)]">
                    Département
                  </label>
                  <input id="province" name="province" className={`mt-1 ${inputClass}`} />
                </div>

                <div>
                  <label htmlFor="country_code" className="text-sm font-semibold text-[var(--mache-text)]">
                    Pays *
                  </label>
                  <select id="country_code" name="country_code" required className={`mt-1 ${inputClass}`}>
                    {COUNTRIES.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="phone" className="text-sm font-semibold text-[var(--mache-text)]">
                    Téléphone *
                  </label>
                  <input id="phone" name="phone" required inputMode="tel" className={`mt-1 ${inputClass}`} />
                  <p className="mt-1 text-xs text-[var(--mache-muted)]">
                    Le livreur appelle. Sans numéro, la livraison échoue.
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="rounded-[6px] bg-[var(--mache-text)] px-5 py-2.5 text-md font-bold text-white transition-colors hover:bg-black"
                  >
                    {state.hasAddress ? "Modifier l'adresse" : "Valider l'adresse"}
                  </button>
                </div>
              </form>
            </Step>

            {/* 2. Livraison par vendeur */}
            <Step number={2} title="Mode de livraison" done={state.allSellersShipped}>
              {!state.hasAddress ? (
                <p className="text-base text-[var(--mache-muted)]">
                  Renseignez d&apos;abord votre adresse : les modes de livraison
                  en dépendent.
                </p>
              ) : state.shippingBySeller.length === 0 ? (
                <p className="rounded-[8px] border border-[#f3d9a5] bg-[#fdf6e8] px-3 py-2.5 text-base text-[var(--mache-muted)]">
                  Aucun mode de livraison ne dessert cette adresse. Vérifiez le
                  pays et la ville, ou contactez MACHÉ.
                </p>
              ) : (
                <div className="space-y-4">
                  {state.shippingBySeller.length > 1 && (
                    <p className="text-sm leading-relaxed text-[var(--mache-muted)]">
                      Votre panier contient des articles de{" "}
                      {state.shippingBySeller.length} boutiques. Chacune expédie
                      de son côté : choisissez un mode de livraison pour
                      chacune.
                    </p>
                  )}

                  {state.shippingBySeller.map((seller) => (
                    <div key={seller.sellerId || seller.sellerName}>
                      {state.shippingBySeller.length > 1 && (
                        <p className="mb-1.5 text-sm font-semibold text-[var(--mache-text)]">
                          {seller.sellerName}
                        </p>
                      )}

                      <div className="space-y-1.5">
                        {seller.options.map((option) => {
                          const chosen = seller.chosenOptionId === option.id;

                          return (
                            <form key={option.id} action={chooseShippingAction}>
                              <input type="hidden" name="option_id" value={option.id} />
                              <button
                                type="submit"
                                className={`flex w-full items-center justify-between gap-3 rounded-[6px] border px-3 py-2.5 text-left transition-colors ${
                                  chosen
                                    ? "border-[var(--mache-text)] bg-[var(--mache-bg)]"
                                    : "border-[var(--mache-line)] hover:border-[var(--mache-primary)]"
                                }`}
                              >
                                <span className="text-base font-medium text-[var(--mache-text)]">
                                  {chosen ? "✓ " : ""}
                                  {option.name}
                                </span>
                                <span className="text-base font-semibold text-[var(--mache-text)]">
                                  {option.amount === null
                                    ? "Tarif à confirmer"
                                    : formatAmount(option.amount, cart.currency)}
                                </span>
                              </button>
                            </form>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Step>

            {/* 3. Paiement */}
            <Step number={3} title="Paiement">
              <div className="rounded-[8px] border border-[var(--mache-line)] bg-[var(--mache-bg)] p-3.5">
                <p className="text-base font-semibold text-[var(--mache-text)]">
                  Paiement à la livraison
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--mache-muted)]">
                  Vous réglez en main propre au moment de recevoir le colis.
                  Vérifiez son contenu avant de payer : c&apos;est le moment où
                  un refus est le plus simple, pour vous comme pour le vendeur.
                </p>
              </div>

              {/*
                Aucun autre moyen n'est proposé, et aucun n'est annoncé
                comme « bientôt disponible » : tant qu'un prestataire n'est
                pas raccordé, une carte bancaire affichée en grisé ne
                serait qu'une promesse.
              */}
              <p className="mt-3 text-xs leading-relaxed text-[var(--mache-muted)]">
                MACHÉ n&apos;a aujourd&apos;hui aucun prestataire de paiement en
                ligne raccordé. Aucune donnée bancaire ne vous est demandée, ni
                ne transite par ce site.
              </p>
            </Step>
          </div>

          {/* Récapitulatif */}
          <aside className="h-fit rounded-[10px] border border-[var(--mache-line)] bg-white p-4">
            <h2 className="text-md font-bold text-[var(--mache-text)]">
              Votre commande
            </h2>

            <ul className="mt-3 space-y-2">
              {cart.lines.map((line) => (
                <li key={line.id} className="flex justify-between gap-3 text-sm">
                  <span className="min-w-0 text-[var(--mache-muted)]">
                    {line.quantity} × {line.title}
                  </span>
                  <span className="shrink-0 font-medium">
                    {formatAmount(line.total, cart.currency)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-3 space-y-2 border-t border-[var(--mache-line)] pt-3 text-base">
              <div className="flex justify-between">
                <dt className="text-[var(--mache-muted)]">Sous-total</dt>
                <dd className="font-medium">{formatAmount(cart.subtotal, cart.currency)}</dd>
              </div>

              <div className="flex justify-between">
                <dt className="text-[var(--mache-muted)]">Livraison</dt>
                <dd className="font-medium">
                  {state.allSellersShipped
                    ? formatAmount(cart.shippingTotal, cart.currency)
                    : "À choisir"}
                </dd>
              </div>

              {cart.taxTotal > 0 && (
                <div className="flex justify-between">
                  <dt className="text-[var(--mache-muted)]">Taxes</dt>
                  <dd className="font-medium">{formatAmount(cart.taxTotal, cart.currency)}</dd>
                </div>
              )}

              <div className="flex justify-between border-t border-[var(--mache-line)] pt-2 text-lg">
                <dt className="font-bold">Total</dt>
                <dd className="font-black">{formatAmount(cart.total, cart.currency)}</dd>
              </div>
            </dl>

            <form action={placeOrderAction} className="mt-4">
              <button
                type="submit"
                disabled={!state.readyToPay}
                className="w-full rounded-[6px] bg-[var(--mache-primary)] px-5 py-3 text-md font-bold text-white transition-colors hover:bg-[var(--mache-primary-dark)] disabled:cursor-not-allowed disabled:bg-[var(--mache-line)] disabled:text-[var(--mache-muted)]"
              >
                Confirmer la commande
              </button>
            </form>

            {!state.readyToPay && (
              <p className="mt-2 text-xs leading-relaxed text-[var(--mache-muted)]">
                {!state.hasAddress
                  ? "Complétez l'adresse pour continuer."
                  : "Choisissez un mode de livraison pour chaque boutique."}
              </p>
            )}

            <Link
              href="/cart"
              className="mt-3 block text-center text-sm text-[var(--mache-muted)] hover:underline"
            >
              Modifier le panier
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
