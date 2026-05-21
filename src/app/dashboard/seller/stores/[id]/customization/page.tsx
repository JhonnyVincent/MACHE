// src/app/dashboard/seller/stores/[id]/customization/page.tsx

/*
  PAGE : Personnalisation

  Sert à :
  - Personnaliser l’apparence du store
  - Choisir logo, bannière, couleurs, sections
  - Plus tard : mini-site vendeur personnalisé
*/

import { SellerStorePageShell } from "@/components/seller-store-page-shell";

export default async function StoreCustomizationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <SellerStorePageShell
      storeId={id}
      title="Personnalisation"
      description="Personnalisez l’apparence de votre boutique pour la rendre plus professionnelle."
      cards={[
        {
          icon: "🎨",
          title: "Couleurs",
          text: "Choisir l’ambiance visuelle du store.",
        },
        {
          icon: "🖼️",
          title: "Bannière",
          text: "Ajouter une grande image d’accueil.",
        },
        {
          icon: "🧩",
          title: "Sections boutique",
          text: "Organiser les blocs visibles sur la page publique.",
        },
      ]}
    />
  );
}
