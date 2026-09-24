/*
  PAGE : la porte de l'espace agent.

  Pourquoi une porte distincte alors que c'est le même compte

  Parce qu'un agent ne sait pas forcément qu'il est « un client avec une
  fonction » — c'est notre vocabulaire, pas le sien. On lui a dit « tu
  es agent MACHÉ » et il cherche l'endroit où les agents entrent. Lui
  répondre par un formulaire qui parle de commandes et d'adresses le
  laisserait croire qu'il s'est trompé de site.

  Le compte, lui, est bien le même, et la page le dit plutôt que de le
  cacher : le découvrir plus tard serait déroutant.
*/

import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomer } from "@/lib/medusa/customer";
import { SubmitButton } from "@/components/submit-button";
import { agentLoginAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Espace agent · MACHÉ",
  description: "Connexion des agents MACHÉ : livreurs, points de retrait, commerciaux.",
};

const inputClass =
  "mt-1 w-full rounded-[6px] border border-[var(--mache-line)] bg-white px-3 py-2.5 text-md outline-none focus:border-[var(--mache-primary)]";

export default async function AgentLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const query = searchParams ? await searchParams : {};

  const customer = await getCustomer();

  if (customer) redirect("/dashboard/agent");

  return (
    <main className="mx-auto w-full max-w-md px-4 py-12 sm:py-16">
      <span className="inline-block rounded-[3px] bg-[var(--mache-text)] px-2 py-1 text-xs font-bold uppercase tracking-widest text-white">
        Espace agent
      </span>

      <h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--mache-text)]">
        Retrouver mes colis
      </h1>

      <p className="mt-2 text-md leading-relaxed text-[var(--mache-muted)]">
        Livreurs, points de retrait et commerciaux de MACHÉ.
      </p>

      {query.error && (
        <p
          role="alert"
          className="mt-5 rounded-[6px] border border-[#f2c2c8] bg-[#fdeaec] px-3 py-2.5 text-sm text-[#b01124]"
        >
          {query.error}
        </p>
      )}

      <form action={agentLoginAction} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-[var(--mache-text)]">
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
          <label htmlFor="password" className="block text-sm font-semibold text-[var(--mache-text)]">
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

        <SubmitButton pendingLabel="Connexion…" pendingHint="Nous vérifions vos identifiants.">
          Entrer
        </SubmitButton>
      </form>

      {/*
        Ce paragraphe évite le principal appel au support qu'une page
        comme celle-ci génère : « je n'arrive pas à créer mon compte
        agent ». Il n'y a rien à créer.
      */}
      <div className="mt-8 rounded-[8px] border border-[var(--mache-line)] bg-[var(--mache-white)] p-4">
        <h2 className="text-md font-bold text-[var(--mache-text)]">
          C&apos;est votre compte MACHÉ habituel
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--mache-muted)]">
          Il n&apos;y a pas de compte agent à créer. Vous entrez avec le compte
          client que vous utilisez pour acheter ; c&apos;est MACHÉ qui y attache
          votre fonction. Si vous n&apos;avez pas encore de compte,{" "}
          <Link
            href="/compte/inscription"
            className="font-medium text-[var(--mache-primary)] underline"
          >
            créez-en un
          </Link>
          , puis dites-le à MACHÉ pour qu&apos;on vous rattache.
        </p>
      </div>

      <p className="mt-6 text-sm text-[var(--mache-muted)]">
        Vous cherchez plutôt{" "}
        <Link href="/compte/connexion" className="font-medium underline">
          vos commandes
        </Link>{" "}
        ou{" "}
        <Link href="/dashboard/seller/connexion" className="font-medium underline">
          votre boutique
        </Link>{" "}
        ?
      </p>
    </main>
  );
}
