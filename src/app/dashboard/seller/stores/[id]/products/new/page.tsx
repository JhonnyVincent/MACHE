/*
  PAGE : Espace vendeur — ajout d'un produit dans une boutique

  Le formulaire est celui de la modification : mêmes champs, mêmes règles,
  même traitement serveur. Voir src/components/seller/product-form.tsx.
*/

import { requireStoreOwner, formatNumber } from "@/lib/seller";
import {
  PageHeader, Panel, Button, Notice, FormFeedback,
} from "@/components/seller/ui";
import { ProductForm } from "@/components/seller/product-form";
import { createStoreProductAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function NewStoreProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const query = searchParams ? await searchParams : {};
  const { supabase, store, limits } = await requireStoreOwner(id);

  const { count: productCount } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("store_id", store.id);

  const used = productCount ?? 0;
  const atLimit = used >= limits.maxArticlesPerStore;

  const createProduct = createStoreProductAction.bind(null, store.id);

  return (
    <>
      <PageHeader
        title="Ajouter un produit"
        subtitle={store.name?.trim() || "Boutique"}
        actions={
          <Button href={`/dashboard/seller/stores/${store.id}/products`}>
            Retour au catalogue
          </Button>
        }
      />

      <div className="space-y-4">
        <FormFeedback error={query.error} />

        {atLimit ? (
          <Notice tone="warning" title="Limite de votre plan atteinte">
            Votre plan {limits.planName} autorise{" "}
            {formatNumber(limits.maxArticlesPerStore)} produits par boutique, et
            cette boutique en compte déjà {formatNumber(used)}. Retirez un
            produit, ou consultez les plans disponibles.
          </Notice>
        ) : (
          <>
            {!store.is_verified && (
              <Notice tone="info" title="Boutique non vérifiée">
                Vos produits mis en ligne passeront par un examen avant
                d&apos;être visibles. Fournir le document légal de la boutique
                accélère ce passage.
              </Notice>
            )}

            <Panel
              title="Fiche du produit"
              description={`${formatNumber(used)} produit(s) sur ${formatNumber(limits.maxArticlesPerStore)} autorisés.`}
            >
              <ProductForm
                action={createProduct}
                defaults={{ intent: "online", stock: 1 }}
                submitLabel="Créer le produit"
                storeVerified={Boolean(store.is_verified)}
              />
            </Panel>
          </>
        )}
      </div>
    </>
  );
}
