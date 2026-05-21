// src/app/dashboard/seller/stores/[id]/documents/page.tsx

/*
  PAGE : Documents & vérification

  Sert à :
  - Permettre au vendeur d’envoyer ses documents
  - Vérifier identité, entreprise ou marque officielle
  - Plus tard : upload documents, statut validation, badge vérifié
*/

import { SellerStorePageShell } from "@/components/seller-store-page-shell";

export default async function StoreDocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <SellerStorePageShell
      storeId={id}
      title="Documents & vérification"
      description="Envoyez vos documents pour obtenir le badge vérifié et débloquer toutes les fonctionnalités."
      cards={[
        {
          icon: "🪪",
          title: "Identité",
          text: "Carte d’identité, passeport ou document vendeur.",
        },
        {
          icon: "🏢",
          title: "Entreprise",
          text: "Documents business, registre ou justificatifs.",
        },
        {
          icon: "✅",
          title: "Statut de vérification",
          text: "Suivre l’avancement de la validation MACHÉ.",
        },
      ]}
    />
  );
}
