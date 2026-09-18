/*
  PAGE : éditeur visuel de vitrine.

  Elle ne charge que ce que l'éditeur affiche réellement : la boutique du
  vendeur connecté et ses produits, pour que l'aperçu montre de vrais
  articles et non des carrés gris.

  Tout ce qui décide — qui est connecté, quelle boutique il peut modifier,
  ce qui a le droit d'être enregistré — reste ici, côté serveur. Le
  composant d'édition ne reçoit que des données.
*/

import { redirect } from "next/navigation";
import { getVendorSeller } from "@/lib/medusa/vendor";
import { fetchProducts, type StoreSeller } from "@/lib/medusa/catalog";
import { parseLayout } from "@/lib/storefront/blocks";
import { VitrineEditor } from "@/components/storefront/puck-editor";
import { saveLayoutAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function VitrineEditeurPage() {
  const seller = await getVendorSeller();

  /*
    Pas de session : on renvoie à l'écran de connexion vendeur plutôt que
    d'afficher un éditeur vide qui n'enregistrerait rien.
  */
  if (!seller) redirect("/dashboard/seller/vitrine");

  const { layout } = parseLayout(seller.metadata, seller.name);

  const products = await fetchProducts({ sellerId: seller.id, limit: 24 });

  /*
    L'aperçu attend une boutique au format du storefront public. Le panneau
    vendeur n'expose pas l'indicateur d'abonnement ; il ne change rien à ce
    que l'éditeur affiche.
  */
  const storeSeller: StoreSeller = {
    id: seller.id,
    handle: seller.handle,
    name: seller.name,
    description: seller.description,
    logo: seller.logo,
    banner: seller.banner,
    isPremium: false,
    metadata: seller.metadata,
  };

  /*
    Puck occupe l'écran entier. Une barre de retour posée au-dessus de lui
    se retrouvait recouverte : le vendeur n'avait plus de chemin vers
    l'éditeur en formulaire. Le lien vit donc dans l'en-tête de Puck, que
    MACHÉ remplace par le sien.
  */
  return (
    <main className="flex min-h-screen flex-col">
      <VitrineEditor
        layout={layout}
        seller={storeSeller}
        products={products.ok ? products.data.products : []}
        save={saveLayoutAction}
      />
    </main>
  );
}
