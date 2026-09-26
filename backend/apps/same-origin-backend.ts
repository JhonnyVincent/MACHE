/*
  LES PANNEAUX APPELLENT LE SERVEUR QUI LES A SERVIS.

  Ce que ce fichier corrige

  Le panneau vendeur de Mercur affichait « Failed to fetch » à la
  connexion, avec un mot de passe parfaitement bon. Aucun appel
  n'atteignait le serveur.

  La cause : l'adresse du serveur est GRAVÉE dans le panneau au moment
  de sa construction, depuis la variable MERCUR_BACKEND_URL. Absente ou
  mal saisie sur l'hébergeur, le panneau se construisait quand même, en
  visant http://localhost:9000 — c'est-à-dire l'ordinateur du vendeur
  lui-même. Chaque appel échouait dans son navigateur, sans que rien ne
  l'explique.

  Pourquoi une variable ne suffisait pas

  On pouvait exiger la variable. Mais une variable qu'on saisit à la
  main peut être oubliée, mal copiée, rester sur l'ancienne adresse le
  jour où MACHÉ prend un vrai nom de domaine — et dans chacun de ces
  cas, le panneau casse de la même façon muette.

  Or ces panneaux sont TOUJOURS servis par le backend lui-même, sous
  /seller et /dashboard. L'adresse du serveur, c'est donc l'adresse de
  la page, et le navigateur la connaît : `window.location.origin`. Elle
  est juste par construction, sur l'adresse de Render comme sur un futur
  domaine, sans rien à saisir.

  Et parce que les appels restent sur la même adresse, le navigateur ne
  les traite ni comme des requêtes vers un autre site (pas de CORS à
  régler), ni ses cookies de session comme des cookies tiers — que
  Safari et Chrome bloquent de plus en plus.

  Les deux canaux à couvrir

  1. `virtual:mercur/config`, que le client du panneau lit pour
     `backendUrl` — c'est lui qui sert la connexion.
  2. `__BACKEND_URL__`, que les écrans propres à MACHÉ (devis,
     statistiques) lisent directement.

  En développement (`vite dev`), rien ne change : le panneau tourne sur
  son propre port et vise le backend local, comme avant.

  S'il ne trouve plus où agir, il ARRÊTE la construction

  Si une mise à jour de Mercur change la forme de sa configuration, le
  remplacement ne trouverait plus rien. Continuer en silence
  reconstruirait exactement la panne d'origine. Mieux vaut une
  construction qui échoue — l'hébergeur garde alors la version
  précédente, qui fonctionne — qu'un panneau déployé qui ne peut
  joindre personne.
*/

const CONFIG_MODULE = "\0virtual:mercur/config";

/* Une expression évaluée dans le navigateur, pas une chaîne figée. */
const PAGE_ORIGIN = "window.location.origin";

const BACKEND_URL_ENTRY = /"backendUrl":"[^"]*"/g;

export function sameOriginBackend() {
  return {
    name: "mache:same-origin-backend",
    /* Après le greffon Mercur, pour que sa valeur ne recouvre pas la nôtre. */
    enforce: "post" as const,
    /* En développement, le panneau vise toujours le backend local. */
    apply: "build" as const,

    config() {
      return { define: { __BACKEND_URL__: PAGE_ORIGIN } };
    },

    transform(code: string, id: string) {
      if (id !== CONFIG_MODULE) return null;

      const next = code.replace(BACKEND_URL_ENTRY, `"backendUrl":${PAGE_ORIGIN}`);

      if (next === code) {
        throw new Error(
          "[same-origin-backend] `backendUrl` introuvable dans virtual:mercur/config. " +
            "La forme de la configuration Mercur a changé : sans ce remplacement, le " +
            "panneau viserait une adresse figée et chaque connexion échouerait par " +
            "« Failed to fetch ». Adapter apps/same-origin-backend.ts."
        );
      }

      return { code: next, map: null };
    },
  };
}
