/*
  PAGE : les partenaires de services.

  Les demandes à examiner d'abord, puis les partenaires publics, suspendus
  et exclus. L'équipe peut en ajouter, corriger une fiche, approuver,
  suspendre (réversible), exclure ou supprimer. Suspendre et exclure
  demandent un motif.
*/

import { redirect } from "next/navigation";
import { getAdminUser, fetchAdminPartners, type AdminPartner } from "@/lib/medusa/admin";
import { reportOutage } from "@/lib/medusa/outage";
import { SubmitButton } from "@/components/submit-button";
import { PARTNER_CATEGORIES } from "@/lib/partner-categories";
import { partnerActionAction, createPartnerAction } from "./actions";

export const dynamic = "force-dynamic";

const inputClass =
  "w-full rounded-[6px] border border-[#d5d9d9] bg-white px-3 py-2 text-base outline-none focus:border-[#0f1111]";

const STATUS_LABELS: Record<AdminPartner["status"], string> = {
  pending: "À examiner",
  approved: "Public",
  suspended: "Suspendu",
  banned: "Exclu",
};

function Fields({ partner }: { partner?: AdminPartner }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-semibold">Nom
        <input name="name" required defaultValue={partner?.name} className={inputClass} />
      </label>
      <label className="text-sm font-semibold">Catégorie
        <select name="category" required defaultValue={partner?.category ?? ""} className={inputClass}>
          <option value="" disabled>Choisir…</option>
          {PARTNER_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
        </select>
      </label>
      <label className="text-sm font-semibold sm:col-span-2">Présentation
        <textarea name="description" rows={3} defaultValue={partner?.description ?? ""} className={inputClass} />
      </label>
      <label className="text-sm font-semibold">Adresse / ville
        <input name="location" defaultValue={partner?.location ?? ""} className={inputClass} />
      </label>
      <label className="text-sm font-semibold">WhatsApp
        <input name="whatsapp" defaultValue={partner?.whatsapp ?? ""} className={inputClass} />
      </label>
      <label className="text-sm font-semibold">Téléphone
        <input name="phone" defaultValue={partner?.phone ?? ""} className={inputClass} />
      </label>
      <label className="text-sm font-semibold">Site web
        <input name="website" defaultValue={partner?.website ?? ""} className={inputClass} />
      </label>
      <label className="text-sm font-semibold">Facebook
        <input name="facebook" defaultValue={partner?.facebook ?? ""} className={inputClass} />
      </label>
      <label className="text-sm font-semibold">Instagram
        <input name="instagram" defaultValue={partner?.instagram ?? ""} className={inputClass} />
      </label>
      <label className="text-sm font-semibold">Logo (adresse de l&apos;image)
        <input name="logo" defaultValue={partner?.logo ?? ""} className={inputClass} />
      </label>
      <label className="text-sm font-semibold">Bannière (adresse de l&apos;image)
        <input name="banner" defaultValue={partner?.banner ?? ""} className={inputClass} />
      </label>
      <label className="text-sm font-semibold">Nom du contact (non publié)
        <input name="contact_name" defaultValue={partner?.contactName ?? ""} className={inputClass} />
      </label>
      <label className="text-sm font-semibold">E-mail du contact (non publié)
        <input name="contact_email" type="email" required defaultValue={partner?.contactEmail} className={inputClass} />
      </label>
    </div>
  );
}

function ActionButtons({ partner }: { partner: AdminPartner }) {
  const hidden = (action: string) => (
    <>
      <input type="hidden" name="id" value={partner.id} />
      <input type="hidden" name="action" value={action} />
    </>
  );

  return (
    <div className="mt-3 flex flex-wrap items-start gap-2">
      {partner.status !== "approved" && (
        <form action={partnerActionAction}>
          {hidden("approve")}
          <SubmitButton pendingLabel="…" className="rounded-[6px] bg-[#067d62] px-3 py-1.5 text-sm font-bold text-white">
            {partner.status === "pending" ? "Approuver" : "Rétablir"}
          </SubmitButton>
        </form>
      )}

      {partner.status === "approved" && (
        <form action={partnerActionAction} className="flex gap-2">
          {hidden("suspend")}
          <input name="reason" required minLength={3} placeholder="Motif" className={`${inputClass} w-44`} />
          <SubmitButton pendingLabel="…" className="rounded-[6px] bg-[#b26b00] px-3 py-1.5 text-sm font-bold text-white">
            Suspendre
          </SubmitButton>
        </form>
      )}

      {partner.status !== "banned" && (
        <form action={partnerActionAction} className="flex gap-2">
          {hidden("ban")}
          <input name="reason" required minLength={3} placeholder="Motif" className={`${inputClass} w-44`} />
          <SubmitButton pendingLabel="…" className="rounded-[6px] bg-[#b12704] px-3 py-1.5 text-sm font-bold text-white">
            Exclure
          </SubmitButton>
        </form>
      )}

      {partner.status !== "banned" && (
        <form action={partnerActionAction}>
          {hidden("delete")}
          <SubmitButton pendingLabel="…" className="rounded-[6px] border border-[#d5d9d9] px-3 py-1.5 text-sm font-bold">
            Supprimer
          </SubmitButton>
        </form>
      )}
    </div>
  );
}

export default async function AdminPartnersPage({
  searchParams,
}: {
  searchParams?: Promise<{ erreur?: string; fait?: string }>;
}) {
  const user = await getAdminUser();

  if (!user) redirect("/dashboard/admin/connexion");

  const query = searchParams ? await searchParams : {};
  const result = await fetchAdminPartners();

  if (!result.ok) reportOutage("partenaires (administration)", result.reason);

  const partners = result.ok ? result.data : [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0f1111]">Partenaires de services</h1>
        <p className="mt-1 text-base text-[#565959]">
          Photographes, financement, graphisme… Ils s&apos;inscrivent seuls (à examiner) ou vous les ajoutez ici.
          Rien n&apos;est public avant l&apos;approbation.
        </p>
      </div>

      {query.erreur && <p role="alert" className="rounded-[8px] border border-[#f2c2c8] bg-[#fdeaec] px-4 py-3 text-base text-[#b01124]">{query.erreur}</p>}
      {query.fait && <p className="rounded-[8px] border border-[#b7dfc9] bg-[#f4fbf7] px-4 py-3 text-base text-[#046c4e]">{query.fait}</p>}

      <details className="rounded-[8px] border border-[#d5d9d9] bg-white p-4">
        <summary className="cursor-pointer text-base font-bold">+ Ajouter un partenaire</summary>
        <form action={createPartnerAction} className="mt-4 space-y-3">
          <Fields />
          <SubmitButton pendingLabel="Ajout…" className="rounded-[6px] bg-[#0f1111] px-4 py-2 text-base font-bold text-white">
            Ajouter (public tout de suite)
          </SubmitButton>
        </form>
      </details>

      {partners.length === 0 ? (
        <p className="rounded-[8px] border border-[#d5d9d9] bg-white p-4 text-base text-[#565959]">Aucun partenaire pour l&apos;instant.</p>
      ) : (
        <ul className="space-y-3">
          {partners.map((partner) => (
            <li key={partner.id} className="rounded-[8px] border border-[#d5d9d9] bg-white p-4">
              <p className="text-lg font-bold text-[#0f1111]">
                {partner.name}{" "}
                <span className="text-sm font-semibold text-[#565959]">
                  · {partner.category} · {STATUS_LABELS[partner.status]} · {partner.source === "self" ? "inscrit seul" : "ajouté par l'équipe"}
                </span>
              </p>
              <p className="mt-1 text-sm text-[#565959]">
                {partner.contactName ?? "—"} — {partner.contactEmail}
                {partner.location ? ` — ${partner.location}` : ""}
              </p>
              {partner.statusReason && <p className="mt-1 text-sm text-[#b12704]">Motif : {partner.statusReason}</p>}
              {partner.description && <p className="mt-2 text-base text-[#0f1111]">{partner.description}</p>}

              <ActionButtons partner={partner} />

              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-semibold text-[#007185]">Modifier la fiche</summary>
                <form action={partnerActionAction} className="mt-3 space-y-3">
                  <input type="hidden" name="id" value={partner.id} />
                  <input type="hidden" name="action" value="update" />
                  <Fields partner={partner} />
                  <SubmitButton pendingLabel="…" className="rounded-[6px] bg-[#0f1111] px-4 py-2 text-base font-bold text-white">
                    Enregistrer
                  </SubmitButton>
                </form>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
