// src/app/dashboard/seller/stores/[id]/settings/page.tsx

/*
  PAGE : Paramètres

  Sert à :
  - Gérer les réglages du store
  - Modifier informations, sécurité, notifications
  - Préparer la suppression du store
*/

import { SellerStorePageShell } from "@/components/seller-store-page-shell";

export default async function StoreSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <SellerStorePageShell
      storeId={id}
      title="Paramètres"
      description="Modifiez les réglages importants de votre boutique."
      cards={[
        {
          icon: "⚙️",
          title: "Réglages boutique",
          text: "Modifier nom, catégorie, description et options.",
        },
        {
          icon: "🔔",
          title: "Notifications",
          text: "Choisir les alertes email ou dashboard.",
        },
        {
          icon: "🗑️",
          title: "Supprimer le store",
          text: "Désactiver ou supprimer définitivement cette boutique.",
        },
      ]}
    />
  );
}
