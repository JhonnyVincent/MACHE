/*
  QUI VOIT LES GROSSISTES.

  Un grossiste ne vend pas à l'unité : ses produits et ses devis ne
  concernent pas l'acheteur qui cherche un article. Ils sont réservés à :

  - un VENDEUR connecté (particulier, boutique, marque, grossiste) : un
    vendeur est aussi un acheteur, qui s'approvisionne pour revendre ;
  - un ACHETEUR PROFESSIONNEL validé par MACHE (hôtel, école, entreprise…),
    qui achète en quantité sans vendre sur MACHE.

  Les marques restent publiques : le public peut acheter leurs produits,
  et elles apparaissent en plus dans l'annuaire des fournisseurs.

  Lu une fois par affichage (cache de React) : plusieurs composants de
  la même page le demandent.
*/

import { cache } from "react";
import { getVendorSeller } from "./medusa/vendor";
import { getProInfo, type ProStatus } from "./medusa/customer";

export type TradeAccess = {
  allowed: boolean;
  as: "vendeur" | "pro" | null;
  /* Pour préremplir une demande de devis. */
  name: string | null;
  email: string | null;
  proStatus: ProStatus | null;
};

export const getTradeAccess = cache(async (): Promise<TradeAccess> => {
  const [seller, pro] = await Promise.all([
    getVendorSeller().catch(() => null),
    getProInfo().catch(() => null),
  ]);

  if (seller) {
    return { allowed: true, as: "vendeur", name: seller.name ?? null, email: null, proStatus: pro?.status ?? null };
  }

  if (pro?.status === "approved") {
    return { allowed: true, as: "pro", name: pro.organisation, email: null, proStatus: "approved" };
  }

  return { allowed: false, as: null, name: null, email: null, proStatus: pro?.status ?? null };
});

/* Un profil vendu seulement aux professionnels. */
export function isTradeOnlyProfile(profile: string | null | undefined): boolean {
  return profile === "fournisseur";
}
