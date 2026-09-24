/*
  PAGE : conditions générales

  Ce qu'elle était

  Trois phrases sur la suspension de comptes et les litiges, sans dire
  ce que MACHÉ est, qui vend, qui livre, ni qui répond en cas de
  problème. Un client n'y trouvait aucune des réponses qu'il cherche.

  Ce qu'elle dit maintenant

  Le fonctionnement réel de la place de marché, relevé dans le code :
  MACHÉ n'est pas le vendeur, une commande se partage entre boutiques,
  le paiement se fait à la livraison, et une boutique n'apparaît
  qu'après relecture.

  Ce qu'elle n'invente pas

  Le droit applicable, la juridiction compétente, les délais de
  rétractation et le taux de commission engagent MACHÉ juridiquement et
  commercialement. Ils se décident, au besoin avec un conseil. Les
  écrire ici au hasard donnerait à un client l'apparence d'un
  engagement qui n'a jamais été pris.
*/

import Link from "next/link";
import { LegalPage } from "@/components/legal-page";

export const metadata = {
  title: "Conditions générales — MACHÉ",
  description:
    "Comment fonctionne la place de marché MACHÉ : qui vend, qui livre, qui répond.",
};

function TermsPageEcrit() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--mache-text)] sm:text-4xl">
        Conditions générales
      </h1>

      <p className="mt-3 text-md leading-relaxed text-[var(--mache-muted)]">
        Comment MACHÉ fonctionne, et qui répond de quoi.
      </p>

      <div className="mt-8 space-y-7 text-md leading-relaxed text-[var(--mache-muted)]">
        <section>
          <h2 className="text-lg font-bold text-[var(--mache-text)]">
            MACHÉ n&apos;est pas le vendeur
          </h2>

          <p className="mt-2">
            MACHÉ est une place de marché : les produits sont vendus par
            des boutiques indépendantes. C&apos;est le vendeur qui fixe
            ses prix, décrit ses articles, tient son stock, prépare et
            expédie votre commande.
          </p>

          <p className="mt-3">
            MACHÉ tient la place : le catalogue, le panier, le passage de
            commande, la mise en relation. Sur chaque fiche produit et
            sur chaque commande, le nom de la boutique est indiqué — vous
            savez toujours chez qui vous achetez.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[var(--mache-text)]">
            Une commande peut se partager entre plusieurs boutiques
          </h2>

          <p className="mt-2">
            Un panier qui mélange des articles de plusieurs vendeurs
            devient plusieurs commandes, une par boutique. Chacune a sa
            propre livraison, son propre délai, et son propre
            interlocuteur.
          </p>

          <p className="mt-3">
            Certaines boutiques — les grossistes notamment — demandent un
            montant minimum de commande. Le panier vous l&apos;indique
            avant de commander, avec ce qui manque.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[var(--mache-text)]">
            Le paiement se fait à la livraison
          </h2>

          <p className="mt-2">
            Vous réglez en main propre au moment de recevoir le colis,
            après l&apos;avoir vérifié. MACHÉ ne demande aucune donnée
            bancaire et ne prélève rien à la commande.
          </p>

          <p className="mt-3">
            Aucun paiement en ligne n&apos;est proposé aujourd&apos;hui.
            Le jour où il le sera, ce sera écrit ici avant de
            l&apos;être ailleurs.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[var(--mache-text)]">
            Les agents qui livrent
          </h2>

          <p className="mt-2">
            Un agent MACHÉ qui se présente chez vous porte un code.
            Vérifiez-le avant de lui remettre un colis ou de
            l&apos;argent.
          </p>

          <Link
            href="/verify-agent"
            className="mt-3 inline-block rounded-[6px] border border-[var(--mache-text)] px-4 py-2 text-base font-bold text-[var(--mache-text)] transition-colors hover:bg-[var(--mache-text)] hover:text-white"
          >
            Vérifier un agent
          </Link>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[var(--mache-text)]">
            Ouvrir une boutique
          </h2>

          <p className="mt-2">
            Toute personne ou entreprise peut demander à vendre sur
            MACHÉ. Une boutique nouvellement ouverte est relue par MACHÉ
            avant d&apos;apparaître dans le catalogue : elle peut
            préparer ses produits pendant ce temps.
          </p>

          <p className="mt-3">
            Un vendeur s&apos;engage à décrire ses produits fidèlement, à
            ne proposer que ce qu&apos;il peut livrer, et à respecter la
            loi haïtienne. Les{" "}
            <Link
              href="/legal/vendors"
              className="font-semibold text-[var(--mache-primary)] hover:underline"
            >
              règles vendeurs
            </Link>{" "}
            précisent ce qui est attendu.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[var(--mache-text)]">
            Les avis
          </h2>

          <p className="mt-2">
            Seul un client qui a réellement commandé un article peut le
            noter : le système exige la commande correspondante. Les avis
            sont relus par MACHÉ avant publication, et un vendeur peut
            répondre publiquement — sa réponse est signalée comme telle.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[var(--mache-text)]">
            En cas de problème
          </h2>

          <p className="mt-2">
            Adressez-vous d&apos;abord au vendeur : c&apos;est lui qui a
            préparé et expédié. Si vous n&apos;obtenez pas de réponse,
            écrivez à MACHÉ.
          </p>

          <p className="mt-3">
            MACHÉ peut suspendre une boutique qui trompe ses clients,
            vend des produits interdits ou ne livre pas ce qu&apos;elle
            annonce.
          </p>

          <div className="mt-4 flex flex-wrap gap-2.5">
            <Link
              href="/legal/returns"
              className="rounded-[6px] border border-[var(--mache-line)] px-4 py-2 text-base font-semibold text-[var(--mache-text)] hover:border-[var(--mache-primary)]"
            >
              Retours et remboursements
            </Link>
            <Link
              href="/contact"
              className="rounded-[6px] bg-[var(--mache-primary)] px-4 py-2 text-base font-bold text-white transition-colors hover:bg-[var(--mache-primary-dark)]"
            >
              Écrire à MACHÉ
            </Link>
          </div>
        </section>

        {/*
          Ce qui manque, dit plutôt que comblé. Un délai de rétractation
          inventé serait un engagement pris au nom de MACHÉ sans que
          MACHÉ l'ait décidé.
        */}
        <section className="rounded-[10px] border border-[#f3d9a5] bg-[#fdf6e8] p-4">
          <h2 className="text-lg font-bold text-[var(--mache-text)]">
            Ce qui reste à arrêter
          </h2>

          <p className="mt-2 text-base">
            Cette page décrit fidèlement le fonctionnement du site
            aujourd&apos;hui. Quatre points relèvent d&apos;une décision
            de MACHÉ et seront précisés avant l&apos;ouverture
            commerciale : l&apos;identité juridique de
            l&apos;exploitant, le droit applicable et la juridiction
            compétente, le délai de rétractation, et la commission
            retenue sur les ventes.
          </p>

          <p className="mt-2 text-base">
            Nous préférons le dire plutôt que d&apos;annoncer des
            engagements que nous n&apos;avons pas encore pris.
          </p>
        </section>
      </div>

      <p className="mt-10 text-sm text-[var(--mache-muted)]">
        <Link href="/legal/privacy" className="font-semibold hover:underline">
          Confidentialité
        </Link>{" "}
        ·{" "}
        <Link href="/legal/vendors" className="font-semibold hover:underline">
          Règles vendeurs
        </Link>{" "}
        ·{" "}
        <Link href="/legal/shipping" className="font-semibold hover:underline">
          Livraison
        </Link>
      </p>
    </main>
  );
}

/*
  La page telle qu'elle s'affiche.

  Si un texte a été publié depuis l'administration pour « conditions »,
  c'est lui qui s'affiche. Sinon — rien de publié, ou backend muet —
  c'est le texte ci-dessus, écrit dans le code.

  Ce texte n'est donc pas un vestige : c'est le filet. Une page légale
  qui afficherait « service indisponible » serait pire qu'inutile,
  puisque c'est justement la page qu'on consulte quand quelque chose ne
  va pas.
*/
export default async function TermsPage() {
  return (
    <LegalPage slug="conditions" fallbackTitle="Conditions générales">
      <TermsPageEcrit />
    </LegalPage>
  );
}
