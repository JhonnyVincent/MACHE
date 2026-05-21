// src/app/dashboard/seller/stores/[id]/ads/page.tsx

/*
  PAGE : Publicité

  Sert à :
  - Permettre au vendeur de sponsoriser ses produits
  - Créer des campagnes publicitaires
  - Mettre en avant un produit sur MACHÉ
  - Plus tard : budget, durée, ciblage, statistiques pub
*/

import { SellerStorePageShell } from "@/components/seller-store-page-shell";

export default async function StoreAdsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <SellerStorePageShell
      storeId={id}
      title="Publicité"
      description="Boostez vos produits avec des campagnes sponsorisées sur MACHÉ."
      cards={[
        {
          icon: "📢",
          title: "Créer une campagne",
          text: "Sponsoriser un produit pour le rendre plus visible.",
        },
        {
          icon: "🎯",
          title: "Ciblage",
          text: "Choisir les clients, catégories ou zones à atteindre.",
        },
        {
          icon: "📊",
          title: "Résultats publicitaires",
          text: "Suivre vues, clics, ventes et performance.",
        },
      ]}
    />
  );
}
