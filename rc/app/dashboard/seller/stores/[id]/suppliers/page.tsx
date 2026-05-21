// src/app/dashboard/seller/stores/[id]/suppliers/page.tsx

/*
  PAGE : Trouver un fournisseur

  Sert à :
  - Aider le vendeur à trouver des fournisseurs
  - Déléguer certaines tâches : livraison, stock, photos, emballage
  - Plus tard : marketplace de fournisseurs et partenaires MACHÉ
*/

import { SellerStorePageShell } from "@/components/seller-store-page-shell";

export default async function StoreSuppliersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <SellerStorePageShell
      storeId={id}
      title="Trouver un fournisseur"
      description="Trouvez des partenaires pour aider votre boutique : fournisseurs, livreurs, emballage, shooting produit et gestion."
      cards={[
        {
          icon: "🏭",
          title: "Fournisseurs produits",
          text: "Trouver des fournisseurs pour remplir votre catalogue.",
        },
        {
          icon: "🚚",
          title: "Livreurs",
          text: "Connecter votre store à des livreurs ou points relais.",
        },
        {
          icon: "📸",
          title: "Photos produits",
          text: "Faire améliorer les photos de vos produits.",
        },
        {
          icon: "📦",
          title: "Emballage",
          text: "Trouver des solutions d’emballage pour vos colis.",
        },
        {
          icon: "🧾",
          title: "Gestion administrative",
          text: "Déléguer factures, documents ou suivi commercial.",
        },
        {
          icon: "📢",
          title: "Marketing",
          text: "Trouver de l’aide pour la publicité et les réseaux sociaux.",
        },
      ]}
    />
  );
}
