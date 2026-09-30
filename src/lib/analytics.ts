/*
  STATISTIQUES DE VISITE : Cloudflare Web Analytics.

  Pourquoi celui-ci :
  - gratuit ;
  - sans cookie et sans suivi d'une personne d'un site à l'autre : il
    compte des visites (pages vues, pays, appareil, provenance), il ne
    reconnaît personne. Pas de bannière de consentement à imposer ;
  - un seul petit script, chargé après la page : il ne ralentit pas
    l'affichage, ce qui compte sur les connexions haïtiennes.

  Render ne fournit pas ce genre de chiffres : ses graphiques mesurent
  le serveur (mémoire, processeur), pas les visiteurs.

  Désactivé tant que CF_ANALYTICS_TOKEN n'est pas posé dans Render :
  sans jeton, aucun script n'est chargé et rien ne part chez Cloudflare.
*/

/* Un jeton Cloudflare Web Analytics : 32 caractères hexadécimaux. */
const TOKEN_SHAPE = /^[a-f0-9]{32}$/i;

export function analyticsToken(): string | null {
  const token = (process.env.CF_ANALYTICS_TOKEN || "").trim();

  return TOKEN_SHAPE.test(token) ? token : null;
}

export function analyticsEnabled(): boolean {
  return analyticsToken() !== null;
}
