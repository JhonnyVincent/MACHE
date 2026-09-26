/*
  PAGE : accueil MACHÉ

  L'ordre de la page, voulu par MACHÉ

  1. Le grand bandeau, en défilement : la carte d'Haïti d'abord, toujours,
     puis nouveautés, partenaires, meilleures ventes, fait main, fait
     maison, bio.
  2. Parcourir les rayons.
  3. « Vous vendez quelque chose ? »
  4. Nouvelles boutiques.
  5. Nos partenaires.
  6. Promotions, en rangée qui défile.
  7. Les plus vendus.
  8. Vérifier un agent.
  9. Vous aimerez — ou « À découvrir ».

  Les rangées d'articles alternent avec autre chose : empilées l'une
  sous l'autre, elles se liraient comme un entrepôt.

  Ce qui ne change pas

  Chaque section vient du backend commerce, et n'apparaît que si la
  donnée qui la justifie existe. L'ancien accueil découpait un même lot
  de vingt-quatre produits en six rayons — « meilleures ventes »,
  « sponsorisés », « recommandé pour vous », « tendances » — qui étaient
  en réalité six tranches du même tableau. Un vendeur pouvait s'y croire
  mis en avant sans l'être, un client croire à un classement qui
  n'existait pas. Ce qui manque est nommé, pas simulé.

  Ce qui a été retiré, et pourquoi

  Le damier de cartes, la bande des quatre services et les quatre blocs
  « Pourquoi MACHÉ » : une page faite de blocs posés les uns sous les
  autres. Les services ont chacun leur place ailleurs — « Mon compte »
  pour les commandes, la section « Vérifier un agent », « Vous vendez
  quelque chose ? », « Aide » dans le menu.
*/

import { fetchHomeData } from "@/lib/medusa/home";
import { getFavorites } from "@/lib/medusa/favorites";
import { PartnersStrip } from "@/components/partners-strip";
import { HeroCarousel } from "@/components/home/hero";
import { BrowseRayons, SellCta, VerifyAgentBanner } from "@/components/home/sections";
import { ProductRailSection, SellerRailSection } from "@/components/home/rails";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  /* Les favoris du client connecté ; aucun pour un visiteur, sans appel au backend. */
  const favoriteHandles = await getFavorites();

  const home = await fetchHomeData({ favoriteHandles });

  /*
    Le diagnostic va au journal du serveur, pas au visiteur.

    « Backend commerce non configuré » est une information
    d'exploitation : utile à qui déploie le site, pas à qui vient
    acheter. Elle n'est pas perdue pour autant, elle est écrite ici.
  */
  if (home.problems.length > 0) {
    console.warn(
      `[accueil] catalogue incomplet (backend ${home.configured ? "configuré" : "non configuré"}) : ${home.problems.join(" | ")}`
    );
  }

  const counts = [
    { label: "Boutiques", value: home.newSellers.length },
    { label: "Rayons", value: home.mainRayons.length },
    { label: "Nouveautés", value: Math.min(home.newest.length, 12) },
  ];

  return (
    <main className="bg-[var(--mache-bg)] pb-10">
      <HeroCarousel slides={home.slides} counts={counts} />

      <BrowseRayons />

      <SellCta />

      <SellerRailSection
        title="Nouvelles boutiques"
        subtitle="Les vendeurs qui viennent d'ouvrir sur MACHÉ"
        sellers={home.newSellers}
      />

      <PartnersStrip />

      {/* Des remises réelles : prix calculé inférieur au tarif habituel. */}
      <ProductRailSection
        title="Promotions"
        subtitle="Prix réellement inférieurs au tarif habituel"
        href="/shop?sort=deals"
        products={home.deals}
        autoplayMs={4500}
      />

      {/* Absent tant qu'il n'y a pas assez de vraies commandes pour classer. */}
      <ProductRailSection
        title="Les plus vendus"
        subtitle="Classement des 90 derniers jours, sur de vraies commandes"
        href="/shop"
        linkLabel="Tout le catalogue"
        products={home.bestSellers}
      />

      <VerifyAgentBanner />

      {home.forYou && (
        <ProductRailSection
          title={home.forYou.title}
          subtitle={home.forYou.subtitle}
          href={home.forYou.href}
          products={home.forYou.products}
        />
      )}
    </main>
  );
}
