import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SiteChrome } from "@/components/site-chrome";
import { fetchCategories } from "@/lib/medusa/catalog";
import { getCart } from "@/lib/medusa/cart";
import { fetchSiteTheme, themeStyle } from "@/lib/medusa/theme";
import { fetchSitePromotions } from "@/lib/medusa/promotions";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: "MACHÉ",
  description:
    "Marketplace haïtienne : boutiques indépendantes, marques et fournisseurs d'Haïti et de la diaspora."
};

/*
  Le compteur du panier est lu ici, côté serveur, et descendu jusqu'à
  l'en-tête. Le fournisseur de panier côté navigateur a disparu : le
  panier vit dans Medusa, et deux compteurs auraient donné deux vérités —
  celui du navigateur serait resté à zéro pendant que le vrai se
  remplissait.
*/
export default async function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const cart = await getCart();

  /*
    Les rayons du pied de page viennent du catalogue, pas d'une liste
    écrite en dur : ce sont ceux de ce que les vendeurs vendent
    réellement, et ils changent avec eux.
  */
  const categoriesResult = await fetchCategories(6);

  const categories = categoriesResult.ok
    ? categoriesResult.data.map((entry) => ({
        handle: entry.handle,
        name: entry.name,
      }))
    : [];

  /*
    L'habillage saisonnier — Noël, Octobre rose, Fête du Drapeau. Les
    couleurs viennent du backend, où elles vivent dans une liste
    fermée ; l'administrateur n'y choisit qu'une clé.

    Elles sont posées ici, dans le <head>, et non dans une feuille
    chargée après coup : injectées plus tard, elles repeindraient une
    page déjà affichée, et le visiteur verrait le rouge habituel virer
    au vert sous ses yeux.

    Une lecture qui échoue rend l'habillage habituel. Le site s'affiche.
  */
  /*
    Les promotions en cours, pour le bandeau. Une liste vide le fait
    disparaître : il ne montre jamais rien d'inventé.
  */
  const promotions = await fetchSitePromotions();

  const theme = await fetchSiteTheme();

  const style = themeStyle(theme);

  return (
    <html lang="fr" data-mache-theme={theme.key}>
      <head>
        {/*
          `dangerouslySetInnerHTML` est le seul moyen d'écrire une règle
          CSS ici — React échapperait le texte d'un <style> ordinaire, et
          la règle arriverait illisible dans la page.

          Ce qu'on y met a été filtré dans `themeStyle` : chaque nom est
          une variable --mache-*, chaque valeur une couleur hexadécimale.
          Rien de ce qui entre ici ne peut refermer une accolade.
        */}
        {style && <style dangerouslySetInnerHTML={{ __html: style }} />}
      </head>
      <body className={inter.variable}>
        {/*
          Le bandeau saisonnier. C'est du texte rendu par React, donc
          échappé : il ne peut pas contenir de balise.
        */}
        {theme.banner && (
          <div className="bg-[var(--mache-primary)] px-4 py-1.5 text-center text-sm font-semibold text-white">
            {theme.banner}
          </div>
        )}

        <SiteChrome
          cartCount={cart?.itemCount ?? 0}
          categories={categories}
          promotions={promotions}
        >
          {children}
        </SiteChrome>
      </body>
    </html>
  );
}
