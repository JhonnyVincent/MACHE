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

function read(path: string): string {
  return readFileSync(path, "utf8");
}

/* La valeur littérale déclarée dans un fichier, quel que soit son nom. */
function marker(source: string): string | null {
  const match = source.match(
    /SUSPENDED_MARKER\s*=\s*"([^"]+)"/
  );

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

console.log(`\n${passed} vérifications passées.\n`);
