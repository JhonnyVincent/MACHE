/*
  ROUTE : mes produits de marque et leurs revendeurs autorisés.

  Pour une boutique « marque » : ses produits (déjà marqués comme siens,
  ou qu'elle est seule à pouvoir vendre), avec la liste des boutiques
  autorisées à les revendre, et les boutiques qu'on peut autoriser.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { brandStatus, type ProductRow } from "../../../../lib/brand-authorization";

type Raw = Record<string, unknown>;
type Query = { graph: (args: unknown) => Promise<{ data: unknown }> };

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const me = (req as unknown as { seller_context?: { seller_id?: string } }).seller_context?.seller_id;

  if (!me) return res.status(401).json({ message: "Boutique non identifiée." });

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as unknown as Query;

  const { data: sellerRows } = await query.graph({
    entity: "seller",
    fields: ["id", "name", "status", "metadata"],
    pagination: { take: 1000 },
  });

  const sellers = (sellerRows ?? []) as Raw[];
  const mine = sellers.find((seller) => seller.id === me);
  const profile = (mine?.metadata as Raw | null)?.profile;

  if (profile !== "marque") {
    return res.json({ brand: false, products: [], candidates: [] });
  }

  const { data: productRows } = await query.graph({
    entity: "product",
    fields: ["id", "title", "metadata", "sellers.id", "sellers.name"],
    filters: { sellers: { id: me } },
    pagination: { take: 500 },
  });

  const products = ((productRows ?? []) as unknown as ProductRow[])
    .filter((product) => brandStatus(product, me) !== "no")
    .map((product) => ({
      id: product.id,
      title: product.title,
      authorized: (product.sellers ?? [])
        .filter((seller) => seller.id !== me)
        .map((seller) => ({ id: seller.id, name: seller.name ?? "" })),
    }));

  const candidates = sellers
    .filter((seller) => seller.id !== me && seller.status === "open")
    .map((seller) => ({ id: String(seller.id), name: String(seller.name ?? "") }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return res.json({ brand: true, products, candidates });
}
