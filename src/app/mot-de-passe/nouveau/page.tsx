/*
  PAGE : choisir un nouveau mot de passe.

  On y arrive depuis le lien de l'e-mail, qui porte le jeton. Le jeton
  seul donne le droit de changer le mot de passe : il est valable
  15 minutes et ne sert qu'une fois, garanti par Medusa.

  La page n'est pas indexée, et ne charge rien d'un autre site : le
  jeton est dans l'adresse, et une adresse se transmet aux sites
  qu'une page sollicite.
*/

import Link from "next/link";
import { SubmitButton } from "@/components/submit-button";
import { isResetActor, MIN_PASSWORD, SPACE_LABEL, type ResetActor } from "@/lib/medusa/password";
import { setPasswordAction } from "../actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Nouveau mot de passe · MACHÉ",
  robots: { index: false },
  referrer: "no-referrer",
};

const inputClass =
  "mt-1 w-full rounded-[6px] border border-[var(--mache-line)] bg-white px-3 py-2.5 text-md outline-none focus:border-[var(--mache-primary)]";

export default async function NewPasswordPage({
  searchParams,
}: {
  searchParams?: Promise<{ acteur?: string; token?: string; erreur?: string }>;
}) {
  const query = searchParams ? await searchParams : {};
  const actor: ResetActor = isResetActor(query.acteur) ? query.acteur : "customer";
  const token = query.token ?? "";

  if (!token) {
    return (
      <main className="mx-auto w-full max-w-md px-4 py-12 sm:py-16">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--mache-text)]">Lien incomplet</h1>
        <p className="mt-3 text-md leading-relaxed text-[var(--mache-muted)]">
          Ce lien ne contient pas de jeton. Il a peut-être été coupé par votre
          messagerie. Demandez-en un nouveau.
        </p>
        <Link
          href={`/mot-de-passe?acteur=${actor}`}
          className="mt-5 inline-block text-base font-semibold text-[var(--mache-primary)] hover:underline"
        >
          Demander un nouveau lien
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 py-12 sm:py-16">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--mache-text)]">
        Nouveau mot de passe
      </h1>
      <p className="mt-2 text-md text-[var(--mache-muted)]">
        Pour {SPACE_LABEL[actor]}.
      </p>

      {query.erreur && (
        <div className="mt-4 rounded-[8px] border border-[#f2c2c8] bg-[#fdeaec] px-4 py-3 text-base text-[#b01124]">
          {query.erreur}
        </div>
      )}

      <form action={setPasswordAction} className="mt-6 space-y-4">
        <input type="hidden" name="acteur" value={actor} />
        <input type="hidden" name="token" value={token} />

        <div>
          <label htmlFor="password" className="text-sm font-semibold text-[var(--mache-text)]">
            Nouveau mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={MIN_PASSWORD}
            autoComplete="new-password"
            className={inputClass}
          />
          <p className="mt-1 text-sm text-[var(--mache-muted)]">Au moins {MIN_PASSWORD} caractères.</p>
        </div>

        <div>
          <label htmlFor="confirm" className="text-sm font-semibold text-[var(--mache-text)]">
            Le même, une seconde fois
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            required
            minLength={MIN_PASSWORD}
            autoComplete="new-password"
            className={inputClass}
          />
        </div>

        <SubmitButton
          className="w-full rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-md font-bold text-white transition-colors hover:bg-[var(--mache-primary-dark)]"
          pendingLabel="Enregistrement…"
          pendingHint="Le backend commerce peut être en veille et mettre jusqu'à une minute à répondre. Ne quittez pas la page."
        >
          Enregistrer le nouveau mot de passe
        </SubmitButton>
      </form>
    </main>
  );
}
