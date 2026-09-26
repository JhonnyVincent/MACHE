/*
  PAGE : accueil MACHÉ

  L'ordre de la page, voulu par MACHÉ

  (En-tête : la bande noire défilante — suivre sa livraison, vérifier
  un agent, ouvrir une boutique.)

  1. Le grand bandeau, en défilement : la carte d'Haïti d'abord,
     toujours, puis les nouvelles boutiques en grille, les promotions,
     les partenaires.
  2. Le menu noir, descendu sous le bandeau.
  3. Sur MACHÉ en ce moment : des produits, chaque vendeur à son tour.
  4. Catégories : cinq rayons et un « ➕ ».
  5. S'abonner aux nouvelles de MACHÉ.
  6. Nouvelles boutiques : la carte survolée grandit et passe devant.
  7. Nos marques, de droite à gauche.
  8. Nos partenaires, de gauche à droite.
  9. Nos suggestions pour vous — ou « À découvrir ».
  10. Devenez vendeur chez MACHÉ.

  Ce qui ne change pas

  Chaque section vient du backend commerce, et n'apparaît que si la
  donnée qui la justifie existe. Ce qui manque est nommé, pas simulé.
*/

import { fetchHomeData } from "@/lib/medusa/home";
import { getFavorites } from "@/lib/medusa/favorites";
import { MainNav } from "@/components/header";
import { PartnersStrip } from "@/components/partners-strip";
import { HeroCarousel } from "@/components/home/hero";
import { NewsletterCta } from "@/components/home/newsletter";
import { BrandsMarquee, CategoryTiles, SellCta, Spotlight } from "@/components/home/sections";
import { ProductRailSection, SellerRailSection } from "@/components/home/rails";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  /* Les favoris du client connecté ; aucun pour un visiteur, sans appel au backend. */
  const favoriteHandles = await getFavorites();

  const home = await fetchHomeData({ favoriteHandles });

  /*
    Le diagnostic va au journal du serveur, pas au visiteur : « backend
    non configuré » est utile à qui déploie le site, pas à qui achète.
  */
  if (home.problems.length > 0) {
    console.warn(
      `[accueil] catalogue incomplet (backend ${home.configured ? "configuré" : "non configuré"}) : ${home.problems.join(" | ")}`
    );
  }

  const counts = [
    { label: "Boutiques", value: home.newSellers.length },
    { label: "Rayons", value: home.mainRayons.length },
    { label: "Nouveautés", value: home.newestCount },
  ];

  return (
    <main className="bg-[var(--mache-bg)] pb-10">
      <HeroCarousel slides={home.slides} counts={counts} />

      <MainNav />

      <Spotlight products={home.spotlight} />

      <CategoryTiles tiles={home.categoryTiles} fromFavorites={home.tilesFromFavorites} />

      <NewsletterCta />

      <SellerRailSection
        title="Nouvelles boutiques"
        subtitle="Les vendeurs qui viennent d'ouvrir sur MACHÉ"
        sellers={home.newSellers}
      />

      <BrandsMarquee brands={home.brands} />

      <PartnersStrip />

      {home.forYou && (
        <ProductRailSection
          title={home.forYou.title}
          subtitle={home.forYou.subtitle}
          href={home.forYou.href}
          products={home.forYou.products}
          spotlight
        />
      )}

      <SellCta />
    </main>
  );
}
