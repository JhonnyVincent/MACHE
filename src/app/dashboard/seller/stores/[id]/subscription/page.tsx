// src/app/dashboard/seller/stores/[id]/subscription/page.tsx

/*
  PAGE : Mon abonnement

  Sert à :
  - Afficher le plan actuel du vendeur
  - Montrer les limites : produits, stores, pubs, analytics
  - Proposer de passer à un plan supérieur
*/

import { SellerStorePageShell } from "@/components/seller-store-page-shell";

export default async function StoreSubscriptionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <SellerStorePageShell
      storeId={id}
      title="Mon abonnement"
      description="Gérez votre plan vendeur et débloquez plus de fonctionnalités pour développer votre boutique."
      cards={[
        {
          icon: "🆓",
          title: "Plan actuel",
          text: "Voir les limites actuelles de votre compte vendeur.",
        },
        {
          icon: "👑",
          title: "Passer au Business",
          text: "Débloquer plus de produits, statistiques et outils.",
        },
        {
          icon: "🏆",
          title: "Marque officielle",
          text: "Obtenir un badge officiel et des options avancées.",
        },
      ]}
    />
  );
}
