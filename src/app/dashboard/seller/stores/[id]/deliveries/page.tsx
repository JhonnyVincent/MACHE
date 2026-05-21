// src/app/dashboard/seller/stores/[id]/deliveries/page.tsx

/*
  PAGE : Livraisons

  Sert à :
  - Gérer les livraisons du store
  - Suivre les colis déposés, en cours ou livrés
  - Plus tard : points relais, livreurs partenaires, frais livraison
*/

import { SellerStorePageShell } from "@/components/seller-store-page-shell";

export default async function StoreDeliveriesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <SellerStorePageShell
      storeId={id}
      title="Livraisons"
      description="Organisez les colis, les transporteurs et le suivi des livraisons."
      cards={[
        {
          icon: "🚚",
          title: "Colis à envoyer",
          text: "Produits à préparer pour la livraison.",
        },
        {
          icon: "📍",
          title: "Points relais",
          text: "Gérer les lieux de dépôt disponibles.",
        },
        {
          icon: "🤝",
          title: "Livreurs partenaires",
          text: "Connecter la boutique à des livreurs disponibles.",
        },
      ]}
    />
  );
}
