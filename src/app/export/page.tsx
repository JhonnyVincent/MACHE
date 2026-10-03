/*
  PAGE : export

  Ce qu'elle annonçait

  Trois encarts — Fournisseurs, Logistique, Paiement — tous rédigés en
  « architecture prête pour » et « prévu pour ». Une page entière
  consacrée à une fonction qui n'existe sous aucune forme.

  Pourquoi elle existe encore

  Parce que la question est légitime : MACHE parle d'Haïti, de la
  Caraïbe et de la diaspora, et quelqu'un qui veut exporter a le droit
  de trouver une réponse claire plutôt que rien. Depuis le 30 septembre,
  la réponse est « oui, sur confirmation » : un acheteur à l'étranger
  commande, MACHE chiffre l'expédition et la fait accepter avant tout
  envoi. Ce qui manque encore (tarifs négociés, douane, paiement en
  ligne, suivi) est dit en toutes lettres.

  Une page supprimée laisserait la question sans réponse ; une page qui
  promet laisserait croire à une offre. Celle-ci dit ce qui est vrai, et
  propose de se faire connaître à qui la fonction intéresse.
*/

import { Link } from "next-view-transitions";

export const metadata = {
  title: "Exporter depuis Haïti",
  description:
    "Vendre hors d'Haïti avec MACHE : la commande sur confirmation, et ce qui n'existe pas encore.",
};

export default function ExportPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--mache-text)] sm:text-4xl">
        Exporter depuis Haïti
      </h1>

      <div className="mt-6 rounded-[8px] border border-[var(--mache-warn-line)] bg-[var(--mache-warn-soft)] p-5">
        <p className="text-md font-bold text-[var(--mache-text)]">
          L&apos;export s&apos;ouvre, sur confirmation
        </p>
        <p className="mt-1.5 text-md leading-relaxed text-[var(--mache-muted)]">
          Un acheteur aux États-Unis, au Canada, en France ou ailleurs peut
          commander chez vous. Sa commande vous arrive marquée «&nbsp;commande
          internationale&nbsp;» : MACHE chiffre l&apos;expédition, la fait
          accepter par l&apos;acheteur avec le moyen de paiement, puis vous
          donne le feu vert. <strong>N&apos;expédiez rien avant.</strong>
        </p>
      </div>

      <div className="mt-8 space-y-7 text-md leading-relaxed text-[var(--mache-muted)]">
        <section>
          <h2 className="text-lg font-bold text-[var(--mache-text)]">
            Ce qui est possible aujourd&apos;hui
          </h2>

          <p className="mt-2">
            Un vendeur définit ses zones de livraison. Rien ne
            l&apos;empêche d&apos;y ajouter un pays étranger s&apos;il
            sait expédier et déclarer lui-même : MACHE ne bloque pas, mais
            n&apos;accompagne pas non plus.
          </p>

          <p className="mt-3">
            Concrètement : c&apos;est le vendeur qui gère le transporteur,
            les documents, les droits de douane et les délais. La
            plateforme ne fournit ni tarif international, ni suivi
            transfrontalier, ni assistance aux formalités.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[var(--mache-text)]">
            Ce qui manque encore
          </h2>

          <p className="mt-2">
            Exporter n&apos;est pas une case à cocher. Il faut des tarifs
            négociés avec des transporteurs, une gestion des documents
            douaniers, un moyen d&apos;encaisser depuis l&apos;étranger,
            et une réponse claire quand un colis est bloqué à la
            frontière.
          </p>

          <p className="mt-3">
            Tant que ces quatre choses n&apos;existent pas, chaque commande
            vers l&apos;étranger passe par une confirmation : personne ne
            s&apos;engage sur un envoi qu&apos;on ne sait pas encore chiffrer.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[var(--mache-text)]">
            Si l&apos;export vous intéresse
          </h2>

          <p className="mt-2">
            Écrivez-nous en disant ce que vous vendez et vers où. Ce sont
            ces réponses qui décideront de l&apos;ordre dans lequel les
            choses se feront, pas une intuition.
          </p>

          <div className="mt-4 flex flex-wrap gap-2.5">
            <Link
              href="/contact"
              className="rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-md font-bold text-white transition-colors hover:bg-[var(--mache-primary-dark)]"
            >
              Nous écrire
            </Link>
            <Link
              href="/services"
              className="rounded-[6px] border border-[var(--mache-text)] px-5 py-2.5 text-md font-bold text-[var(--mache-text)] transition-colors hover:bg-[var(--mache-text)] hover:text-white"
            >
              Ce que MACHE fait
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
