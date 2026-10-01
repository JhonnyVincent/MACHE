/*
  ROUTE ADMIN : les demandes de compte professionnel, et les comptes
  accordés. Les demandes en attente d'abord, les plus anciennes en tête.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { proGroup } from "../../../pro-context";
import { proStatus, readProRequest } from "../../../../lib/pro-buyers";

type Raw = Record<string, unknown>;

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as {
    graph: (args: unknown) => Promise<{ data: unknown }>;
  };

  const group = await proGroup(req.scope);
  const members = new Set(group?.customerIds ?? []);

  const { data } = await query.graph({
    entity: "customer",
    fields: ["id", "email", "first_name", "last_name", "metadata", "created_at"],
    pagination: { take: 2000 },
  });

  const rows = ((data ?? []) as Raw[])
    .map((customer) => {
      const metadata = (customer.metadata as Raw | null) ?? null;
      const status = proStatus(members.has(String(customer.id)), metadata);
      const refused = metadata?.mache_pro_refused as Raw | undefined;

      return {
        id: String(customer.id),
        email: String(customer.email ?? ""),
        name: `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim(),
        status,
        request: readProRequest(metadata),
        refused_reason: typeof refused?.reason === "string" ? refused.reason : null,
      };
    })
    .filter((row) => row.status !== "none");

  const order = { pending: 0, approved: 1, refused: 2, none: 3 } as const;

  rows.sort(
    (a, b) =>
      order[a.status] - order[b.status] ||
      String(a.request?.requested_at ?? "").localeCompare(String(b.request?.requested_at ?? ""))
  );

  return res.json({ pros: rows, group_ready: Boolean(group) });
}
