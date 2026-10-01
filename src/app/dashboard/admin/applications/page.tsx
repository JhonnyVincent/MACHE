/*
  PAGE : les applications demandées par les vendeurs.

  Chaque vendeur dit, depuis la page « Applications » de son panneau,
  les outils qu'il voudrait relier à sa boutique (Shopify, Alibaba…).
  Cette page compte les demandes : on construit d'abord les plus
  demandées.
*/

import { redirect } from "next/navigation";
import { getAdminUser, fetchAppInterest } from "@/lib/medusa/admin";
import { reportOutage } from "@/lib/medusa/outage";

export const dynamic = "force-dynamic";

const NAMES: Record<string, string> = {
  shopify: "Shopify",
  woocommerce: "WooCommerce",
  alibaba: "Alibaba.com",
  aliexpress: "AliExpress",
  cjdropshipping: "CJ Dropshipping",
  syncee: "Syncee",
  spocket: "Spocket",
  printful: "Printful / Printify",
  transporteurs: "Transporteurs",
  analytics: "Google Analytics",
  seo: "Référencement (SEO)",
};

export default async function AdminApplicationsPage() {
  const user = await getAdminUser();

  if (!user) redirect("/dashboard/admin/connexion");

  const result = await fetchAppInterest();

  if (!result.ok) reportOutage("applications demandées (administration)", result.reason);

  const apps = result.ok ? result.data : [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0f1111]">Applications demandées</h1>
        <p className="mt-1 text-base text-[#565959]">
          Les outils que les vendeurs voudraient relier à leur boutique, du plus demandé au moins demandé.
        </p>
      </div>

      {apps.length === 0 ? (
        <p className="rounded-[8px] border border-[#d5d9d9] bg-white p-4 text-base text-[#565959]">
          Aucune demande pour l&apos;instant.
        </p>
      ) : (
        <ul className="space-y-3">
          {apps.map((entry) => (
            <li key={entry.app} className="rounded-[8px] border border-[#d5d9d9] bg-white p-4">
              <p className="text-lg font-bold text-[#0f1111]">
                {NAMES[entry.app] ?? entry.app}{" "}
                <span className="text-base font-normal text-[#565959]">
                  · {entry.count} boutique{entry.count > 1 ? "s" : ""}
                </span>
              </p>
              <p className="mt-1 text-base text-[#565959]">{entry.sellers.map((seller) => seller.name).join(", ")}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
