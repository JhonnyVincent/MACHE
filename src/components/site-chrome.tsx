"use client";

import { usePathname } from "next/navigation";
import { Header } from "./header";
import { Footer, type FooterCategory } from "./footer";
import { ChatAssistant } from "./chat-assistant";

/*
  Les dashboards affichent leur propre en-tête et leur propre sidebar en
  plein écran (h-screen). Empiler par-dessus l'en-tête et le pied de page
  du site public poussait le panneau hors de la fenêtre et ajoutait une
  seconde barre de navigation. On masque donc le chrome public sur
  /dashboard.
*/
const BARE_PREFIXES = ["/dashboard"];

export function SiteChrome({
  children,
  cartCount = 0,
  categories = [],
}: {
  children: React.ReactNode;
  cartCount?: number;
  categories?: FooterCategory[];
}) {
  const pathname = usePathname() || "/";

  const isBare = BARE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isBare) {
    return <>{children}</>;
  }

  return (
    <>
      <Header cartCount={cartCount} />
      {children}
      <Footer categories={categories} />
      <ChatAssistant />
    </>
  );
}
