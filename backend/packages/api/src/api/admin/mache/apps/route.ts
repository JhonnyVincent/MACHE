/*
  ROUTE ADMIN : quelles applications les vendeurs veulent-ils ?

  Chaque vendeur note son intérêt dans `seller.metadata.apps` (page
  « Applications » du panneau vendeur). Cette route compte, par
  application, les boutiques intéressées : c'est ce qui dit quoi
  construire en premier.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

type Raw = Record<string, unknown>;

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as {
    graph: (args: unknown) => Promise<{ data: unknown }>;
  };

  const { data } = await query.graph({
    entity: "seller",
    fields: ["id", "name", "metadata"],
    pagination: { take: 2000 },
  });

  const apps: Record<string, { id: string; name: string }[]> = {};

  for (const seller of (data ?? []) as Raw[]) {
    const chosen = ((seller.metadata as Raw | null) ?? {}).apps;

    if (!chosen || typeof chosen !== "object" || Array.isArray(chosen)) continue;

    for (const app of Object.keys(chosen as Raw)) {
      (apps[app] ??= []).push({ id: String(seller.id), name: String(seller.name ?? "") });
    }
  }

  const summary = Object.entries(apps)
    .map(([app, sellers]) => ({ app, count: sellers.length, sellers }))
    .sort((a, b) => b.count - a.count);

  return res.json({ apps: summary });
}
