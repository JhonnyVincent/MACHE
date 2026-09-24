/*
  L'enveloppe des pages légales.

  Elle affiche le texte publié depuis l'administration s'il y en a un,
  et sinon le texte écrit dans le code — celui qui est passé en enfant.

  Pourquoi le texte d'origine reste dans le code

  Ce n'est pas un vestige. C'est ce qui s'affiche tant que personne n'a
  rien publié, et tant que le backend ne répond pas. Une page de
  conditions générales qui afficherait « service indisponible » est
  pire qu'inutile : c'est justement la page qu'on consulte quand
  quelque chose ne va pas.

  La version et la date sont affichées quand le texte vient de
  l'administration. Une page légale sans date laisse le lecteur
  incapable de savoir s'il lit ce qui s'appliquait au moment de son
  achat.
*/

import { fetchPolicy, parsePolicyBody } from "@/lib/medusa/policies";

export async function LegalPage({
  slug,
  fallbackTitle,
  children,
}: {
  slug: string;
  fallbackTitle: string;
  children: React.ReactNode;
}) {
  const policy = await fetchPolicy(slug);

  /* Rien de publié, ou backend muet : le texte d'origine, tel quel. */
  if (!policy) return <>{children}</>;

  const blocks = parsePolicyBody(policy.body);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--mache-text)] sm:text-4xl">
        {policy.title || fallbackTitle}
      </h1>

      {policy.summary && (
        <p className="mt-3 text-md leading-relaxed text-[var(--mache-muted)]">
          {policy.summary}
        </p>
      )}

      <div className="mt-8 space-y-4">
        {blocks.map((block, index) =>
          block.kind === "heading" ? (
            <h2
              key={index}
              className="pt-4 text-lg font-bold text-[var(--mache-text)]"
            >
              {block.text}
            </h2>
          ) : (
            <p
              key={index}
              className="text-md leading-relaxed text-[var(--mache-muted)]"
            >
              {block.text}
            </p>
          )
        )}
      </div>

      {/*
        La date et la version. Sans elles, un lecteur ne peut pas savoir
        si ce qu'il lit est ce qui s'appliquait au moment de son achat.
        L'empreinte permet de vérifier que le texte affiché est bien
        celui qui a été publié.
      */}
      <footer className="mt-10 border-t border-[var(--mache-line)] pt-4 text-sm text-[var(--mache-muted)]">
        <p>
          Version {policy.version}
          {policy.publishedAt
            ? ` — en vigueur depuis le ${new Date(policy.publishedAt).toLocaleDateString(
                "fr-FR",
                { day: "numeric", month: "long", year: "numeric" }
              )}`
            : ""}
        </p>

        {policy.contentHash && (
          <p className="mt-1 break-all text-2xs text-[var(--mache-light)]">
            Empreinte du texte : {policy.contentHash}
          </p>
        )}
      </footer>
    </main>
  );
}
