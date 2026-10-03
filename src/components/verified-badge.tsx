/*
  Le badge de vérification de MACHE.

  Ce qu'il dit

  Que MACHE a contrôlé les documents de cette entreprise. C'est une
  affirmation de MACHE, pas une présentation du vendeur — et c'est
  exactement ce qui la distingue du badge de profil, à côté duquel il
  s'affiche souvent.

  Pourquoi on peut s'y fier

  Il est accordé depuis l'administration et rangé dans un champ que le
  vendeur ne peut pas écrire. Un badge qu'on pourrait s'attribuer
  soi-même ne vérifierait rien ; il ne ferait que donner l'apparence
  d'un contrôle à qui l'a réclamée.

  Il s'appelait « Premium »

  Un mot qui promet un niveau de service et laisse penser qu'il
  s'achète — d'autant plus depuis que les marques officielles ont un
  abonnement. Ce n'est pas ce que ce badge veut dire : il ne se paie
  pas, il se mérite par des papiers en règle.
*/

export function VerifiedBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      title="MACHE a contrôlé les documents de cette entreprise."
      className={`inline-flex items-center gap-1 rounded-[4px] bg-[var(--mache-success-soft)] font-bold text-[var(--mache-success)] ${
        compact ? "px-1.5 py-0.5 text-2xs" : "px-2 py-0.5 text-xs"
      }`}
    >
      <span aria-hidden="true">✓</span>
      Vérifié
    </span>
  );
}
