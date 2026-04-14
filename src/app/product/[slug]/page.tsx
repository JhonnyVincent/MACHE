import { notFound } from "next/navigation";
import Link from "next/link";
import { allProducts } from "@/lib/mock-data";

export default async function ProductPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = allProducts.find((item) => item.slug === slug);

  if (!product) notFound();

  const relatedProducts = allProducts
    .filter((item) => item.slug !== product.slug && item.category === product.category)
    .slice(0, 4);

  const fallbackProducts =
    relatedProducts.length < 4
      ? allProducts.filter((item) => item.slug !== product.slug).slice(0, 4)
      : relatedProducts;

  const displayProducts = relatedProducts.length ? relatedProducts : fallbackProducts;

  const savings = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : null;

  return (
    <main>
      <section className="container-page py-8">
        <div className="mb-5 text-[12px] text-[var(--mache-muted)]">
          <Link href="/">Accueil</Link> / <Link href="/shop">Boutique</Link> /{" "}
          <span>{product.category}</span> / <span>{product.title}</span>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="overflow-hidden rounded-[20px] border border-[var(--mache-line)] bg-[var(--mache-white)]">
              <img
                src={product.images[0]}
                alt={product.title}
                className="h-[500px] w-full object-cover"
              />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {product.images.map((image, index) => (
                <div
                  key={`${image}-${index}`}
                  className="overflow-hidden rounded-[14px] border border-[var(--mache-line)] bg-[var(--mache-white)]"
                >
                  <img
                    src={image}
                    alt={product.title}
                    className="h-28 w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="badge">{product.category}</span>
              <span className="btag bg-hot">Tendance</span>
              {savings ? <span className="btag bg-promo">-{savings}%</span> : null}
              {product.stock > 0 ? (
                <span className="btag bg-fresh">En stock</span>
              ) : (
                <span className="btag bg-promo">Rupture</span>
              )}
            </div>

            <h1 className="text-[clamp(24px,3vw,38px)] font-[900] leading-[1.08] tracking-[-0.04em]">
              {product.title}
            </h1>

            <div className="mt-3 flex items-center gap-3">
              <div className="text-[34px] font-[900] tracking-[-0.04em]">
                {product.currency} {product.price}
              </div>

              {product.compareAtPrice ? (
                <div className="text-[18px] text-[var(--mache-muted)] line-through">
                  {product.currency} {product.compareAtPrice}
                </div>
              ) : null}

              {savings ? (
                <div className="rounded-[4px] bg-[var(--mache-success-soft)] px-2 py-1 text-[11px] font-[700] text-[var(--mache-success)]">
                  Économie {savings}%
                </div>
              ) : null}
            </div>

            <div className="mt-3 text-[13px] text-[var(--mache-muted)]">
              ⭐ {product.rating} · {product.reviewCount} avis
            </div>

            <p className="mt-5 text-[14px] leading-7 text-[var(--mache-muted)]">
              {product.description}
            </p>

            {product.variants?.length ? (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {product.variants.map((variant) => (
                  <div
                    key={variant.id}
                    className="rounded-[10px] border border-[var(--mache-line)] bg-[var(--mache-bg)] px-4 py-3 text-[13px]"
                  >
                    <span className="font-[700]">{variant.name} :</span> {variant.value}
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="flex items-center overflow-hidden rounded-[8px] border border-[var(--mache-line)]">
                <button className="h-10 w-10 text-lg">-</button>
                <div className="flex h-10 items-center border-x border-[var(--mache-line)] px-4 font-[700]">
                  1
                </div>
                <button className="h-10 w-10 text-lg">+</button>
              </div>

              <button className="btn-primary">Ajouter au panier</button>
              <button className="btn-secondary">Ajouter à la wishlist</button>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[10px] bg-[var(--mache-bg)] px-4 py-3 text-[13px] text-[var(--mache-muted)]">
                🚚 Livraison nationale et internationale
              </div>
              <div className="rounded-[10px] bg-[var(--mache-bg)] px-4 py-3 text-[13px] text-[var(--mache-muted)]">
                🔒 Paiement sécurisé et structure checkout prête
              </div>
              <div className="rounded-[10px] bg-[var(--mache-bg)] px-4 py-3 text-[13px] text-[var(--mache-muted)]">
                ↩️ Retour selon politique produit
              </div>
              <div className="rounded-[10px] bg-[var(--mache-bg)] px-4 py-3 text-[13px] text-[var(--mache-muted)]">
                📦 Stock actuel : {product.stock}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-6">
        <div className="border-b-2 border-[var(--mache-line)]">
          <div className="flex flex-wrap gap-6">
            <button className="border-b-2 border-[var(--mache-primary)] pb-3 text-[13px] font-[700] text-[var(--mache-primary)]">
              Description
            </button>
            <button className="pb-3 text-[13px] font-[700] text-[var(--mache-muted)]">
              Avis clients
            </button>
            <button className="pb-3 text-[13px] font-[700] text-[var(--mache-muted)]">
              Livraison
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="card p-6">
            <h3 className="text-[15px] font-[800]">Description</h3>
            <p className="mt-4 text-[14px] leading-7 text-[var(--mache-muted)]">
              {product.description}
            </p>
            <p className="mt-4 text-[14px] leading-7 text-[var(--mache-muted)]">
              Produit présenté dans une logique e-commerce moderne avec variations,
              stock, wishlist, panier, avis et livraison.
            </p>
          </div>

          <div className="card p-6">
            <h3 className="text-[15px] font-[800]">Livraison & retours</h3>
            <div className="mt-4 space-y-4 text-[14px] leading-7 text-[var(--mache-muted)]">
              <p>Haïti : 2 à 4 jours</p>
              <p>USA / Canada : 5 à 10 jours</p>
              <p>Europe : 7 à 14 jours</p>
              <p>Retour accepté selon la politique du produit et l’état à réception.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-10">
        <div className="mb-6">
          <h2 className="section-title">Produits similaires</h2>
          <p className="section-subtitle">
            On affiche ici des produits liés à la catégorie ou d’autres produits du catalogue,
            pas un bloc vendeur figé.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {displayProducts.map((item) => (
            <Link
              key={item.id}
              href={`/product/${item.slug}`}
              className="card overflow-hidden transition hover:-translate-y-1"
            >
              <img
                src={item.images[0]}
                alt={item.title}
                className="h-52 w-full object-cover"
              />
              <div className="p-4">
                <div className="mb-2">
                  <span className="badge">{item.category}</span>
                </div>
                <h3 className="line-clamp-2 text-[14px] font-[700]">{item.title}</h3>
                <div className="mt-3 text-[18px] font-[800]">
                  {item.currency} {item.price}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
