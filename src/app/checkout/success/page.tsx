/*
  PAGE : Commande confirmée

  Sert à :
  - confirmer l'enregistrement de la commande et rappeler sa référence ;
  - vider le panier, la commande étant passée ;
  - orienter vers le suivi quand le client a un compte.

  Cette page affichait auparavant une confirmation figée, sans référence :
  elle ne prouvait rien. Les valeurs proviennent désormais de la commande
  réellement créée.
*/

import Link from "next/link";
import { ClearCartOnMount } from "@/components/checkout/clear-cart";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Commande confirmée — Maché",
};

function formatHTG(value: number) {
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(
    Number(value) || 0
  )} HTG`;
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    ref?: string;
    total?: string;
    items?: string;
    stores?: string;
    shipping?: string;
  }>;
}) {
  const { ref, total, items, stores, shipping } = await searchParams;

  /*
    Sans référence, la page a été ouverte directement : on ne prétend pas
    qu'une commande existe.
  */
  if (!ref) {
    return (
      <main className="container-page py-16">
        <div className="card mx-auto max-w-xl p-8 text-center">
          <h1 className="text-[24px] font-[900]">Aucune commande à afficher</h1>
          <p className="mt-3 text-[14px] leading-[1.8] text-[var(--mache-muted)]">
            Cette page confirme une commande après sa validation. Vous y
            arriverez automatiquement depuis le tunnel d&apos;achat.
          </p>
          <Link href="/shop" className="btn-primary mt-6">
            Voir le catalogue
          </Link>
        </div>
      </main>
    );
  }

  const storeCount = Number(stores) || 1;

  return (
    <main className="container-page py-14">
      <ClearCartOnMount />

      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--mache-success-soft)] text-[28px]">
          ✅
        </div>

        <h1 className="text-[clamp(24px,3.4vw,34px)] font-[900] tracking-[-0.03em]">
          Commande confirmée
        </h1>

        <p className="mt-3 text-[14px] leading-[1.8] text-[var(--mache-muted)]">
          Votre commande est enregistrée. Conservez sa référence : elle permet
          de la retrouver auprès de la boutique.
        </p>

        <div className="card mt-7 p-5 text-left">
          <dl className="divide-y divide-[var(--mache-line)] text-[13.5px]">
            <div className="flex items-center justify-between py-3">
              <dt className="text-[var(--mache-muted)]">Référence</dt>
              <dd className="tnum text-[17px] font-[950] tracking-[0.02em]">{ref}</dd>
            </div>
            {items && (
              <div className="flex items-center justify-between py-3">
                <dt className="text-[var(--mache-muted)]">Articles</dt>
                <dd className="tnum font-[800]">{items}</dd>
              </div>
            )}
            {storeCount > 1 && (
              <div className="flex items-center justify-between py-3">
                <dt className="text-[var(--mache-muted)]">Boutiques</dt>
                <dd className="tnum font-[800]">
                  {storeCount} — chaque boutique prépare sa part
                </dd>
              </div>
            )}
            {total && (
              <div className="flex items-center justify-between py-3">
                <dt className="text-[var(--mache-muted)]">Total</dt>
                <dd className="tnum text-[17px] font-[950]">
                  {formatHTG(Number(total))}
                </dd>
              </div>
            )}
          </dl>

          {shipping === "pending" && (
            <p className="mt-4 rounded-[8px] border border-[#f3d9a5] bg-[#fdf6e8] px-3.5 py-3 text-[12.5px] leading-[1.7]">
              Les frais de livraison de votre zone ne sont pas encore tarifés :
              ils ne sont pas compris dans ce total. La boutique vous les
              confirmera avant l&apos;expédition.
            </p>
          )}

          <p className="mt-4 text-[12.5px] leading-[1.7] text-[var(--mache-muted)]">
            Le paiement se fait à la livraison. La boutique vous contactera au
            numéro indiqué pour convenir de la remise du colis.
          </p>
        </div>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/dashboard/buyer/orders" className="btn-primary">
            Suivre ma commande
          </Link>
          <Link href="/shop" className="btn-secondary">
            Continuer mes achats
          </Link>
        </div>
      </div>
    </main>
  );
}
