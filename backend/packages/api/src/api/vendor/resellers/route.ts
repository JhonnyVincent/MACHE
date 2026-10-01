/*
  ROUTE : mes revendeurs (pour une marque).

  Une marque crée un produit et le confie à des revendeurs : sur MACHE,
  un revendeur est un vendeur qui propose SA offre sur le même produit.
  Cette route lit donc les offres existantes — rien n'est déclaré à part,
  et rien ne peut diverger de la réalité :

  - les produits sur lesquels la boutique connectée a une offre ;
  - les AUTRES boutiques ouvertes qui ont une offre sur ces mêmes produits.

  Lecture seule, réservée à la boutique connectée (Mercur refuse sans
  session vendeur).
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

type Raw = Record<string, unknown>;

type Query = { graph: (args: unknown) => Promise<{ data: unknown }> };

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const me = (req as unknown as { seller_context?: { seller_id?: string } }).seller_context?.seller_id;

  if (!me) return res.status(401).json({ message: "Boutique non identifiée." });

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as unknown as Query;

  const { data: mine } = await query.graph({
    entity: "offer",
    fields: ["id", "product_id"],
    filters: { seller_id: me },
    pagination: { take: 1000 },
  });

  const productIds = [...new Set(((mine ?? []) as Raw[]).map((offer) => String(offer.product_id ?? "")).filter(Boolean))];

  if (productIds.length === 0) return res.json({ resellers: [], products: 0 });

  const { data: others } = await query.graph({
    entity: "offer",
    fields: ["id", "product_id", "seller_id"],
    filters: { product_id: productIds },
    pagination: { take: 5000 },
  });

  const byReseller = new Map<string, Set<string>>();

  for (const offer of (others ?? []) as Raw[]) {
    const seller = String(offer.seller_id ?? "");

    if (!seller || seller === me) continue;

    if (!byReseller.has(seller)) byReseller.set(seller, new Set());
    byReseller.get(seller)!.add(String(offer.product_id));
  }

  if (byReseller.size === 0) return res.json({ resellers: [], products: productIds.length });

  const { data: sellers } = await query.graph({
    entity: "seller",
    fields: ["id", "name", "handle", "status"],
    filters: { id: [...byReseller.keys()] },
    pagination: { take: 500 },
  });

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title"],
    filters: { id: productIds },
    pagination: { take: 1000 },
  });

  const titles = new Map(((products ?? []) as Raw[]).map((product) => [String(product.id), String(product.title ?? "")]));

  const resellers = ((sellers ?? []) as Raw[])
    .filter((seller) => seller.status === "open")
    .map((seller) => {
      const shared = [...(byReseller.get(String(seller.id)) ?? [])];

      return {
        id: String(seller.id),
        name: String(seller.name ?? ""),
        handle: String(seller.handle ?? ""),
        shared_products: shared.length,
        examples: shared.slice(0, 3).map((id) => titles.get(id) ?? "").filter(Boolean),
      };
    })
    .sort((a, b) => b.shared_products - a.shared_products);

  return res.json({ resellers, products: productIds.length });
}
