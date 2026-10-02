/*
  LES QUESTIONS FRÉQUENTES DE MACHE — une seule source.

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
            En Haïti : à la livraison, en main propre, après avoir vérifié
            le colis. Hors d&apos;Haïti : MACHE vous indique le moyen de
            paiement avec les frais d&apos;expédition, avant l&apos;envoi.
            MACHE ne demande aucune donnée bancaire sur le site. Le
            paiement par carte n&apos;est pas proposé aujourd&apos;hui.
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
        q: "J'habite hors d'Haïti : puis-je commander ?",
        a: (
          <>
            Oui. Choisissez votre pays à la commande (États-Unis, Canada,
            France…). Les frais d&apos;expédition vers l&apos;étranger ne
            sont pas encore calculés automatiquement : MACHE vous écrit
            ensuite avec leur montant et le moyen de paiement, et{" "}
            <strong>rien n&apos;est expédié ni payé avant votre accord</strong>.
            Vous pouvez aussi faire livrer un proche en Haïti.{" "}
            <Link href="/legal/shipping" className="font-semibold text-[var(--mache-primary)] hover:underline">
              Comment se passe la livraison
            </Link>
          </>
        ),
      },
      {
        q: "Un livreur se présente chez moi, comment savoir s'il est bien de MACHE ?",
        a: (
          <>
            Il porte un code. Saisissez-le sur la{" "}
            <Link href="/verify-agent" className="font-semibold text-[var(--mache-primary)] hover:underline">
              page de vérification
            </Link>{" "}
            avant de lui remettre quoi que ce soit. Si la vérification
            ne répond pas, ne remettez rien : dans le doute, appelez
            MACHE pendant qu&apos;il attend.
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
            vendeur, grossiste ou marque (le profil) qui s&apos;affiche
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
            MACHE la relit avant de l&apos;afficher dans le catalogue.
            Vous pouvez préparer vos produits et votre vitrine pendant ce
            temps.
          </>
        ),
      },
      {
        q: "Combien MACHE prend sur mes ventes ?",
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
            vendeur, qui s&apos;ouvre depuis votre espace MACHE sans vous
            redemander vos identifiants. Votre vitrine et le profil de
            votre boutique se règlent depuis MACHE. Le panneau peut être
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
        q: "MACHE vend-il lui-même ?",
        a: (
          <>
            Non. Les produits sont vendus par des boutiques
            indépendantes. MACHE tient la place : le catalogue, le
            panier, la commande, la mise en relation.
          </>
        ),
      },
      {
        q: "Les avis sont-ils fiables ?",
        a: (
          <>
            Seul un client ayant réellement commandé un article peut le
            noter, le système exige la commande correspondante. Les avis
            sont relus avant publication, et personne ne peut en acheter
            ni en supprimer.
          </>
        ),
      },
      {
        q: "Peut-on exporter depuis Haïti avec MACHE ?",
        a: (
          <>
            Oui, sur confirmation. Un acheteur à l&apos;étranger peut
            commander chez vous : MACHE chiffre l&apos;expédition, la fait
            accepter par l&apos;acheteur, puis vous donne le feu vert pour
            expédier. Il n&apos;y a pas encore de tarif de transporteur
            négocié ni de paiement en ligne : chaque envoi est chiffré à la
            demande.
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
  "J'habite hors d'Haïti : puis-je commander ?",
  "Un livreur se présente chez moi, comment savoir s'il est bien de MACHE ?",
  "Qui peut ouvrir une boutique ?",
  "Combien MACHE prend sur mes ventes ?",
  "MACHE vend-il lui-même ?",
];

export const HOME_FAQ: FaqItem[] = HOME_FAQ_QUESTIONS.map((question) => {
  const item = FAQ_SECTIONS.flatMap((section) => section.items).find((entry) => entry.q === question);
  if (!item) throw new Error(`Question absente de la FAQ : ${question}`);
  return item;
});
