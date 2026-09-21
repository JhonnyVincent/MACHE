/*
  PAGE : panier

  Les totaux affichés sont ceux que Medusa a calculés : la page n'en
  additionne aucun. C'est ce qui garantit que le montant vu est celui qui
  sera facturé, promotions et taxes comprises.

  L'ancien panier vivait dans le navigateur avec un instantané du prix
  pris à l'ajout. Une promotion terminée entre-temps n'était pas
  répercutée, et le client voyait un total que la commande n'aurait pas
  honoré.
*/

import Link from "next/link";
import { getCart } from "@/lib/medusa/cart";
import { formatAmount } from "@/lib/medusa/catalog";
import { sellerGroupsOf } from "@/lib/medusa/cart-minimums";
import { blockingGroups } from "@/lib/seller-minimum";
import { updateCartLineAction, removeCartLineAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function CartPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const query = searchParams ? await searchParams : {};
  const cart = await getCart();

  /*
    Les boutiques du panier et leurs conditions. Un panier MACHÉ mélange
    les vendeurs, et chacun pose les siennes.
  */
  const groups = cart ? await sellerGroupsOf(cart) : [];
  const blocked = blockingGroups(groups);

  const isEmpty = !cart || cart.lines.length === 0;

  return (
    <main className="bg-[var(--mache-bg)] pb-10">
      <div className="container-page py-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--mache-text)] sm:text-3xl">
          Mon panier
        </h1>

        {query.error && (
          <div className="mt-4 rounded-[8px] border border-[#f2c2c8] bg-[#fdeaec] px-4 py-3 text-base text-[#b01124]">
            {decodeURIComponent(query.error)}
          </div>
        )}

        {isEmpty ? (
          <div className="mt-6 rounded-[10px] border border-dashed border-[var(--mache-line)] bg-white p-10 text-center">
            <p className="text-md font-bold text-[var(--mache-text)]">
              Votre panier est vide
            </p>
            <p className="mx-auto mt-2 max-w-md text-base leading-relaxed text-[var(--mache-muted)]">
              Parcourez le catalogue et ajoutez des articles depuis leur fiche.
            </p>
            <Link
              href="/shop"
              className="mt-5 inline-block rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-md font-bold text-white transition-colors hover:bg-[var(--mache-primary-dark)]"
            >
              Voir le catalogue
            </Link>
          </div>
        ) : (
          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_340px]">
            {/* Lignes */}
            <div className="space-y-2.5">
              {cart.lines.map((line) => (
                <div
                  key={line.id}
                  className="flex gap-3 rounded-[10px] border border-[var(--mache-line)] bg-white p-3"
                >
                  <span className="h-20 w-20 shrink-0 overflow-hidden rounded-[6px] border border-[var(--mache-line)] bg-[var(--mache-bg)]">
                    {line.thumbnail ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={line.thumbnail} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </span>

                  <div className="min-w-0 flex-1">
                    {line.productHandle ? (
                      <Link
                        href={`/product/${line.productHandle}`}
                        className="text-md font-semibold text-[var(--mache-text)] hover:underline"
                      >
                        {line.title}
                      </Link>
                    ) : (
                      <span className="text-md font-semibold text-[var(--mache-text)]">
                        {line.title}
                      </span>
                    )}

                    {line.variantTitle && (
                      <p className="mt-0.5 text-sm text-[var(--mache-muted)]">
                        {line.variantTitle}
                      </p>
                    )}

                    <p className="mt-1 text-sm text-[var(--mache-muted)]">
                      {formatAmount(line.unitPrice, cart.currency)} l&apos;unité
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <form action={updateCartLineAction} className="flex items-center gap-1.5">
                        <input type="hidden" name="line_id" value={line.id} />
                        <label htmlFor={`qty-${line.id}`} className="sr-only">
                          Quantité
                        </label>
                        <input
                          id={`qty-${line.id}`}
                          name="quantity"
                          type="number"
                          min={1}
                          defaultValue={line.quantity}
                          className="w-16 rounded-[4px] border border-[var(--mache-line)] px-2 py-1 text-base"
                        />
                        <button
                          type="submit"
                          className="rounded-[4px] border border-[var(--mache-line)] px-2.5 py-1 text-sm font-semibold text-[var(--mache-text)] hover:border-[var(--mache-primary)]"
                        >
                          Mettre à jour
                        </button>
                      </form>

                      <form action={removeCartLineAction}>
                        <input type="hidden" name="line_id" value={line.id} />
                        <button
                          type="submit"
                          className="text-sm text-[var(--mache-muted)] underline-offset-2 hover:text-[var(--mache-danger)] hover:underline"
                        >
                          Retirer
                        </button>
                      </form>
                    </div>
                  </div>

                  <span className="shrink-0 text-md font-black text-[var(--mache-text)]">
                    {formatAmount(line.total, cart.currency)}
                  </span>
                </div>
              ))}
            </div>

            {/* Récapitulatif */}
            <aside className="h-fit rounded-[10px] border border-[var(--mache-line)] bg-white p-4">
              <h2 className="text-md font-bold text-[var(--mache-text)]">
                Récapitulatif
              </h2>

              <dl className="mt-3 space-y-2 text-base">
                <div className="flex justify-between">
                  <dt className="text-[var(--mache-muted)]">
                    Sous-total ({cart.itemCount} article{cart.itemCount > 1 ? "s" : ""})
                  </dt>
                  <dd className="font-medium">{formatAmount(cart.subtotal, cart.currency)}</dd>
                </div>

                {cart.discountTotal > 0 && (
                  <div className="flex justify-between text-[var(--mache-success)]">
                    <dt>Remises</dt>
                    <dd className="font-medium">
                      −{formatAmount(cart.discountTotal, cart.currency)}
                    </dd>
                  </div>
                )}

                <div className="flex justify-between">
                  <dt className="text-[var(--mache-muted)]">Livraison</dt>
                  <dd className="font-medium">
                    {cart.shippingTotal > 0
                      ? formatAmount(cart.shippingTotal, cart.currency)
                      : "Calculée à l'étape suivante"}
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

              {/*
                Ce qui manque, boutique par boutique, et avant le bouton.

                Découvrir à la caisse qu'une commande ne peut pas aboutir
                fait perdre le travail déjà fait — adresse, livraison. Le
                panier le dit d'abord, avec le montant exact qui manque
                et chez qui.
              */}
              {blocked.length > 0 && (
                <div className="mt-4 rounded-[8px] border border-[#f3d9a5] bg-[#fdf6e8] p-3.5">
                  <p className="text-base font-bold text-[var(--mache-text)]">
                    {blocked.length > 1
                      ? "Deux boutiques demandent une commande minimum"
                      : "Cette boutique demande une commande minimum"}
                  </p>

                  <ul className="mt-2 space-y-1.5">
                    {blocked.map((group) => (
                      <li
                        key={group.sellerId}
                        className="text-base leading-relaxed text-[var(--mache-muted)]"
                      >
                        <strong className="text-[var(--mache-text)]">
                          {group.sellerName}
                        </strong>{" "}
                        : minimum{" "}
                        {formatAmount(group.minimum, cart.currency)}, vous
                        en êtes à {formatAmount(group.subtotal, cart.currency)}.
                        Il manque{" "}
                        <strong className="text-[var(--mache-text)]">
                          {formatAmount(group.missing, cart.currency)}
                        </strong>
                        .
                      </li>
                    ))}
                  </ul>

                  <p className="mt-2 text-sm leading-relaxed text-[var(--mache-muted)]">
                    Le minimum porte sur les articles de cette boutique
                    seulement.
                  </p>
                </div>
              )}

              {blocked.length > 0 ? (
                <span
                  aria-disabled="true"
                  className="mt-4 block cursor-not-allowed rounded-[6px] bg-[var(--mache-line)] px-5 py-3 text-center text-md font-bold text-[var(--mache-muted)]"
                >
                  Commander
                </span>
              ) : (
                <Link
                  href="/checkout"
                  className="mt-4 block rounded-[6px] bg-[var(--mache-primary)] px-5 py-3 text-center text-md font-bold text-white transition-colors hover:bg-[var(--mache-primary-dark)]"
                >
                  Commander
                </Link>
              )}

              {/*
                Le moyen de paiement est annoncé ici, pas découvert à la
                dernière étape : quelqu'un qui n'a pas d'espèces doit le
                savoir avant de saisir son adresse.
              */}
              <p className="mt-2 text-xs leading-relaxed text-[var(--mache-muted)]">
                Paiement à la livraison. Aucune donnée bancaire ne vous sera
                demandée.
              </p>

              <Link
                href="/shop"
                className="mt-3 block text-center text-base font-semibold text-[var(--mache-primary)] hover:underline"
              >
                Continuer mes achats
              </Link>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
