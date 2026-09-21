/*
  PAGE : connexion vendeur.

  Ce qui existait

  Le site n'avait qu'une connexion : celle des acheteurs. Un vendeur qui
  cherchait la sienne ne la trouvait nulle part — elle était enfouie
  dans l'éditeur de vitrine, sous la forme d'un formulaire qui
  apparaissait quand on n'était pas connecté. Autrement dit : il fallait
  déjà savoir où aller pour pouvoir y aller.

  Elle a donc maintenant son adresse, et les deux portes — acheteur et
  vendeur — se renvoient l'une à l'autre : c'est le seul moyen pour que
  quelqu'un qui s'est trompé s'en aperçoive.
*/

import Link from "next/link";
import { redirect } from "next/navigation";
import { getVendorSeller } from "@/lib/medusa/vendor";
import { medusaBackendUrl } from "@/lib/medusa/config";
import { reportOutage } from "@/lib/medusa/outage";
import { vendorLoginAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function VendorLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; next?: string }>;
}) {
  const query = searchParams ? await searchParams : {};

  /* Déjà connecté : on ne demande pas deux fois. */
  const existing = await getVendorSeller();

  if (existing) redirect(query.next || "/dashboard/seller");

  if (!medusaBackendUrl()) {
    reportOutage(
      "connexion vendeur",
      "adresse du backend commerce absente (NEXT_PUBLIC_MEDUSA_BACKEND_URL)"
    );

    return (
      <main className="mx-auto w-full max-w-lg px-4 py-14">
        <h1 className="text-2xl font-bold text-[var(--mache-text)]">
          Connexion vendeur momentanément indisponible
        </h1>
        <p className="mt-3 text-md leading-relaxed text-[var(--mache-muted)]">
          Nous ne pouvons pas vous connecter pour le moment. Réessayez
          dans quelques minutes.
        </p>
        <Link
          href="/contact"
          className="mt-6 inline-block rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-md font-bold text-white"
        >
          Contacter MACHÉ
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--mache-text)]">
        Connexion vendeur
      </h1>

      <p className="mt-2 text-md leading-relaxed text-[var(--mache-muted)]">
        Accédez à votre boutique, vos produits et vos commandes.
      </p>

      {query.error && (
        <div className="mt-5 rounded-[8px] border border-[#f2c2c8] bg-[#fdeaec] px-4 py-3 text-base leading-relaxed text-[#b01124]">
          {decodeURIComponent(query.error)}
        </div>
      )}

      <form action={vendorLoginAction} className="mt-6 space-y-4">
        <input type="hidden" name="next" value={query.next ?? "/dashboard/seller"} />

        <label className="block">
          <span className="text-base font-semibold text-[var(--mache-text)]">
            Adresse e-mail
          </span>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-1 w-full rounded-[6px] border border-[var(--mache-line)] px-3 py-2.5 text-md outline-none focus:border-[var(--mache-primary)]"
          />
        </label>

        <label className="block">
          <span className="text-base font-semibold text-[var(--mache-text)]">
            Mot de passe
          </span>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="mt-1 w-full rounded-[6px] border border-[var(--mache-line)] px-3 py-2.5 text-md outline-none focus:border-[var(--mache-primary)]"
          />
        </label>

        {/*
          Facultatif, et c'est le point : la plupart des vendeurs n'ont
          qu'une boutique, et leur demander son adresse serait une
          question dont on connaît déjà la réponse.
        */}
        <details className="rounded-[6px] border border-[var(--mache-line)] px-3 py-2">
          <summary className="cursor-pointer text-base text-[var(--mache-muted)]">
            Je gère plusieurs boutiques
          </summary>
          <label className="mt-2 block">
            <span className="text-sm font-semibold text-[var(--mache-text)]">
              Adresse de la boutique
            </span>
            <input
              id="store_handle"
              name="store_handle"
              placeholder="bawon-lakwa"
              className="mt-1 w-full rounded-[6px] border border-[var(--mache-line)] px-3 py-2 text-base outline-none focus:border-[var(--mache-primary)]"
            />
            <span className="mt-1 block text-sm text-[var(--mache-muted)]">
              La partie après /store/ dans l&apos;adresse de votre vitrine.
            </span>
          </label>
        </details>

        <button
          type="submit"
          className="w-full rounded-[6px] bg-[var(--mache-primary)] px-5 py-3 text-md font-bold text-white transition-colors hover:bg-[var(--mache-primary-dark)]"
        >
          Se connecter
        </button>
      </form>

      <p className="mt-6 border-t border-[var(--mache-line)] pt-4 text-base text-[var(--mache-muted)]">
        Pas encore de boutique ?{" "}
        <Link
          href="/dashboard/seller/inscription"
          className="font-semibold text-[var(--mache-primary)] hover:underline"
        >
          En ouvrir une
        </Link>
      </p>

      {/*
        La porte des acheteurs, nommée ici : quelqu'un qui s'est trompé
        de connexion ne s'en aperçoit autrement qu'après avoir échoué.
      */}
      <p className="mt-2 text-base text-[var(--mache-muted)]">
        Vous venez acheter ?{" "}
        <Link
          href="/compte/connexion"
          className="font-semibold text-[var(--mache-primary)] hover:underline"
        >
          Connexion client
        </Link>
      </p>
    </main>
  );
}
