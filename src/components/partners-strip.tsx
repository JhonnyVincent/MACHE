/*
  « NOS PARTENAIRES », SUR L'ACCUEIL — des blocs qui défilent lentement,
  de gauche à droite.

  Deux sortes de blocs, et on ne les confond pas :

  1. LES PARTENAIRES SIGNÉS (src/lib/partners.ts) : leur nom, ce qu'ils
     font, leur adresse. Pas de logos — MACHÉ n'a l'accord écrit de
     personne pour en afficher.

  2. LES RÔLES OUVERTS : la livraison et les points relais. Ce ne sont
     PAS des entreprises partenaires — aucune n'a signé. Afficher
     « Shipping » ou « Point relais » comme des noms de partenaires
     ferait croire à un réseau de livraison qui n'existe pas encore.
     Ils sont donc présentés pour ce qu'ils sont : des places à prendre,
     avec « Devenir partenaire ». Les points relais sont d'ailleurs déjà
     gérés par MACHÉ (dépôt du colis, remise contre le code de
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
import { PARTNERS } from "@/lib/partners";

/* Les places à prendre — des rôles, pas des entreprises. */
const OPEN_ROLES = [
  {
    key: "livraison",
    icon: "🚚",
    title: "Livraison",
    text: "Transporteurs et coursiers qui acheminent les colis entre vendeurs et acheteurs.",
    tone: "border-dashed border-[var(--mache-line)] bg-[var(--mache-white)]",
  },
  {
    key: "points-relais",
    icon: "📍",
    title: "Points relais",
    text: "Des commerces de quartier qui gardent les colis jusqu'à ce que l'acheteur vienne les chercher.",
    /* Vert léger, nuancé de blanc, voulu par MACHÉ pour les points relais. */
    tone: "border-[#bbf7d0] bg-gradient-to-br from-[#f0fdf4] via-white to-[#dcfce7]",
  },
];

const block =
  "flex h-full w-[280px] flex-col rounded-[12px] border p-5 transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:shadow-[0_10px_26px_rgba(16,24,32,0.14)] motion-reduce:transform-none sm:w-[320px]";

export function PartnersStrip() {
  if (PARTNERS.length === 0) return null;

  const copies = 4;

  return (
    <section className="mache-reveal py-6">
      <div className="container-page mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-xl font-bold tracking-tight text-[var(--mache-text)] sm:text-2xl">Nos partenaires</h2>
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
                  className={`${block} border-[#1e3a8a] bg-[#1e3a8a] text-white`}
                >
                  <span className="text-xs font-bold uppercase tracking-widest text-white/70">Partenaire</span>
                  <span className="mt-2 text-2xl font-black">
                    {partner.name}
                    <span className="ml-1 text-sm text-white/70" aria-hidden="true">↗</span>
                    <span className="sr-only"> (site externe)</span>
                  </span>
                  <span className="mt-2 text-sm leading-relaxed text-white/85">{partner.does}</span>
                  {!partner.mediated && (
                    <span className="mt-auto pt-3 text-xs text-white/65">En direct avec {partner.name}.</span>
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
                  <span className="text-xs font-bold uppercase tracking-widest text-[var(--mache-gold)]">
                    Place à prendre
                  </span>
                  <span className="mt-2 text-2xl font-black text-[var(--mache-text)]">
                    <span aria-hidden="true">{role.icon} </span>
                    {role.title}
                  </span>
                  <span className="mt-2 text-sm leading-relaxed text-[var(--mache-muted)]">{role.text}</span>
                  <span className="mt-auto pt-3 text-sm font-bold text-[var(--mache-primary)]">Devenir partenaire →</span>
                </Link>
              </li>
            )),
          ])}
        </ul>
      </div>
    </section>
  );
}
