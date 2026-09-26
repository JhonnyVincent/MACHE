/*
  PAGE : export

  Ce qu'elle annonçait

  Trois encarts — Fournisseurs, Logistique, Paiement — tous rédigés en
  « architecture prête pour » et « prévu pour ». Une page entière
  consacrée à une fonction qui n'existe sous aucune forme.

  Pourquoi elle existe encore

  Parce que la question est légitime : MACHÉ parle d'Haïti, de la
  Caraïbe et de la diaspora, et quelqu'un qui veut exporter a le droit
  de trouver une réponse claire plutôt que rien. La réponse est « pas
  encore », et elle est dite en toutes lettres.

  Une page supprimée laisserait la question sans réponse ; une page qui
  promet laisserait croire à une offre. Celle-ci dit ce qui est vrai, et
  propose de se faire connaître à qui la fonction intéresse.
*/

import { Link } from "next-view-transitions";

export const metadata = {
  title: "Exporter depuis Haïti — MACHÉ",
  description:
    "Ce que MACHÉ permet aujourd'hui pour vendre hors d'Haïti, et ce qui n'est pas encore ouvert.",
};

export default function ExportPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--mache-text)] sm:text-4xl">
        Exporter depuis Haïti
      </h1>

      <div className="mt-6 rounded-[10px] border border-[#f3d9a5] bg-[#fdf6e8] p-5">
        <p className="text-md font-bold text-[var(--mache-text)]">
          L&apos;export n&apos;est pas encore ouvert sur MACHÉ
        </p>
        <p className="mt-1.5 text-md leading-relaxed text-[var(--mache-muted)]">
          Aujourd&apos;hui, les vendeurs livrent là où ils livrent — et
          c&apos;est Haïti. Les formalités douanières, le transport
          international et les paiements transfrontaliers ne sont pas pris
          en charge par la plateforme.
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
            sait expédier et déclarer lui-même : MACHÉ ne bloque pas, mais
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
            Pourquoi ce n&apos;est pas ouvert
          </h2>

          <p className="mt-2">
            Exporter n&apos;est pas une case à cocher. Il faut des tarifs
            négociés avec des transporteurs, une gestion des documents
            douaniers, un moyen d&apos;encaisser depuis l&apos;étranger,
            et une réponse claire quand un colis est bloqué à la
            frontière.
          </p>

          <p className="mt-3">
            Tant que ces quatre choses n&apos;existent pas, annoncer
            l&apos;export reviendrait à laisser des vendeurs s&apos;engager
            auprès de clients qu&apos;ils ne pourraient pas servir.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[var(--mache-text)]">
            Si l&apos;export vous intéresse
          </h2>

          <p className="mt-2">
            Écrivez-nous en disant ce que vous vendez et vers où. Ce sont
            ces réponses qui décideront de l&apos;ordre dans lequel les
            choses se feront — pas une intuition.
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
              Ce que MACHÉ fait
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
