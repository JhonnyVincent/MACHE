/*
  TESTS : la connexion d'un vendeur.

  LE BOGUE SIGNALÉ

  Un vendeur crée sa boutique, la personnalise, se déconnecte — et ne
  peut plus revenir. Tantôt « mot de passe incorrect », tantôt « pas de
  boutique », alors que rien n'avait changé et que rien n'était faux.

  DEUX FAUTES DISTINCTES, ET AUCUNE NE CONCERNAIT SES IDENTIFIANTS

  1. L'ADRESSE DE LA BOUTIQUE N'ÉTAIT PAS NORMALISÉE PAREIL DES DEUX
     CÔTÉS. À l'inscription elle passe par `toHandle` — « Bawon Lakwa »
     devient « bawon-lakwa ». À la connexion, le champ n'était que mis
     en minuscules : « bawon lakwa », qui ne correspond à rien. Le
     vendeur lisait qu'il n'était pas membre de sa propre boutique.

  2. TOUTE PANNE ÉTAIT ANNONCÉE COMME UN MAUVAIS MOT DE PASSE. Le
     backend commerce s'endort — la page de connexion le dit elle-même
     sous le bouton — et au réveil il ne répond pas à temps. Cet échec
     était présenté comme un refus d'identifiants. Le vendeur va donc
     vérifier, changer, douter de son compte : partout sauf là où est le
     problème.

  Un refus (400, 401) parle des identifiants. Un 500, un délai dépassé,
  un réseau coupé parlent d'autre chose, et il faut le dire.

  Lancer : npm run test:connexion
*/

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { toHandle } from "../src/lib/handle.ts";

let passed = 0;

function check(name: string, run: () => void) {
  run();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

/* ------------------------------------------------------------------ */
/* 1. La normalisation, des deux côtés                                 */
/* ------------------------------------------------------------------ */

/*
  Ce que la connexion faisait AVANT : mise en minuscules seulement.
  Gardé ici pour que le test montre la faute qu'il empêche, et non
  seulement la règle qu'il impose.
*/
function ancienneNormalisation(value: string): string {
  return value.trim().toLowerCase();
}

check("le nom d'une boutique donne la même adresse qu'à l'inscription", () => {
  assert.equal(toHandle("Bawon Lakwa"), "bawon-lakwa");
  assert.equal(toHandle("  BAWON LAKWA  "), "bawon-lakwa");
  assert.equal(toHandle("Bawon-Lakwa"), "bawon-lakwa");
  assert.equal(toHandle("Épicerie Dèlmas"), "epicerie-delmas");
});

check("l'ancienne normalisation de la connexion ne pouvait pas correspondre", () => {
  /*
    La démonstration du bogue : le vendeur tape le nom de sa boutique,
    et obtient une chaîne qu'aucune adresse enregistrée ne peut égaler.
  */
  const saisi = "Bawon Lakwa";
  const enregistre = toHandle(saisi);

  assert.notEqual(
    ancienneNormalisation(saisi),
    enregistre,
    "c'est exactement ce qui fermait la porte au vendeur"
  );

  assert.equal(toHandle(saisi), enregistre, "la normalisation commune, elle, correspond");
});

/* ------------------------------------------------------------------ */
/* 2. Une panne n'est pas un refus                                     */
/* ------------------------------------------------------------------ */

/*
  La règle telle que `loginVendor` l'applique : seuls 400 et 401
  parlent des identifiants.
*/
function parleDesIdentifiants(status: number | undefined): boolean {
  return status === 401 || status === 400;
}

check("un refus du backend parle bien des identifiants", () => {
  assert.equal(parleDesIdentifiants(401), true);
  assert.equal(parleDesIdentifiants(400), true);
});

check("une panne ne doit jamais être présentée comme un mot de passe faux", () => {
  /*
    `undefined` est le cas du délai dépassé et du réseau coupé : rien
    n'a été reçu, donc aucun code. C'est précisément le cas qui a
    trompé le vendeur, l'hébergement mettant le backend en veille.
  */
  for (const status of [undefined, 500, 502, 503, 504, 404, 429]) {
    assert.equal(
      parleDesIdentifiants(status),
      false,
      `un statut « ${String(status)} » ne dit rien du mot de passe`
    );
  }
});

/* ------------------------------------------------------------------ */
/* 3. Le code réel applique bien ces deux règles                       */
/* ------------------------------------------------------------------ */

const SOURCE = "src/lib/medusa/vendor.ts";

check("la connexion normalise l'adresse avec toHandle", () => {
  const source = readFileSync(SOURCE, "utf8");

  assert.match(
    source,
    /const wanted = toHandle\(storeHandle\)/,
    "la connexion doit normaliser comme l'inscription"
  );

  assert.equal(
    source.includes("storeHandle.trim().toLowerCase()"),
    false,
    "l'ancienne normalisation ne doit plus exister"
  );
});

check("le nom de la boutique est accepté, pas seulement son adresse", () => {
  const source = readFileSync(SOURCE, "utf8");

  assert.match(
    source,
    /toHandle\(entry\.name\) === wanted/,
    "un vendeur tape le nom de sa boutique, pas son adresse technique"
  );
});

check("le code HTTP est conservé pour distinguer refus et panne", () => {
  const source = readFileSync(SOURCE, "utf8");

  assert.match(
    source,
    /status: response\.status/,
    "sans le code, un appelant ne peut pas distinguer un refus d'une panne"
  );

  assert.match(
    source,
    /auth\.status === 401 \|\| auth\.status === 400/,
    "seul un refus doit produire « mot de passe incorrect »"
  );
});

check("une panne ne fait pas dire « aucune boutique » non plus", () => {
  const source = readFileSync(SOURCE, "utf8");

  assert.match(
    source,
    /if \(!mine\.ok && mine\.status !== 401\) return mine;/,
    "un backend muet ne prouve pas qu'un vendeur n'a pas de boutique"
  );
});

check("une panne ne fait pas dire « ce compte existe déjà » à l'inscription", () => {
  const source = readFileSync(SOURCE, "utf8");

  assert.match(
    source,
    /const refused = retry\.status === 401 \|\| retry\.status === 400;/,
    "sinon un nouveau vendeur se croit déjà inscrit et ouvre un second compte"
  );
});

console.log(`\n${passed} vérifications passées.\n`);
