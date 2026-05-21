// src/app/dashboard/seller/stores/[id]/orders/page.tsx

/*
  PAGE : Commandes

  Sert à :
  - Afficher les commandes reçues par ce store
  - Suivre les statuts : en attente, payé, expédié, livré, annulé
  - Plus tard : détails commande, facture, client, livraison
*/

import { SellerStorePageShell } from "@/components/seller-store-page-shell";

export default async function StoreOrdersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <SellerStorePageShell
      storeId={id}
      title="Commandes"
      description="Suivez toutes les commandes reçues par cette boutique."
      cards={[
        {
          icon: "🛒",
          title: "Commandes en attente",
          text: "Commandes à préparer ou confirmer.",
        },
        {
          icon: "📦",
          title: "Commandes expédiées",
          text: "Commandes déjà remises au livreur.",
        },
        {
          icon: "✅",
          title: "Commandes terminées",
          text: "Commandes livrées et finalisées.",
        },
      ]}
    />
  );
}
