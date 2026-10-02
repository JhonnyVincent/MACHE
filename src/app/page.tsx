/*
  PAGE : accueil MACHE

  L'ordre de la page, voulu par MACHE

  (En-tête : la bande noire défilante — suivre sa livraison, vérifier
  un agent, ouvrir une boutique.)

  1. Le grand bandeau, en défilement : la carte d'Haïti d'abord,
     toujours, puis les nouvelles boutiques en grille, les promotions,
     les partenaires.
  2. Le menu noir, descendu sous le bandeau.
  3. Sur MACHE en ce moment : des produits, chaque vendeur à son tour.
  4. Catégories : cinq rayons et un « ➕ ».
  5. S'abonner aux nouvelles de MACHE.
  6. Nouveautés : trois rangées de six, les derniers articles en ligne.
  7. Nouvelles boutiques, de droite à gauche, en grandes cartes.
  8. Nos suggestions pour vous — ou « À découvrir » —, de droite à gauche.
  9. Nos marques, de droite à gauche (seulement s'il y en a).
  10. Gagnez de l'argent avec MACHE : point relais ou agent vérifié.
  11. Nos partenaires, de gauche à droite.
  12. Devenez vendeur chez MACHE.
  13. Questions fréquentes — puis le pied de page.

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
import { EarnWithMache, HomeFaq, NewArrivals, NewShopsMarquee, SuggestionsMarquee } from "@/components/home/rows";
import { fetchSiteTheme } from "@/lib/medusa/theme";
import { fetchProducts } from "@/lib/medusa/catalog";
import { SEASON_RAILS, seasonProducts } from "@/lib/seasons";
import { ProductRailSection } from "@/components/home/rails";
import { pageMetadata, SITE_DESCRIPTION } from "@/lib/seo";

export const metadata = {
  ...pageMetadata({
  title: "MACHE | La marketplace haïtienne : acheter et vendre en Haïti",
  description: SITE_DESCRIPTION,
  path: "/",
  }),
  /* L'accueil garde le titre complet, sans « | MACHE » en double. */
  title: { absolute: "MACHE | La marketplace haïtienne : acheter et vendre en Haïti" },
};

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

  /* La rangée de la fête en cours : seulement s'il y a de vrais produits. */
  const theme = await fetchSiteTheme();
  const seasonRail = SEASON_RAILS[theme.key];
  let seasonItems: Awaited<ReturnType<typeof seasonProducts>> = [];

  if (seasonRail) {
    const pool = await fetchProducts({ limit: 100, order: "-created_at" });

    if (pool.ok) seasonItems = seasonProducts(theme.key, pool.data.products);
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

      {seasonRail && (
        <div data-season-rail={theme.key}>
          <ProductRailSection
            title={seasonRail.title}
            subtitle={seasonRail.subtitle}
            products={seasonItems}
          />
        </div>
      )}

      <Spotlight products={home.spotlight} />

      <CategoryTiles tiles={home.categoryTiles} fromFavorites={home.tilesFromFavorites} />

      <NewsletterCta />

      <NewArrivals products={home.newArrivals} />

      <NewShopsMarquee sellers={home.newSellers} />

      {home.forYou && (
        <SuggestionsMarquee
          title={home.forYou.title}
          subtitle={home.forYou.subtitle}
          href={home.forYou.href}
          products={home.forYou.products}
        />
      )}

      <BrandsMarquee brands={home.brands} />

      <EarnWithMache />

      <PartnersStrip />

      <SellCta />

      <HomeFaq />
    </main>
  );
}
