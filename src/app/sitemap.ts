/*
  LE PLAN DU SITE, POUR GOOGLE (/sitemap.xml).

  La liste des pages que Google doit connaître : les pages fixes, chaque
  rayon, chaque boutique et chaque produit en vente. Il le relit de
  lui-même ; un produit ajouté par un vendeur y apparaît au plus tard
  une heure après.

  Les espaces connectés, le panier et la commande n'y sont pas : ils
  n'ont rien à faire dans les résultats de recherche.

  Si le catalogue ne répond pas, le plan garde au moins les pages fixes
  plutôt que d'échouer.
*/

import type { MetadataRoute } from "next";
import { fetchCategories, fetchProducts, fetchPublicSellers } from "@/lib/medusa/catalog";
import { siteUrl } from "@/lib/seo";

export const revalidate = 3600;

const STATIC_PAGES: Array<[string, number]> = [
  ["/", 1],
  ["/shop", 0.9],
  ["/gros", 0.7],
  ["/haiti", 0.6],
  ["/sell", 0.8],
  ["/sell/particulier", 0.6],
  ["/sell/business", 0.6],
  ["/sell/fournisseur", 0.6],
  ["/sell/marque-officielle", 0.6],
  ["/sell/tarifs", 0.6],
  ["/dashboard/seller/inscription", 0.5],
  ["/services", 0.5],
  ["/export", 0.5],
  ["/partenaires", 0.5],
  ["/about", 0.5],
  ["/faq", 0.6],
  ["/contact", 0.4],
  ["/verify-agent", 0.4],
  ["/legal/terms", 0.2],
  ["/legal/privacy", 0.2],
  ["/legal/returns", 0.3],
  ["/legal/shipping", 0.3],
  ["/legal/vendors", 0.2],
];

/* Google n'en lit pas plus de 50 000 par fichier ; on reste bien en dessous. */
const PAGE = 100;
const MAX_PRODUCTS = 5000;

async function allProducts() {
  const handles: Array<{ handle: string; updated: string | null }> = [];

  for (let offset = 0; offset < MAX_PRODUCTS; offset += PAGE) {
    const result = await fetchProducts({ limit: PAGE, offset });

    if (!result.ok) break;

    for (const product of result.data.products) {
      handles.push({ handle: product.handle, updated: product.createdAt });
    }

    if (result.data.products.length < PAGE) break;
  }

  return handles;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();

  const entries: MetadataRoute.Sitemap = STATIC_PAGES.map(([path, priority]) => ({
    url: `${base}${path}`,
    lastModified: now,
    priority,
  }));

  const [categories, sellers, products] = await Promise.all([
    fetchCategories(300),
    fetchPublicSellers(500),
    allProducts(),
  ]);

  if (categories.ok) {
    for (const category of categories.data) {
      entries.push({
        url: `${base}/shop?category=${encodeURIComponent(category.handle)}`,
        lastModified: now,
        priority: 0.7,
      });
    }
  }

  if (sellers.ok) {
    for (const seller of sellers.data.sellers) {
      entries.push({ url: `${base}/store/${encodeURIComponent(seller.handle)}`, lastModified: now, priority: 0.6 });
    }
  }

  for (const product of products) {
    entries.push({
      url: `${base}/product/${encodeURIComponent(product.handle)}`,
      lastModified: product.updated ? new Date(product.updated) : now,
      priority: 0.8,
    });
  }

  return entries;
}
