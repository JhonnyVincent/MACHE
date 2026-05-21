// src/app/dashboard/seller/stores/[id]/stock/page.tsx

/*
  PAGE : Stock & inventaire

  Sert à :
  - Suivre le stock des produits
  - Voir les produits presque épuisés
  - Préparer les réapprovisionnements
*/

import { SellerStorePageShell } from "@/components/seller-store-page-shell";

export default async function StoreStockPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <SellerStorePageShell
      storeId={id}
      title="Stock & inventaire"
      description="Surveillez les quantités disponibles et les produits à réapprovisionner."
      cards={[
        {
          icon: "📊",
          title: "Inventaire complet",
          text: "Vue globale du stock de la boutique.",
        },
        {
          icon: "⚠️",
          title: "Stock faible",
          text: "Produits qui doivent être réapprovisionnés.",
        },
        {
          icon: "🔁",
          title: "Réapprovisionnement",
          text: "Préparer les futures commandes fournisseur.",
        },
      ]}
    />
  );
}
