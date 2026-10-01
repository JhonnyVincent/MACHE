/*
  PAGE : les comptes professionnels.

  Un hôtel, une école, une entreprise demande un compte professionnel
  pour voir les grossistes et leur demander des devis, sans vendre sur
  MACHE. C'est ici que MACHE accorde ou refuse.

  Les demandes en attente d'abord, les plus anciennes en tête. L'accord
  est une appartenance à un groupe que seule l'administration modifie ;
  la demande, elle, est écrite par le client (voir
  backend/packages/api/src/lib/pro-buyers.ts).

  Ce qu'il faut regarder avant d'accorder : l'organisation existe-t-elle,
  la ville et le téléphone sont-ils plausibles, le message est-il
  cohérent. Un doute : appeler le numéro indiqué.
*/

import { redirect } from "next/navigation";
import { getAdminUser, fetchPros } from "@/lib/medusa/admin";
import { reportOutage } from "@/lib/medusa/outage";
import { SubmitButton } from "@/components/submit-button";
import { proDecisionAction } from "./actions";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  hotel: "Hôtel",
  restaurant: "Restaurant",
  ecole: "École",
  entreprise: "Entreprise",
  ong: "ONG / association",
  commerce: "Commerce",
  autre: "Autre",
};

const inputClass =
  "w-full rounded-[6px] border border-[#d5d9d9] bg-white px-3 py-2 text-base outline-none focus:border-[#0f1111]";

function formatDate(value: string | null): string {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminProsPage({
  searchParams,
}: {
  searchParams?: Promise<{ erreur?: string; fait?: string }>;
}) {
  const user = await getAdminUser();

  if (!user) redirect("/dashboard/admin/connexion");

  const query = searchParams ? await searchParams : {};

  const result = await fetchPros();

  if (!result.ok) reportOutage("comptes professionnels (administration)", result.reason);

  const pros = result.ok ? result.data.pros : [];
  const groupReady = result.ok ? result.data.groupReady : true;

  const pending = pros.filter((pro) => pro.status === "pending");
  const approved = pros.filter((pro) => pro.status === "approved");
  const refused = pros.filter((pro) => pro.status === "refused");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0f1111]">Comptes professionnels</h1>
        <p className="mt-1 text-base text-[#565959]">
          Hôtels, écoles, restaurants, entreprises : une fois validés, ils voient les grossistes et peuvent leur
          demander des devis, sans vendre sur MACHE. Les vendeurs y ont accès d&apos;office.
        </p>
      </div>

      {query.fait === "approve" && (
        <div className="rounded-[8px] border border-[#b7e0bf] bg-[#eaf6ec] px-4 py-3 text-base text-[#116b25]">
          Compte professionnel accordé. Le client est prévenu par e-mail.
        </div>
      )}
      {query.fait === "refuse" && (
        <div className="rounded-[8px] border border-[#f5d9a8] bg-[#fff8ed] px-4 py-3 text-base text-[#8a5a00]">
          Demande refusée. Le motif est envoyé au client par e-mail.
        </div>
      )}
      {query.fait === "revoke" && (
        <div className="rounded-[8px] border border-[#d5d9d9] bg-white px-4 py-3 text-base text-[#565959]">
          Compte professionnel retiré. La personne reste cliente de MACHE.
        </div>
      )}
      {query.erreur && (
        <div className="rounded-[8px] border border-[#f2c2c8] bg-[#fdeaec] px-4 py-3 text-base text-[#b01124]">
          {query.erreur}
        </div>
      )}
      {!result.ok && (
        <div className="rounded-[8px] border border-[#f2c2c8] bg-[#fdeaec] px-4 py-3 text-base text-[#b01124]">
          La liste ne peut pas être lue pour le moment.
        </div>
      )}
      {!groupReady && (
        <div className="rounded-[8px] border border-[#f5d9a8] bg-[#fff8ed] px-4 py-3 text-base text-[#8a5a00]">
          Le groupe des acheteurs professionnels n&apos;existe pas encore : il est créé au démarrage du backend.
          Redémarrez-le (Render → Manual Deploy), puis revenez ici.
        </div>
      )}

      {/* ---- À décider ----------------------------------------------- */}
      <section>
        <h2 className="text-lg font-bold text-[#0f1111]">
          À décider{pending.length > 0 ? ` (${pending.length})` : ""}
        </h2>

        {pending.length === 0 ? (
          <p className="mt-2 rounded-[8px] border border-[#d5d9d9] bg-white p-5 text-base text-[#565959]">
            Aucune demande en attente.
          </p>
        ) : (
          <ul className="mt-2 space-y-3">
            {pending.map((pro) => (
              <li key={pro.id} className="rounded-[8px] border border-[#d5d9d9] bg-white p-4">
                <p className="text-base font-bold text-[#0f1111]">
                  {pro.organisation ?? "—"}{" "}
                  <span className="font-normal text-[#565959]">
                    · {pro.type ? (TYPE_LABELS[pro.type] ?? pro.type) : "—"} · {pro.city ?? "—"}
                  </span>
                </p>

                <p className="mt-1 text-sm text-[#565959]">
                  {pro.name || "—"} — {pro.email} — {pro.phone ?? "pas de téléphone"} — demande du{" "}
                  {formatDate(pro.requestedAt)}
                </p>

                {pro.note && (
                  <p className="mt-2 rounded-[6px] bg-[#f7f8f8] px-3 py-2 text-sm text-[#0f1111]">{pro.note}</p>
                )}

                <div className="mt-3 flex flex-wrap items-start gap-3">
                  <form action={proDecisionAction}>
                    <input type="hidden" name="customer_id" value={pro.id} />
                    <input type="hidden" name="action" value="approve" />
                    <SubmitButton
                      pendingLabel="…"
                      className="rounded-[6px] bg-[#0f1111] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-black"
                    >
                      Accorder
                    </SubmitButton>
                  </form>

                  <form action={proDecisionAction} className="flex min-w-[260px] flex-1 flex-wrap items-center gap-2">
                    <input type="hidden" name="customer_id" value={pro.id} />
                    <input type="hidden" name="action" value="refuse" />
                    <input
                      name="reason"
                      required
                      minLength={3}
                      maxLength={500}
                      placeholder="Motif du refus (envoyé au client)"
                      className={`${inputClass} flex-1`}
                    />
                    <SubmitButton
                      pendingLabel="…"
                      className="rounded-[6px] border border-[#b01124] px-4 py-2 text-sm font-bold text-[#b01124] transition-colors hover:bg-[#fdeaec]"
                    >
                      Refuser
                    </SubmitButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---- Comptes actifs ------------------------------------------ */}
      <section>
        <h2 className="text-lg font-bold text-[#0f1111]">Comptes actifs ({approved.length})</h2>

        {approved.length === 0 ? (
          <p className="mt-2 rounded-[8px] border border-[#d5d9d9] bg-white p-5 text-base text-[#565959]">
            Aucun compte professionnel actif.
          </p>
        ) : (
          <div className="mt-2 overflow-hidden rounded-[8px] border border-[#d5d9d9] bg-white">
            <table className="w-full text-left text-base">
              <thead className="border-b border-[#d5d9d9] bg-[#f7f8f8] text-sm text-[#565959]">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Organisation</th>
                  <th className="px-4 py-2.5 font-medium">Contact</th>
                  <th className="px-4 py-2.5 font-medium" />
                </tr>
              </thead>
              <tbody>
                {approved.map((pro) => (
                  <tr key={pro.id} className="border-b border-[#eceef0] last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[#0f1111]">{pro.organisation ?? pro.name}</p>
                      <p className="text-sm text-[#565959]">
                        {pro.type ? (TYPE_LABELS[pro.type] ?? pro.type) : ""} {pro.city ? `· ${pro.city}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#565959]">
                      {pro.email}
                      <br />
                      {pro.phone ?? ""}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form action={proDecisionAction}>
                        <input type="hidden" name="customer_id" value={pro.id} />
                        <input type="hidden" name="action" value="revoke" />
                        <button
                          type="submit"
                          className="whitespace-nowrap rounded-[6px] border border-[#d5d9d9] px-3 py-1.5 text-sm font-semibold text-[#565959] transition-colors hover:border-[#b01124] hover:text-[#b01124]"
                        >
                          Retirer
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {refused.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-[#0f1111]">Refusées ou retirées ({refused.length})</h2>
          <ul className="mt-2 space-y-2">
            {refused.map((pro) => (
              <li key={pro.id} className="rounded-[8px] border border-[#d5d9d9] bg-white px-4 py-3 text-sm text-[#565959]">
                <span className="font-semibold text-[#0f1111]">{pro.organisation ?? pro.name}</span> — {pro.email}
                {pro.refusedReason ? ` — « ${pro.refusedReason} »` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
