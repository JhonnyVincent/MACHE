/*
  « NOS PARTENAIRES », SUR L'ACCUEIL — des blocs qui défilent lentement,
  de gauche à droite.

  Deux sortes de blocs, et on ne les confond pas :

  1. LES PARTENAIRES SIGNÉS (src/lib/partners.ts) : leur nom, ce qu'ils
     font, leur adresse. Pas de logos — MACHE n'a l'accord écrit de
     personne pour en afficher.

  2. LES RÔLES OUVERTS : la livraison et les points relais. Ce ne sont
     PAS des entreprises partenaires — aucune n'a signé. Afficher
     « Shipping » ou « Point relais » comme des noms de partenaires
     ferait croire à un réseau de livraison qui n'existe pas encore.
     Ils sont donc présentés pour ce qu'ils sont : des places à prendre,
     avec « Devenir partenaire ». Les points relais sont d'ailleurs déjà
     gérés par MACHE (dépôt du colis, remise contre le code de
     l'acheteur) : il ne manque que les commerces pour les tenir.

  Aucun partenaire signé : pas de section. Une section « Nos
  partenaires » sans partenaire annonce un réseau qui n'existe pas.

  La rangée est répétée pour que la boucle se referme sans à-coup ; les
  copies sont cachées aux lecteurs d'écran. Le défilement est lent,
  s'arrête au survol, et ne part pas pour qui a demandé moins
  d'animations.

  Les liens externes le disent : `target`, `rel`, et le picto.
*/

import { Link } from "next-view-transitions";
import { PinIcon, TruckIcon } from "@/components/icons";
import { PARTNERS } from "@/lib/partners";

/* Les places à prendre — des rôles, pas des entreprises. */
const OPEN_ROLES = [
  {
    key: "livraison",
    Icon: TruckIcon,
    title: "Livraison",
    text: "Transporteurs et coursiers qui acheminent les colis entre vendeurs et acheteurs.",
    tone: "border-dashed border-[var(--mache-line)] bg-[var(--mache-white)]",
  },
  {
    key: "points-relais",
    Icon: PinIcon,
    title: "Points relais",
    text: "Des commerces de quartier qui gardent les colis jusqu'à ce que l'acheteur vienne les chercher.",
    /* Vert léger, nuancé de blanc, voulu par MACHE pour les points relais. */
    /* Vert léger, voulu par MACHE pour les points relais. */
    tone: "border-[var(--mache-success-line)] bg-[var(--mache-success-soft)]",
  },
];

const block =
  "flex h-full w-[280px] flex-col rounded-[8px] border p-6 transition-colors hover:border-[var(--mache-text)] sm:w-[320px]";

export function PartnersStrip() {
  if (PARTNERS.length === 0) return null;

  const copies = 4;

  return (
    <section className="mache-reveal py-10">
      <div className="container-page mb-6 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-2xl text-[var(--mache-text)]">Nos partenaires</h2>
        <Link href="/partenaires" className="text-sm font-semibold text-[var(--mache-primary)] hover:underline">
          Tous nos partenaires →
        </Link>
      </div>

      <div className="overflow-hidden py-3">
        <ul className="mache-marquee-reverse mache-marquee-slow flex w-max items-stretch gap-4">
          {Array.from({ length: copies }).flatMap((_, copy) => [
            ...PARTNERS.map((partner) => (
              <li key={`${copy}-${partner.name}`} aria-hidden={copy > 0 ? true : undefined}>
                <a
                  href={partner.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  tabIndex={copy > 0 ? -1 : undefined}
                  className={`${block} border-[var(--mache-line)] bg-[var(--mache-white)] text-[var(--mache-text)]`}
                >
                  <span className="text-sm font-semibold text-[var(--mache-muted)]">Partenaire</span>
                  <span className="mt-2 font-display text-xl font-semibold">
                    {partner.name}
                    <span className="ml-1 text-sm text-[var(--mache-muted)]" aria-hidden="true">↗</span>
                    <span className="sr-only"> (site externe)</span>
                  </span>
                  <span className="mt-2 text-sm leading-relaxed text-[var(--mache-muted)]">{partner.does}</span>
                  {!partner.mediated && (
                    <span className="mt-auto pt-3 text-xs text-[var(--mache-muted)]">En direct avec {partner.name}.</span>
                  )}
                </a>
              </li>
            )),
            ...OPEN_ROLES.map((role) => (
              <li key={`${copy}-${role.key}`} aria-hidden={copy > 0 ? true : undefined}>
                <Link
                  href="/partenaires"
                  tabIndex={copy > 0 ? -1 : undefined}
                  className={`${block} ${role.tone}`}
                >
                  <span className="text-sm font-semibold text-[var(--mache-muted)]">
                    Place à prendre
                  </span>
                  <span className="mt-2 font-display text-xl font-semibold text-[var(--mache-text)]">
                    <role.Icon className="mr-2 inline h-5 w-5 align-[-3px] text-[var(--mache-primary)]" />
                    {role.title}
                  </span>
                  <span className="mt-2 text-sm leading-relaxed text-[var(--mache-muted)]">{role.text}</span>
                  <span className="mt-auto pt-3 text-sm font-semibold text-[var(--mache-primary)]">Devenir partenaire →</span>
                </Link>
              </li>
            )),
          ])}
        </ul>
      </div>
    </section>
  );
}
