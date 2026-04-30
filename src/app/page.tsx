import { HomePageClient } from "@/components/home-page-client";
import { featuredProducts } from "@/lib/mock-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Product } from "@/types";

function mapProduct(row: any): Product {
  return {
    id: row.id,
    slug: row.id,
    title: row.title,
    price: Number(row.price ?? 0),
    currency: "USD",
    stock: 99,
    images: row.image_url ? [row.image_url] : [],
    vendorName: row.users?.full_name ?? "Vendeur Maché",
    category: row.category ?? "Catalogue",
    description: row.description ?? "",
    rating: 4.8,
    reviewCount: 0,
    status: row.status ?? "active",
    featured: true
  };
}

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();

  const { data: productsData } = await supabase
    .from("products")
    .select("*, users:seller_id(full_name)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(24);

  const { data: vendorsData } = await supabase
    .from("users")
    .select("id, full_name, role, created_at")
    .in("role", ["seller_individual", "seller_business"])
    .order("created_at", { ascending: false })
    .limit(3);

  const products =
    productsData && productsData.length > 0
      ? productsData.map(mapProduct)
      : featuredProducts;

  const vendors =
    vendorsData && vendorsData.length > 0
      ? vendorsData.map((vendor) => ({
          name: vendor.full_name ?? "Nouveau vendeur",
          category:
            vendor.role === "seller_business"
              ? "Boutique professionnelle"
              : "Vendeur individuel",
          location: "Maché",
          href: `/shop?seller=${vendor.id}`
        }))
      : [];

  return <HomePageClient products={products} vendors={vendors} />;
}
