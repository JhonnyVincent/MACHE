/*
  ROUTES ADMIN : les partenaires de services.

  GET  → tous, par statut (les demandes à examiner d'abord).
  POST → ajouter un partenaire à la main (il est approuvé d'office, sauf
         avis contraire).
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { PARTNER_MODULE } from "../../../../modules/partner";
import { parsePartner, slugify } from "../../../../lib/partner-input";

type Raw = Record<string, unknown>;

type PartnerService = {
  listPartners: (filters?: unknown, config?: unknown) => Promise<Raw[]>;
  createPartners: (data: Raw) => Promise<Raw>;
};

const ORDER = { pending: 0, approved: 1, suspended: 2, banned: 3 } as Record<string, number>;

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(PARTNER_MODULE) as unknown as PartnerService;

  const rows = await service.listPartners({}, { take: 1000, order: { created_at: "ASC" } });

  rows.sort((a, b) => (ORDER[String(a.status)] ?? 9) - (ORDER[String(b.status)] ?? 9));

  return res.json({ partners: rows });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parsed = parsePartner((req.body ?? {}) as Raw);

  if (!parsed.ok) return res.status(400).json({ message: parsed.reason });

  const service = req.scope.resolve(PARTNER_MODULE) as unknown as PartnerService;

  const base = slugify(parsed.value.name);
  let slug = base;
  for (let n = 2; (await service.listPartners({ slug }, { take: 1 })).length > 0 && n < 50; n += 1) {
    slug = `${base}-${n}`;
  }

  const created = await service.createPartners({ ...parsed.value, slug, status: "approved", source: "admin" });

  return res.status(201).json({ partner: created });
}
