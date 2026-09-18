/*
  PAGE : livraison

  Le pied de page pointait vers cette adresse depuis le début, sur chaque
  page du site, alors qu'elle n'existait pas : tout visiteur cherchant les
  délais de livraison tombait sur une page introuvable.

  Elle décrit ce que MACHÉ fait réellement aujourd'hui. Les conditions
  définitives — délais garantis, tarifs par zone, transporteurs — relèvent
  d'une décision commerciale et ne sont pas inventées ici.
*/

import Link from "next/link";

export const metadata = {
  title: "Livraison — MACHÉ",
  description: "Comment les commandes sont acheminées sur MACHÉ.",
};

export default function ShippingPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--mache-text)] sm:text-4xl">
        Livraison
      </h1>

      <div className="mt-6 space-y-6 text-md leading-relaxed text-[var(--mache-muted)]">
        <section>
          <h2 className="text-lg font-bold text-[var(--mache-text)]">
            Qui livre votre commande
          </h2>
          <p className="mt-2">
            MACHÉ est une place de marché : chaque produit est vendu et expédié
            par son vendeur. Une commande contenant des articles de plusieurs
            boutiques donne lieu à plusieurs envois, qui peuvent arriver
            séparément.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[var(--mache-text)]">
            Suivi
          </h2>
          <p className="mt-2">
            L&apos;état de chaque envoi est visible depuis votre espace, dans{" "}
            <Link href="/dashboard/buyer/orders" className="font-semibold text-[var(--mache-primary)] hover:underline">
              Mes commandes
            </Link>
            . Il est mis à jour par le vendeur ou par l&apos;agent chargé de la
            course.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[var(--mache-text)]">
            Agents MACHÉ
          </h2>
          <p className="mt-2">
            Une partie des livraisons est assurée par des agents MACHÉ. Un agent
            porte une carte avec un code que vous pouvez vérifier sur{" "}
            <Link href="/verify-agent" className="font-semibold text-[var(--mache-primary)] hover:underline">
              la page de vérification
            </Link>
            , depuis votre propre téléphone. Ne remettez ni colis ni argent à
            quelqu&apos;un dont le code ne se vérifie pas.
          </p>
        </section>

        <section className="rounded-[10px] border border-[#f3d9a5] bg-[#fdf6e8] p-4">
          <h2 className="text-md font-bold text-[var(--mache-text)]">
            Ce qui n&apos;est pas encore en place
          </h2>
          <p className="mt-2 text-base">
            Aucun transporteur n&apos;est intégré à MACHÉ : il n&apos;y a donc
            ni numéro de suivi automatique, ni délai garanti, ni grille
            tarifaire par zone. Les délais et frais sont convenus avec le
            vendeur. Cette page sera complétée dès qu&apos;un partenaire
            logistique sera raccordé — plutôt que d&apos;annoncer des délais que
            personne ne pourrait tenir.
          </p>
        </section>

        <p className="text-base">
          Une question sur une livraison en cours ?{" "}
          <Link href="/contact" className="font-semibold text-[var(--mache-primary)] hover:underline">
            Contactez-nous
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
