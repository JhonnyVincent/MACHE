/*
  LES LOGOS DES RÉSEAUX SOCIAUX DE MACHE.

  Rien ne s'affiche tant qu'aucune adresse n'est remplie dans
  src/lib/social.ts : pas de logo qui mène nulle part.

  Chaque lien s'ouvre dans un nouvel onglet, et le dit aux lecteurs
  d'écran ; `noopener` empêche la page ouverte d'agir sur MACHE.
*/

import { SOCIAL_LINKS } from "@/lib/social";

export function SocialLinks({ className = "", size = 18 }: { className?: string; size?: number }) {
  if (SOCIAL_LINKS.length === 0) return null;

  return (
    <ul className={`items-center gap-3 ${className}`} aria-label="MACHE sur les réseaux sociaux">
      {SOCIAL_LINKS.map((network) => (
        <li key={network.key}>
          <a
            href={network.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`MACHE sur ${network.name} (nouvel onglet)`}
            title={network.name}
            className="block opacity-80 transition hover:opacity-100 motion-reduce:transform-none"
          >
            <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
              <path d={network.path} />
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}
