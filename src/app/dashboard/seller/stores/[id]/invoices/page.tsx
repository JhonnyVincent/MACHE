// src/app/dashboard/seller/stores/[id]/invoices/page.tsx

/*
  PAGE : Factures

  Sert à :
  - Afficher les factures du store
  - Télécharger les factures de ventes
  - Suivre les documents comptables
  - Plus tard : génération PDF, export comptable
*/

import { SellerStorePageShell } from "@/components/seller-store-page-shell";

export default async function StoreInvoicesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <SellerStorePageShell
      storeId={id}
      title="Factures"
      description="Retrouvez les factures, reçus et documents comptables de votre boutique."
      cards={[
        {
          icon: "🧾",
          title: "Factures ventes",
          text: "Voir les factures liées aux commandes.",
        },
        {
          icon: "⬇️",
          title: "Télécharger",
          text: "Exporter vos factures en PDF.",
        },
        {
          icon: "📁",
          title: "Documents comptables",
          text: "Classer les justificatifs de votre activité.",
        },
      ]}
    />
  );
}
