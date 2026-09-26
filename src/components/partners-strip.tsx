/*
  LA BANDE DES PARTENAIRES, SUR L'ACCUEIL.

  Juste les noms et leurs adresses. Pas de logos — MACHÉ n'a l'accord
  écrit de personne pour en afficher — et pas de phrase vendeuse écrite
  à leur place.

  Aucun partenaire signé : pas de bande. Une section « Nos partenaires »
  vide, ou meublée de cases grises, annonce un réseau qui n'existe pas.

  Les liens sortent du site : `target` et `rel` le disent au navigateur,
  et le picto le dit au visiteur, pour que personne ne croie rester sur
  MACHÉ.
*/

import { PARTNERS } from "@/lib/partners";

export function PartnersStrip() {
  if (PARTNERS.length === 0) return null;

  return (
    <section className="mache-reveal container-page py-5">
      <div className="rounded-[10px] border border-[var(--mache-line)] bg-[var(--mache-white)] p-5">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--mache-muted)]">
            Nos partenaires
          </h2>

          {PARTNERS.map((partner) => (
            <a
              key={partner.name}
              href={partner.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-md font-bold text-[var(--mache-text)] underline-offset-4 hover:underline"
            >
              {partner.name}
              <span className="ml-1 text-xs text-[var(--mache-muted)]" aria-hidden="true">
                ↗
              </span>
              <span className="sr-only"> (site externe)</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
