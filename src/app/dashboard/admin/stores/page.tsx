/*
  PAGE : les boutiques de la marketplace.

  En lecture seule, et volontairement.

  Approuver, suspendre ou vérifier une boutique se fait dans le panneau
  du backend. Refaire ces gestes ici reviendrait à entretenir deux
  versions de la même décision — et deux versions d'un même écran
  finissent toujours par diverger, l'une approuvant ce que l'autre croit
  encore en attente.

  Ce que cette page apporte, c'est la liste et l'attente : qui s'est
  inscrit, et qui attend une réponse. C'est ce qu'on veut voir en
  ouvrant l'administration.
*/

import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getAdminUser,
  fetchSellers,
  SELLER_STATUS_LABELS,
  sellerIsOpen,
} from "@/lib/medusa/admin";
import { medusaBackendUrl } from "@/lib/medusa/config";
import { reportOutage } from "@/lib/medusa/outage";
import { formatDate } from "@/lib/seller";
import { approveSellerAction } from "./approve-action";

export const dynamic = "force-dynamic";

export default async function AdminStoresPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; approuvee?: string }>;
}) {
  const query = searchParams ? await searchParams : {};

  const user = await getAdminUser();

  if (!user) redirect("/dashboard/admin/connexion");

  const result = await fetchSellers();

  if (!result.ok) reportOutage("boutiques (administration)", result.reason);

  const sellers = result.ok ? result.data : [];

  /* Celles qui attendent d'abord : c'est la raison d'ouvrir cette page. */
  const sorted = [...sellers].sort((a, b) => {
    const waiting = (seller: typeof a) =>
      seller.status === "pending_approval" ? 0 : 1;

    return waiting(a) - waiting(b);
  });

  const backendUrl = medusaBackendUrl();
  const panelUrl = backendUrl ? `${backendUrl}/dashboard` : "";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0f1111]">
          Boutiques
        </h1>
        <p className="mt-1 text-base text-[#565959]">
          {sellers.length} inscrite{sellers.length > 1 ? "s" : ""} sur la
          marketplace.
        </p>
      </div>

      {query.approuvee && (
        <div className="rounded-[8px] border border-[#b7e0bf] bg-[#eaf6ec] px-4 py-3 text-base text-[#116b25]">
          Boutique approuvée. Ses produits entrent dans le catalogue.
        </div>
      )}

      {query.error && (
        <div className="rounded-[8px] border border-[#f2c2c8] bg-[#fdeaec] px-4 py-3 text-base text-[#b01124]">
          {decodeURIComponent(query.error)}
        </div>
      )}

      {!result.ok && (
        <div className="rounded-[8px] border border-[#f2c2c8] bg-[#fdeaec] px-4 py-3 text-base text-[#b01124]">
          La liste ne peut pas être lue pour le moment. Réessayez dans
          quelques minutes.
        </div>
      )}

      {result.ok && sellers.length === 0 && (
        <div className="rounded-[8px] border border-[#d5d9d9] bg-white p-5">
          <p className="text-base font-semibold text-[#0f1111]">
            Aucune boutique inscrite.
          </p>
          <p className="mt-1 text-base text-[#565959]">
            Les commerçants ouvrent leur boutique depuis{" "}
            <Link href="/sell" className="font-medium text-[#0f1111] underline">
              la page « Vendre »
            </Link>
            .
          </p>
        </div>
      )}

      {sorted.length > 0 && (
        <div className="overflow-hidden rounded-[8px] border border-[#d5d9d9] bg-white">
          <table className="w-full text-left text-base">
            <thead className="border-b border-[#d5d9d9] bg-[#f7f8f8] text-sm text-[#565959]">
              <tr>
                <th className="px-4 py-2.5 font-medium">Boutique</th>
                <th className="px-4 py-2.5 font-medium">Contact</th>
                <th className="px-4 py-2.5 font-medium">État</th>
                <th className="px-4 py-2.5 font-medium">Inscrite le</th>
                <th className="px-4 py-2.5 font-medium" />
              </tr>
            </thead>

            <tbody>
              {sorted.map((seller) => {
                const waiting = seller.status === "pending_approval";

                return (
                  <tr
                    key={seller.id}
                    className="border-b border-[#eceef0] last:border-0"
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[#0f1111]">{seller.name}</p>

                      {seller.handle && (
                        <Link
                          href={`/store/${seller.handle}`}
                          className="text-sm text-[#565959] underline-offset-2 hover:underline"
                        >
                          /store/{seller.handle}
                        </Link>
                      )}
                    </td>

                    <td className="px-4 py-3 text-[#565959]">
                      {seller.email ?? "—"}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-sm font-semibold ${
                          waiting
                            ? "bg-[#fff8ed] text-[#8a5a00]"
                            : sellerIsOpen(seller.status)
                              ? "bg-[#eaf6ec] text-[#116b25]"
                              : "bg-[#f1f2f3] text-[#565959]"
                        }`}
                      >
                        {SELLER_STATUS_LABELS[seller.status] ?? seller.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-[#565959]">
                      {seller.createdAt ? formatDate(seller.createdAt) : "—"}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {/*
                        Le bouton n'apparaît que là où il y a une
                        décision à prendre. Sur une boutique déjà
                        ouverte, il n'aurait rien à faire.
                      */}
                      {waiting && (
                        <form action={approveSellerAction}>
                          <input type="hidden" name="seller_id" value={seller.id} />
                          <button
                            type="submit"
                            className="whitespace-nowrap rounded-[6px] bg-[#0f1111] px-3 py-1.5 text-sm font-bold text-white transition-colors hover:bg-black"
                          >
                            Approuver
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-[8px] border border-[#d5d9d9] bg-white p-4">
        <p className="text-base font-semibold text-[#0f1111]">
          Approuver, suspendre, vérifier
        </p>
        <p className="mt-1 text-base leading-relaxed text-[#565959]">
          Approuver se fait ici, parce que c&apos;est l&apos;attente que
          cette page signale. Suspendre, refuser ou vérifier les documents
          se fait dans le panneau du backend, qui en tient l&apos;historique
          — ce sont des décisions plus lourdes, souvent à motiver.
        </p>

        {panelUrl && (
          <a
            href={panelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block rounded-[6px] bg-[#0f1111] px-4 py-2 text-base font-bold text-white transition-colors hover:bg-black"
          >
            Ouvrir le panneau
          </a>
        )}
      </div>
    </div>
  );
}
