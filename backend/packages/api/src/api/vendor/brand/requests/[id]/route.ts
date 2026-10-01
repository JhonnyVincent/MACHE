/*
  ROUTE (marque) : accepter ou refuser une demande reçue.

  Accepter autorise le revendeur sur le produit (mêmes règles que la page
  Revendeurs) puis le prévient par e-mail. Refuser le prévient aussi.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { BRAND_REQUEST_MODULE } from "../../../../../modules/brand_request";
import { grantResellerAccess } from "../../../../../lib/brand-actions";
import { layout, siteLink } from "../../../../../lib/notification-emails";
import { notify } from "../../../../../lib/notify";

type Raw = Record<string, unknown>;
type RequestService = {
  listBrandRequests: (filters?: unknown, config?: unknown) => Promise<Raw[]>;
  updateBrandRequests: (data: Raw) => Promise<unknown>;
};
type Query = { graph: (args: unknown) => Promise<{ data: unknown }> };

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const me = (req as unknown as { seller_context?: { seller_id?: string } }).seller_context?.seller_id;

  if (!me) return res.status(401).json({ message: "Boutique non identifiée." });

  const action = (req.body as Raw | undefined)?.action;

  if (action !== "approve" && action !== "decline") return res.status(400).json({ message: "Action inconnue." });

  const service = req.scope.resolve(BRAND_REQUEST_MODULE) as unknown as RequestService;
  const [request] = await service.listBrandRequests({ id: String(req.params.id ?? ""), brand_seller_id: me, status: "pending" }, { take: 1 });

  if (!request) return res.status(404).json({ message: "Demande introuvable ou déjà traitée." });

  if (action === "approve") {
    const result = await grantResellerAccess(req.scope, me, String(request.reseller_seller_id), [String(request.product_id)], "add");

    if (!result.ok) return res.status(result.status).json({ message: result.message });
  }

  await service.updateBrandRequests({ id: request.id, status: action === "approve" ? "approved" : "declined" });

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as unknown as Query;
  const { data } = await query.graph({ entity: "seller", fields: ["id", "name", "email"], filters: { id: [me, String(request.reseller_seller_id)] } });
  const sellers = (data ?? []) as Raw[];
  const brand = sellers.find((seller) => seller.id === me);
  const reseller = sellers.find((seller) => seller.id === request.reseller_seller_id);

  void notify(
    req.scope.resolve(ContainerRegistrationKeys.LOGGER),
    "décision sur une demande d'autorisation (revendeur)",
    typeof reseller?.email === "string" ? reseller.email : null,
    layout(
      action === "approve" ? `Vous pouvez revendre « ${request.product_title} »` : `Demande refusée pour « ${request.product_title} »`,
      [
        {
          kind: "p",
          text:
            action === "approve"
              ? `${String(brand?.name ?? "La marque")} vous autorise à revendre « ${request.product_title} ». Vous pouvez maintenant créer votre offre sur ce produit.`
              : `${String(brand?.name ?? "La marque")} n'a pas accepté votre demande pour « ${request.product_title} ».`,
        },
      ],
      { label: "Ouvrir mon espace vendeur", url: siteLink("/dashboard/seller") }
    )
  );

  return res.json({ ok: true });
}
