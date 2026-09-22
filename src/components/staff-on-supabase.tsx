/*
  Écran d'un espace interne resté sur Supabase.

  Les agents, les partenaires et les blocs de contenu sont propres à
  MACHÉ : Medusa n'en a pas la notion, et leurs comptes vivaient dans
  Supabase. Le projet Supabase ayant été supprimé, ces écrans n'ont plus
  de données à lire.

  Ils ne sont pas retirés pour autant. Une page qui disparaît fait
  croire que la fonctionnalité n'a jamais existé ; celle-ci dit ce qui
  manque, et que la décision de rebrancher Supabase appartient à
  l'exploitant.

  Cet écran s'adresse à qui exploite MACHÉ, pas à un client : ces
  adresses ne sont pas publiques, et il peut donc nommer les variables.
*/

import Link from "next/link";
import { missingSupabaseEnvMessage } from "@/lib/supabase/env";

export function StaffOnSupabase({
  area,
  what,
}: {
  area: string;
  what: string;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0f1111]">
          {area}
        </h1>
        <p className="mt-1 text-base text-[#565959]">
          Hors service tant que Supabase n&apos;est pas rebranché.
        </p>
      </div>

      <div className="rounded-[8px] border border-[#d5d9d9] bg-white p-5">
        <p className="text-base leading-relaxed text-[#565959]">{what}</p>

        <p className="mt-3 text-base leading-relaxed text-[#565959]">
          Ces données vivaient dans Supabase. Medusa n&apos;a pas la notion
          d&apos;agent ni de partenaire : ce sont des rôles propres à MACHÉ.
          Rebrancher un projet Supabase rend cet écran à son état
          d&apos;origine ; les données de l&apos;ancien projet, elles, ont
          disparu avec lui.
        </p>

        <p className="mt-4 rounded-[6px] bg-[#f7f8f8] p-3 text-sm leading-relaxed text-[#0f1111]">
          {missingSupabaseEnvMessage("serveur")}
        </p>

        <p className="mt-4 text-base leading-relaxed text-[#565959]">
          Le reste de l&apos;administration ne dépend pas de Supabase :
          boutiques, commandes, vendeurs et clients viennent du backend
          commerce.
        </p>

        <Link
          href="/dashboard/admin"
          className="mt-4 inline-block rounded-[6px] bg-[#0f1111] px-4 py-2 text-base font-bold text-white transition-colors hover:bg-black"
        >
          Retour à la vue d&apos;ensemble
        </Link>
      </div>
    </div>
  );
}
