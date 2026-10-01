/*
  ROUTES ADMIN (propriétaire) : l'équipe.

  GET  → les comptes administrateurs et leur rôle.
  POST → créer un membre délégué : compte + rôle, puis e-mail « choisissez
         votre mot de passe » (le propriétaire ne connaît jamais ce mot de
         passe). Réservé au propriétaire : le garde (api/staff-guard.ts)
         n'ouvre aucune route /admin/mache/team aux rôles délégués.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { createUserAccountWorkflow, generateResetPasswordTokenWorkflow } from "@medusajs/core-flows";
import { randomBytes } from "node:crypto";
import { STAFF_METADATA_KEY, STAFF_ROLES, staffRole } from "../../../../lib/staff";

type Raw = Record<string, unknown>;

type UserService = { listUsers: (filters?: unknown, config?: unknown) => Promise<Raw[]> };
type AuthService = {
  register: (provider: string, data: Raw) => Promise<{ success: boolean; error?: string; authIdentity?: { id: string } }>;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const users = req.scope.resolve(Modules.USER) as unknown as UserService;
  const rows = await users.listUsers({}, { take: 200 });

  return res.json({
    team: rows.map((user) => ({
      id: user.id,
      email: user.email,
      first_name: user.first_name ?? null,
      last_name: user.last_name ?? null,
      role: staffRole(user.metadata as Raw | null),
    })),
  });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body ?? {}) as Raw;
  const email = String(body.email ?? "").trim().toLowerCase();
  const first = String(body.first_name ?? "").trim().slice(0, 100);
  const last = String(body.last_name ?? "").trim().slice(0, 100);
  const role = String(body.role ?? "");

  if (!EMAIL.test(email)) return res.status(400).json({ message: "Adresse e-mail non valable." });
  if (!first) return res.status(400).json({ message: "Indiquez le prénom." });
  if (role === "owner" || !(STAFF_ROLES as readonly string[]).includes(role)) {
    return res.status(400).json({ message: "Choisissez un rôle : suivi des clients, ou site et mises à jour." });
  }

  const users = req.scope.resolve(Modules.USER) as unknown as UserService;

  if ((await users.listUsers({ email }, { take: 1 })).length > 0) {
    return res.status(409).json({ message: "Un compte administrateur existe déjà pour cette adresse." });
  }

  /* Mot de passe aléatoire que personne ne connaît : le membre en choisit un par le lien reçu. */
  const auth = req.scope.resolve(Modules.AUTH) as unknown as AuthService;
  const registered = await auth.register("emailpass", { body: { email, password: randomBytes(24).toString("hex") } });

  if (!registered.success || !registered.authIdentity) {
    return res.status(409).json({ message: registered.error || "Ce compte existe déjà." });
  }

  await createUserAccountWorkflow(req.scope).run({
    input: {
      authIdentityId: registered.authIdentity.id,
      userData: { email, first_name: first, last_name: last || undefined, metadata: { [STAFF_METADATA_KEY]: role } },
    },
  });

  const { http } = req.scope.resolve(ContainerRegistrationKeys.CONFIG_MODULE).projectConfig;

  /* Émet l'événement qui envoie le lien « choisissez votre mot de passe ». */
  await generateResetPasswordTokenWorkflow(req.scope).run({
    input: { entityId: email, actorType: "user", provider: "emailpass", secret: http.jwtSecret, jwtOptions: http.jwtOptions },
    throwOnError: false,
  });

  return res.status(201).json({ ok: true });
}
