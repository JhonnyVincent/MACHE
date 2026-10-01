/* ROUTE : la fiche publique d'un partenaire approuvé. */

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { PARTNER_MODULE } from "../../../../modules/partner";
import { publicPartner } from "../../../../lib/partner-input";

type PartnerService = { listPartners: (filters?: unknown, config?: unknown) => Promise<Record<string, unknown>[]> };

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(PARTNER_MODULE) as unknown as PartnerService;

  const [row] = await service.listPartners({ slug: String(req.params.slug ?? ""), status: "approved" }, { take: 1 });

  if (!row) return res.status(404).json({ message: "Partenaire introuvable." });

  return res.json({ partner: publicPartner(row) });
}
