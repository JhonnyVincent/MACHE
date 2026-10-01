/*
  ROUTE ADMIN : accorder, refuser ou retirer un compte professionnel.

  - approve : le client entre dans le groupe (c'est ce qui fait foi) et
              reçoit un e-mail ;
  - refuse  : un motif est obligatoire ; il est noté et envoyé au client ;
  - revoke  : le client sort du groupe. Il garde son compte client.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { proGroup } from "../../../../pro-context";
import { notify } from "../../../../../lib/notify";
import { layout, siteLink } from "../../../../../lib/notification-emails";

type CustomerService = {
  retrieveCustomer: (id: string) => Promise<{ id: string; email?: string; first_name?: string | null; metadata?: Record<string, unknown> | null }>;
  updateCustomers: (id: string, data: Record<string, unknown>) => Promise<unknown>;
  addCustomerToGroup: (pair: { customer_id: string; customer_group_id: string }) => Promise<unknown>;
  removeCustomerFromGroup: (pair: { customer_id: string; customer_group_id: string }) => Promise<unknown>;
};

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const id = String(req.params.id ?? "");
  const body = (req.body ?? {}) as Record<string, unknown>;
  const action = String(body.action ?? "");
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

  const group = await proGroup(req.scope);

  if (!group) {
    return res.status(503).json({ message: "Le groupe des acheteurs professionnels n'existe pas encore : redémarrez le backend, il est créé au démarrage." });
  }

  const customers = req.scope.resolve(Modules.CUSTOMER) as unknown as CustomerService;

  let customer;

  try {
    customer = await customers.retrieveCustomer(id);
  } catch {
    return res.status(404).json({ message: "Client introuvable." });
  }

  const pair = { customer_id: customer.id, customer_group_id: group.id };
  const hello = customer.first_name ? `Bonjour ${customer.first_name},` : "Bonjour,";

  if (action === "approve") {
    if (!group.customerIds.includes(customer.id)) await customers.addCustomerToGroup(pair);

    void notify(
      logger,
      "compte professionnel accordé (client)",
      customer.email,
      layout(
        "Votre compte professionnel MACHE est actif",
        [
          { kind: "p", text: hello },
          { kind: "p", text: "MACHE a validé votre compte professionnel. Vous voyez désormais les grossistes et les fournisseurs, et vous pouvez leur demander un devis pour des quantités." },
        ],
        { label: "Trouver un fournisseur", url: siteLink("/gros") }
      )
    );

    return res.json({ status: "approved" });
  }

  if (action === "refuse") {
    const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : "";

    if (reason.length < 3) return res.status(400).json({ message: "Indiquez le motif du refus : il est envoyé au client." });

    if (group.customerIds.includes(customer.id)) await customers.removeCustomerFromGroup(pair);

    await customers.updateCustomers(customer.id, {
      metadata: { ...(customer.metadata ?? {}), mache_pro_refused: { reason, at: new Date().toISOString() } },
    });

    void notify(
      logger,
      "compte professionnel refusé (client)",
      customer.email,
      layout(
        "Votre demande de compte professionnel MACHE",
        [
          { kind: "p", text: hello },
          { kind: "p", text: "MACHE n'a pas pu valider votre demande de compte professionnel, pour la raison suivante :" },
          { kind: "rows", rows: [["Motif", reason]] },
          { kind: "small", text: "Vous pouvez compléter votre demande et la renvoyer depuis votre compte." },
        ],
        { label: "Mon compte professionnel", url: siteLink("/compte/pro") }
      )
    );

    return res.json({ status: "refused" });
  }

  if (action === "revoke") {
    if (group.customerIds.includes(customer.id)) await customers.removeCustomerFromGroup(pair);

    /* Sans cette trace, l'ancienne demande le remettrait « en attente ». */
    await customers.updateCustomers(customer.id, {
      metadata: {
        ...(customer.metadata ?? {}),
        mache_pro_refused: { reason: "Compte professionnel retiré par MACHE.", at: new Date().toISOString() },
      },
    });

    return res.json({ status: "refused" });
  }

  return res.status(400).json({ message: "Action inconnue." });
}
