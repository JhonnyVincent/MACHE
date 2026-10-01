/*
  ROUTE : autoriser (ou retirer) un revendeur sur mes produits de marque.

  Corps : { seller_id, product_ids: string[], action: "add" | "remove" }
  Les règles sont dans lib/brand-actions.ts.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { grantResellerAccess } from "../../../../lib/brand-actions";

type Raw = Record<string, unknown>;

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const me = (req as unknown as { seller_context?: { seller_id?: string } }).seller_context?.seller_id;

  if (!me) return res.status(401).json({ message: "Boutique non identifiée." });

  const body = (req.body ?? {}) as Raw;
  const action = body.action === "remove" ? "remove" : body.action === "add" ? "add" : null;
  const productIds = Array.isArray(body.product_ids) ? body.product_ids.map(String).slice(0, 200) : [];

  if (!action) return res.status(400).json({ message: "Choisissez un revendeur et au moins un produit." });

  const result = await grantResellerAccess(req.scope, me, String(body.seller_id ?? ""), productIds, action);

  return result.ok ? res.json({ ok: true, products: result.products }) : res.status(result.status).json({ message: result.message });
}
