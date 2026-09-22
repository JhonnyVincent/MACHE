/*
  PAGE : ce que MACHÉ fait

  Ce qu'elle annonçait

  Six « services », dont six formulations au conditionnel :
  « Architecture prête pour Stripe, PayPal, méthodes locales »,
  « Structure prête pour générer descriptions produit »,
  « Prévu pour livraisons, statuts d'expédition, tracking ».

  C'était la feuille de route du projet présentée comme un catalogue de
  services. Un commerçant qui lisait « Paiements intégrés » en concluait
  qu'il encaisserait par carte.

  Ce qu'elle dit maintenant

  Ce qui marche, et ce qui ne marche pas encore — les deux, séparés, et
  nommés comme tels. Une plateforme jeune n'a pas à cacher qu'elle est
  jeune : elle a à ne pas faire croire qu'elle ne l'est pas.
*/

import Link from "next/link";

export const metadata = {
  title: "Ce que MACHÉ fait — MACHÉ",
  description:
    "Ce qui fonctionne aujourd'hui sur MACHÉ, et ce qui n'est pas encore ouvert.",
};

const aujourdhui = [
  {
    titre: "Une boutique en ligne, à vous",
    texte:
      "Votre vitrine a son adresse, ses couleurs et sa mise en page. Vous la composez par blocs : bandeau, texte, grille de produits, questions fréquentes.",
  },
  {
    titre: "Produits, stocks et commandes",
    texte:
      "Déclinaisons, photos, prix, inventaire, commandes et expéditions se gèrent depuis le panneau vendeur.",
  },
  {
    titre: "Prix par quantité",
    texte:
      "Un prix qui baisse à partir d'un certain nombre d'articles, appliqué automatiquement quand le client atteint le seuil. Rien à demander.",
  },
  {
    titre: "Commande minimum",
    texte:
      "Si vous vendez en gros, vous fixez le montant en dessous duquel vous ne servez pas. Le panier de vos clients l'affiche avant qu'ils commandent.",
  },
  {
    titre: "Panier multi-boutiques",
    texte:
      "Un client peut acheter chez plusieurs vendeurs en une fois. Chaque boutique reçoit sa propre commande, avec sa livraison.",
  },
  {
    titre: "Paiement à la livraison",
    texte:
      "Le client règle en main propre après avoir vérifié le colis. Aucune donnée bancaire ne circule.",
  },
  {
    titre: "Avis adossés à un achat",
    texte:
      "Seul un client ayant réellement commandé peut noter. Les avis sont relus avant publication, et vous pouvez répondre publiquement.",
  },
  {
    titre: "Agents vérifiables",
    texte:
      "Un livreur porte un code que le client vérifie avant de lui remettre un colis ou de l'argent.",
  },
];

const pasEncore = [
  {
    titre: "Paiement en ligne",
    texte:
      "Ni carte, ni portefeuille mobile. Tant qu'aucun prestataire n'est raccordé, MACHÉ ne prétend pas encaisser.",
  },
  {
    titre: "Export international",
    texte:
      "Les vendeurs livrent là où ils livrent, et aujourd'hui c'est Haïti. Les formalités douanières et la logistique internationale ne sont pas prises en charge.",
  },
  {
    titre: "Rédaction assistée",
    texte:
      "Générer un descriptif de produit à partir de quelques mots n'est pas encore branché.",
  },
  {
    titre: "Messagerie acheteur-vendeur",
    texte:
      "Les échanges passent par le contact de la boutique, pas par une messagerie intégrée.",
  },
];

export default function ServicesPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--mache-text)] sm:text-4xl">
        Ce que MACHÉ fait
      </h1>

      <p className="mt-3 max-w-2xl text-md leading-relaxed text-[var(--mache-muted)]">
        Et ce qu&apos;il ne fait pas encore. Les deux sont sur cette
        page, parce qu&apos;on ne décide pas de vendre quelque part sans
        savoir ce qui manque.
      </p>

      <section className="mt-9">
        <h2 className="text-xl font-bold tracking-tight text-[var(--mache-text)]">
          Aujourd&apos;hui
        </h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {aujourdhui.map((item) => (
            <div
              key={item.titre}
              className="rounded-[10px] border border-[var(--mache-line)] bg-white p-4"
            >
              <p className="text-md font-bold text-[var(--mache-text)]">
                {item.titre}
              </p>
              <p className="mt-1.5 text-base leading-relaxed text-[var(--mache-muted)]">
                {item.texte}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/*
        Nommé « pas encore » et non « bientôt » : « bientôt » est une
        promesse de calendrier que personne n'a prise.
      */}
      <section className="mt-9">
        <h2 className="text-xl font-bold tracking-tight text-[var(--mache-text)]">
          Pas encore
        </h2>

        <p className="mt-1.5 text-base leading-relaxed text-[var(--mache-muted)]">
          Ces fonctions ne sont pas ouvertes. Aucune date n&apos;est
          annoncée ici, parce qu&apos;aucune n&apos;est arrêtée.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {pasEncore.map((item) => (
            <div
              key={item.titre}
              className="rounded-[10px] border border-[#f3d9a5] bg-[#fdf6e8] p-4"
            >
              <p className="text-md font-bold text-[var(--mache-text)]">
                {item.titre}
              </p>
              <p className="mt-1.5 text-base leading-relaxed text-[var(--mache-muted)]">
                {item.texte}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-10 flex flex-wrap gap-2.5">
        <Link
          href="/dashboard/seller/inscription"
          className="rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-md font-bold text-white transition-colors hover:bg-[var(--mache-primary-dark)]"
        >
          Ouvrir ma boutique
        </Link>
        <Link
          href="/sell"
          className="rounded-[6px] border border-[var(--mache-text)] px-5 py-2.5 text-md font-bold text-[var(--mache-text)] transition-colors hover:bg-[var(--mache-text)] hover:text-white"
        >
          Vendre sur MACHÉ
        </Link>
        <Link
          href="/faq"
          className="rounded-[6px] border border-[var(--mache-line)] px-5 py-2.5 text-md font-semibold text-[var(--mache-text)] hover:border-[var(--mache-primary)]"
        >
          Questions fréquentes
        </Link>
      </div>
    </main>
  );
}
