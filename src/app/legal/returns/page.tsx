/*
  PAGE : retours et remboursements

  Comme /legal/shipping, cette adresse figurait dans le pied de page de
  chaque page du site sans exister.

  Elle décrit le fonctionnement réel. Le délai légal de rétractation, les
  cas de remboursement et les frais de retour sont des engagements
  juridiques : ils doivent être arrêtés par MACHÉ, au besoin avec un
  conseil, et ne sont pas écrits ici à sa place.
*/

import Link from "next/link";

export const metadata = {
  title: "Retours et remboursements — MACHÉ",
  description: "Comment demander un retour ou un remboursement sur MACHÉ.",
};

export default function ReturnsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <h1 className="text-[26px] font-bold tracking-[-0.01em] text-[var(--mache-text)] sm:text-[32px]">
        Retours et remboursements
      </h1>

      <div className="mt-6 space-y-6 text-[14px] leading-relaxed text-[var(--mache-muted)]">
        <section>
          <h2 className="text-[16px] font-bold text-[var(--mache-text)]">
            À qui s&apos;adresser
          </h2>
          <p className="mt-2">
            Chaque produit est vendu par son vendeur : c&apos;est à lui que se
            demande un retour, depuis le détail de la commande concernée dans{" "}
            <Link href="/dashboard/buyer/orders" className="font-semibold text-[var(--mache-primary)] hover:underline">
              Mes commandes
            </Link>
            . MACHÉ intervient si le vendeur ne répond pas ou si le désaccord
            persiste.
          </p>
        </section>

        <section>
          <h2 className="text-[16px] font-bold text-[var(--mache-text)]">
            Article non conforme ou abîmé
          </h2>
          <p className="mt-2">
            Signalez-le sans attendre, photos à l&apos;appui. Un article qui ne
            correspond pas à sa description ou qui arrive endommagé n&apos;est
            pas à votre charge.
          </p>
        </section>

        <section>
          <h2 className="text-[16px] font-bold text-[var(--mache-text)]">
            Paiement à la livraison
          </h2>
          <p className="mt-2">
            Le paiement à la livraison est aujourd&apos;hui le seul moyen de
            paiement de MACHÉ. Vérifiez le contenu du colis avant de payer :
            c&apos;est le moment où un refus est le plus simple, pour vous
            comme pour le vendeur.
          </p>
        </section>

        <section className="rounded-[10px] border border-[#f3d9a5] bg-[#fdf6e8] p-4">
          <h2 className="text-[15px] font-bold text-[var(--mache-text)]">
            Ce qui reste à arrêter
          </h2>
          <p className="mt-2 text-[13.5px]">
            Le délai de rétractation, les cas ouvrant droit à remboursement et
            la prise en charge des frais de retour sont des engagements
            juridiques. Ils seront publiés ici une fois fixés par MACHÉ. En
            attendant, aucun délai n&apos;est annoncé sur cette page :
            afficher un chiffre qui n&apos;engage personne serait pire que de
            n&apos;en afficher aucun.
          </p>
        </section>

        <p className="text-[13px]">
          Un litige à signaler ?{" "}
          <Link href="/contact" className="font-semibold text-[var(--mache-primary)] hover:underline">
            Contactez l&apos;équipe MACHÉ
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
