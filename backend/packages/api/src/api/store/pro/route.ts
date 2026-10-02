/*
  ROUTE : « mon compte professionnel ».

  GET  → le statut : accordé, en attente, refusé, ou pas de demande.
  POST → déposer (ou renouveler) une demande. L'équipe MACHE est
         prévenue par e-mail ; c'est elle qui accorde, dans
         l'administration.

  Réservée à un client connecté : un statut pro s'attache à un compte.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { customerId } from "../../delivery-helpers";
import { isProBuyer } from "../../pro-context";
import { PRO_TYPE_LABELS, parseProRequest, proStatus, readProRequest } from "../../../lib/pro-buyers";
import { notify } from "../../../lib/notify";
import { adminAlertAddress, adminAlertEmail } from "../../../lib/notification-emails";

type CustomerService = {
  retrieveCustomer: (id: string) => Promise<{ id: string; email?: string; first_name?: string | null; last_name?: string | null; metadata?: Record<string, unknown> | null }>;
  updateCustomers: (id: string, data: Record<string, unknown>) => Promise<unknown>;
};

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const me = customerId(req);

  if (!me) return res.status(401).json({ message: "Connectez-vous à votre compte." });

  const customers = req.scope.resolve(Modules.CUSTOMER) as unknown as CustomerService;
  const customer = await customers.retrieveCustomer(me);
  const inGroup = await isProBuyer(req.scope, me);

  return res.json({
    pro: {
      status: proStatus(inGroup, customer.metadata),
      request: readProRequest(customer.metadata),
    },
  });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const me = customerId(req);

  if (!me) return res.status(401).json({ message: "Connectez-vous à votre compte." });

  const parsed = parseProRequest((req.body ?? {}) as Record<string, unknown>);

  if (!parsed.ok) return res.status(400).json({ message: parsed.reason });

  if (await isProBuyer(req.scope, me)) {
    return res.status(409).json({ message: "Votre compte professionnel est déjà actif." });
  }

  const customers = req.scope.resolve(Modules.CUSTOMER) as unknown as CustomerService;
  const customer = await customers.retrieveCustomer(me);

  /* Le reste du champ libre (favoris…) est conservé. */
  await customers.updateCustomers(me, {
    metadata: { ...(customer.metadata ?? {}), mache_pro_request: parsed.value },
  });

  const request = parsed.value;
  const name = `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim();

  void notify(
    req.scope.resolve(ContainerRegistrationKeys.LOGGER),
    "demande de compte professionnel (équipe)",
    adminAlertAddress(),
    adminAlertEmail({
      subject: `Compte professionnel à valider : ${request.organisation}`,
      intro: "Un client demande un compte professionnel : il pourra voir les grossistes et leur demander des devis.",
      rows: [
        ["Organisation", `${request.organisation} (${PRO_TYPE_LABELS[request.type]})`],
        ["Ville", request.city],
        ["Contact", `${name || "—"} — ${customer.email ?? ""}`],
        ["Téléphone", request.phone],
        ...(request.note ? [["Message", request.note] as [string, string]] : []),
      ],
      path: "/pros",
      label: "Valider ou refuser",
    })
  );

  return res.status(201).json({ pro: { status: "pending", request } });
}
