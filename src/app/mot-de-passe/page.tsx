/*
  PAGE : mot de passe oublié — demander un lien.

  Une seule page pour les trois espaces (client, vendeur,
  administration), choisis par `?acteur=`. Le vendeur y arrive aussi
  depuis le lien « Reset » du panneau Mercur : c'est le même compte.

  La confirmation est identique qu'un compte existe ou non. C'est
  voulu : dire « aucun compte pour cette adresse » apprendrait à
  n'importe qui qui est inscrit chez MACHÉ.
*/

import { Link } from "next-view-transitions";
import { SubmitButton } from "@/components/submit-button";
import { isResetActor, LOGIN_PAGE, SPACE_LABEL, type ResetActor } from "@/lib/medusa/password";
import { requestResetAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Mot de passe oublié · MACHÉ",
  robots: { index: false },
};

const inputClass =
  "mt-1 w-full rounded-[6px] border border-[var(--mache-line)] bg-white px-3 py-2.5 text-md outline-none focus:border-[var(--mache-primary)]";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams?: Promise<{ acteur?: string; envoye?: string; erreur?: string }>;
}) {
  const query = searchParams ? await searchParams : {};
  const actor: ResetActor = isResetActor(query.acteur) ? query.acteur : "customer";

  return (
    <main className="mx-auto w-full max-w-md px-4 py-12 sm:py-16">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--mache-text)]">
        Mot de passe oublié
      </h1>

      {query.envoye ? (
        <div className="mt-6 rounded-[10px] border border-[var(--mache-line)] bg-[var(--mache-white)] p-5">
          <p className="text-md font-semibold text-[var(--mache-text)]">
            Si un compte existe pour cette adresse, un e-mail vient de partir.
          </p>
          <p className="mt-2 text-base leading-relaxed text-[var(--mache-muted)]">
            Il contient un lien pour choisir un nouveau mot de passe, valable
            15 minutes. Pensez à regarder dans vos courriers indésirables.
          </p>
          <p className="mt-2 text-base leading-relaxed text-[var(--mache-muted)]">
            Rien reçu au bout de quelques minutes ? Vérifiez l&apos;adresse et
            refaites la demande.
          </p>
          <Link
            href={`/mot-de-passe?acteur=${actor}`}
            className="mt-4 inline-block text-base font-semibold text-[var(--mache-primary)] hover:underline"
          >
            Refaire une demande
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-2 text-md text-[var(--mache-muted)]">
            Indiquez l&apos;adresse de {SPACE_LABEL[actor]}. Vous recevrez un
            lien pour choisir un nouveau mot de passe.
          </p>

          {query.erreur && (
            <div className="mt-4 rounded-[8px] border border-[#f2c2c8] bg-[#fdeaec] px-4 py-3 text-base text-[#b01124]">
              {query.erreur}
            </div>
          )}

          <form action={requestResetAction} className="mt-6 space-y-4">
            <input type="hidden" name="acteur" value={actor} />

            <div>
              <label htmlFor="email" className="text-sm font-semibold text-[var(--mache-text)]">
                Adresse e-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                autoCapitalize="none"
                className={inputClass}
              />
            </div>

            <SubmitButton
              className="w-full rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-md font-bold text-white transition-colors hover:bg-[var(--mache-primary-dark)]"
              pendingLabel="Envoi en cours…"
              pendingHint="Le backend commerce peut être en veille et mettre jusqu'à une minute à répondre. Ne quittez pas la page."
            >
              Recevoir un lien
            </SubmitButton>
          </form>
        </>
      )}

      <p className="mt-6 text-base text-[var(--mache-muted)]">
        <Link href={LOGIN_PAGE[actor]} className="font-semibold text-[var(--mache-primary)] hover:underline">
          Retour à la connexion
        </Link>
      </p>
    </main>
  );
}
