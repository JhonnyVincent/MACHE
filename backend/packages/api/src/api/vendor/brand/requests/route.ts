/*
  ROUTES : les demandes d'autorisation.

  POST (revendeur) → demander à une marque le droit de revendre un produit.
        La marque est prévenue par e-mail.
  GET  (marque)    → les demandes reçues en attente.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { BRAND_REQUEST_MODULE } from "../../../../modules/brand_request";
import { brandProductsFor } from "../../../../lib/brand-actions";
import { layout, siteLink } from "../../../../lib/notification-emails";
import { notify } from "../../../../lib/notify";

type Raw = Record<string, unknown>;

type RequestService = {
  listBrandRequests: (filters?: unknown, config?: unknown) => Promise<Raw[]>;
  createBrandRequests: (data: Raw) => Promise<Raw>;
};

type Query = { graph: (args: unknown) => Promise<{ data: unknown }> };

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const me = (req as unknown as { seller_context?: { seller_id?: string } }).seller_context?.seller_id;

  if (!me) return res.status(401).json({ message: "Boutique non identifiée." });

  const body = (req.body ?? {}) as Raw;
  const productId = String(body.product_id ?? "");
  const message = typeof body.message === "string" ? body.message.trim().slice(0, 600) : "";

  const products = await brandProductsFor(req.scope, me);
  const product = products.find((entry) => entry.id === productId);

  if (!product) return res.status(404).json({ message: "Ce produit n'est pas un produit de marque que vous pouvez demander." });
  if (product.authorized) return res.status(409).json({ message: "Vous êtes déjà autorisé à revendre ce produit." });

  const service = req.scope.resolve(BRAND_REQUEST_MODULE) as unknown as RequestService;

  const existing = await service.listBrandRequests({ reseller_seller_id: me, product_id: productId, status: "pending" }, { take: 1 });

  if (existing.length > 0) return res.status(409).json({ message: "Votre demande est déjà en attente." });

  await service.createBrandRequests({
    brand_seller_id: product.brand_id,
    reseller_seller_id: me,
    product_id: productId,
    product_title: product.title,
    message: message || null,
    status: "pending",
  });

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as unknown as Query;
  const { data } = await query.graph({
    entity: "seller",
    fields: ["id", "name", "email"],
    filters: { id: [me, product.brand_id] },
  });

  const sellers = (data ?? []) as Raw[];
  const reseller = sellers.find((seller) => seller.id === me);
  const brand = sellers.find((seller) => seller.id === product.brand_id);

  void notify(
    req.scope.resolve(ContainerRegistrationKeys.LOGGER),
    "demande d'autorisation (marque)",
    typeof brand?.email === "string" ? brand.email : null,
    layout(
      `Une boutique veut revendre « ${product.title} »`,
      [
        { kind: "p", text: `${String(reseller?.name ?? "Une boutique")} demande l'autorisation de revendre « ${product.title} ».` },
        ...(message ? [{ kind: "p" as const, text: message }] : []),
        { kind: "small", text: "Vous décidez dans l'espace vendeur, page Revendeurs : accepter ou refuser." },
      ],
      { label: "Voir la demande", url: siteLink("/dashboard/seller") }
    )
  );

  return res.status(201).json({ ok: true });
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const me = (req as unknown as { seller_context?: { seller_id?: string } }).seller_context?.seller_id;

  if (!me) return res.status(401).json({ message: "Boutique non identifiée." });

  const service = req.scope.resolve(BRAND_REQUEST_MODULE) as unknown as RequestService;
  const rows = await service.listBrandRequests({ brand_seller_id: me, status: "pending" }, { take: 200, order: { created_at: "ASC" } });

  if (rows.length === 0) return res.json({ requests: [] });

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as unknown as Query;
  const { data } = await query.graph({
    entity: "seller",
    fields: ["id", "name"],
    filters: { id: [...new Set(rows.map((row) => String(row.reseller_seller_id)))] },
  });

  const names = new Map(((data ?? []) as Raw[]).map((seller) => [String(seller.id), String(seller.name ?? "")]));

  return res.json({
    requests: rows.map((row) => ({
      id: row.id,
      reseller_id: row.reseller_seller_id,
      reseller_name: names.get(String(row.reseller_seller_id)) ?? "",
      product_id: row.product_id,
      product_title: row.product_title,
      message: row.message ?? null,
      created_at: row.created_at,
    })),
  });
}
