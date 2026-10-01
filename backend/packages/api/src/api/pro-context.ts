/*
  Retrouver le groupe des acheteurs professionnels et l'appartenance d'un
  client. Voir lib/pro-buyers.ts pour la règle.
*/

import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { PRO_MARKER } from "./agent-identity";

type Raw = Record<string, unknown>;

type Scope = { resolve: (key: string) => unknown };

export async function proGroup(scope: Scope): Promise<{ id: string; customerIds: string[] } | null> {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY) as {
    graph: (args: unknown) => Promise<{ data: unknown }>;
  };

  const { data } = await query.graph({
    entity: "customer_group",
    fields: ["id", "metadata", "customers.id"],
  });

  const group = ((data ?? []) as Raw[]).find((row) => (row.metadata as Raw | null)?.[PRO_MARKER] === true);

  if (!group) return null;

  return {
    id: String(group.id),
    customerIds: ((group.customers as Raw[] | null) ?? []).map((customer) => String(customer.id)),
  };
}

export async function isProBuyer(scope: Scope, customerId: string | null): Promise<boolean> {
  if (!customerId) return false;

  const group = await proGroup(scope);

  return Boolean(group?.customerIds.includes(customerId));
}
