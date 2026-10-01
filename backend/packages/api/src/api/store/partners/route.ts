/*
  ROUTES : les partenaires de services.

  GET  → la liste publique (statut « approved » seulement), sans e-mail.
  POST → inscription d'un partenaire. Il arrive « pending » ; rien n'est
         public avant l'approbation par l'équipe, prévenue par e-mail.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { PARTNER_MODULE } from "../../../modules/partner";
import { parsePartner, publicPartner, slugify } from "../../../lib/partner-input";
import { notify } from "../../../lib/notify";
import { adminAlertAddress, adminAlertEmail } from "../../../lib/notification-emails";

type Raw = Record<string, unknown>;

type PartnerService = {
  listPartners: (filters?: unknown, config?: unknown) => Promise<Raw[]>;
  createPartners: (data: Raw) => Promise<Raw>;
};

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(PARTNER_MODULE) as unknown as PartnerService;

  const category = typeof req.query.category === "string" ? req.query.category : null;

  const rows = await service.listPartners(
    { status: "approved", ...(category ? { category } : {}) },
    { take: 500, order: { name: "ASC" } }
  );

  return res.json({ partners: rows.map(publicPartner) });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parsed = parsePartner((req.body ?? {}) as Raw);

  if (!parsed.ok) return res.status(400).json({ message: parsed.reason });

  const service = req.scope.resolve(PARTNER_MODULE) as unknown as PartnerService;

  /* Un partenaire exclu ne revient pas par une nouvelle inscription. */
  const sameEmail = await service.listPartners({ contact_email: parsed.value.contact_email }, { take: 20 });

  if (sameEmail.some((row) => row.status === "banned")) {
    return res.status(403).json({ message: "Cette adresse ne peut pas être inscrite." });
  }

  if (sameEmail.some((row) => row.status === "pending")) {
    return res.status(409).json({ message: "Une demande est déjà en cours d'examen pour cette adresse." });
  }

  /* L'adresse de la page : le nom, avec un suffixe si déjà pris. */
  const base = slugify(parsed.value.name);
  let slug = base;
  for (let n = 2; (await service.listPartners({ slug }, { take: 1 })).length > 0 && n < 50; n += 1) {
    slug = `${base}-${n}`;
  }

  await service.createPartners({ ...parsed.value, slug, status: "pending", source: "self" });

  void notify(
    req.scope.resolve(ContainerRegistrationKeys.LOGGER),
    "inscription d'un partenaire (équipe)",
    adminAlertAddress(),
    adminAlertEmail({
      subject: `Nouveau partenaire à examiner : ${parsed.value.name}`,
      intro: "Un partenaire de services demande à figurer sur MACHE. Rien n'est public avant votre approbation.",
      rows: [
        ["Entreprise", `${parsed.value.name} (${parsed.value.category})`],
        ["Contact", `${parsed.value.contact_name ?? "—"} — ${parsed.value.contact_email}`],
        ["Lieu", parsed.value.location ?? "—"],
        ["Site", parsed.value.website ?? "—"],
      ],
      path: "/dashboard/admin/partenaires",
      label: "Examiner la demande",
    })
  );

  return res.status(201).json({ message: "Demande reçue. L'équipe MACHE l'examine." });
}
