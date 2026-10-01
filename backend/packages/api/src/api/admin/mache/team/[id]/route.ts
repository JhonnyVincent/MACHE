/*
  ROUTE ADMIN (propriétaire) : changer le rôle d'un membre ou le retirer.

  Le propriétaire ne peut pas se retirer lui-même ni retirer un autre
  propriétaire : il n'y a qu'une personne qui détient tout, et l'équipe
  ne peut pas la déposséder.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import { deleteUsersWorkflow } from "@medusajs/core-flows";
import { STAFF_METADATA_KEY, staffRole } from "../../../../../lib/staff";

type Raw = Record<string, unknown>;

type UserService = {
  listUsers: (filters?: unknown, config?: unknown) => Promise<Raw[]>;
  updateUsers: (data: Raw) => Promise<unknown>;
};

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const id = String(req.params.id ?? "");
  const body = (req.body ?? {}) as Raw;
  const action = String(body.action ?? "");

  const users = req.scope.resolve(Modules.USER) as unknown as UserService;
  const [user] = await users.listUsers({ id }, { take: 1 });

  if (!user) return res.status(404).json({ message: "Membre introuvable." });

  if (staffRole(user.metadata as Raw | null) === "owner") {
    return res.status(409).json({ message: "Le propriétaire ne peut être ni modifié ni retiré ici." });
  }

  if (action === "role") {
    const role = String(body.role ?? "");

    if (role !== "support" && role !== "contenu") return res.status(400).json({ message: "Rôle inconnu." });

    await users.updateUsers({ id, metadata: { ...((user.metadata as Raw | null) ?? {}), [STAFF_METADATA_KEY]: role } });
    return res.json({ ok: true });
  }

  if (action === "remove") {
    await deleteUsersWorkflow(req.scope).run({ input: { ids: [id] } });
    return res.json({ ok: true });
  }

  return res.status(400).json({ message: "Action inconnue." });
}
