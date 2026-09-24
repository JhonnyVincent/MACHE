"use client";

/*
  Carte d'Haïti, département par département.

  Ce qu'elle fait

  On survole ou on sélectionne un département : son tracé se détache,
  et un panneau donne son chef-lieu, quelques lignes sur lui, et les
  boutiques MACHÉ qui s'y trouvent.

  Pourquoi en SVG et pas en trois dimensions

  Les dix départements pèsent ensemble moins de dix kilo-octets. Un
  globe en trois dimensions demande une bibliothèque de plusieurs
  centaines — sur un site consulté en Haïti depuis un forfait mobile
  facturé au volume, c'est une décision qui se paie à chaque visite.

  Et un SVG se navigue au clavier, se lit par un lecteur d'écran, et
  s'imprime. Un canevas 3D ne fait rien de tout cela.

  Accessibilité

  Chaque département est un bouton : atteignable à la tabulation,
  activable à l'entrée ou à l'espace. Le panneau est annoncé aux
  lecteurs d'écran quand il change. Les transitions s'effacent pour qui
  a demandé moins de mouvement.
*/

import { useId, useState } from "react";
import Link from "next/link";
import { DEPARTMENTS, HAITI_VIEWBOX, type Department } from "@/lib/haiti";

export type DepartmentShops = Record<string, number>;

export function HaitiMap({ shops = {} }: { shops?: DepartmentShops }) {
  /*
    L'Ouest par défaut, et non le premier de la liste alphabétique :
    c'est Port-au-Prince, de loin le département le plus peuplé et
    celui par lequel passe l'essentiel du commerce. Ouvrir sur le
    Centre — premier dans l'ordre des noms — donnerait une première
    image qui ne dit rien de ce que le pays achète.
  */
  const [active, setActive] = useState<Department>(
    DEPARTMENTS.find((entry) => entry.slug === "ouest") ?? DEPARTMENTS[0]
  );
  const titleId = useId();

  const count = shops[active.slug] ?? 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-center">
      <div className="rounded-[12px] border border-[var(--mache-line)] bg-white p-3 sm:p-5">
        <svg
          viewBox={HAITI_VIEWBOX}
          role="group"
          aria-labelledby={titleId}
          className="h-auto w-full"
        >
          <title id={titleId}>
            Carte d&apos;Haïti : ses dix départements
          </title>

          {DEPARTMENTS.map((department) => {
            const selected = department.slug === active.slug;

            return (
              <path
                key={department.slug}
                d={department.d}
                tabIndex={0}
                role="button"
                aria-pressed={selected}
                aria-label={`${department.name}, chef-lieu ${department.capital}`}
                onMouseEnter={() => setActive(department)}
                onFocus={() => setActive(department)}
                onClick={() => setActive(department)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setActive(department);
                  }
                }}
                className={`cursor-pointer outline-none transition-[fill] duration-200 motion-reduce:transition-none ${
                  selected
                    ? "fill-[var(--mache-primary)]"
                    : "fill-[var(--mache-primary-soft)] hover:fill-[var(--mache-primary-dark)]"
                } focus-visible:stroke-[var(--mache-dark)]`}
                stroke="#fff"
                strokeWidth={2.5}
                style={{ strokeWidth: selected ? 3.5 : 2.5 }}
              />
            );
          })}
        </svg>

        <p className="mt-2 text-center text-xs text-[var(--mache-muted)]">
          Survolez un département, ou parcourez-les à la tabulation.
        </p>
      </div>

      {/*
        `aria-live` : le panneau change sans que la page bouge. Sans
        cela, une personne qui navigue au clavier entendrait le nom du
        département mais rien de ce qu'on en dit.
      */}
      <div aria-live="polite" className="min-w-0">
        <p className="text-sm font-bold uppercase tracking-label text-[var(--mache-primary)]">
          Chef-lieu : {active.capital}
        </p>

        <h3 className="mt-1 text-2xl font-bold tracking-tight text-[var(--mache-text)] sm:text-3xl">
          {active.name}
        </h3>

        <p className="mt-3 text-md leading-relaxed text-[var(--mache-muted)]">
          {active.text}
        </p>

        <div className="mt-5 rounded-[10px] border border-[var(--mache-line)] bg-[var(--mache-bg)] p-4">
          {count > 0 ? (
            <>
              <p className="text-md font-bold text-[var(--mache-text)]">
                {count} boutique{count > 1 ? "s" : ""} dans ce département
              </p>

              <Link
                href={`/shop?departement=${encodeURIComponent(active.slug)}`}
                className="mt-2 inline-block text-base font-semibold text-[var(--mache-primary)] hover:underline"
              >
                Voir ce qu&apos;on y vend
              </Link>
            </>
          ) : (
            /*
              Aucune boutique. On le dit, et on n'invente rien : une
              carte qui afficherait des chiffres flatteurs se
              démentirait au premier clic.
            */
            <>
              <p className="text-md font-bold text-[var(--mache-text)]">
                Aucune boutique déclarée ici pour l&apos;instant
              </p>

              <p className="mt-1 text-base leading-relaxed text-[var(--mache-muted)]">
                Les boutiques apparaissent sur cette carte quand elles
                renseignent leur adresse.{" "}
                <Link
                  href="/sell"
                  className="font-semibold text-[var(--mache-primary)] hover:underline"
                >
                  Vous vendez depuis ce département ?
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
