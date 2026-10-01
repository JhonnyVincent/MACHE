/*
  ROUTE : les produits de marque que je peux demander à revendre.

  Pour un revendeur : les produits d'une marque (voir lib/brand-actions.ts),
  avec la marque, et s'il y est déjà autorisé ou s'il a une demande en cours.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { BRAND_REQUEST_MODULE } from "../../../../modules/brand_request";
import { brandProductsFor } from "../../../../lib/brand-actions";

type Raw = Record<string, unknown>;
type RequestService = { listBrandRequests: (filters?: unknown, config?: unknown) => Promise<Raw[]> };

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const me = (req as unknown as { seller_context?: { seller_id?: string } }).seller_context?.seller_id;

  if (!me) return res.status(401).json({ message: "Boutique non identifiée." });

  const products = await brandProductsFor(req.scope, me);

  const service = req.scope.resolve(BRAND_REQUEST_MODULE) as unknown as RequestService;
  const mine = await service.listBrandRequests({ reseller_seller_id: me }, { take: 500 });
  const status = new Map(mine.map((row) => [String(row.product_id), String(row.status)]));

  return res.json({
    products: products.map((product) => ({ ...product, request: status.get(product.id) ?? null })),
  });
}
