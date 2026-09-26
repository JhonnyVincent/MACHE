/*
  TESTS : une adresse e-mail ne dépend pas des majuscules.

  La panne qu'ils gardent : « mot de passe incorrect » avec le bon mot
  de passe, parce qu'un téléphone avait mis une majuscule à la première
  lettre de l'adresse et que Medusa compare les adresses à la lettre.

  Lancer : npm run test:casse
*/

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeAuthEmail } from "../backend/packages/api/src/api/email-case.ts";

let passed = 0;
function check(name: string, run: () => void) { run(); passed += 1; console.log(`  ✓ ${name}`); }

function pass(body: unknown) {
  const req = { body } as never;
  let called = false;
  normalizeAuthEmail(req, {} as never, () => { called = true; });
  assert.ok(called, "la requête doit toujours continuer son chemin");
  return (req as { body: Record<string, unknown> }).body;
}

check("une majuscule initiale ne change pas l'adresse", () => {
  assert.equal(pass({ email: "Jean@Exemple.ht" }).email, "jean@exemple.ht");
});

check("les espaces autour sont retirés", () => {
  assert.equal(pass({ email: "  JEAN@EXEMPLE.HT  " }).email, "jean@exemple.ht");
});

check("la demande de nouveau mot de passe est couverte aussi", () => {
  /* Elle nomme le champ `identifier`, et répond « envoyé » même quand rien ne correspond. */
  assert.equal(pass({ identifier: "Jean@Exemple.ht" }).identifier, "jean@exemple.ht");
});

check("le mot de passe n'est JAMAIS touché", () => {
  /* Le mettre en minuscules changerait le mot de passe de tout le monde. */
  assert.equal(pass({ email: "a@b.ht", password: "MotDePasse-AVEC-Majuscules" }).password, "MotDePasse-AVEC-Majuscules");
});

check("une valeur qui n'est pas du texte passe telle quelle", () => {
  assert.equal(pass({ email: 42 }).email, 42);
  assert.doesNotThrow(() => pass(undefined));
});

check("la mise en minuscules passe avant le plafond de tentatives", () => {
  /* Sinon « Jean@… » et « jean@… » compteraient comme deux comptes. */
  const source = readFileSync("backend/packages/api/src/api/middlewares.ts", "utf8");
  assert.match(source, /middlewares: \[normalizeAuthEmail, throttleLogin\]/);
});

const EXISTING = readFileSync("backend/packages/api/src/scripts/email-case-existing.ts", "utf8");

check("les anciens comptes à majuscules sont ramenés, sans fusionner les doubles", () => {
  assert.match(EXISTING, /AND NOT \$\{HAS_TWIN\}/, "un compte qui a un double ne doit pas être converti");
  assert.match(EXISTING, /SET entity_id = lower\(btrim\(p\.entity_id\)\)/);
});

check("la recherche de doubles inclut les comptes supprimés", () => {
  /* L'index d'unicité les couvre : les ignorer ferait échouer le démarrage. */
  const twin = EXISTING.slice(EXISTING.indexOf("const HAS_TWIN"), EXISTING.indexOf("export default"));
  assert.doesNotMatch(twin, /deleted_at/);
});

check("les adresses sont alignées au démarrage, avant toute connexion", () => {
  const boot = readFileSync("backend/packages/api/src/scripts/bootstrap.ts", "utf8");
  const aligned = boot.indexOf("await emailCaseExisting(args)");
  const admin = boot.indexOf("await adminUser(args)");
  assert.ok(aligned > -1 && aligned < admin, "l'alignement doit précéder la création du compte d'administration");
});

console.log(`\n${passed} vérifications passées.\n`);
