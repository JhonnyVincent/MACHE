import { notFound } from "next/navigation";
import { allProducts } from "@/lib/mock-data";

export default async function ProductPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = allProducts.find((item) => item.slug === slug);

  if (!product) notFound();

  return (
    <main className="container-page py-12">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="card overflow-hidden p-0">
            <img
              src={product.images[0]}
              alt={product.title}
              className="h-[460px] w-full object-cover"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {product.images.map((image, index) => (
              <div key={`${image}-${index}`} className="card overflow-hidden p-0">
                <img
                  src={image}
                  alt={product.title}
                  className="h-28 w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <span className="badge">{product.category}</span>

          <h1 className="mt-4 text-3xl font-bold">{product.title}</h1>

          <div className="mt-4 flex items-center gap-3">
            <span className="text-3xl font-black">
              {product.currency} {product.price}
            </span>
            {product.compareAtPrice ? (
              <span className="text-lg text-neutral-400 line-through">
                {product.currency} {product.compareAtPrice}
              </span>
            ) : null}
          </div>

          <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-300">
            {product.description}
          </p>

          <div className="mt-6 space-y-3 text-sm">
            <p>
              <span className="font-semibold">Vendeur :</span> {product.vendorName}
            </p>
            <p>
              <span className="font-semibold">Stock :</span> {product.stock}
            </p>
            <p>
              <span className="font-semibold">Avis :</span> ⭐ {product.rating} ({product.reviewCount})
            </p>
            <p>
              <span className="font-semibold">Livraison :</span> Nationale et internationale selon zone
            </p>
          </div>

          {product.variants?.length ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {product.variants.map((variant) => (
                <div key={variant.id} className="rounded-2xl border p-3 text-sm">
                  <span className="font-semibold">{variant.name} :</span> {variant.value}
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <button className="btn-primary">Ajouter au panier</button>
            <button className="btn-secondary">Wishlist</button>
            <button className="btn-secondary">Contacter le vendeur</button>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-xl font-semibold">Avis clients</h2>
          <div className="mt-4 space-y-4 text-sm text-neutral-600 dark:text-neutral-300">
            <p>⭐ 0/0 — “”</p>
            <p>⭐ 0/0 — “”</p>
            <p>⭐ 0/0 — “”</p>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-semibold">Infos livraison</h2>
          <div className="mt-4 space-y-3 text-sm text-neutral-600 dark:text-neutral-300">
            <p>Expédition locale et internationale selon destination.</p>
            <p>Architecture prête pour shipping, tracking et délais variables.</p>
            <p>Support futur des fournisseurs, export et logistique multi-zone.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
