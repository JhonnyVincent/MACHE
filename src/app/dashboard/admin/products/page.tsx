/*
  PAGE : Administration — modération des produits

  Reprend la file de modération, jusqu'ici rendue par le routeur générique
  /dashboard/[role]. Le composant et les actions ne changent pas : seule
  la route qui les sert est maintenant explicite.
*/

import { requireAdmin } from "@/lib/admin";
import { fetchModerationQueue, PENDING_STATUSES } from "@/lib/moderation";
import { PageHeader } from "@/components/seller/ui";
import { ModerationQueue } from "@/components/admin/moderation-queue";

export const dynamic = "force-dynamic";

export default async function AdminModerationPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; done?: string; error?: string }>;
}) {
  await requireAdmin("/dashboard/admin/products");

  const query = searchParams ? await searchParams : {};
  const requested = typeof query.status === "string" ? query.status : "";

  const { products, counts } = await fetchModerationQueue(
    requested ? [requested] : PENDING_STATUSES
  );

  return (
    <>
      <PageHeader
        title="Modération des produits"
        subtitle="Les produits listés ici ne sont pas visibles des clients tant qu'aucune décision n'est prise."
      />

      <ModerationQueue
        products={products}
        counts={counts}
        activeStatus={requested || "manual_review"}
        message={query.done}
        error={query.error}
      />
    </>
  );
}
