/*
  « NOS PARTENAIRES », SUR L'ACCUEIL — en défilement continu, de gauche
  à droite (l'inverse de « Nos marques », juste au-dessus).

  Le nom de chaque partenaire, ce qu'il fait, et son adresse. Pas de
  logos — MACHÉ n'a l'accord écrit de personne pour en afficher — et pas
  de phrase vendeuse écrite à leur place.

  Aucun partenaire signé : pas de section. Une section « Nos
  partenaires » vide annonce un réseau qui n'existe pas.

  La liste est répétée pour que la boucle se referme sans à-coup ; les
  copies sont cachées aux lecteurs d'écran, qui n'entendent chaque
  partenaire qu'une fois. Le défilement s'arrête au survol, et ne part
  pas pour qui a demandé moins d'animations.

  Les liens sortent du site : `target` et `rel` le disent au
  navigateur, et le picto le dit au visiteur.
*/

import Link from "next/link";
import { PARTNERS } from "@/lib/partners";

export function PartnersStrip() {
  if (PARTNERS.length === 0) return null;

  const copies = Math.max(2, Math.ceil(6 / PARTNERS.length) * 2);

  return (
    <section className="mache-reveal py-6">
      <div className="container-page mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-xl font-bold tracking-tight text-[var(--mache-text)] sm:text-2xl">Nos partenaires</h2>
        <Link href="/partenaires" className="text-sm font-semibold text-[var(--mache-primary)] hover:underline">
          Tous nos partenaires →
        </Link>
      </div>

      <div className="overflow-hidden bg-[var(--mache-gold-soft)] py-4">
        <ul className="mache-marquee-reverse flex w-max gap-6">
          {Array.from({ length: copies }).flatMap((_, copy) =>
            PARTNERS.map((partner) => (
              <li key={`${copy}-${partner.name}`} aria-hidden={copy > 0 ? true : undefined}>
                <a
                  href={partner.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  tabIndex={copy > 0 ? -1 : undefined}
                  className="flex items-baseline gap-3 whitespace-nowrap rounded-[8px] bg-[var(--mache-white)] px-5 py-3 shadow-sm transition-transform hover:scale-105 motion-reduce:transform-none"
                >
                  <span className="text-lg font-black text-[var(--mache-text)]">
                    {partner.name}
                    <span className="ml-1 text-xs text-[var(--mache-muted)]" aria-hidden="true">↗</span>
                    <span className="sr-only"> (site externe)</span>
                  </span>
                  <span className="text-sm text-[var(--mache-muted)]">
                    {partner.does}
                    {!partner.mediated && ` En direct avec ${partner.name}.`}
                  </span>
                </a>
              </li>
            ))
          )}
        </ul>
      </div>
    </section>
  );
}
