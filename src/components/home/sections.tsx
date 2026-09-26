/*
  LES SECTIONS QUI RYTHMENT L'ACCUEIL, ENTRE LES RANGÉES D'ARTICLES.

  L'accueil alterne : une proposition d'articles, puis quelque chose
  d'autre — parcourir les rayons, ouvrir une boutique, les partenaires,
  vérifier un agent. Une page qui empile les rangées de produits l'une
  sous l'autre se lit comme un entrepôt ; intercalées, elles se lisent
  comme un marché.
*/

import Link from "next/link";
import { CATEGORY_TREE } from "@/lib/categories";

/*
  PARCOURIR LES RAYONS — gardé tel qu'il était : une bande de liens, un
  par rayon principal de MACHÉ, avec son icône. Pas de cartes, pas de
  blocs : on voit tous les rayons d'un coup d'œil.
*/
export function BrowseRayons() {
  return (
    <section className="mache-reveal container-page py-5">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 className="text-xl font-bold tracking-tight text-[var(--mache-text)] sm:text-2xl">
          Parcourir les rayons
        </h2>
        <Link href="/shop" className="text-sm font-semibold text-[var(--mache-primary)] hover:underline">
          Tout le catalogue
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORY_TREE.map((category) => (
          <Link
            key={category.slug}
            href={`/shop?category=${category.slug}`}
            className="rounded-[6px] border border-[var(--mache-line)] bg-[var(--mache-white)] px-3.5 py-2 text-base font-medium text-[var(--mache-text)] transition-colors hover:border-[var(--mache-primary)] hover:text-[var(--mache-primary)]"
          >
            {category.icon && <span aria-hidden="true">{category.icon} </span>}
            {category.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

/*
  « VOUS VENDEZ QUELQUE CHOSE ? »

  La phrase « profitez d'un catalogue déjà visité » a été retirée :
  MACHÉ démarre, et promettre de l'audience à un vendeur avant d'en
  avoir, c'est lui vendre ce qu'on n'a pas.
*/
export function SellCta() {
  return (
    <section className="mache-reveal container-page py-5">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[10px] bg-[var(--mache-dark)] p-6 text-white">
        <div>
          <h2 className="text-xl font-black tracking-tight">Vous vendez quelque chose ?</h2>
          <p className="mt-1.5 max-w-xl text-base leading-relaxed text-white/70">
            Ouvrez votre boutique sur MACHÉ et gardez votre marque.
            Particuliers, entreprises, fournisseurs et marques officielles.
          </p>
        </div>

        <Link
          href="/sell"
          className="rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-md font-bold text-white transition-colors hover:bg-[var(--mache-primary-strong)]"
        >
          Commencer à vendre
        </Link>
      </div>
    </section>
  );
}

/*
  VÉRIFIER UN AGENT — directement depuis l'accueil.

  Le formulaire envoie vers la page de vérification, qui interroge le
  registre des agents côté serveur. Rien n'est vérifié ici : cette
  section n'est qu'une porte, pour qu'on n'ait pas à chercher la page
  au moment où quelqu'un sonne à la porte.
*/
export function VerifyAgentBanner() {
  return (
    <section className="mache-reveal container-page py-5">
      <div className="grid items-center gap-5 rounded-[10px] border border-[var(--mache-line)] bg-[var(--mache-success-soft)] p-6 lg:grid-cols-[1fr_auto]">
        <div>
          <h2 className="text-xl font-black tracking-tight text-[var(--mache-text)]">
            <span aria-hidden="true">✅ </span>
            Vérifier un agent MACHÉ
          </h2>
          <p className="mt-1.5 max-w-xl text-base leading-relaxed text-[var(--mache-muted)]">
            Quelqu&apos;un se présente comme agent MACHÉ ? Demandez-lui son
            code et vérifiez-le avant de lui remettre un colis ou de
            l&apos;argent.
          </p>
        </div>

        <form action="/verify-agent" method="GET" className="flex w-full flex-col gap-2 sm:flex-row lg:w-[380px]">
          <label htmlFor="home-agent-code" className="sr-only">
            Code de l&apos;agent
          </label>
          <input
            id="home-agent-code"
            name="code"
            required
            autoComplete="off"
            autoCapitalize="characters"
            placeholder="MCH-AG-0000"
            className="w-full rounded-[6px] border border-[var(--mache-line)] bg-[var(--mache-white)] px-3 py-2.5 text-md uppercase tracking-label outline-none focus:border-[var(--mache-primary)]"
          />
          <button
            type="submit"
            className="shrink-0 rounded-[6px] bg-[var(--mache-success)] px-5 py-2.5 text-md font-bold text-white transition-opacity hover:opacity-90"
          >
            Vérifier
          </button>
        </form>
      </div>
    </section>
  );
}
