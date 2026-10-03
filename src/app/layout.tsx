import "./globals.css";
import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { SiteChrome } from "@/components/site-chrome";
import { fetchCategories } from "@/lib/medusa/catalog";
import { CATEGORY_TREE } from "@/lib/categories";
import { ViewTransitions } from "next-view-transitions";
import { getCart } from "@/lib/medusa/cart";
import { fetchSiteTheme, themeStyle } from "@/lib/medusa/theme";
import { fetchSitePromotions } from "@/lib/medusa/promotions";
import { siteUrl, SITE_NAME, SITE_DESCRIPTION, DEFAULT_SHARE_IMAGE } from "@/lib/seo";
import { Analytics } from "@/components/analytics";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter"
});

/*
  Deux familles, pas plus : Inter pour tout ce qui se lit vite (menus,
  boutons, prix, formulaires) et Fraunces, une serif chaleureuse, pour les
  titres des pages publiques. Le contraste entre les deux donne au site
  une voix éditoriale, au lieu d'une même police partout.
*/
const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  axes: ["opsz"]
});

/*
  Chaque page donne son propre titre ; le modèle y ajoute « | MACHE ».
  Une page qui n'en donne pas prend le titre par défaut, jamais « MACHE »
  tout seul, qui ne dit rien à Google ni à qui reçoit le lien.
*/
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "MACHE | La marketplace haïtienne : acheter et vendre en Haïti",
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "fr_FR",
    title: "MACHE | La marketplace haïtienne",
    description: SITE_DESCRIPTION,
    url: "/",
    images: [{ url: DEFAULT_SHARE_IMAGE, width: 1200, height: 630, alt: "MACHE, la marketplace haïtienne" }],
  },
  twitter: { card: "summary_large_image", images: [DEFAULT_SHARE_IMAGE] },
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
  /*
    Les rayons principaux de MACHE, dans l'ordre du site. Les six
    premiers du catalogue étaient ceux de la démonstration Mercur
    (Sandals, Sneakers…), que son ordre par défaut place en tête.
  */
  const categoriesResult = await fetchCategories(300);

  const macheOrder = new Map(CATEGORY_TREE.map((node, index) => [node.slug, index]));

  const categories = categoriesResult.ok
    ? categoriesResult.data
        .filter((entry) => entry.parentId === null && macheOrder.has(entry.handle))
        .sort((a, b) => macheOrder.get(a.handle)! - macheOrder.get(b.handle)!)
        .slice(0, 8)
        .map((entry) => ({ handle: entry.handle, name: entry.name }))
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

  /*
    Les changements de page se font en fondu (View Transitions, via
    next-view-transitions) : le navigateur fait l'animation lui-même,
    sans rien ajouter au poids de la page. Un navigateur qui ne connaît
    pas cette API change de page normalement.
  */
  return (
    <ViewTransitions>
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
      <body className={`${inter.variable} ${fraunces.variable}`}>
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

        <Analytics />
      </body>
    </html>
    </ViewTransitions>
  );
}
