/*
  Les deux champs invisibles de l'anti-spam (voir src/lib/anti-spam.ts),
  à placer dans chaque formulaire public.

  Le champ piège est caché par sa position, pas par `display: none` :
  certains robots sautent les champs masqués ainsi. Il est retiré du
  clavier (tabIndex -1), des lecteurs d'écran (aria-hidden) et du
  remplissage automatique du navigateur (autoComplete off), pour qu'aucun
  humain ne le remplisse par accident.

  L'heure d'affichage est posée au rendu. Le composant est rendu à
  chaque visite : les pages qui l'utilisent sont dynamiques.
*/

import { HONEYPOT_FIELD, RENDERED_AT_FIELD } from "@/lib/anti-spam-fields";

export function AntiSpamFields({ renderedAt }: { renderedAt?: number }) {
  return (
    <>
      <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", top: "auto", width: 1, height: 1, overflow: "hidden" }}>
        <label>
          Ne pas remplir ce champ
          <input type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
      {/* L'heure diffère entre le serveur et le navigateur d'un formulaire interactif : c'est attendu. */}
      <input type="hidden" name={RENDERED_AT_FIELD} value={String(renderedAt ?? Date.now())} suppressHydrationWarning />
    </>
  );
}
