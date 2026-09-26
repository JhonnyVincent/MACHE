"use client";

/*
  UNE LISTE QUI BOUGE QUAND ELLE CHANGE — AutoAnimate.

  Un article retiré du panier glisse hors de la liste, les autres se
  resserrent ; un article ajouté y entre en douceur. Quelques kilo-octets,
  et aucune ligne d'animation à écrire. AutoAnimate se coupe de lui-même
  pour qui a demandé à son appareil de réduire les animations.
*/

import { useAutoAnimate } from "@formkit/auto-animate/react";
import type { ReactNode } from "react";

export function AnimatedList({ children, className }: { children: ReactNode; className?: string }) {
  const [ref] = useAutoAnimate<HTMLDivElement>();

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
