/*
  ÉCRAN : page introuvable (erreur 404).

  Il remplace la page anglaise de Next.js, « This page could not be
  found », qui laissait le visiteur sans aucune sortie.

  Les cas les plus fréquents : un lien partagé vers un produit retiré,
  une boutique renommée, une adresse mal recopiée. Le visiteur cherchait
  quelque chose : on lui propose de le chercher, puis les portes
  principales du site.
*/

import { Link } from "next-view-transitions";
import { privateMetadata } from "@/lib/seo";

export const metadata = privateMetadata("Page introuvable");

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16 text-center">
      <p className="text-sm font-bold uppercase tracking-widest text-[var(--mache-primary)]">Erreur 404</p>

      <h1 className="mt-2 text-3xl font-black text-[var(--mache-text)]">Cette page n&apos;existe pas (ou plus)</h1>

      <p className="mx-auto mt-3 max-w-lg text-md leading-relaxed text-[var(--mache-muted)]">
        Le produit a peut-être été retiré par son vendeur, ou l&apos;adresse a été mal recopiée. Cherchez
        ce que vous vouliez voir :
      </p>

      <form action="/shop" method="get" className="mx-auto mt-6 flex max-w-md gap-2" role="search">
        <label htmlFor="recherche-404" className="sr-only">
          Rechercher un produit ou une boutique
        </label>
        <input
          id="recherche-404"
          type="search"
          name="q"
          placeholder="Rechercher un produit, une boutique…"
          className="min-w-0 flex-1 rounded-[6px] border border-[var(--mache-line)] bg-white px-4 py-2.5 text-md"
        />
        <button
          type="submit"
          className="rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-md font-bold text-white hover:bg-[var(--mache-primary-dark)]"
        >
          Chercher
        </button>
      </form>

      <nav aria-label="Pages principales" className="mt-8 flex flex-wrap justify-center gap-3 text-md font-semibold">
        <Link href="/" className="rounded-[6px] border border-[var(--mache-line)] bg-white px-4 py-2 hover:border-[var(--mache-primary)]">
          Accueil
        </Link>
        <Link href="/shop" className="rounded-[6px] border border-[var(--mache-line)] bg-white px-4 py-2 hover:border-[var(--mache-primary)]">
          Tout le catalogue
        </Link>
        <Link href="/sell" className="rounded-[6px] border border-[var(--mache-line)] bg-white px-4 py-2 hover:border-[var(--mache-primary)]">
          Vendre sur MACHE
        </Link>
        <Link href="/contact" className="rounded-[6px] border border-[var(--mache-line)] bg-white px-4 py-2 hover:border-[var(--mache-primary)]">
          Nous écrire
        </Link>
      </nav>
    </main>
  );
}
