// src/app/dashboard/seller/stores/[id]/products/page.tsx

/*
  PAGE : Mes produits

  Sert à :
  - Afficher tous les produits du store
  - Permettre au vendeur de voir, modifier, désactiver ou supprimer ses produits
  - Plus tard : filtres, recherche, statut actif/brouillon, stock
*/

import { SellerStorePageShell } from "@/components/seller-store-page-shell";

export default async function StoreProductsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <SellerStorePageShell
      storeId={id}
      title="Mes produits"
      description="Gérez tous les produits de cette boutique : prix, stock, images, statut et visibilité."
      cards={[
        {
          icon: "📦",
          title: "Liste des produits",
          text: "Tous les produits du store seront affichés ici.",
        },
        {
          icon: "+",
          title: "Ajouter un produit",
          text: "Créer un nouveau produit pour cette boutique.",
          href: `/dashboard/seller/stores/${id}/products/new`,
        },
        {
          icon: "⚠️",
          title: "Stock faible",
          text: "Voir les produits à réapprovisionner rapidement.",
        },
      ]}
    />
  );
}
