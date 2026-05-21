// src/app/dashboard/seller/stores/[id]/stats/page.tsx

/*
  PAGE : Statistiques

  Sert à :
  - Afficher les performances du store
  - Suivre ventes, vues, conversion, commandes
  - Plus tard : graphiques par période, export, comparaison
*/

import { SellerStorePageShell } from "@/components/seller-store-page-shell";

export default async function StoreStatsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <SellerStorePageShell
      storeId={id}
      title="Statistiques"
      description="Analysez les performances de votre boutique : ventes, visites, conversion et produits forts."
      cards={[
        {
          icon: "📈",
          title: "Ventes",
          text: "Voir l’évolution des ventes par période.",
        },
        {
          icon: "👀",
          title: "Visites",
          text: "Suivre le nombre de visiteurs sur votre boutique.",
        },
        {
          icon: "🧮",
          title: "Conversion",
          text: "Comprendre combien de visiteurs achètent réellement.",
        },
      ]}
    />
  );
}
