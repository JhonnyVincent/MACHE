/*
  TESTS : la suspension d'un agent MACHÉ.

  LA FAILLE QUE CE TEST FERME

  L'habilitation d'un agent vient de son appartenance à un GROUPE DE
  CLIENTS, que seule l'administration modifie. Ce choix était fait,
  documenté, et justifié dans trois fichiers : un client écrit son
  propre champ libre — c'est là que vivent ses favoris — et pourrait
  donc s'y déclarer livreur.

  Sa SUSPENSION, elle, vivait dans ce même champ libre.

  Un agent suspendu n'avait donc qu'à envoyer
  `{ metadata: { agent_suspended: false } }` sur la route publique de
  son propre compte — que Medusa accepte, son validateur déclarant
  `metadata: z.record(z.string(), z.unknown())` — pour recommencer à
  confirmer des livraisons, et pour que la page de vérification
  publique le redéclare digne de confiance. Celle qu'on consulte,
  précisément, avant de remettre de l'argent liquide à un inconnu sur
  le pas de sa porte.

  CE QUE CE TEST VÉRIFIE

  1. Que les deux moitiés du dispositif emploient LA MÊME étiquette.
     Le `tsconfig` du site exclut `backend/` : la constante est donc
     recopiée, et une divergence serait silencieuse et grave — le site
     écrirait la suspension dans un groupe que le backend ne regarde
     pas, l'écran afficherait « suspendu », et l'agent continuerait de
     confirmer des livraisons.

  2. Que le champ libre ne peut plus RELEVER une suspension. Il est
     encore lu, pour que les suspensions posées avant ce changement
     tiennent — mais seulement en s'ajoutant, jamais en retranchant.
     C'est ce que dit un `||`, et que dirait exactement le contraire un
     `&&` ou une lecture seule du champ libre.

  Lancer : npm run test:agents
*/

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

let passed = 0;

function check(name: string, run: () => void) {
  run();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

const BACKEND_IDENTITY = "backend/packages/api/src/api/agent-identity.ts";
const BACKEND_CONTEXT = "backend/packages/api/src/api/agent-context.ts";
const BACKEND_VERIFY =
  "backend/packages/api/src/api/store/agents/verify/route.ts";
const SITE_ADMIN = "src/lib/medusa/agents-admin.ts";
const SITE_ACCOUNTS = "src/lib/medusa/admin.ts";
const BACKEND_MIDDLEWARES = "backend/packages/api/src/api/middlewares.ts";
const BACKEND_BLOCKED = "backend/packages/api/src/api/blocked-customers.ts";

function read(path: string): string {
  return readFileSync(path, "utf8");
}

/* La valeur littérale déclarée dans un fichier, quel que soit son nom. */
function marker(source: string, name = "SUSPENDED_MARKER"): string | null {
  const match = source.match(new RegExp(`${name}\\s*=\\s*"([^"]+)"`));

  return match ? match[1] : null;
}

check("le backend déclare une étiquette de suspension", () => {
  assert.equal(
    marker(read(BACKEND_IDENTITY)),
    "mache_agent_suspended",
    "l'étiquette du groupe des agents suspendus a disparu ou changé côté backend"
  );
});

check("le site emploie exactement la même étiquette que le backend", () => {
  /*
    Le cœur du test. Deux chaînes qui divergent produiraient un écran
    qui affiche « suspendu » et un agent qui continue de livrer.
  */
  assert.equal(
    marker(read(SITE_ADMIN)),
    marker(read(BACKEND_IDENTITY)),
    "le site et le backend ne désignent pas le même groupe : une suspension serait écrite là où personne ne la lit"
  );
});

check("l'agent connecté est suspendu par le GROUPE, pas par son champ libre", () => {
  const source = read(BACKEND_CONTEXT);

  assert.equal(
    source.includes("SUSPENDED_MARKER"),
    true,
    "la résolution de l'agent ne consulte plus le groupe des suspendus"
  );

  /*
    Le champ libre ne doit pouvoir qu'AJOUTER une suspension. Un « || »
    le garantit ; seul le champ libre lu, ou un « && », rendrait la
    suspension révocable par l'agent lui-même.
  */
  assert.match(
    source,
    /suspendedByGroup\s*\|\|\s*metadata\.agent_suspended === true/,
    "le champ libre du client doit s'ajouter à la suspension du groupe, jamais la remplacer"
  );
});

check("la vérification publique lit elle aussi le groupe", () => {
  const source = read(BACKEND_VERIFY);

  assert.equal(
    source.includes("SUSPENDED_MARKER"),
    true,
    "la page consultée avant de remettre de l'argent à un inconnu ne consulte plus le groupe des suspendus"
  );

  assert.match(
    source,
    /suspendedIds\.has\([^\n]*\)\s*\|\|/,
    "la vérification publique doit suspendre dès que le groupe le dit"
  );
});

check("l'administration suspend en déplaçant l'agent dans un groupe", () => {
  const source = read(SITE_ADMIN);

  /*
    Le geste qui compte : ajouter au groupe ou l'en retirer. Écrire
    `agent_suspended: true` dans le champ libre serait revenir
    exactement à la faille.
  */
  assert.match(
    source,
    /suspended \? \{ add: \[customerId\] \} : \{ remove: \[customerId\] \}/,
    "la suspension doit être une appartenance à un groupe"
  );

  assert.equal(
    /body:\s*\{\s*metadata:\s*\{[^}]*agent_suspended:\s*true/.test(source),
    false,
    "plus rien ne doit écrire « agent_suspended: true » dans le champ libre du client"
  );
});

/* ------------------------------------------------------------------ */
/* Le blocage d'un compte client                                       */
/* ------------------------------------------------------------------ */

check("le site bloque un compte avec la même étiquette que le backend", () => {
  /*
    Même raisonnement, et même conséquence en cas de divergence :
    l'écran dirait « bloqué » et le compte continuerait de commander.
  */
  assert.equal(
    marker(read(BACKEND_IDENTITY), "BLOCKED_MARKER"),
    "mache_customer_blocked",
    "l'étiquette du groupe des comptes bloqués a disparu ou changé côté backend"
  );

  assert.equal(
    marker(read(SITE_ACCOUNTS), "BLOCKED_MARKER"),
    marker(read(BACKEND_IDENTITY), "BLOCKED_MARKER"),
    "le site et le backend ne désignent pas le même groupe : un blocage serait écrit là où personne ne le lit"
  );
});

check("le backend refuse réellement les écritures d'un compte bloqué", () => {
  /*
    Sans ce middleware, le bouton « bloquer » écrirait une appartenance
    que rien ne ferait respecter : l'écran afficherait « bloqué » et le
    compte continuerait de commander. Un bouton qui ment est pire que
    pas de bouton.
  */
  const middlewares = read(BACKEND_MIDDLEWARES);

  /*
    Cherché DANS le tableau `middlewares`, et non n'importe où dans le
    fichier : la ligne d'import contient elle aussi ce nom, et un test
    qui s'en contenterait resterait vert avec un tableau vide. Vérifié
    en le vidant.
  */
  assert.match(
    middlewares,
    /middlewares:\s*\[[^\]]*refuseBlockedCustomer/,
    "le contrôle des comptes bloqués n'est plus branché"
  );

  assert.match(
    middlewares,
    /matcher:\s*"\/store\/\*"/,
    "le contrôle doit couvrir toutes les routes boutique"
  );

  /*
    Les LECTURES restent permises : un compte bloqué doit pouvoir
    consulter son historique, ne serait-ce que pour régler un litige.
  */
  assert.equal(
    /method:\s*\[[^\]]*"GET"/.test(middlewares),
    false,
    "bloquer la lecture rendrait son propre historique inaccessible au client"
  );
});

check("un blocage ne s'applique jamais à une requête d'invité", () => {
  /*
    Un panier anonyme n'a pas de session client. Le vérifier évite une
    lecture inutile à chaque achat — et surtout, un `actor_type` non
    filtré bloquerait l'administration elle-même.
  */
  const source = read(BACKEND_BLOCKED);

  assert.match(
    source,
    /actor_type !== "customer"/,
    "seule une session CLIENT doit être contrôlée"
  );

  assert.match(
    source,
    /if \(!id\) return next\(\);/,
    "une requête sans session client doit passer sans lecture"
  );
});

console.log(`\n${passed} vérifications passées.\n`);
