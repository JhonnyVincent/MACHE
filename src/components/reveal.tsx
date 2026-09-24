"use client";

/*
  Révéler une section quand elle arrive à l'écran.

  Pourquoi pas une bibliothèque

  Ce comportement tient en vingt lignes avec `IntersectionObserver`,
  disponible partout depuis des années. Une bibliothèque d'animation
  pèserait des dizaines de kilo-octets sur chaque page d'un site
  consulté en Haïti, souvent sur une connexion mobile facturée au
  volume. Le mouvement ne vaut pas ce prix.

  La précaution qui compte

  Le masquage n'est posé QUE si ce script tourne : c'est lui qui ajoute
  `js-reveal` sur la page. Sans JavaScript — désactivé, en échec, ou
  bloqué — rien n'est masqué et tout s'affiche normalement.

  C'est la façon la plus courante de rendre un site illisible en
  croyant l'embellir : masquer d'abord en CSS, révéler ensuite en
  JavaScript, et ne jamais révéler quand le JavaScript ne s'exécute
  pas. On fait l'inverse.

  Et si quelqu'un a demandé moins de mouvement, on ne masque rien non
  plus : l'observateur n'est même pas installé.
*/

import { useEffect } from "react";

export function RevealProvider() {
  useEffect(() => {
    const root = document.documentElement;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion || typeof IntersectionObserver === "undefined") {
      return;
    }

    /*
      C'est à partir d'ici seulement que le CSS masque quoi que ce soit.
    */
    root.classList.add("js-reveal");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;

          entry.target.classList.add("is-revealed");

          /*
            Une fois révélé, on cesse d'observer : un élément qui se
            rejouerait à chaque remontée de page deviendrait agaçant, et
            coûterait du calcul pour rien.
          */
          observer.unobserve(entry.target);
        }
      },
      {
        /*
          Déclenché un peu avant l'entrée réelle, pour que l'animation
          soit finie quand l'œil arrive. Révélée trop tard, une section
          donne l'impression que la page rame.
        */
        rootMargin: "0px 0px -8% 0px",
        threshold: 0.05,
      }
    );

    const observe = () => {
      document
        .querySelectorAll(".mache-reveal:not(.is-revealed)")
        .forEach((element) => observer.observe(element));
    };

    observe();

    /*
      Les pages de ce site changent de contenu sans rechargement
      (navigation côté client). Sans cette relecture, les sections
      arrivées après coup resteraient masquées — c'est-à-dire
      invisibles.
    */
    const mutations = new MutationObserver(observe);

    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutations.disconnect();
      root.classList.remove("js-reveal");
    };
  }, []);

  return null;
}
