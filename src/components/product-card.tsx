import Link from "next/link";
import { Product } from "@/types";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/product/${product.slug}`}
      className="group card overflow-hidden p-0 transition hover:-translate-y-1"
    >
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
      </div>

      <div className="p-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="badge">{product.category}</span>
          <span className="text-xs text-neutral-500">{product.vendorName}</span>
        </div>

        <h3 className="line-clamp-2 text-lg font-semibold">{product.title}</h3>

        <div className="mt-3 flex items-center gap-2">
          <span className="text-lg font-bold">
            {product.currency} {product.price}
          </span>
          {product.compareAtPrice ? (
            <span className="text-sm text-neutral-400 line-through">
              {product.currency} {product.compareAtPrice}
            </span>
          ) : null}
        </div>

        <p className="mt-3 text-sm text-neutral-500">
          ⭐ {product.rating} · {product.reviewCount} avis
        </p>
      </div>
    </Link>
  );
}
