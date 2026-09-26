/*
  « NOS PARTENAIRES », SUR L'ACCUEIL.

  Un bandeau entre deux rangées d'articles : le nom de chaque
  partenaire, ce qu'il fait, et son adresse. Pas de logos — MACHÉ n'a
  l'accord écrit de personne pour en afficher — et pas de phrase
  vendeuse écrite à leur place.

  Aucun partenaire signé : pas de bandeau. Une section « Nos
  partenaires » vide, ou meublée de cases grises, annonce un réseau
  qui n'existe pas.

  Le service d'un partenaire se traite en direct avec lui (voir
  `mediated` dans src/lib/partners.ts) : le bandeau le dit, pour qu'un
  vendeur ne croie pas qu'ouvrir une boutique ici lui ouvre un
  financement.

  Les liens sortent du site : `target` et `rel` le disent au
  navigateur, et le picto le dit au visiteur.
*/

import Link from "next/link";
import { PARTNERS } from "@/lib/partners";

export function PartnersStrip() {
  if (PARTNERS.length === 0) return null;

  return (
    <section className="mache-reveal container-page py-5">
      <div className="rounded-[10px] border border-[var(--mache-line)] bg-[var(--mache-gold-soft)] p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-xl font-black tracking-tight text-[var(--mache-text)]">
            Nos partenaires
          </h2>
          <Link
            href="/partenaires"
            className="text-sm font-semibold text-[var(--mache-primary)] hover:underline"
          >
            Tous nos partenaires →
          </Link>
        </div>

        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {PARTNERS.map((partner) => (
            <li key={partner.name}>
              <a
                href={partner.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group block h-full rounded-[8px] bg-[var(--mache-white)] p-4 transition-shadow hover:shadow-[0_6px_20px_rgba(16,24,32,0.10)]"
              >
                <span className="text-lg font-black text-[var(--mache-text)] group-hover:underline">
                  {partner.name}
                  <span className="ml-1 text-xs text-[var(--mache-muted)]" aria-hidden="true">
                    ↗
                  </span>
                  <span className="sr-only"> (site externe)</span>
                </span>
                <span className="mt-1 block text-base leading-relaxed text-[var(--mache-muted)]">
                  {partner.does}
                </span>
                {!partner.mediated && (
                  <span className="mt-1 block text-sm text-[var(--mache-muted)]">
                    En direct avec {partner.name}, selon ses propres critères.
                  </span>
                )}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
