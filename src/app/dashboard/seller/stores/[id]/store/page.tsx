// src/app/dashboard/seller/stores/[id]/store/page.tsx

/*
  PAGE : Ma boutique

  Sert à :
  - Afficher les informations principales du store
  - Voir le lien public de la boutique
  - Préparer la modification du nom, description, logo, bannière
*/

import { SellerStorePageShell } from "@/components/seller-store-page-shell";

export default async function StoreMainPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <SellerStorePageShell
      storeId={id}
      title="Ma boutique"
      description="Gérez les informations principales de votre boutique."
      cards={[
        {
          icon: "🏪",
          title: "Informations boutique",
          text: "Nom, catégorie, description et statut du store.",
        },
        {
          icon: "🖼️",
          title: "Logo & bannière",
          text: "Modifier l’apparence visuelle de votre boutique.",
        },
        {
          icon: "🔗",
          title: "Lien public",
          text: "Voir et partager la page publique de votre store.",
        },
      ]}
    />
  );
}
