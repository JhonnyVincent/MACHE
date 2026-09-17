/*
  PAGE : Favoris

  Sert à :
  - afficher les produits mis en favori par le client connecté ;
  - inviter à se connecter si ce n'est pas le cas.

  L'en-tête du site pointait déjà vers /favorites : le lien menait à une 404.

  La table `favorites` est créée par la migration 0001. Tant qu'elle n'a pas
  été appliquée, la requête échoue : la page l'annonce clairement au lieu de
  planter.
*/

import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/product-card";
import { fetchProducts, type CatalogProduct } from "@/lib/catalog";
import type { Product } from "@/types";

export const dynamic = "force-dynamic";

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
    rating: product.ratingAverage,
    reviewCount: product.ratingCount,
    status: "active",
  };
}

export default async function FavoritesPage() {
  const supabase = await createSupabaseServerClient();

  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return (
      <main className="container-page py-12">
        <h1 className="section-title">Mes favoris</h1>

        <div className="card mt-8 p-10 text-center">
          <p className="text-[18px] font-[900]">Connectez-vous pour voir vos favoris</p>
          <p className="mx-auto mt-2 max-w-md text-[14px] leading-[1.8] text-[var(--mache-muted)]">
            Vos favoris sont rattachés à votre compte : vous les retrouvez sur
            tous vos appareils.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/login?next=/favorites" className="btn-primary">
              Se connecter
            </Link>
            <Link href="/register" className="btn-secondary">
              Créer un compte
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { data: rows, error } = await supabase
    .from("favorites")
    .select("product_id, created_at")
    .eq("user_id", userData.user.id)
    .not("product_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[favorites]", error.message);

    return (
      <main className="container-page py-12">
        <h1 className="section-title">Mes favoris</h1>

        <div className="card mt-8 p-8">
          <p className="text-[16px] font-[900]">Favoris indisponibles</p>
          <p className="mt-2 max-w-2xl text-[13px] leading-[1.7] text-[var(--mache-muted)]">
            La fonctionnalité n&apos;est pas encore active sur cette base de
            données. Détail : {error.message}
          </p>
          <Link href="/shop" className="btn-secondary mt-5">
            Voir le catalogue
          </Link>
        </div>
      </main>
    );
  }

  const productIds = (rows ?? [])
    .map((row) => String(row.product_id))
    .filter(Boolean);

  /*
    Les produits sont relus par le catalogue : un favori doit disparaître de
    la liste si le produit a été retiré de la vente.
  */
  const { products } = productIds.length
    ? await fetchProducts({ limit: 100 })
    : { products: [] as CatalogProduct[] };

  const favorites = products.filter((product) => productIds.includes(product.id));

  return (
    <main className="container-page py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="section-title">Mes favoris</h1>
        <p className="text-[13px] text-[var(--mache-muted)]">
          {favorites.length} produit{favorites.length > 1 ? "s" : ""}
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="card mt-8 p-10 text-center">
          <p className="text-[18px] font-[900]">Aucun favori pour le moment</p>
          <p className="mx-auto mt-2 max-w-md text-[14px] leading-[1.8] text-[var(--mache-muted)]">
            {productIds.length > 0
              ? "Les produits que vous aviez mis en favori ne sont plus en vente."
              : "Parcourez le catalogue et mettez de côté les produits qui vous intéressent."}
          </p>
          <div className="mt-6">
            <Link href="/shop" className="btn-primary">
              Voir le catalogue
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {favorites.map((product) => (
            <ProductCard key={product.id} product={toCardProduct(product)} />
          ))}
        </div>
      )}
    </main>
  );
}
