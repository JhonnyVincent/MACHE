/*
  TESTS : rester connecté.

  Le vendeur était déconnecté du panneau au bout de quelques minutes :
  ses sessions vivaient en mémoire, et Render endort puis redémarre le
  backend. Vérifié à la main avec le vrai backend : sans Redis, la
  session est perdue au redémarrage (401) ; avec Redis, elle tient (200).

  Ces tests gardent la configuration qui rend cela possible.

  Lancer : npm run test:sessions
*/

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

let passed = 0;
function check(name: string, run: () => void) { run(); passed += 1; console.log(`  ✓ ${name}`); }

const CONFIG = readFileSync("backend/packages/api/medusa-config.ts", "utf8");
const RENDER = readFileSync("render.yaml", "utf8");

check("les sessions vont dans Redis quand il est configuré, sinon en mémoire", () => {
  assert.match(CONFIG, /redisUrl: process\.env\.REDIS_URL \|\| undefined,/);
});

check("trois jours, prolongés à chaque utilisation", () => {
  assert.match(CONFIG, /const SESSION_DAYS = 3;/);
  assert.match(CONFIG, /ttl: SESSION_DAYS \* 24 \* 60 \* 60 \* 1000,/);
  assert.match(CONFIG, /rolling: true,/);
  assert.match(CONFIG, /jwtExpiresIn: `\$\{SESSION_DAYS\}d`,/);
});

check("les cookies du site durent autant que le jeton du backend", () => {
  for (const file of ["src/lib/medusa/vendor.ts", "src/lib/medusa/customer.ts"]) {
    const source = readFileSync(file, "utf8");
    assert.match(source, /maxAge: 60 \* 60 \* 24 \* 3,/, file);
    assert.doesNotMatch(source, /maxAge: 60 \* 60 \* 24 \* 7,|maxAge: 60 \* 60 \* 12,/, file);
  }
});

check("Render fournit un Redis au backend, privé", () => {
  assert.match(RENDER, /- type: keyvalue\n\s+name: mache-sessions\n\s+plan: free/);
  assert.match(RENDER, /ipAllowList: \[\]/);
  assert.match(
    RENDER,
    /- key: REDIS_URL\n\s+fromService:\n\s+type: keyvalue\n\s+name: mache-sessions\n\s+property: connectionString/
  );
});

console.log(`\n${passed} vérifications passées.`);
