/*
  Outils partagés du back-office.

  Ce fichier était le socle de l'espace vendeur. Cet espace est passé au
  panneau Mercur, mais son formatage et ses libellés de rôle servent
  toujours aux espaces administration, agent, client et partenaire — ils
  sont donc conservés ici plutôt que recopiés quatre fois.

  Ce qui a été retiré : requireSeller, requireStoreOwner et les limites de
  plan. Le contrôle d'accès vendeur et les quotas de boutique sont
  désormais tenus par Mercur, et garder ici une seconde définition des
  limites aurait garanti qu'elles divergent.
*/

import type { SellerRole } from "@/lib/authz";

export const ROLE_LABELS: Record<SellerRole, string> = {
  seller_individual: "Vendeur particulier",
  seller_business: "Vendeur Business",
  supplier: "Fournisseur",
  official_brand: "Marque officielle",
};

export const LOW_STOCK_THRESHOLD = 5;

const numberFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0,
});

export function formatNumber(value: number | null | undefined) {
  return numberFormatter.format(Number(value) || 0);
}

export function formatHTG(value: number | null | undefined) {
  return `${numberFormatter.format(Number(value) || 0)} HTG`;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function initialsOf(value: string, max = 2) {
  const cleaned = (value || "").trim();

  if (!cleaned) return "?";

  return cleaned
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, max)
    .toUpperCase();
}
