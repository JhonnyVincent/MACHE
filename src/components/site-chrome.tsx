"use client";

import { usePathname } from "next/navigation";
import { Header } from "./header";
import { Footer, type FooterCategory } from "./footer";
import type { SitePromotion } from "@/lib/medusa/promotions";
import { ChatAssistant } from "./chat-assistant";
import { RevealProvider } from "./reveal";

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
  promotions = [],
}: {
  children: React.ReactNode;
  cartCount?: number;
  categories?: FooterCategory[];
  promotions?: SitePromotion[];
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
      {/*
        Le révélateur est posé ici, une fois pour tout le site public.
        Il ne rend rien : il observe. Les tableaux de bord en sont
        exclus, comme le reste du chrome — on n'anime pas un outil de
        travail qu'on ouvre vingt fois par jour.
      */}
      <RevealProvider />

      <Header cartCount={cartCount} promotions={promotions} />
      {children}
      <Footer categories={categories} />
      <ChatAssistant />
    </>
  );
}
