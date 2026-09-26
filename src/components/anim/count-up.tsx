"use client";

/*
  UN CHIFFRE QUI MONTE JUSQU'À SA VALEUR.

  Quelques lignes, sans bibliothèque. La fonction `animate` de Motion
  faisait la même chose, mais son moteur ajoutait une vingtaine de
  kilo-octets à l'accueil — mesuré — pour un simple compteur. Motion
  sert ailleurs, dans sa version « mini » (voir stagger-in.tsx).

  Le chiffre final est dans la page dès le départ, rendu par le
  serveur : sans JavaScript, ou pour qui a demandé moins d'animations,
  il s'affiche tel quel. L'animation ne part qu'une fois le chiffre
  visible à l'écran, et une seule fois.
*/

import { useEffect, useRef } from "react";

const DURATION_MS = 1200;

export function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || value <= 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();

      const start = performance.now();

      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / DURATION_MS);
        const eased = 1 - Math.pow(1 - progress, 3);
        node.textContent = String(Math.round(value * eased));
        if (progress < 1) frame = requestAnimationFrame(tick);
      };

      frame = requestAnimationFrame(tick);
    });

    observer.observe(node);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);

  return <span ref={ref}>{value}</span>;
}
