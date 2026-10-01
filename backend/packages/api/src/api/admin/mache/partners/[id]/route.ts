/*
  ROUTE ADMIN : agir sur un partenaire.

  - update  : corriger sa fiche ;
  - approve : le rendre public (aussi pour rétablir un partenaire suspendu) ;
  - suspend : le retirer du site, réversible (motif obligatoire) ;
  - ban     : l'exclure, il ne peut plus se réinscrire (motif obligatoire) ;
  - delete  : supprimer la fiche. Un partenaire exclu ne se supprime pas :
              il faut d'abord lever l'exclusion, sinon l'exclusion
              disparaîtrait avec la fiche.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { PARTNER_MODULE } from "../../../../../modules/partner";
import { parsePartner } from "../../../../../lib/partner-input";

type Raw = Record<string, unknown>;

type PartnerService = {
  listPartners: (filters?: unknown, config?: unknown) => Promise<Raw[]>;
  updatePartners: (data: Raw) => Promise<Raw>;
  softDeletePartners: (id: string) => Promise<unknown>;
};

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const id = String(req.params.id ?? "");
  const body = (req.body ?? {}) as Raw;
  const action = String(body.action ?? "");
  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : "";

  const service = req.scope.resolve(PARTNER_MODULE) as unknown as PartnerService;

  const [row] = await service.listPartners({ id }, { take: 1 });

  if (!row) return res.status(404).json({ message: "Partenaire introuvable." });

  if (action === "approve") {
    await service.updatePartners({ id, status: "approved", status_reason: null });
    return res.json({ ok: true });
  }

  if (action === "suspend" || action === "ban") {
    if (reason.length < 3) return res.status(400).json({ message: "Indiquez un motif (3 caractères au moins)." });

    await service.updatePartners({ id, status: action === "ban" ? "banned" : "suspended", status_reason: reason });
    return res.json({ ok: true });
  }

  if (action === "delete") {
    if (row.status === "banned") {
      return res.status(409).json({ message: "Ce partenaire est exclu : levez d'abord l'exclusion (« Rétablir »), puis supprimez-le." });
    }

    await service.softDeletePartners(id);
    return res.json({ ok: true });
  }

  if (action === "update") {
    const parsed = parsePartner({ ...row, ...body });

    if (!parsed.ok) return res.status(400).json({ message: parsed.reason });

    await service.updatePartners({ id, ...parsed.value });
    return res.json({ ok: true });
  }

  return res.status(400).json({ message: "Action inconnue." });
}
