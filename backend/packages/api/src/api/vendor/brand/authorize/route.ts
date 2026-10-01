/*
  ROUTE : autoriser (ou retirer) un revendeur sur mes produits de marque.

  Corps : { seller_id, product_ids: string[], action: "add" | "remove" }

  Règles, vérifiées ici et pas seulement à l'écran :
  - la boutique connectée a le profil « marque » ;
  - chaque produit est le sien (voir lib/brand-authorization.ts) ;
  - le revendeur est une autre boutique OUVERTE ;
  - la marque ne peut pas se retirer elle-même.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { linkSellersToProductWorkflow } from "@mercurjs/core/workflows";
import { BRAND_KEY, brandStatus, type ProductRow } from "../../../../lib/brand-authorization";

type Raw = Record<string, unknown>;
type Query = { graph: (args: unknown) => Promise<{ data: unknown }> };
type ProductService = { updateProducts: (id: string, data: Raw) => Promise<unknown> };

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const me = (req as unknown as { seller_context?: { seller_id?: string } }).seller_context?.seller_id;

  if (!me) return res.status(401).json({ message: "Boutique non identifiée." });

  const body = (req.body ?? {}) as Raw;
  const sellerId = String(body.seller_id ?? "");
  const action = body.action === "remove" ? "remove" : body.action === "add" ? "add" : null;
  const productIds = Array.isArray(body.product_ids) ? body.product_ids.map(String).slice(0, 200) : [];

  if (!action || !sellerId || productIds.length === 0) {
    return res.status(400).json({ message: "Choisissez un revendeur et au moins un produit." });
  }

  if (sellerId === me) return res.status(400).json({ message: "Vous êtes déjà la marque de ces produits." });

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as unknown as Query;

  const { data: sellerRows } = await query.graph({
    entity: "seller",
    fields: ["id", "status", "metadata"],
    filters: { id: [me, sellerId] },
  });

  const sellers = (sellerRows ?? []) as Raw[];
  const mine = sellers.find((seller) => seller.id === me);
  const target = sellers.find((seller) => seller.id === sellerId);

  if ((mine?.metadata as Raw | null)?.profile !== "marque") {
    return res.status(403).json({ message: "Seules les boutiques déclarées comme marque peuvent autoriser des revendeurs." });
  }

  if (!target || (action === "add" && target.status !== "open")) {
    return res.status(400).json({ message: "Cette boutique n'existe pas ou n'est pas ouverte." });
  }

  const { data: productRows } = await query.graph({
    entity: "product",
    fields: ["id", "title", "metadata", "sellers.id", "sellers.name"],
    filters: { id: productIds },
  });

  const products = (productRows ?? []) as unknown as ProductRow[];

  if (products.length !== productIds.length || products.some((product) => brandStatus(product, me) === "no")) {
    return res.status(403).json({ message: "Un de ces produits n'est pas à vous : vous ne pouvez pas y autoriser de revendeur." });
  }

  const productService = req.scope.resolve(Modules.PRODUCT) as unknown as ProductService;

  for (const product of products) {
    /* La marque est notée une fois pour toutes, à la première autorisation. */
    if (brandStatus(product, me) === "claimable") {
      await productService.updateProducts(product.id, { metadata: { ...(product.metadata ?? {}), [BRAND_KEY]: me } });
    }

    await linkSellersToProductWorkflow(req.scope).run({
      input: { id: product.id, ...(action === "add" ? { add: [sellerId] } : { remove: [sellerId] }) },
    });
  }

  return res.json({ ok: true, products: products.length });
}
