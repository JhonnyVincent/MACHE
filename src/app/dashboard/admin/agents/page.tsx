/*
  PAGE : les agents MACHÉ.

  Un agent est un CLIENT à qui s'ajoute une fonction — point de relais,
  livreur, commercial. Ce ne sont pas des administrateurs : ils
  achètent sur MACHÉ comme tout le monde, et rendent un service en
  plus.

  Cette page lisait l'ancien socle, dont le socle a été supprimé. Elle lit
  maintenant Medusa, et surtout elle AGIT : nommer, suspendre, retirer.
  Jusqu'ici il fallait passer par le panneau du backend et y fouiller
  les groupes de clients.

  Ce que la page rappelle, parce que c'est la raison d'être de tout ceci

  Le code d'un agent est ce qu'un client saisit sur `/verify-agent`
  avant de lui remettre de l'argent liquide. C'est la seule protection
  de cet échange, et elle ne vaut que si les codes sont distribués
  avec soin.
*/

import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/medusa/admin";
import { fetchAgents, AGENT_FUNCTIONS } from "@/lib/medusa/agents-admin";
import { reportOutage } from "@/lib/medusa/outage";
import { SubmitButton } from "@/components/submit-button";
import {
  makeAgentAction,
  suspendAgentAction,
  revokeAgentAction,
} from "./actions";

export const dynamic = "force-dynamic";

const inputClass =
  "mt-1 w-full rounded-[6px] border border-[#d5d9d9] bg-white px-3 py-2 text-base outline-none focus:border-[#0f1111]";

export default async function AdminAgentsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    error?: string;
    cree?: string;
    nom?: string;
    suspendu?: string;
    retire?: string;
  }>;
}) {
  const user = await getAdminUser();

  if (!user) redirect("/dashboard/admin/connexion");

  const query = searchParams ? await searchParams : {};

  const result = await fetchAgents();

  if (!result.ok) reportOutage("agents (administration)", result.reason);

  const agents = result.ok ? result.data : [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0f1111]">
          Agents
        </h1>
        <p className="mt-1 text-base text-[#565959]">
          Points de relais, livreurs et commerciaux. Ce sont des clients de
          MACHÉ à qui vous ajoutez une fonction.
        </p>
      </div>

      {query.cree && (
        /*
          Le code, montré une fois et en grand. C'est ce qu'il faut
          recopier sur la carte de l'agent — une valeur à transmettre
          qu'on n'affiche pas se perd.
        */
        <div className="rounded-[8px] border border-[#b7e0bf] bg-[#eaf6ec] px-4 py-4">
          <p className="text-base font-bold text-[#116b25]">
            {query.nom ? decodeURIComponent(query.nom) : "Agent"} est
            maintenant agent MACHÉ.
          </p>

          <p className="mt-2 text-sm text-[#116b25]">
            Son code de carte, à lui transmettre :
          </p>

          <p className="mt-1 font-mono text-2xl font-bold tracking-widest text-[#0f1111]">
            {decodeURIComponent(query.cree)}
          </p>

          <p className="mt-2 text-sm leading-relaxed text-[#116b25]">
            C&apos;est ce code qu&apos;un client saisira sur la page de
            vérification avant de lui remettre un colis ou de l&apos;argent.
            Notez-le : il ne sera plus affiché ici.
          </p>
        </div>
      )}

      {query.suspendu === "1" && (
        <div className="rounded-[8px] border border-[#f5d9a8] bg-[#fff8ed] px-4 py-3 text-base text-[#8a5a00]">
          Agent suspendu. La vérification publique répond désormais qu&apos;il
          ne faut rien lui remettre.
        </div>
      )}

      {query.suspendu === "0" && (
        <div className="rounded-[8px] border border-[#b7e0bf] bg-[#eaf6ec] px-4 py-3 text-base text-[#116b25]">
          Agent réactivé.
        </div>
      )}

      {query.retire && (
        <div className="rounded-[8px] border border-[#d5d9d9] bg-white px-4 py-3 text-base text-[#565959]">
          Fonction retirée. La personne reste cliente de MACHÉ ; son code ne
          vérifie plus rien.
        </div>
      )}

      {query.error && (
        <div className="rounded-[8px] border border-[#f2c2c8] bg-[#fdeaec] px-4 py-3 text-base text-[#b01124]">
          {decodeURIComponent(query.error)}
        </div>
      )}

      {!result.ok && (
        <div className="rounded-[8px] border border-[#f2c2c8] bg-[#fdeaec] px-4 py-3 text-base text-[#b01124]">
          La liste des agents ne peut pas être lue pour le moment.
        </div>
      )}

      {/* ---- Nommer ---------------------------------------------------- */}

      <div className="rounded-[8px] border border-[#d5d9d9] bg-white p-5">
        <h2 className="text-lg font-bold text-[#0f1111]">Nommer un agent</h2>

        <p className="mt-1 text-base leading-relaxed text-[#565959]">
          La personne doit déjà avoir un compte client sur MACHÉ. On
          n&apos;en crée pas à sa place : ce serait un compte dont elle ne
          connaîtrait pas le mot de passe.
        </p>

        <form action={makeAgentAction} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="email" className="text-sm font-semibold text-[#0f1111]">
                Adresse e-mail de son compte client
              </label>
              <input id="email" name="email" type="email" required className={inputClass} />
            </div>

            <div>
              <label htmlFor="function" className="text-sm font-semibold text-[#0f1111]">
                Fonction
              </label>
              <select id="function" name="function" required className={inputClass}>
                {AGENT_FUNCTIONS.map((entry) => (
                  <option key={entry.slug} value={entry.slug}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="zone" className="text-sm font-semibold text-[#0f1111]">
                Zone <span className="font-normal text-[#565959]">(facultatif)</span>
              </label>
              <input id="zone" name="zone" placeholder="Delmas 33" className={inputClass} />
            </div>

            <div>
              <label htmlFor="phone" className="text-sm font-semibold text-[#0f1111]">
                Téléphone public{" "}
                <span className="font-normal text-[#565959]">(facultatif)</span>
              </label>
              <input id="phone" name="phone" placeholder="+509 …" className={inputClass} />
              <p className="mt-1 text-xs text-[#565959]">
                Affiché à qui vérifie son code. Ne le renseignez qu&apos;avec
                son accord.
              </p>
            </div>
          </div>

          <SubmitButton
            className="rounded-[6px] bg-[#0f1111] px-5 py-2.5 text-base font-bold text-white transition-colors hover:bg-black"
            pendingLabel="Nomination en cours…"
          >
            Nommer cet agent
          </SubmitButton>
        </form>
      </div>

      {/* ---- La liste --------------------------------------------------- */}

      {agents.length === 0 ? (
        <div className="rounded-[8px] border border-[#d5d9d9] bg-white p-5">
          <p className="text-base font-semibold text-[#0f1111]">
            Aucun agent pour le moment.
          </p>
          <p className="mt-1 text-base text-[#565959]">
            Les agents apparaîtront ici dès la première nomination.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[8px] border border-[#d5d9d9] bg-white">
          <table className="w-full text-left text-base">
            <thead className="border-b border-[#d5d9d9] bg-[#f7f8f8] text-sm text-[#565959]">
              <tr>
                <th className="px-4 py-2.5 font-medium">Agent</th>
                <th className="px-4 py-2.5 font-medium">Fonction</th>
                <th className="px-4 py-2.5 font-medium">Code</th>
                <th className="px-4 py-2.5 font-medium">Zone</th>
                <th className="px-4 py-2.5 font-medium" />
              </tr>
            </thead>

            <tbody>
              {agents.map((agent) => (
                <tr
                  key={agent.customerId}
                  className="border-b border-[#eceef0] last:border-0"
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[#0f1111]">{agent.name}</p>
                    <p className="text-sm text-[#565959]">{agent.email}</p>
                  </td>

                  <td className="px-4 py-3 text-[#565959]">
                    {agent.functionLabel}
                    {agent.suspended && (
                      <span className="ml-2 rounded-full bg-[#fff8ed] px-2 py-0.5 text-sm font-semibold text-[#8a5a00]">
                        Suspendu
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3 font-mono text-sm text-[#0f1111]">
                    {agent.code ?? "—"}
                  </td>

                  <td className="px-4 py-3 text-[#565959]">
                    {agent.zone ?? "—"}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      <form action={suspendAgentAction}>
                        <input type="hidden" name="customer_id" value={agent.customerId} />
                        <input
                          type="hidden"
                          name="suspended"
                          value={agent.suspended ? "0" : "1"}
                        />
                        <button
                          type="submit"
                          className="whitespace-nowrap rounded-[6px] border border-[#d5d9d9] px-3 py-1.5 text-sm font-semibold text-[#565959] transition-colors hover:border-[#0f1111] hover:text-[#0f1111]"
                        >
                          {agent.suspended ? "Réactiver" : "Suspendre"}
                        </button>
                      </form>

                      <form action={revokeAgentAction}>
                        <input type="hidden" name="customer_id" value={agent.customerId} />
                        <input type="hidden" name="function" value={agent.functionSlug} />
                        <button
                          type="submit"
                          className="whitespace-nowrap rounded-[6px] border border-[#d5d9d9] px-3 py-1.5 text-sm font-semibold text-[#565959] transition-colors hover:border-[#b01124] hover:text-[#b01124]"
                        >
                          Retirer
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-[8px] border border-[#d5d9d9] bg-white p-4">
        <p className="text-base font-semibold text-[#0f1111]">
          Suspendre plutôt que retirer
        </p>
        <p className="mt-1 text-base leading-relaxed text-[#565959]">
          Un agent suspendu reste connu : la{" "}
          <Link href="/verify-agent" className="font-medium text-[#0f1111] underline">
            page de vérification
          </Link>{" "}
          répond alors qu&apos;il ne faut rien lui remettre. Un agent retiré
          devient « inconnu », ce qui se lit comme une faute de frappe et
          pousse le client à réessayer — alors que la bonne réponse est de
          ne rien remettre.
        </p>
      </div>
    </div>
  );
}
