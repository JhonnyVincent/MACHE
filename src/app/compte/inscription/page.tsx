/*
  PAGE : création d'un compte client
*/

import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomer } from "@/lib/medusa/customer";
import { registerAction } from "../actions";

export const dynamic = "force-dynamic";

const inputClass =
  "mt-1 w-full rounded-[6px] border border-[var(--mache-line)] bg-white px-3 py-2.5 text-md outline-none focus:border-[var(--mache-primary)]";

export default async function CustomerRegisterPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const query = searchParams ? await searchParams : {};

  const customer = await getCustomer();

  if (customer) redirect("/dashboard/buyer");

  return (
    <main className="mx-auto w-full max-w-md px-4 py-12 sm:py-16">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--mache-text)]">
        Créer un compte
      </h1>
      <p className="mt-2 text-md text-[var(--mache-muted)]">
        Pour suivre vos commandes et garder vos adresses.
      </p>

      {query.error && (
        <div className="mt-4 rounded-[8px] border border-[#f2c2c8] bg-[#fdeaec] px-4 py-3 text-base text-[#b01124]">
          {decodeURIComponent(query.error)}
        </div>
      )}

      <form action={registerAction} className="mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="first_name" className="text-sm font-semibold text-[var(--mache-text)]">
              Prénom
            </label>
            <input id="first_name" name="first_name" required autoComplete="given-name" className={inputClass} />
          </div>

          <div>
            <label htmlFor="last_name" className="text-sm font-semibold text-[var(--mache-text)]">
              Nom
            </label>
            <input id="last_name" name="last_name" required autoComplete="family-name" className={inputClass} />
          </div>
        </div>

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
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-[var(--mache-muted)]">
            Au moins 8 caractères.
          </p>
        </div>

        <button
          type="submit"
          className="w-full rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-md font-bold text-white transition-colors hover:bg-[var(--mache-primary-dark)]"
        >
          Créer mon compte
        </button>
      </form>

      <p className="mt-5 text-base text-[var(--mache-muted)]">
        Vous avez déjà un compte ?{" "}
        <Link href="/compte/connexion" className="font-semibold text-[var(--mache-primary)] hover:underline">
          Se connecter
        </Link>
      </p>
    </main>
  );
}
