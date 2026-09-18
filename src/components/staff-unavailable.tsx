/*
  Écran des espaces internes quand Supabase n'est pas configuré.

  Les espaces d'administration, d'agent et de partenaire lisent leurs
  comptes et leurs rôles dans Supabase. Sans les variables
  correspondantes, ils levaient une erreur et le navigateur affichait une
  page d'erreur 500 : un écran blanc, sans rien dire de ce qui manque.

  Cet écran s'adresse à qui exploite MACHÉ, pas à un client : ces adresses
  ne sont pas publiques. Il nomme donc les variables, ce que les pages du
  site ne font jamais.
*/

import Link from "next/link";
import { missingSupabaseEnvMessage } from "@/lib/supabase/env";

export function StaffUnavailable({ area }: { area: string }) {
  return (
    <main className="container-page py-12">
      <div className="mx-auto max-w-xl rounded-[10px] border border-[var(--mache-line)] bg-white p-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--mache-text)]">
          {area} : configuration incomplète
        </h1>

        <p className="mt-2 text-base leading-relaxed text-[var(--mache-muted)]">
          Cet espace lit les comptes et les rôles internes de MACHÉ dans
          Supabase. Tant que la connexion n&apos;est pas renseignée, il ne
          peut rien afficher — et il vaut mieux le dire que montrer des
          écrans vides.
        </p>

        <p className="mt-4 rounded-[6px] bg-[var(--mache-bg)] p-3 text-sm leading-relaxed text-[var(--mache-text)]">
          {missingSupabaseEnvMessage("serveur")}
        </p>

        <p className="mt-4 text-sm leading-relaxed text-[var(--mache-muted)]">
          Le catalogue, les commandes et les vendeurs ne dépendent pas de
          Supabase : ils viennent du backend commerce, et le reste du site
          fonctionne sans cette configuration.
        </p>

        <Link
          href="/"
          className="mt-5 inline-block rounded-[6px] bg-[var(--mache-text)] px-4 py-2 text-base font-bold text-white hover:bg-black"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
