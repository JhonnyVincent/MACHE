/*
  PAGE : le code à usage unique, à la connexion.

  On arrive ici avec un mot de passe juste et rien d'autre. La session
  n'est pas ouverte : un jeton attend dans un cookie séparé, qu'aucune
  page d'administration ne lit. Tant que le code n'est pas donné, cet
  espace reste fermé.

  Les deux champs plutôt qu'un choix

  Le code de l'application et le code de secours sont proposés
  ensemble, et le serveur prend celui qui est rempli. Demander d'abord
  « quel type de code allez-vous saisir ? » ajoute une décision au
  moment précis où quelqu'un fouille ses papiers parce qu'il a perdu
  son téléphone.
*/

import { Link } from "next-view-transitions";
import { redirect } from "next/navigation";
import { adminAwaitingCode, getAdminUser } from "@/lib/medusa/admin";
import { SubmitButton } from "@/components/submit-button";
import {
  adminSecondFactorAction,
  adminCancelSecondFactorAction,
} from "../../actions";

export const dynamic = "force-dynamic";

const inputClass =
  "mt-1 w-full rounded-[6px] border border-[var(--mache-line)] bg-white px-3 py-2.5 text-md outline-none focus:border-[var(--mache-primary)]";

export default async function AdminSecondFactorPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const query = searchParams ? await searchParams : {};

  /* Déjà connecté : rien à faire ici. */
  const user = await getAdminUser();

  if (user) redirect("/dashboard/admin");

  /*
    Aucune connexion en attente : soit le cookie a expiré, soit on est
    arrivé ici par l'URL. On renvoie au mot de passe plutôt que
    d'afficher un formulaire qui ne pourrait rien valider.
  */
  if (!(await adminAwaitingCode())) redirect("/dashboard/admin/connexion");

  return (
    <main className="mx-auto w-full max-w-md px-4 py-12 sm:py-16">
      <span className="inline-block rounded-[3px] bg-[var(--mache-text)] px-2 py-1 text-xs font-bold uppercase tracking-widest text-white">
        Administration
      </span>

      <h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--mache-text)]">
        Votre code à usage unique
      </h1>

      <p className="mt-2 text-md leading-relaxed text-[var(--mache-muted)]">
        Ouvrez votre application d&apos;authentification et recopiez les six
        chiffres affichés pour MACHÉ.
      </p>

      {query.error && (
        <p
          role="alert"
          className="mt-5 rounded-[6px] border border-[#f2c2c8] bg-[#fdeaec] px-3 py-2.5 text-sm text-[#b01124]"
        >
          {query.error}
        </p>
      )}

      <form action={adminSecondFactorAction} className="mt-6 space-y-4">
        <div>
          <label htmlFor="code" className="block text-sm font-semibold text-[var(--mache-text)]">
            Code de l&apos;application
          </label>
          <input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={7}
            placeholder="123456"
            className={`${inputClass} font-mono text-2xl tracking-[0.4em]`}
          />
        </div>

        <details className="rounded-[6px] border border-[var(--mache-line)] bg-[var(--mache-white)] p-3">
          <summary className="cursor-pointer text-sm font-semibold text-[var(--mache-text)]">
            Téléphone perdu ou application effacée ?
          </summary>

          <div className="mt-3">
            <label
              htmlFor="recovery"
              className="block text-sm font-semibold text-[var(--mache-text)]"
            >
              Code de secours
            </label>
            <input
              id="recovery"
              name="recovery"
              autoComplete="off"
              placeholder="XXXXX-XXXXX"
              className={`${inputClass} font-mono uppercase`}
            />
            <p className="mt-1.5 text-xs leading-relaxed text-[var(--mache-muted)]">
              Un des codes notés le jour où vous avez activé la protection.
              Chacun ne sert qu&apos;une fois.
            </p>
          </div>
        </details>

        <SubmitButton pendingLabel="Vérification…">Entrer</SubmitButton>
      </form>

      <form action={adminCancelSecondFactorAction} className="mt-6">
        <button
          type="submit"
          className="text-sm text-[var(--mache-muted)] underline underline-offset-2 hover:text-[var(--mache-text)]"
        >
          Revenir au mot de passe
        </button>
      </form>

      <p className="mt-8 text-xs leading-relaxed text-[var(--mache-muted)]">
        Le code change toutes les trente secondes. Si le vôtre est refusé
        plusieurs fois de suite, vérifiez que l&apos;heure de votre téléphone
        est réglée automatiquement — c&apos;est la cause la plus fréquente.
      </p>

      <p className="mt-3 text-xs text-[var(--mache-muted)]">
        <Link href="/" className="underline underline-offset-2">
          Retour au site
        </Link>
      </p>
    </main>
  );
}
