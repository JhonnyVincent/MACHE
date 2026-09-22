"use client";

import { useFormStatus } from "react-dom";

/*
  Un bouton d'envoi qui dit qu'il travaille.

  Le problème qu'il résout

  Les formulaires du site envoyaient sans rien changer à l'écran. Entre
  le clic et la réponse, la page restait identique : même bouton, même
  couleur, aucun mouvement. Quand le backend répond en 200 ms, cela ne
  se voit pas. Quand il met une minute à se réveiller — ce que fait un
  hébergement gratuit après un moment sans trafic — la personne clique,
  ne voit rien, et conclut que le bouton est cassé. Elle reclique, ou
  elle part.

  « Rien ne se passe, même pas d'erreur » : c'est exactement ce que
  produit un bouton muet devant un serveur lent, et ce n'est pas une
  panne — c'est une attente qu'on n'a pas montrée.

  Le bouton est aussi désactivé pendant l'envoi. Sans cela, trois clics
  impatients envoient trois inscriptions.
*/
export function SubmitButton({
  children,
  pendingLabel,
  className,
  /*
    Affichée sous le bouton pendant l'attente seulement. Elle sert à
    expliquer une lenteur qui a une cause connue, sans encombrer le
    formulaire le reste du temps.
  */
  pendingHint,
}: {
  children: React.ReactNode;
  pendingLabel: string;
  className?: string;
  pendingHint?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <>
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className={`${className ?? ""} ${
          pending ? "cursor-wait opacity-70" : ""
        }`.trim()}
      >
        {pending ? pendingLabel : children}
      </button>

      {pending && pendingHint && (
        <p
          /*
            `aria-live` : une personne qui n'a pas le bouton sous les
            yeux — lecteur d'écran — doit entendre que l'envoi est en
            cours, et pourquoi c'est long.
          */
          aria-live="polite"
          className="mt-2 text-sm leading-relaxed text-[var(--mache-muted)]"
        >
          {pendingHint}
        </p>
      )}
    </>
  );
}
