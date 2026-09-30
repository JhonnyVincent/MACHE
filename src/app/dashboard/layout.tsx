/*
  Tous les espaces connectés : client, vendeur, agent, administration.

  Rien ici n'a à apparaître dans Google : ce sont des pages personnelles,
  qui n'affichent de toute façon rien sans connexion. Ce réglage vaut
  pour toutes les pages en dessous ; les rares pages publiques de
  l'arborescence (ouvrir une boutique) le rétablissent elles-mêmes.
*/
import { privateSectionMetadata } from "@/lib/seo";

export const metadata = privateSectionMetadata("Mon espace");

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
