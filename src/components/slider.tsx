"use client";

/*
  UN DÉFILEMENT HORIZONTAL, POUR LE GRAND BANDEAU ET POUR LES RAYONS.

  Deux usages, un seul mécanisme :

  - « hero » : une diapositive à la fois, pleine largeur, avec des
    points et un défilement automatique vers la gauche. Le grand
    bandeau de l'accueil.
  - « rail » : une rangée d'articles ou de boutiques qu'on fait glisser,
    à la place des grilles figées. Défilement automatique facultatif.

  Pourquoi le défilement natif, et pas un carrousel en JavaScript

  Le défilement est celui du navigateur (`scroll-snap`) : au doigt sur
  un téléphone, il glisse et se cale comme n'importe quelle page, sans
  bibliothèque ni calcul de geste. Le JavaScript ne fait qu'avancer
  d'un cran à intervalle régulier, et dessiner les points et les
  flèches. S'il ne se charge pas, tout reste lisible et faisable au
  doigt.

  Le défilement automatique s'arrête de lui-même

  - quand la souris est dessus, quand un élément a le focus clavier,
    et dès qu'on y touche au doigt : on ne fait pas bouger ce que
    quelqu'un est en train de lire ;
  - quand l'onglet est caché ;
  - toujours, pour qui a demandé à son appareil de réduire les
    animations ;
  - et au doigt : on le fait glisser soi-même.
*/

import {
  Children,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type Props = {
  children: ReactNode;
  /* Nom du défilement, lu par les lecteurs d'écran. */
  label: string;
  variant?: "hero" | "rail";
  /* Intervalle du défilement automatique, en millisecondes ; 0 pour aucun. */
  autoplayMs?: number;
  /* Largeur de chaque élément d'un rail (classes Tailwind). */
  itemClassName?: string;
  /* Classes en plus sur la rangée elle-même (effet de survol, marges). */
  trackClassName?: string;
};

export function Slider({
  children,
  label,
  variant = "rail",
  autoplayMs = 0,
  itemClassName = "w-[46%] sm:w-[31%] lg:w-[23%] xl:w-[18.5%]",
  trackClassName = "",
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const items = Children.toArray(children);
  const count = items.length;
  const hero = variant === "hero";

  const [active, setActive] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(count > 1);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const elements = useCallback(
    () => Array.from(trackRef.current?.children ?? []) as HTMLElement[],
    []
  );

  /* Quelle diapositive (ou quel premier article) est à l'écran, et peut-on aller plus loin ? */
  const sync = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const left = track.scrollLeft;
    let nearest = 0;
    let best = Number.POSITIVE_INFINITY;

    elements().forEach((element, index) => {
      const distance = Math.abs(element.offsetLeft - left);
      if (distance < best) {
        best = distance;
        nearest = index;
      }
    });

    setActive(nearest);
    setCanPrev(left > 4);
    setCanNext(left + track.clientWidth < track.scrollWidth - 4);
  }, [elements]);

  useEffect(() => {
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [sync]);

  const goTo = useCallback(
    (index: number) => {
      const track = trackRef.current;
      const target = elements()[index];
      if (!track || !target) return;

      track.scrollTo({ left: target.offsetLeft, behavior: reduced ? "auto" : "smooth" });
    },
    [elements, reduced]
  );

  const step = useCallback(
    (direction: 1 | -1) => {
      const track = trackRef.current;
      if (!track) return;

      if (hero) {
        goTo((active + direction + count) % count);
        return;
      }

      /* Un rail avance d'une largeur d'écran, moins un article pour garder un repère. */
      track.scrollBy({
        left: direction * Math.max(track.clientWidth * 0.8, 160),
        behavior: reduced ? "auto" : "smooth",
      });
    },
    [active, count, goTo, hero, reduced]
  );

  const running =
    autoplayMs > 0 && count > 1 && !reduced && !hovered && !focused && !touched;

  useEffect(() => {
    if (!running) return;

    const id = window.setInterval(() => {
      if (document.hidden) return;

      const track = trackRef.current;
      if (!track) return;

      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;

      if (hero) {
        goTo(atEnd ? 0 : active + 1);
        return;
      }

      if (atEnd) {
        track.scrollTo({ left: 0, behavior: "smooth" });
        return;
      }

      const next = elements()[active + 1];
      track.scrollTo({ left: next ? next.offsetLeft : 0, behavior: "smooth" });
    }, autoplayMs);

    return () => window.clearInterval(id);
  }, [running, autoplayMs, hero, active, goTo, elements]);

  if (count === 0) return null;

  const arrowClass =
    "absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--mache-line)] bg-[var(--mache-white)] text-xl text-[var(--mache-text)] shadow-[0_4px_14px_rgba(16,24,32,0.12)] transition-opacity hover:text-[var(--mache-primary)] disabled:pointer-events-none disabled:opacity-0 sm:flex";

  return (
    <div
      className="relative"
      role="region"
      aria-roledescription={hero ? "carrousel" : undefined}
      aria-label={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
      }}
      onTouchStart={() => setTouched(true)}
    >
      <div
        ref={trackRef}
        onScroll={sync}
        aria-live={running ? "off" : "polite"}
        className={`mache-slider-track relative flex snap-x snap-mandatory overflow-x-auto ${
          hero ? "" : "gap-3 scroll-px-1 px-1 pb-2"
        } ${trackClassName}`}
      >
        {items.map((item, index) => (
          <div
            key={index}
            role={hero ? "group" : undefined}
            aria-roledescription={hero ? "diapositive" : undefined}
            aria-label={hero ? `${index + 1} sur ${count}` : undefined}
            className={`shrink-0 snap-start ${hero ? "w-full" : itemClassName}`}
          >
            {item}
          </div>
        ))}
      </div>

      {/*
        Les flèches d'un rail sont sur ses côtés. Celles du bandeau sont
        en bas, avec les points : posées sur les côtés, elles couvraient
        le début du texte de la diapositive.
      */}
      {!hero && count > 1 && (
        <>
          <button
            type="button"
            onClick={() => step(-1)}
            disabled={!canPrev}
            aria-label="Précédent"
            className={`${arrowClass} -left-2`}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            disabled={!canNext}
            aria-label="Suivant"
            className={`${arrowClass} -right-2`}
          >
            ›
          </button>
        </>
      )}

      {/*
        Le bandeau n'a que ses points : ni flèches ni bouton pause, par
        choix de MACHÉ. Il s'arrête de lui-même au survol, au focus
        clavier et au doigt, et ne défile pas du tout pour qui a demandé
        moins d'animations ; au doigt, on le fait glisser.
      */}
      {hero && count > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2">
          {items.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`Aller à la diapositive ${index + 1} sur ${count}`}
              aria-current={index === active ? "true" : undefined}
              className={`h-2.5 rounded-full transition-all ${
                index === active
                  ? "w-6 bg-[var(--mache-primary)]"
                  : "w-2.5 bg-black/25 ring-1 ring-white/70 hover:bg-black/45"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
