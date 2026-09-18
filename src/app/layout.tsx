import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SiteChrome } from "@/components/site-chrome";
import { getCart } from "@/lib/medusa/cart";

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

  return (
    <html lang="fr">
      <body className={inter.variable}>
        <SiteChrome cartCount={cart?.itemCount ?? 0}>{children}</SiteChrome>
      </body>
    </html>
  );
}
