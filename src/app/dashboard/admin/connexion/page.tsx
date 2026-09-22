/*
  PAGE : connexion à l'administration de MACHÉ.

  Les comptes du personnel vivent dans Medusa — la table `user`,
  distincte des clients et des vendeurs. Cet espace authentifiait
  auparavant contre Supabase ; le projet Supabase a été supprimé, et
  chaque écran d'administration tombait alors en erreur serveur.

  Un compte se crée en ligne de commande, côté backend :

      medusa user -e vous@mache.ht -p <mot de passe>

  Volontairement : ouvrir une inscription publique à l'administration
  d'une marketplace reviendrait à laisser la porte du coffre sur le
  palier.
*/

import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/medusa/admin";
import { adminLoginAction } from "../actions";
import { isMedusaConfigured } from "@/lib/medusa/config";

export const dynamic = "force-dynamic";

const inputClass =
  "mt-1 w-full rounded-[6px] border border-[var(--mache-line)] bg-white px-3 py-2.5 text-md outline-none focus:border-[var(--mache-primary)]";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const query = searchParams ? await searchParams : {};

  /*
    Sans backend commerce, aucune authentification n'est possible. On le
    dit ici plutôt que de présenter un formulaire dont chaque envoi
    échouera.
  */
  if (!isMedusaConfigured()) {
    return (
      <main className="mx-auto w-full max-w-md px-4 py-16">
        <h1 className="text-2xl font-bold text-[var(--mache-text)]">
          Administration indisponible
        </h1>
        <p className="mt-3 text-md leading-relaxed text-[var(--mache-muted)]">
          Les comptes du personnel sont gérés par le backend commerce,
          dont l&apos;adresse n&apos;est pas renseignée sur ce
          déploiement.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-[6px] bg-[var(--mache-text)] px-5 py-2.5 text-md font-bold text-white"
        >
          Retour à l&apos;accueil
        </Link>
      </main>
    );
  }

  if (await getAdminUser()) redirect("/dashboard/admin");

  return (
    <main className="mx-auto w-full max-w-md px-4 py-12 sm:py-16">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--mache-text)]">
        Administration MACHÉ
      </h1>

      <p className="mt-2 text-md text-[var(--mache-muted)]">
        Réservé au personnel de la marketplace.
      </p>

      {query.error && (
        <div className="mt-4 rounded-[8px] border border-[#f2c2c8] bg-[#fdeaec] px-4 py-3 text-base text-[#b01124]">
          {decodeURIComponent(query.error)}
        </div>
      )}

      <form action={adminLoginAction} className="mt-6 space-y-4">
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
            className={inputClass}
          />
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

        <button
          type="submit"
          className="w-full rounded-[6px] bg-[var(--mache-text)] px-5 py-2.5 text-md font-bold text-white transition-colors hover:bg-black"
        >
          Se connecter
        </button>
      </form>

      {/*
        Les deux autres portes, nommées. Un vendeur ou un client qui
        atterrit ici doit savoir où aller, plutôt que d'essayer son mot
        de passe jusqu'à croire son compte perdu.
      */}
      <p className="mt-6 text-sm leading-relaxed text-[var(--mache-muted)]">
        Vous vendez sur MACHÉ ?{" "}
        <Link href="/dashboard/seller/connexion" className="font-semibold text-[var(--mache-primary)] hover:underline">
          Espace vendeur
        </Link>
        . Vous êtes client ?{" "}
        <Link href="/compte/connexion" className="font-semibold text-[var(--mache-primary)] hover:underline">
          Votre compte
        </Link>
        .
      </p>
    </main>
  );
}
