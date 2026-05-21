// src/app/dashboard/seller/stores/[id]/sales/page.tsx

/*
  PAGE : Mes ventes

  Sert à :
  - Afficher les ventes du store
  - Suivre le chiffre d’affaires
  - Voir les meilleurs produits vendus
  - Plus tard : graphiques, export, périodes
*/

import { SellerStorePageShell } from "@/components/seller-store-page-shell";

export default async function StoreSalesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <SellerStorePageShell
      storeId={id}
      title="Mes ventes"
      description="Analysez les ventes, revenus et performances commerciales du store."
      cards={[
        {
          icon: "💰",
          title: "Chiffre d’affaires",
          text: "Résumé des revenus générés.",
        },
        {
          icon: "📈",
          title: "Évolution des ventes",
          text: "Comparer les ventes par semaine, mois ou année.",
        },
        {
          icon: "🏆",
          title: "Meilleurs produits",
          text: "Identifier les produits les plus vendus.",
        },
      ]}
    />
  );
}
