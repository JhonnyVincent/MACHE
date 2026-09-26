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

import { Link } from "next-view-transitions";
import { redirect } from "next/navigation";
import { getVendorSeller } from "@/lib/medusa/vendor";
import { SELLER_PROFILES, readSellerProfile } from "@/lib/seller-profile";
import { readSellerMinimum } from "@/lib/seller-minimum";
import { STOREFRONT_THEMES, readSellerTheme } from "@/lib/storefront/themes";
import { saveProfileAction, saveMinimumAction, saveThemeAction } from "./actions";

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
  const minimum = readSellerMinimum(seller.metadata);
  const theme = readSellerTheme(seller.metadata);

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
        Le thème de la vitrine.

        Une liste fermée, et non un sélecteur de couleur : un choix
        libre produit des vitrines illisibles. Chaque thème de cette
        liste a un contraste mesuré et vérifié — deux candidats ont été
        écartés pour cette raison.
      */}
      <section className="mt-8 border-t border-[var(--mache-line)] pt-6">
        <h2 className="text-xl font-bold tracking-tight text-[var(--mache-text)]">
          Couleurs de ma vitrine
        </h2>

        <p className="mt-1.5 text-md leading-relaxed text-[var(--mache-muted)]">
          Les couleurs de vos boutons et de vos bandeaux. Le fond et le
          texte restent ceux de MACHÉ : c&apos;est ce qui garde votre
          boutique lisible, et reconnaissable comme une boutique MACHÉ.
        </p>

        <form action={saveThemeAction} className="mt-4">
          <div className="grid gap-2.5 sm:grid-cols-2">
            {STOREFRONT_THEMES.map((entry) => (
              <label
                key={entry.id}
                className={`flex cursor-pointer items-start gap-3 rounded-[10px] border p-3 transition-colors ${
                  theme.id === entry.id
                    ? "border-[var(--mache-text)] bg-[var(--mache-bg)]"
                    : "border-[var(--mache-line)] bg-white hover:border-[var(--mache-text)]"
                }`}
              >
                <input
                  type="radio"
                  name="theme"
                  value={entry.id}
                  defaultChecked={theme.id === entry.id}
                  className="mt-1 shrink-0"
                />

                <span className="min-w-0 flex-1">
                  <span className="block text-base font-bold text-[var(--mache-text)]">
                    {entry.label}
                  </span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-[var(--mache-muted)]">
                    {entry.hint}
                  </span>

                  {/* L'aperçu : ce que le client verra vraiment. */}
                  <span className="mt-2 flex items-center gap-1.5">
                    <span
                      className="rounded-[4px] px-2.5 py-1 text-xs font-bold text-white"
                      style={{ backgroundColor: entry.primary }}
                    >
                      Acheter
                    </span>
                    <span
                      className="rounded-[4px] px-2.5 py-1 text-xs font-semibold"
                      style={{ backgroundColor: entry.soft, color: entry.dark }}
                    >
                      Annonce
                    </span>
                    <span
                      className="rounded-[4px] px-2.5 py-1 text-xs font-semibold text-white"
                      style={{ backgroundColor: entry.hero }}
                    >
                      Bandeau
                    </span>
                  </span>
                </span>
              </label>
            ))}
          </div>

          <button
            type="submit"
            className="mt-3 rounded-[6px] bg-[var(--mache-text)] px-5 py-2.5 text-md font-bold text-white transition-colors hover:bg-black"
          >
            Enregistrer les couleurs
          </button>
        </form>
      </section>

      {/*
        La commande minimum. Elle vit sous le profil parce qu'elle en
        découle : c'est une condition de vente, au même titre que le
        fait de se présenter comme grossiste.
      */}
      <section className="mt-8 border-t border-[var(--mache-line)] pt-6">
        <h2 className="text-xl font-bold tracking-tight text-[var(--mache-text)]">
          Commande minimum
        </h2>

        <p className="mt-1.5 text-md leading-relaxed text-[var(--mache-muted)]">
          Le montant en dessous duquel vous ne servez pas une commande.
          Laissez vide si vous vendez sans minimum — c&apos;est le cas de
          la plupart des boutiques.
        </p>

        <form action={saveMinimumAction} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="text-base font-semibold text-[var(--mache-text)]">
              Montant minimum
            </span>
            <span className="mt-1 flex items-center gap-2">
              <input
                name="min_order"
                inputMode="numeric"
                defaultValue={minimum > 0 ? String(minimum) : ""}
                placeholder="0"
                className="w-40 rounded-[6px] border border-[var(--mache-line)] px-3 py-2.5 text-md outline-none focus:border-[var(--mache-primary)]"
              />
              <span className="text-md font-semibold text-[var(--mache-muted)]">
                HTG
              </span>
            </span>
          </label>

          <button
            type="submit"
            className="rounded-[6px] bg-[var(--mache-text)] px-5 py-2.5 text-md font-bold text-white transition-colors hover:bg-black"
          >
            Enregistrer
          </button>
        </form>

        {/*
          Ce que cela fait, exactement. Un vendeur doit savoir que cela
          bloque une commande, et sur quoi porte le calcul.
        */}
        <p className="mt-3 text-sm leading-relaxed text-[var(--mache-muted)]">
          Le montant porte sur <strong>vos articles seuls</strong>. Un
          client qui achète aussi chez d&apos;autres boutiques doit
          atteindre votre minimum avec ce qu&apos;il prend chez vous. En
          dessous, il ne peut pas valider sa commande, et le panier lui
          dit ce qui manque.
        </p>
      </section>

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
