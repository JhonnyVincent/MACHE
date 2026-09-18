/*
  TESTS : l'adresse du backend commerce.

  Elle se recopie à la main depuis un tableau de bord d'hébergeur, et
  ces tableaux affichent l'hôte sans le schéma. Une adresse sans
  « https:// » devient relative : les appels partent vers le site
  lui-même, qui répond 404, et le catalogue reste vide sans que rien ne
  signale l'oubli.

  Lancer : npm run test:config
*/

import assert from "node:assert/strict";
import { medusaBackendUrl } from "@/lib/medusa/config";

/*
  Affecter `undefined` à une variable d'environnement y écrit la chaîne
  « undefined » : Node convertit tout en texte. On retire la clé.
*/
function setBackendUrl(value: string | undefined) {
  delete process.env.MEDUSA_BACKEND_URL;

  if (value === undefined) {
    delete process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
    return;
  }

  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL = value;
}

const cases: [string | undefined, string][] = [
  /* L'hôte seul, tel que l'affiche un tableau de bord. */
  ["mache-backend.onrender.com", "https://mache-backend.onrender.com"],
  /* Une adresse complète n'est pas touchée. */
  ["https://mache-backend.onrender.com", "https://mache-backend.onrender.com"],
  ["http://mache-backend.onrender.com", "http://mache-backend.onrender.com"],
  /* Barre finale et espaces, collés depuis un navigateur. */
  ["https://mache-backend.onrender.com/", "https://mache-backend.onrender.com"],
  ["  mache-backend.onrender.com  ", "https://mache-backend.onrender.com"],
  /* En développement seulement, le chiffrement n'est pas imposé. */
  ["localhost:9000", "http://localhost:9000"],
  ["127.0.0.1:9000", "http://127.0.0.1:9000"],
  /* Absente : on ne devine pas. Les pages disent alors ce qui manque. */
  ["", ""],
  [undefined, ""],
];

console.log("\nAdresse du backend commerce");

let passed = 0;

for (const [input, expected] of cases) {
  setBackendUrl(input);

  const actual = medusaBackendUrl();

  assert.equal(actual, expected, `${JSON.stringify(input)} → ${JSON.stringify(actual)}`);

  console.log(`  ✓ ${JSON.stringify(input)} → ${JSON.stringify(actual)}`);
  passed += 1;
}

console.log(`\n${passed} vérifications passées.\n`);
