"use client";

/*
  PAGE : panier

  Affichait deux produits pris au hasard dans les données de démonstration,
  avec un champ quantité et un bouton « Retirer » qui ne faisaient rien.
  Elle reflète maintenant le panier réel.

  Le passage de commande reste annoncé comme indisponible : aucune commande
  n'est encore enregistrée en base et aucun paiement n'est raccordé. Mieux
  vaut le dire au client que le laisser croire à un achat qui n'aura pas lieu.
*/

import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const { items, subtotal, count, increaseItem, decreaseItem, removeItem, clearCart } =
    useCart();

  if (items.length === 0) {
    return (
      <main className="container-page py-12">
        <h1 className="section-title">Panier</h1>

        <div className="card mt-8 p-10 text-center">
          <p className="text-[18px] font-[900]">Votre panier est vide</p>
          <p className="mx-auto mt-2 max-w-md text-[14px] leading-[1.8] text-[var(--mache-muted)]">
            Parcourez le catalogue et ajoutez des articles pour les retrouver ici.
          </p>
          <div className="mt-6">
            <Link href="/shop" className="btn-primary">
              Voir le catalogue
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container-page py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="section-title">Panier</h1>
        <button onClick={clearCart} className="text-[13px] text-[var(--mache-muted)] underline">
          Vider le panier
        </button>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="card flex flex-col gap-4 p-5 sm:flex-row">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image || "/placeholder-product.png"}
                alt={item.title}
                className="h-28 w-full rounded-2xl object-cover sm:w-32"
              />

              <div className="min-w-0 flex-1">
                <Link href={`/product/${item.handle}`} className="text-[17px] font-[900] hover:underline">
                  {item.title}
                </Link>

                {item.storeName && (
                  <p className="mt-1 text-[13px] text-[var(--mache-muted)]">{item.storeName}</p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <div className="flex items-center overflow-hidden rounded-[8px] border border-[var(--mache-line)]">
                    <button
                      onClick={() => decreaseItem(item.id)}
                      aria-label={`Retirer une unité de ${item.title}`}
                      className="h-9 w-9 text-lg"
                    >
                      −
                    </button>
                    <div className="flex h-9 min-w-10 items-center justify-center border-x border-[var(--mache-line)] px-3 font-[800]">
                      {item.quantity}
                    </div>
                    <button
                      onClick={() => increaseItem(item.id)}
                      aria-label={`Ajouter une unité de ${item.title}`}
                      className="h-9 w-9 text-lg"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-[13px] text-[var(--mache-muted)] underline"
                  >
                    Retirer
                  </button>
                </div>
              </div>

              <div className="text-right">
                <p className="text-[17px] font-[950]">
                  {formatPrice(item.price * item.quantity)}
                </p>
                {item.quantity > 1 && (
                  <p className="mt-1 text-[12px] text-[var(--mache-muted)]">
                    {formatPrice(item.price)} l&apos;unité
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="card h-fit p-6">
          <h2 className="text-[18px] font-[900]">Résumé</h2>

          <div className="mt-4 space-y-3 text-[14px]">
            <div className="flex justify-between">
              <span className="text-[var(--mache-muted)]">
                Sous-total ({count} article{count > 1 ? "s" : ""})
              </span>
              <span className="font-[800]">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--mache-muted)]">Livraison</span>
              <span className="text-[var(--mache-muted)]">Selon la zone</span>
            </div>
          </div>

          <div className="mt-4 border-t border-[var(--mache-line)] pt-4">
            <div className="flex justify-between text-[20px] font-[950]">
              <span>Total</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
          </div>

          <div className="mt-5 rounded-[10px] border border-[#f3d9a5] bg-[#fdf6e8] px-4 py-3 text-[13px] leading-[1.7]">
            <p className="font-[800]">Commande en ligne bientôt disponible</p>
            <p className="mt-1 text-[var(--mache-muted)]">
              Le paiement n&apos;est pas encore raccordé. Contactez directement
              la boutique pour finaliser votre achat.
            </p>
          </div>

          <Link href="/shop" className="btn-secondary mt-4 w-full justify-center">
            Continuer mes achats
          </Link>
        </div>
      </div>
    </main>
  );
}
