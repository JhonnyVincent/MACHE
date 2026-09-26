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

import { Link } from "next-view-transitions";
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
import { suspendSellerAction, restoreSellerAction } from "./suspend-action";
import { setVerifiedAction } from "./verify-action";

export const dynamic = "force-dynamic";

export default async function AdminStoresPage({
  searchParams,
}: {
  searchParams?: Promise<{
    error?: string;
    approuvee?: string;
    verifiee?: string;
    fait?: string;
    erreur?: string;
    suspendre?: string;
  }>;
}) {
  const query = searchParams ? await searchParams : {};

  const user = await getAdminUser();

  if (!user) redirect("/dashboard/admin/connexion");

  const result = await fetchSellers();

  if (!result.ok) reportOutage("boutiques (administration)", result.reason);

  const sellers = result.ok ? result.data : [];

  /*
    La boutique visée par le formulaire de suspension, s'il est ouvert.
    On la relit dans la liste plutôt que de se fier au paramètre : une
    adresse fabriquée à la main ne doit pas afficher un formulaire de
    suspension au nom d'un identifiant inventé.
  */
  const suspendTarget = query.suspendre
    ? sellers.find((seller) => seller.id === query.suspendre) ?? null
    : null;

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

      {query.verifiee === "1" && (
        <div className="rounded-[8px] border border-[#b7e0bf] bg-[#eaf6ec] px-4 py-3 text-base text-[#116b25]">
          Boutique vérifiée. Le badge apparaît désormais sur sa page et
          sur ses fiches produit.
        </div>
      )}

      {query.verifiee === "0" && (
        <div className="rounded-[8px] border border-[#d5d9d9] bg-white px-4 py-3 text-base text-[#565959]">
          Vérification retirée. Le badge n&apos;apparaît plus.
        </div>
      )}

      {query.approuvee && (
        <div className="rounded-[8px] border border-[#b7e0bf] bg-[#eaf6ec] px-4 py-3 text-base text-[#116b25]">
          Boutique approuvée. Ses produits entrent dans le catalogue.
        </div>
      )}

      {query.fait && (
        <div className="rounded-[8px] border border-[#b7e0bf] bg-[#eaf6ec] px-4 py-3 text-base text-[#116b25]">
          {query.fait}
        </div>
      )}

      {query.erreur && (
        <div className="rounded-[8px] border border-[#f2c2c8] bg-[#fdeaec] px-4 py-3 text-base text-[#b01124]">
          {query.erreur}
        </div>
      )}

      {query.error && (
        <div className="rounded-[8px] border border-[#f2c2c8] bg-[#fdeaec] px-4 py-3 text-base text-[#b01124]">
          {decodeURIComponent(query.error)}
        </div>
      )}

      {/*
        Le formulaire de suspension, ouvert depuis la ligne d'une
        boutique. Il n'est pas une boîte de confirmation « êtes-vous
        sûr ? » — celles-là se cliquent sans lire. Il demande un motif,
        ce qui oblige à formuler la raison, et affiche ce que la
        décision fait et ne fait pas.
      */}
      {suspendTarget && (
        <div className="rounded-[10px] border-2 border-[#b01124] bg-white p-5">
          <h2 className="text-lg font-black text-[#0f1111]">
            Suspendre « {suspendTarget.name} »
          </h2>

          <p className="mt-2 text-base leading-relaxed text-[#565959]">
            La boutique disparaît du site et ne peut plus vendre. Ses
            commandes passées et les commissions qu&apos;elle doit à MACHÉ
            sont conservées — rien n&apos;est supprimé, et la décision se
            revient.
          </p>

          <form action={suspendSellerAction} className="mt-4 space-y-3">
            <input type="hidden" name="seller_id" value={suspendTarget.id} />

            <div>
              <label
                htmlFor="reason"
                className="block text-sm font-semibold text-[#0f1111]"
              >
                Pourquoi ?
              </label>
              <textarea
                id="reason"
                name="reason"
                required
                minLength={5}
                rows={3}
                className="mt-1 w-full rounded-[3px] border border-[#8d9096] px-2.5 py-1.5 text-sm outline-none focus:border-[#d2162c]"
              />
              <p className="mt-1 text-xs leading-snug text-[#767676]">
                Le motif est enregistré. Dans six mois, une suspension sans
                raison écrite est indéfendable si le vendeur la conteste.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                name="mode"
                value="suspend"
                className="rounded-[6px] bg-[#b01124] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#8a0d1c]"
              >
                Suspendre
              </button>

              {/*
                Deux boutons distincts, jamais un menu déroulant : on ne
                résilie pas en croyant suspendre.
              */}
              <button
                type="submit"
                name="mode"
                value="terminate"
                className="rounded-[6px] border border-[#b01124] bg-white px-4 py-2 text-sm font-bold text-[#b01124] transition-colors hover:bg-[#fdeaec]"
              >
                Résilier définitivement
              </button>

              <Link
                href="/dashboard/admin/stores"
                className="px-2 text-sm text-[#565959] underline"
              >
                Annuler
              </Link>
            </div>
          </form>
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
                <th className="px-4 py-2.5 font-medium">Vérifiée</th>
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

                    {/*
                      La vérification, séparée de l'état. Une boutique
                      peut vendre sans être vérifiée ; l'inverse
                      n'aurait pas de sens.
                    */}
                    <td className="px-4 py-3">
                      <form action={setVerifiedAction}>
                        <input type="hidden" name="seller_id" value={seller.id} />
                        <input
                          type="hidden"
                          name="verified"
                          value={seller.verified ? "0" : "1"}
                        />
                        <button
                          type="submit"
                          className={`whitespace-nowrap rounded-full px-2.5 py-1 text-sm font-semibold transition-colors ${
                            seller.verified
                              ? "bg-[#eaf6ec] text-[#116b25] hover:bg-[#d8eedd]"
                              : "border border-[#d5d9d9] text-[#565959] hover:border-[#0f1111] hover:text-[#0f1111]"
                          }`}
                          title={
                            seller.verified
                              ? "Retirer la vérification"
                              : "Marquer comme vérifiée après contrôle des documents"
                          }
                        >
                          {seller.verified ? "✓ Vérifiée" : "Non vérifiée"}
                        </button>
                      </form>
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
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
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

                        {/*
                          Rétablir une boutique ne demande pas de motif :
                          on ne se justifie pas de lever une sanction.
                        */}
                        {(seller.status === "suspended" ||
                          seller.status === "terminated") && (
                          <form action={restoreSellerAction}>
                            <input type="hidden" name="seller_id" value={seller.id} />
                            <input
                              type="hidden"
                              name="mode"
                              value={seller.status === "terminated" ? "terminate" : "suspend"}
                            />
                            <button
                              type="submit"
                              className="whitespace-nowrap rounded-[6px] border border-[#8d9096] bg-white px-3 py-1.5 text-sm font-medium text-[#0f1111] transition-colors hover:bg-[#f7f8f8]"
                            >
                              Rétablir
                            </button>
                          </form>
                        )}

                        {/*
                          Le lien ouvre le formulaire de motif plutôt
                          que de suspendre au clic. Suspendre une
                          boutique coupe les revenus de quelqu'un : ça
                          ne doit pas tenir à un bouton qu'on effleure.
                        */}
                        {seller.status !== "suspended" &&
                          seller.status !== "terminated" && (
                            <Link
                              href={`/dashboard/admin/stores?suspendre=${encodeURIComponent(seller.id)}`}
                              className="whitespace-nowrap rounded-[6px] border border-[#d5d9d9] px-3 py-1.5 text-sm font-medium text-[#565959] transition-colors hover:border-[#b01124] hover:text-[#b01124]"
                            >
                              Suspendre
                            </Link>
                          )}
                      </div>
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
          Approuver et vérifier sont deux décisions distinctes :
          approuver ouvre la boutique à la vente, vérifier affirme aux
          acheteurs que vous avez contrôlé les documents de
          l&apos;entreprise. Une boutique peut vendre sans être vérifiée.
          <br />
          <br />
          Suspendre et résilier se font ici aussi, avec un motif obligatoire.
          Ni l&apos;un ni l&apos;autre ne supprime quoi que ce soit : les
          commandes passées et les commissions dues à MACHÉ sont conservées.
          Supprimer une boutique les emporterait avec elle.
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
