/*
  LES QUESTIONS FRÉQUENTES DE MACHÉ — une seule source.

  La page /faq les affiche toutes ; l'accueil en reprend quelques-unes.
  Écrites une fois ici, elles ne peuvent pas se contredire d'une page à
  l'autre.

  La règle : ce que le site fait aujourd'hui, et rien d'autre. Quand la
  réponse est « pas encore », elle le dit dans ces termes.
*/

import { Link } from "next-view-transitions";
import type { ReactNode } from "react";

export type FaqItem = { q: string; a: ReactNode };

export const FAQ_SECTIONS: { title: string; items: FaqItem[] }[] = [
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
            vendeur, qui s&apos;ouvre depuis votre espace MACHÉ sans vous
            redemander vos identifiants. Votre vitrine et le profil de
            votre boutique se règlent depuis MACHÉ. Le panneau peut être
            passé en français depuis votre profil.
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

/* Celles que l'accueil montre : les premières questions qu'on se pose. */
export const HOME_FAQ_QUESTIONS = [
  "Comment je paie ?",
  "J'achète chez plusieurs boutiques, que se passe-t-il ?",
  "Un livreur se présente chez moi, comment savoir s'il est bien de MACHÉ ?",
  "Qui peut ouvrir une boutique ?",
  "Combien MACHÉ prend sur mes ventes ?",
  "MACHÉ vend-il lui-même ?",
];

export const HOME_FAQ: FaqItem[] = HOME_FAQ_QUESTIONS.map((question) => {
  const item = FAQ_SECTIONS.flatMap((section) => section.items).find((entry) => entry.q === question);
  if (!item) throw new Error(`Question absente de la FAQ : ${question}`);
  return item;
});
