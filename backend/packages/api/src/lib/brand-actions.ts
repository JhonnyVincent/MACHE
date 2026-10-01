/*
  Les actions de la marque sur ses revendeurs, partagées par la page
  « Revendeurs » (autoriser / retirer) et par les demandes (accepter).
  Toutes les règles sont ici : une seule version, jamais deux.
*/

import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { linkSellersToProductWorkflow } from "@mercurjs/core/workflows";
import { BRAND_KEY, brandStatus, type ProductRow } from "./brand-authorization";

type Raw = Record<string, unknown>;
type Query = { graph: (args: unknown) => Promise<{ data: unknown }> };
type Scope = { resolve: (key: string) => unknown };
type ProductService = { updateProducts: (id: string, data: Raw) => Promise<unknown> };

export type ActionResult = { ok: true; products: number } | { ok: false; status: number; message: string };

export async function grantResellerAccess(
  scope: Scope,
  me: string,
  sellerId: string,
  productIds: string[],
  action: "add" | "remove"
): Promise<ActionResult> {
  if (!sellerId || productIds.length === 0) {
    return { ok: false, status: 400, message: "Choisissez un revendeur et au moins un produit." };
  }

  if (sellerId === me) return { ok: false, status: 400, message: "Vous êtes déjà la marque de ces produits." };

  const query = scope.resolve(ContainerRegistrationKeys.QUERY) as Query;

  const { data: sellerRows } = await query.graph({
    entity: "seller",
    fields: ["id", "status", "metadata"],
    filters: { id: [me, sellerId] },
  });

  const sellers = (sellerRows ?? []) as Raw[];
  const mine = sellers.find((seller) => seller.id === me);
  const target = sellers.find((seller) => seller.id === sellerId);

  if ((mine?.metadata as Raw | null)?.profile !== "marque") {
    return { ok: false, status: 403, message: "Seules les boutiques déclarées comme marque peuvent autoriser des revendeurs." };
  }

  if (!target || (action === "add" && target.status !== "open")) {
    return { ok: false, status: 400, message: "Cette boutique n'existe pas ou n'est pas ouverte." };
  }

  const { data: productRows } = await query.graph({
    entity: "product",
    fields: ["id", "title", "metadata", "sellers.id", "sellers.name"],
    filters: { id: productIds },
  });

  const products = (productRows ?? []) as unknown as ProductRow[];

  if (products.length !== productIds.length || products.some((product) => brandStatus(product, me) === "no")) {
    return { ok: false, status: 403, message: "Un de ces produits n'est pas à vous : vous ne pouvez pas y autoriser de revendeur." };
  }

  const productService = scope.resolve(Modules.PRODUCT) as ProductService;

  for (const product of products) {
    /* La marque est notée une fois pour toutes, à la première autorisation. */
    if (brandStatus(product, me) === "claimable") {
      await productService.updateProducts(product.id, { metadata: { ...(product.metadata ?? {}), [BRAND_KEY]: me } });
    }

    await linkSellersToProductWorkflow(scope as never).run({
      input: { id: product.id, ...(action === "add" ? { add: [sellerId] } : { remove: [sellerId] }) },
    });
  }

  return { ok: true, products: products.length };
}

/*
  Les produits de marque qu'un revendeur peut demander : ceux dont la
  marque est connue — notée sur le produit, ou boutique « marque » seule
  autorisée dessus (produit pas encore confié à personne).
*/
export type BrandProduct = { id: string; title: string; brand_id: string; brand_name: string; authorized: boolean };

export async function brandProductsFor(scope: Scope, me: string): Promise<BrandProduct[]> {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY) as Query;

  const { data: sellerRows } = await query.graph({
    entity: "seller",
    fields: ["id", "name", "status", "metadata"],
    pagination: { take: 2000 },
  });

  const brands = new Map(
    ((sellerRows ?? []) as Raw[])
      .filter((seller) => seller.status === "open" && (seller.metadata as Raw | null)?.profile === "marque")
      .map((seller) => [String(seller.id), String(seller.name ?? "")] as const)
  );

  if (brands.size === 0) return [];

  const { data: productRows } = await query.graph({
    entity: "product",
    fields: ["id", "title", "metadata", "sellers.id", "sellers.name"],
    pagination: { take: 3000 },
  });

  const result: BrandProduct[] = [];

  for (const product of (productRows ?? []) as unknown as ProductRow[]) {
    const sellers = product.sellers ?? [];
    const owner = (product.metadata ?? {})[BRAND_KEY];

    const brandId =
      typeof owner === "string" && owner
        ? owner
        : sellers.length === 1 && brands.has(sellers[0].id)
          ? sellers[0].id
          : null;

    if (!brandId || !brands.has(brandId) || brandId === me) continue;

    result.push({
      id: product.id,
      title: product.title,
      brand_id: brandId,
      brand_name: brands.get(brandId) ?? "",
      authorized: sellers.some((seller) => seller.id === me),
    });
  }

  return result;
}
