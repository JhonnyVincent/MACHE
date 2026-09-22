/*
  PAGE : questions fréquentes

  Ce qu'elle répondait

  « Les paiements sont-ils prévus ? — Oui, l'architecture prévoit
  Stripe, PayPal, moyens locaux et cash on delivery. »

  Un client qui demande comment il va payer recevait la feuille de route
  du projet. Il en concluait raisonnablement qu'il pourrait payer par
  carte, ce qui est faux.

  Ce qu'elle répond maintenant

  Ce que le site fait aujourd'hui, et rien d'autre. Quand la réponse est
  « pas encore », elle le dit dans ces termes plutôt que d'annoncer une
  phase.
*/

import Link from "next/link";

export const metadata = {
  title: "Questions fréquentes — MACHÉ",
  description: "Comment acheter, payer, vendre et se faire livrer sur MACHÉ.",
};

const sections = [
  {
    title: "Acheter",
    items: [
      {
        q: "Comment je paie ?",
        a: (
          <>
            À la livraison, en main propre, après avoir vérifié le colis.
            MACHÉ ne demande aucune donnée bancaire. Le paiement par
            carte n&apos;est pas proposé aujourd&apos;hui.
          </>
        ),
      },
      {
        q: "Faut-il un compte pour acheter ?",
        a: (
          <>
            Pour parcourir le catalogue, non. Pour commander, oui : il
            faut une adresse et un téléphone pour que le vendeur puisse
            vous livrer.
          </>
        ),
      },
      {
        q: "J'achète chez plusieurs boutiques, que se passe-t-il ?",
        a: (
          <>
            Votre panier devient plusieurs commandes, une par boutique.
            Chacune a sa livraison, son délai et son interlocuteur.
            Certaines boutiques demandent un montant minimum : le panier
            vous le dit avant de commander.
          </>
        ),
      },
      {
        q: "Un livreur se présente chez moi, comment savoir s'il est bien de MACHÉ ?",
        a: (
          <>
            Il porte un code. Saisissez-le sur la{" "}
            <Link href="/verify-agent" className="font-semibold text-[var(--mache-primary)] hover:underline">
              page de vérification
            </Link>{" "}
            avant de lui remettre quoi que ce soit. Si la vérification
            ne répond pas, ne remettez rien : dans le doute, appelez
            MACHÉ pendant qu&apos;il attend.
          </>
        ),
      },
      {
        q: "Puis-je retourner un article ?",
        a: (
          <>
            Adressez-vous d&apos;abord au vendeur. Les modalités sont sur
            la page{" "}
            <Link href="/legal/returns" className="font-semibold text-[var(--mache-primary)] hover:underline">
              retours et remboursements
            </Link>
            .
          </>
        ),
      },
    ],
  },
  {
    title: "Vendre",
    items: [
      {
        q: "Qui peut ouvrir une boutique ?",
        a: (
          <>
            Toute personne ou entreprise. Vous déclarez un profil —
            particulier, boutique, grossiste ou marque — qui s&apos;affiche
            sur votre vitrine.{" "}
            <Link href="/dashboard/seller/inscription" className="font-semibold text-[var(--mache-primary)] hover:underline">
              Ouvrir ma boutique
            </Link>
            .
          </>
        ),
      },
      {
        q: "Combien de temps avant que ma boutique soit visible ?",
        a: (
          <>
            MACHÉ la relit avant de l&apos;afficher dans le catalogue.
            Vous pouvez préparer vos produits et votre vitrine pendant ce
            temps.
          </>
        ),
      },
      {
        q: "Combien MACHÉ prend sur mes ventes ?",
        a: (
          <>
            Le taux de commission n&apos;est pas encore arrêté. Nous
            préférons le dire plutôt que d&apos;annoncer un chiffre qui
            changerait. Il sera fixé avant l&apos;ouverture commerciale,
            et aucun vendeur ne sera engagé sans le connaître.
          </>
        ),
      },
      {
        q: "Je gère ma boutique depuis où ?",
        a: (
          <>
            Vos produits, stocks et commandes se gèrent depuis le panneau
            vendeur. Votre vitrine et le profil de votre boutique se
            règlent depuis MACHÉ. Le panneau peut être passé en français
            depuis votre profil.
          </>
        ),
      },
    ],
  },
  {
    title: "La plateforme",
    items: [
      {
        q: "MACHÉ vend-il lui-même ?",
        a: (
          <>
            Non. Les produits sont vendus par des boutiques
            indépendantes. MACHÉ tient la place : le catalogue, le
            panier, la commande, la mise en relation.
          </>
        ),
      },
      {
        q: "Les avis sont-ils fiables ?",
        a: (
          <>
            Seul un client ayant réellement commandé un article peut le
            noter — le système exige la commande correspondante. Les avis
            sont relus avant publication, et personne ne peut en acheter
            ni en supprimer.
          </>
        ),
      },
      {
        q: "Peut-on exporter depuis Haïti avec MACHÉ ?",
        a: (
          <>
            Pas encore. Les vendeurs livrent là où ils livrent, et
            aujourd&apos;hui c&apos;est Haïti. L&apos;export demande des
            formalités douanières et une logistique internationale que
            MACHÉ ne prend pas en charge pour l&apos;instant.
          </>
        ),
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--mache-text)] sm:text-4xl">
        Questions fréquentes
      </h1>

      <p className="mt-3 text-md leading-relaxed text-[var(--mache-muted)]">
        Ce que MACHÉ fait aujourd&apos;hui. Quand la réponse est « pas
        encore », c&apos;est écrit ainsi.
      </p>

      <div className="mt-8 space-y-9">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-xl font-bold tracking-tight text-[var(--mache-text)]">
              {section.title}
            </h2>

            <div className="mt-3 space-y-2.5">
              {section.items.map((item) => (
                <details
                  key={item.q}
                  className="rounded-[10px] border border-[var(--mache-line)] bg-white p-4"
                >
                  <summary className="cursor-pointer text-md font-bold text-[var(--mache-text)]">
                    {item.q}
                  </summary>
                  <p className="mt-2 text-md leading-relaxed text-[var(--mache-muted)]">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-10 rounded-[10px] border border-[var(--mache-line)] bg-white p-5">
        <p className="text-md font-bold text-[var(--mache-text)]">
          Votre question n&apos;est pas là ?
        </p>
        <p className="mt-1 text-md leading-relaxed text-[var(--mache-muted)]">
          Écrivez-nous. Une question posée deux fois finit sur cette
          page.
        </p>
        <Link
          href="/contact"
          className="mt-4 inline-block rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-md font-bold text-white transition-colors hover:bg-[var(--mache-primary-dark)]"
        >
          Nous écrire
        </Link>
      </div>
    </main>
  );
}
