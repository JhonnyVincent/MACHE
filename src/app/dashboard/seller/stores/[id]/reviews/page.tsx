// src/app/dashboard/seller/stores/[id]/reviews/page.tsx

/*
  PAGE : Avis clients

  Sert à :
  - Voir les avis reçus par le store
  - Répondre aux clients
  - Surveiller la note moyenne
  - Plus tard : modération, signalement, réponses publiques
*/

import { SellerStorePageShell } from "@/components/seller-store-page-shell";

export default async function StoreReviewsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <SellerStorePageShell
      storeId={id}
      title="Avis clients"
      description="Consultez les avis clients et améliorez la réputation de votre boutique."
      cards={[
        {
          icon: "⭐",
          title: "Note moyenne",
          text: "Voir la note globale de votre boutique.",
        },
        {
          icon: "💬",
          title: "Répondre aux avis",
          text: "Répondre aux commentaires des clients.",
        },
        {
          icon: "🚩",
          title: "Signaler un avis",
          text: "Demander la vérification d’un avis problématique.",
        },
      ]}
    />
  );
}
