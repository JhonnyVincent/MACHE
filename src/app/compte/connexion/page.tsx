/*
  PAGE : connexion client

  Distincte de /login, qui sert au personnel MACHÉ — administration,
  agents, partenaires — sur les anciens rôles. Un client achète ; il n'a
  aucune raison de passer par la même porte qu'un administrateur, ni de
  voir un formulaire qui parle de rôles.
*/

import Link from "next/link";
import { SubmitButton } from "@/components/submit-button";
import { redirect } from "next/navigation";
import { getCustomer } from "@/lib/medusa/customer";
import { loginAction } from "../actions";

export const dynamic = "force-dynamic";

const inputClass =
  "mt-1 w-full rounded-[6px] border border-[var(--mache-line)] bg-white px-3 py-2.5 text-md outline-none focus:border-[var(--mache-primary)]";

export default async function CustomerLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; next?: string }>;
}) {
  const query = searchParams ? await searchParams : {};

  const customer = await getCustomer();

  if (customer) redirect("/dashboard/buyer");

  return (
    <main className="mx-auto w-full max-w-md px-4 py-12 sm:py-16">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--mache-text)]">
        Se connecter
      </h1>
      <p className="mt-2 text-md text-[var(--mache-muted)]">
        Pour retrouver vos commandes et vos adresses.
      </p>

      {query.error && (
        <div className="mt-4 rounded-[8px] border border-[#f2c2c8] bg-[#fdeaec] px-4 py-3 text-base text-[#b01124]">
          {decodeURIComponent(query.error)}
        </div>
      )}

      <form action={loginAction} className="mt-6 space-y-4">
        <input type="hidden" name="next" value={query.next || "/dashboard/buyer"} />

        <div>
          <label htmlFor="email" className="text-sm font-semibold text-[var(--mache-text)]">
            Adresse e-mail
          </label>
          <input id="email" name="email" type="email" required autoComplete="email" className={inputClass} />
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-semibold text-[var(--mache-text)]">
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className={inputClass}
          />
        </div>

        <SubmitButton
          className="w-full rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-md font-bold text-white transition-colors hover:bg-[var(--mache-primary-dark)]"
          pendingLabel="Connexion en cours…"
          pendingHint="Le backend commerce peut être en veille et mettre jusqu'à une minute à répondre. Ne quittez pas la page."
        >
          Se connecter
        </SubmitButton>
      </form>

      <p className="mt-5 text-base text-[var(--mache-muted)]">
        Pas encore de compte ?{" "}
        <Link href="/compte/inscription" className="font-semibold text-[var(--mache-primary)] hover:underline">
          Créer un compte
        </Link>
      </p>

      <p className="mt-6 border-t border-[var(--mache-line)] pt-4 text-sm leading-relaxed text-[var(--mache-muted)]">
        Vous vendez sur MACHÉ ?{" "}
        <Link
          href="/dashboard/seller/connexion"
          className="font-semibold hover:underline"
        >
          Connexion vendeur
        </Link>
        . Vous faites partie de l&apos;équipe MACHÉ ?{" "}
        <Link href="/dashboard/admin/connexion" className="font-semibold hover:underline">
          Connexion personnel
        </Link>
        .
      </p>
    </main>
  );
}
