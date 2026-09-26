"use client";

/*
  DES ÉLÉMENTS QUI ENTRENT EN CASCADE, UN PAR UN.

  Motion, version « mini » : elle confie l'animation au navigateur
  lui-même (Web Animations), d'où son poids de quelques kilo-octets —
  contre une vingtaine pour le moteur complet.

  Les éléments sont visibles dès le départ, rendus par le serveur :
  l'animation ne part qu'à leur entrée à l'écran, une seule fois, et
  jamais pour qui a demandé moins d'animations.
*/

import { animate } from "motion/mini";
import { useEffect, useRef, type ReactNode } from "react";

export function StaggerIn({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const list = ref.current;
    if (!list) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();

        Array.from(list.children).forEach((child, index) => {
          animate(
            child,
            { opacity: [0, 1], transform: ["translateY(14px)", "translateY(0)"] },
            { duration: 0.4, delay: index * 0.05, ease: "easeOut" }
          );
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(list);
    return () => observer.disconnect();
  }, []);

  return (
    <ul ref={ref} className={className}>
      {children}
    </ul>
  );
}
