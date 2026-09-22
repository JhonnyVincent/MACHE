/*
  PAGE : ouvrir une boutique sur MACHÉ.

  Ce qui existait

  « Devenir vendeur » renvoyait au panneau Mercur, servi par le backend
  commerce : une autre application, sur une autre adresse, en anglais.
  Un commerçant qui cliquait depuis MACHÉ se retrouvait ailleurs sans
  savoir s'il était encore chez MACHÉ.

  Ce formulaire crée le compte et la boutique depuis le site, en
  français, puis ouvre la session. Le panneau vendeur reste ensuite le
  lieu du travail quotidien — produits, stocks, commandes — mais on n'y
  entre plus par une porte dérobée.

  Ce que la page dit avant qu'on demande

  Que la boutique est relue par MACHÉ avant d'être visible. Sans cela,
  le vendeur la chercherait dans le catalogue et la croirait perdue.
*/

import Link from "next/link";
import { SubmitButton } from "@/components/submit-button";
import { redirect } from "next/navigation";
import { getVendorSeller } from "@/lib/medusa/vendor";
import { medusaBackendUrl } from "@/lib/medusa/config";
import { reportOutage } from "@/lib/medusa/outage";
import { registerVendorAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function VendorRegistrationPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const query = searchParams ? await searchParams : {};

  /* Déjà connecté en vendeur : cette page n'a rien à lui proposer. */
  const existing = await getVendorSeller();

  if (existing) redirect("/dashboard/seller");

  if (!medusaBackendUrl()) {
    reportOutage(
      "inscription vendeur",
      "adresse du backend commerce absente (NEXT_PUBLIC_MEDUSA_BACKEND_URL)"
    );

    return (
      <main className="mx-auto w-full max-w-lg px-4 py-14">
        <h1 className="text-2xl font-bold text-[var(--mache-text)]">
          Ouverture de boutique momentanément indisponible
        </h1>
        <p className="mt-3 text-md leading-relaxed text-[var(--mache-muted)]">
          Nous ne pouvons pas enregistrer de nouvelle boutique pour le
          moment. Réessayez dans quelques minutes.
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
    <main className="mx-auto w-full max-w-xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--mache-text)]">
        Ouvrir ma boutique
      </h1>

      <p className="mt-2 text-md leading-relaxed text-[var(--mache-muted)]">
        Quelques minutes suffisent. Vous pourrez ajouter vos produits
        ensuite.
      </p>

      {query.error && (
        <div className="mt-5 rounded-[8px] border border-[#f2c2c8] bg-[#fdeaec] px-4 py-3 text-base leading-relaxed text-[#b01124]">
          {decodeURIComponent(query.error)}
        </div>
      )}

      <form action={registerVendorAction} className="mt-6 space-y-5">
        <fieldset className="space-y-3">
          <legend className="text-md font-bold text-[var(--mache-text)]">
            Votre boutique
          </legend>

          <label className="block">
            <span className="text-base font-semibold text-[var(--mache-text)]">
              Nom de la boutique
            </span>
            <input
              name="shop_name"
              required
              minLength={2}
              maxLength={100}
              placeholder="Bawon Lakwa"
              className="mt-1 w-full rounded-[6px] border border-[var(--mache-line)] px-3 py-2.5 text-md outline-none focus:border-[var(--mache-primary)]"
            />
          </label>

          <label className="block">
            <span className="text-base font-semibold text-[var(--mache-text)]">
              Adresse de la boutique{" "}
              <span className="font-normal text-[var(--mache-muted)]">
                (facultatif)
              </span>
            </span>
            <input
              name="handle"
              maxLength={60}
              placeholder="bawon-lakwa"
              className="mt-1 w-full rounded-[6px] border border-[var(--mache-line)] px-3 py-2.5 text-md outline-none focus:border-[var(--mache-primary)]"
            />
            <span className="mt-1 block text-sm leading-relaxed text-[var(--mache-muted)]">
              Ce sera l&apos;adresse de votre vitrine : mache.ht/store/
              <strong>votre-adresse</strong>. Laissée vide, elle est
              déduite du nom.
            </span>
          </label>

          <label className="block">
            <span className="text-base font-semibold text-[var(--mache-text)]">
              Ce que vous vendez{" "}
              <span className="font-normal text-[var(--mache-muted)]">
                (facultatif)
              </span>
            </span>
            <textarea
              name="description"
              rows={2}
              maxLength={500}
              placeholder="Artisanat et produits de Port-au-Prince."
              className="mt-1 w-full rounded-[6px] border border-[var(--mache-line)] px-3 py-2.5 text-md outline-none focus:border-[var(--mache-primary)]"
            />
          </label>
        </fieldset>

        <fieldset className="space-y-3 border-t border-[var(--mache-line)] pt-5">
          <legend className="text-md font-bold text-[var(--mache-text)]">
            Votre compte
          </legend>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-base font-semibold text-[var(--mache-text)]">
                Prénom
              </span>
              <input
                name="first_name"
                maxLength={60}
                className="mt-1 w-full rounded-[6px] border border-[var(--mache-line)] px-3 py-2.5 text-md outline-none focus:border-[var(--mache-primary)]"
              />
            </label>

            <label className="block">
              <span className="text-base font-semibold text-[var(--mache-text)]">
                Nom
              </span>
              <input
                name="last_name"
                maxLength={60}
                className="mt-1 w-full rounded-[6px] border border-[var(--mache-line)] px-3 py-2.5 text-md outline-none focus:border-[var(--mache-primary)]"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-base font-semibold text-[var(--mache-text)]">
              Adresse e-mail
            </span>
            <input
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
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-1 w-full rounded-[6px] border border-[var(--mache-line)] px-3 py-2.5 text-md outline-none focus:border-[var(--mache-primary)]"
            />
            <span className="mt-1 block text-sm text-[var(--mache-muted)]">
              Au moins 8 caractères. Ce compte donnera accès à votre
              catalogue et à vos commandes.
            </span>
          </label>
        </fieldset>

        <SubmitButton
          className="w-full rounded-[6px] bg-[var(--mache-primary)] px-5 py-3 text-md font-bold text-white transition-colors hover:bg-[var(--mache-primary-dark)]"
          pendingLabel="Ouverture en cours…"
          pendingHint="Le backend commerce peut être en veille et mettre jusqu'à une minute à répondre. Ne quittez pas la page."
        >
          Ouvrir ma boutique
        </SubmitButton>
      </form>

      {/*
        Dit avant qu'on le demande. Une boutique qui n'apparaît pas dans
        le catalogue sans explication passe pour une inscription ratée.
      */}
      <div className="mt-6 rounded-[10px] border border-[#f3d9a5] bg-[#fdf6e8] p-4">
        <p className="text-base font-bold text-[var(--mache-text)]">
          Votre boutique est relue avant d&apos;être publiée
        </p>
        <p className="mt-1 text-base leading-relaxed text-[var(--mache-muted)]">
          Vous pourrez préparer vos produits et votre vitrine tout de
          suite. Elle n&apos;apparaîtra dans le catalogue qu&apos;une fois
          approuvée par MACHÉ.
        </p>
      </div>

      <p className="mt-5 text-sm text-[var(--mache-muted)]">
        Vous avez déjà une boutique ?{" "}
        <Link
          href="/dashboard/seller/vitrine"
          className="font-semibold text-[var(--mache-primary)] hover:underline"
        >
          Se connecter
        </Link>
      </p>
    </main>
  );
}
