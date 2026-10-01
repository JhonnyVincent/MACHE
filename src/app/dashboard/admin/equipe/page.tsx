/*
  PAGE : l'équipe.

  Une seule personne détient tout : le propriétaire. Il confie des tâches
  à des membres qui ont chacun leur espace :
  - Suivi des clients : messages, comptes professionnels, avis, clients bloqués ;
  - Site et mises à jour : apparence, textes, promotions, partenaires.

  Réservé au propriétaire (le backend refuse aux autres).
*/

import { redirect } from "next/navigation";
import { getAdminUser, fetchTeam } from "@/lib/medusa/admin";
import { reportOutage } from "@/lib/medusa/outage";
import { SubmitButton } from "@/components/submit-button";
import { STAFF_ROLE_HELP, STAFF_ROLE_LABELS } from "@/lib/staff";
import { createMemberAction, memberActionAction } from "./actions";

export const dynamic = "force-dynamic";

const inputClass =
  "w-full rounded-[6px] border border-[#d5d9d9] bg-white px-3 py-2 text-base outline-none focus:border-[#0f1111]";

export default async function AdminTeamPage({
  searchParams,
}: {
  searchParams?: Promise<{ erreur?: string; fait?: string }>;
}) {
  const user = await getAdminUser();

  if (!user) redirect("/dashboard/admin/connexion");
  if (user.role !== "owner") redirect("/dashboard/admin");

  const query = searchParams ? await searchParams : {};
  const result = await fetchTeam();

  if (!result.ok) reportOutage("équipe (administration)", result.reason);

  const team = result.ok ? result.data : [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0f1111]">Équipe</h1>
        <p className="mt-1 text-base text-[#565959]">
          Vous détenez tout. Vous pouvez confier des tâches à des membres, qui ont chacun leur espace et ne voient que
          ce qui les concerne.
        </p>
      </div>

      {query.erreur && <p role="alert" className="rounded-[8px] border border-[#f2c2c8] bg-[#fdeaec] px-4 py-3 text-base text-[#b01124]">{query.erreur}</p>}
      {query.fait && <p className="rounded-[8px] border border-[#b7dfc9] bg-[#f4fbf7] px-4 py-3 text-base text-[#046c4e]">{query.fait}</p>}

      <section className="rounded-[8px] border border-[#d5d9d9] bg-white p-4">
        <h2 className="text-lg font-bold">Ajouter un membre</h2>
        <form action={createMemberAction} className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold">Prénom
            <input name="first_name" required className={inputClass} />
          </label>
          <label className="text-sm font-semibold">Nom
            <input name="last_name" className={inputClass} />
          </label>
          <label className="text-sm font-semibold">E-mail
            <input name="email" type="email" required className={inputClass} />
          </label>
          <label className="text-sm font-semibold">Espace confié
            <select name="role" required defaultValue="" className={inputClass}>
              <option value="" disabled>Choisir…</option>
              <option value="support">{STAFF_ROLE_LABELS.support}</option>
              <option value="contenu">{STAFF_ROLE_LABELS.contenu}</option>
            </select>
          </label>
          <p className="text-sm text-[#565959] sm:col-span-2">
            <strong>{STAFF_ROLE_LABELS.support}</strong> : {STAFF_ROLE_HELP.support}
            <br />
            <strong>{STAFF_ROLE_LABELS.contenu}</strong> : {STAFF_ROLE_HELP.contenu}
            <br />
            Le membre reçoit un e-mail pour choisir son mot de passe. Vous ne le connaissez jamais.
          </p>
          <div className="sm:col-span-2">
            <SubmitButton pendingLabel="Création…" className="rounded-[6px] bg-[#0f1111] px-4 py-2 text-base font-bold text-white">
              Créer le membre
            </SubmitButton>
          </div>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Comptes</h2>
        {team.map((member) => (
          <div key={member.id} className="rounded-[8px] border border-[#d5d9d9] bg-white p-4">
            <p className="text-base font-bold">
              {[member.firstName, member.lastName].filter(Boolean).join(" ") || member.email}{" "}
              <span className="text-sm font-semibold text-[#565959]">· {STAFF_ROLE_LABELS[member.role]}</span>
            </p>
            <p className="text-sm text-[#565959]">{member.email}</p>

            {member.role !== "owner" && (
              <div className="mt-3 flex flex-wrap gap-2">
                <form action={memberActionAction} className="flex gap-2">
                  <input type="hidden" name="id" value={member.id} />
                  <input type="hidden" name="action" value="role" />
                  <select name="role" defaultValue={member.role} className={`${inputClass} w-56`}>
                    <option value="support">{STAFF_ROLE_LABELS.support}</option>
                    <option value="contenu">{STAFF_ROLE_LABELS.contenu}</option>
                  </select>
                  <SubmitButton pendingLabel="…" className="rounded-[6px] border border-[#d5d9d9] px-3 py-1.5 text-sm font-bold">
                    Changer
                  </SubmitButton>
                </form>
                <form action={memberActionAction}>
                  <input type="hidden" name="id" value={member.id} />
                  <input type="hidden" name="action" value="remove" />
                  <SubmitButton pendingLabel="…" className="rounded-[6px] bg-[#b12704] px-3 py-1.5 text-sm font-bold text-white">
                    Retirer
                  </SubmitButton>
                </form>
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
