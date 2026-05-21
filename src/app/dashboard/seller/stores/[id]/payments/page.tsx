// src/app/dashboard/seller/stores/[id]/payments/page.tsx

/*
  PAGE : Argent & paiements

  Sert à :
  - Afficher le solde disponible du vendeur
  - Suivre les paiements à recevoir
  - Demander un retrait
  - Plus tard : Stripe, MonCash, virement bancaire, historique paiements
*/

import { SellerStorePageShell } from "@/components/seller-store-page-shell";

export default async function StorePaymentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <SellerStorePageShell
      storeId={id}
      title="Argent & paiements"
      description="Gérez vos revenus, retraits et paiements liés à cette boutique."
      cards={[
        {
          icon: "💳",
          title: "Solde disponible",
          text: "Voir l’argent disponible pour retrait.",
        },
        {
          icon: "🏦",
          title: "Demander un retrait",
          text: "Envoyer l’argent vers votre moyen de paiement.",
        },
        {
          icon: "🧾",
          title: "Historique paiements",
          text: "Consulter les paiements reçus et en attente.",
        },
      ]}
    />
  );
}
