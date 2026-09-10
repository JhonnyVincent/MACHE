export const dynamic = "force-dynamic";
export const revalidate = 0;

import { HomePageClient } from "@/components/home-page-client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchProducts, type CatalogProduct } from "@/lib/catalog";
import { Product } from "@/types";

/*
  Le catalogue passe par `lib/catalog`, comme /shop et les fiches produit :
  une seule requête de référence, sans dépendre de colonnes optionnelles
  (`featured_priority`, `is_sponsored`, `sales_count`) dont l'absence
  faisait échouer la requête en silence.

  Le repli sur les produits de démonstration a été retiré. Il donnait
  l'illusion d'un catalogue fourni, et depuis que la fiche produit lit la
  base, ces articles fictifs menaient à une page introuvable.
*/
function toCardProduct(product: CatalogProduct): Product {
  return {
    id: product.id,
    slug: product.handle,
    title: product.title,
    price: product.price,
    currency: "HTG",
    stock: product.stock,
    images: product.images,
    vendorName: product.storeName,
    category: product.category,
    description: product.description,
    rating: 0,
    reviewCount: 0,
    status: "active",
  };
}

export default async function HomePage() {
  let products: Product[] = [];
  let vendors: any[] = [];

  try {
    const { products: catalog } = await fetchProducts({ limit: 24 });
    products = catalog.map(toCardProduct);

    const supabase = await createSupabaseServerClient();

    const { data: vendorsData, error: vendorsError } = await supabase
      .from("users")
      .select("id, full_name, role, created_at")
      .in("role", ["seller_individual", "seller_business"])
      .order("created_at", { ascending: false })
      .limit(3);

    if (!vendorsError && vendorsData) {
      vendors = vendorsData.map((vendor) => ({
        name: vendor.full_name ?? "Nouveau vendeur",
        category:
          vendor.role === "seller_business"
            ? "Business / Fournisseur"
            : "Vendeur particulier",
        location: "Maché",
        href: `/shop?seller=${vendor.id}`
      }));
    }
  } catch (error) {
    console.error("HOME SUPABASE ERROR:", error);
  }

  return <HomePageClient products={products} vendors={vendors} />;
}
