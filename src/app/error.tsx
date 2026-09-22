"use client";

/*
  ÉCRAN : une page n'a pas pu être rendue.

  Ce qu'il remplace

  « Application error: a server-side exception has occurred », suivi
  d'un identifiant. Rien d'autre : ni ce qui s'est passé, ni si l'on
  peut réessayer, ni ce que l'on est censé faire de cet identifiant.
  Quelqu'un qui vient de remplir un formulaire d'inscription ne sait
  même pas si son compte a été créé.

  Ce qu'il montre

  De quoi agir : un bouton pour réessayer, une sortie vers le
  catalogue, et une phrase sur ce qui fonctionne encore — parce qu'une
  page qui échoue n'est pas un site qui tombe.

  L'identifiant technique est conservé et nommé pour ce qu'il est : la
  clé qui permet de retrouver l'erreur complète dans le journal du
  serveur. C'est la seule chose qui en fait quelque chose d'utile
  plutôt qu'un numéro à recopier sans savoir pourquoi.

  Ce qu'il ne montre pas

  Le message d'erreur. Il cite des chemins de fichiers, des noms de
  variables, parfois des valeurs. Il appartient au journal, pas à la
  page publique.
*/

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorScreen({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    /*
      Le détail part à la console du navigateur, où un développeur le
      trouvera. Il ne s'affiche pas dans la page.
    */
    console.error("[MACHÉ] rendu interrompu :", error);
  }, [error]);

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-16">
      <h1 className="text-2xl font-bold tracking-tight text-[var(--mache-text)]">
        Cette page n&apos;a pas pu s&apos;afficher
      </h1>

      <p className="mt-3 text-md leading-relaxed text-[var(--mache-muted)]">
        Quelque chose s&apos;est interrompu de notre côté. Le reste du
        site fonctionne : le catalogue, les boutiques et votre panier ne
        sont pas concernés.
      </p>

      <p className="mt-3 text-md leading-relaxed text-[var(--mache-muted)]">
        Si vous veniez d&apos;envoyer un formulaire, rien ne garantit
        qu&apos;il soit passé. Réessayez — et si un compte existe déjà
        avec votre adresse, connectez-vous plutôt que d&apos;en créer un
        second.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-md font-bold text-white transition-colors hover:bg-[var(--mache-primary-dark)]"
        >
          Réessayer
        </button>

        <Link
          href="/"
          className="rounded-[6px] border border-[var(--mache-line)] px-5 py-2.5 text-md font-semibold text-[var(--mache-text)] transition-colors hover:border-[var(--mache-primary)]"
        >
          Retour à l&apos;accueil
        </Link>

        <Link
          href="/contact"
          className="rounded-[6px] border border-[var(--mache-line)] px-5 py-2.5 text-md font-semibold text-[var(--mache-text)] transition-colors hover:border-[var(--mache-primary)]"
        >
          Nous signaler le problème
        </Link>
      </div>

      {error.digest && (
        <div className="mt-8 rounded-[8px] border border-[var(--mache-line)] bg-[var(--mache-bg)] p-4">
          <p className="text-sm font-semibold text-[var(--mache-text)]">
            Référence à nous transmettre
          </p>

          <p className="mt-1 font-mono text-base text-[var(--mache-text)]">
            {error.digest}
          </p>

          <p className="mt-2 text-sm leading-relaxed text-[var(--mache-muted)]">
            Elle permet de retrouver le détail exact dans le journal du
            serveur. Seule, elle ne dit rien — c&apos;est la ligne
            « Error » qui l&apos;accompagne dans le journal qui contient la
            cause.
          </p>
        </div>
      )}
    </main>
  );
}
