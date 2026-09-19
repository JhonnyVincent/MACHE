/*
  PAGE PUBLIQUE : vérification d'un agent MACHÉ

  Sert à ce qu'un client, devant sa porte, puisse s'assurer que la personne
  qui se présente est bien un agent habilité.

  Cette page lisait auparavant deux agents inventés dans un fichier du
  code : elle répondait donc « agent officiel » sur la foi de données
  fausses. Une vérification d'identité qui se trompe ne vaut pas mieux que
  pas de vérification — elle sert de caution. Elle interroge désormais la
  table agent_profiles, et répond « inconnu » tant qu'un agent n'y est pas
  enregistré par l'équipe MACHÉ.

  La recherche se fait côté serveur, par l'URL : le résultat est partageable
  et rien de la table n'est expédié au navigateur.
*/

import Link from "next/link";
import { verifyAgentCode, AGENT_STATUS_LABELS } from "@/lib/agents";

export const dynamic = "force-dynamic";

function formatDay(value: string | null) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function VerifyAgentPage({
  searchParams,
}: {
  searchParams?: Promise<{ code?: string }>;
}) {
  const query = searchParams ? await searchParams : {};
  const submitted = String(query.code || "").trim();
  const result = submitted ? await verifyAgentCode(submitted) : null;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--mache-text)] sm:text-4xl">
        Vérifier un agent MACHÉ
      </h1>

      <p className="mt-3 text-md leading-relaxed text-[var(--mache-muted)]">
        Un agent qui se présente chez vous porte une carte avec un code.
        Saisissez-le ici avant de lui remettre un colis ou de l&apos;argent.
      </p>

      <form method="GET" className="mt-6 flex flex-col gap-2 sm:flex-row">
        <label htmlFor="code" className="sr-only">
          Code de l&apos;agent
        </label>
        <input
          id="code"
          name="code"
          defaultValue={submitted}
          required
          autoComplete="off"
          autoCapitalize="characters"
          placeholder="MCH-AG-0000"
          className="w-full rounded-[6px] border border-[var(--mache-line)] px-3 py-2.5 text-md uppercase tracking-label outline-none focus:border-[var(--mache-primary)]"
        />
        <button
          type="submit"
          className="shrink-0 rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-md font-bold text-white transition-colors hover:bg-[var(--mache-primary-dark)]"
        >
          Vérifier
        </button>
      </form>

      {result && (
        <div className="mt-8">
          {"unavailable" in result ? (
            /*
              MACHÉ n'a pas pu vérifier. La consigne reste la même que
              pour un code inconnu — ne rien remettre — mais la raison
              donnée est la vraie : accuser quelqu'un d'imposture parce
              qu'un service est en panne serait aussi faux que de le
              laisser passer.
            */
            <section className="rounded-[10px] border border-[#f3d9a5] bg-[#fdf6e8] p-5">
              <p className="text-lg font-bold text-[var(--mache-text)]">
                Vérification impossible pour le moment
              </p>
              <p className="mt-2 text-base leading-relaxed text-[var(--mache-muted)]">
                MACHÉ ne peut pas confirmer ce code en ce moment. Cela ne
                veut pas dire que cette personne est un imposteur, ni
                qu&apos;elle est habilitée : nous n&apos;en savons rien.
              </p>
              <p className="mt-2 text-base font-semibold leading-relaxed text-[var(--mache-text)]">
                Dans le doute, ne remettez ni colis ni argent. Réessayez
                dans quelques minutes, ou appelez MACHÉ pendant que la
                personne attend.
              </p>
              <Link
                href="/contact"
                className="mt-4 inline-block text-base font-semibold text-[var(--mache-primary)] hover:underline"
              >
                Contacter MACHÉ
              </Link>
            </section>
          ) : !result.found ? (
            <section className="rounded-[10px] border border-[var(--mache-line)] bg-[var(--mache-white)] p-5">
              <p className="text-lg font-bold text-[var(--mache-danger)]">
                Aucun agent ne correspond à ce code
              </p>
              <p className="mt-2 text-base leading-relaxed text-[var(--mache-muted)]">
                Ne remettez ni colis ni argent à cette personne. Vérifiez la
                saisie du code ; s&apos;il est correct et que la personne
                insiste, signalez-le à MACHÉ.
              </p>
              <Link
                href="/contact"
                className="mt-4 inline-block text-base font-semibold text-[var(--mache-primary)] hover:underline"
              >
                Signaler à MACHÉ
              </Link>
            </section>
          ) : (
            <section
              className={`rounded-[10px] border p-5 ${
                result.trustworthy
                  ? "border-[#b7dfc9] bg-[#f4fbf7]"
                  : "border-[#f2c2c8] bg-[#fdeaec]"
              }`}
            >
              <p
                className={`text-lg font-bold ${
                  result.trustworthy ? "text-[#046c4e]" : "text-[#b01124]"
                }`}
              >
                {result.trustworthy
                  ? "Agent habilité"
                  : result.expired
                    ? "Habilitation expirée"
                    : AGENT_STATUS_LABELS[result.status]}
              </p>

              {!result.trustworthy && (
                <p className="mt-2 text-base leading-relaxed text-[#b01124]">
                  Cette personne n&apos;est pas autorisée à intervenir pour MACHÉ
                  aujourd&apos;hui. Ne lui remettez ni colis ni argent.
                </p>
              )}

              <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
                {result.photoUrl && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={result.photoUrl}
                    alt=""
                    className="h-20 w-20 shrink-0 rounded-full object-cover"
                  />
                )}

                <div className="min-w-0">
                  <p className="text-xl font-bold text-[var(--mache-text)]">
                    {result.displayName}
                  </p>
                  {result.officialBadge && result.trustworthy && (
                    <span className="mt-1 inline-block rounded-[3px] bg-[var(--mache-text)] px-2 py-0.5 text-xs font-semibold text-white">
                      Badge officiel
                    </span>
                  )}
                </div>
              </div>

              <dl className="mt-5 grid gap-2 text-base">
                <div className="flex justify-between gap-4 border-t border-black/5 pt-2">
                  <dt className="text-[var(--mache-muted)]">Code</dt>
                  <dd className="font-semibold tracking-label">{result.code}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-black/5 pt-2">
                  <dt className="text-[var(--mache-muted)]">Zone</dt>
                  <dd className="font-medium">{result.zone || "Non précisée"}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-black/5 pt-2">
                  <dt className="text-[var(--mache-muted)]">Habilitation</dt>
                  <dd className="font-medium">{AGENT_STATUS_LABELS[result.status]}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-black/5 pt-2">
                  <dt className="text-[var(--mache-muted)]">Valable jusqu&apos;au</dt>
                  <dd className="font-medium">
                    {formatDay(result.validUntil) || "Sans échéance enregistrée"}
                  </dd>
                </div>
              </dl>
            </section>
          )}
        </div>
      )}

      <section className="mt-10 rounded-[10px] border border-[var(--mache-line)] bg-[var(--mache-bg)] p-5">
        <h2 className="text-md font-bold text-[var(--mache-text)]">
          Trois règles simples
        </h2>
        <ul className="mt-3 space-y-2 text-base leading-relaxed text-[var(--mache-muted)]">
          <li>
            Un agent MACHÉ vous montre sa carte sans qu&apos;on la lui demande.
          </li>
          <li>
            Le code se vérifie sur cette page, depuis votre propre téléphone —
            jamais sur celui de la personne qui se présente.
          </li>
          <li>
            En cas de doute, ne remettez rien et contactez MACHÉ.
          </li>
        </ul>
      </section>
    </main>
  );
}
