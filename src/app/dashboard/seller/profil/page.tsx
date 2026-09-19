/*
  PAGE : le profil de ma boutique.

  MACHÉ annonce quatre façons de vendre, chacune avec sa page de
  présentation. Jusqu'ici, le choix s'arrêtait à cette page : rien dans
  le système ne retenait le profil d'une boutique, et un acheteur ne
  pouvait pas distinguer une personne qui vend trois objets d'un
  grossiste qui vend par palettes.

  Ce que ce choix fait, et ce qu'il ne fait pas

  Il s'affiche sur la boutique et permet de filtrer le catalogue. Il ne
  donne aucun droit supplémentaire, ne change ni les commissions ni les
  frais, et n'est pas vérifié par MACHÉ — c'est une déclaration du
  vendeur, et la boutique l'affiche comme telle.

  Un profil qui promettrait un contrôle inexistant tromperait l'acheteur
  plus sûrement que pas de profil du tout.
*/

import Link from "next/link";
import { redirect } from "next/navigation";
import { getVendorSeller } from "@/lib/medusa/vendor";
import { SELLER_PROFILES, readSellerProfile } from "@/lib/seller-profile";
import { saveProfileAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function SellerProfilePage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; success?: string }>;
}) {
  const query = searchParams ? await searchParams : {};
  const seller = await getVendorSeller();

  if (!seller) redirect("/dashboard/seller/vitrine");

  const current = readSellerProfile(seller.metadata);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <div className="border-b border-[var(--mache-line)] pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--mache-text)]">
          Profil de ma boutique
        </h1>
        <p className="mt-1 text-base text-[var(--mache-muted)]">
          {seller.name} ·{" "}
          <Link
            href={`/store/${seller.handle}`}
            className="text-[var(--mache-primary)] hover:underline"
          >
            voir la page publique
          </Link>
        </p>
      </div>

      {query.error && (
        <div className="mt-4 rounded-[8px] border border-[#f2c2c8] bg-[#fdeaec] px-4 py-3 text-base text-[#b01124]">
          {decodeURIComponent(query.error)}
        </div>
      )}

      {query.success && (
        <div className="mt-4 rounded-[8px] border border-[#b7dfc9] bg-[#f4fbf7] px-4 py-3 text-base text-[#046c4e]">
          {decodeURIComponent(query.success)}
        </div>
      )}

      <p className="mt-6 text-md leading-relaxed text-[var(--mache-muted)]">
        Ce que vous choisissez ici s&apos;affiche sur votre boutique et
        permet aux acheteurs de filtrer le catalogue. Cela ne change ni vos
        droits, ni vos commissions.
      </p>

      <form action={saveProfileAction} className="mt-5 space-y-2.5">
        {SELLER_PROFILES.map((entry) => (
          <label
            key={entry.id}
            className={`flex cursor-pointer gap-3 rounded-[10px] border p-4 transition-colors ${
              current === entry.id
                ? "border-[var(--mache-primary)] bg-[var(--mache-primary-soft)]"
                : "border-[var(--mache-line)] bg-white hover:border-[var(--mache-primary)]"
            }`}
          >
            <input
              type="radio"
              name="profile"
              value={entry.id}
              defaultChecked={current === entry.id}
              className="mt-1 shrink-0"
            />

            <span className="min-w-0">
              <span className="block text-md font-bold text-[var(--mache-text)]">
                {entry.label}
              </span>
              <span className="mt-0.5 block text-base leading-relaxed text-[var(--mache-muted)]">
                {entry.meaning}
              </span>
              <Link
                href={entry.sellPage}
                className="mt-1.5 inline-block text-sm font-semibold text-[var(--mache-primary)] hover:underline"
              >
                Ce que ce profil propose
              </Link>
            </span>
          </label>
        ))}

        <button
          type="submit"
          className="mt-3 rounded-[6px] bg-[var(--mache-text)] px-5 py-2.5 text-md font-bold text-white transition-colors hover:bg-black"
        >
          Enregistrer mon profil
        </button>
      </form>

      {/*
        Dit avant qu'on le demande : ce badge n'est pas une vérification.
        Le laisser croire serait tromper l'acheteur, et donner au vendeur
        une confiance qu'il n'a pas gagnée.
      */}
      <p className="mt-6 border-t border-[var(--mache-line)] pt-4 text-sm leading-relaxed text-[var(--mache-muted)]">
        Votre boutique affichera ce profil comme une déclaration de votre
        part. Ce n&apos;est pas un badge de vérification : MACHÉ ne contrôle
        pas ce choix, et l&apos;acheteur en est informé.
      </p>

      <p className="mt-4 text-sm text-[var(--mache-muted)]">
        <Link
          href="/dashboard/seller/vitrine"
          className="font-semibold hover:underline"
        >
          ← Personnaliser ma vitrine
        </Link>
      </p>
    </main>
  );
}
