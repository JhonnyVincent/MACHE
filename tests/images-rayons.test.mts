/*
  TESTS : les photos des rayons sur l'accueil.

  1. Une photo déposée dans public/images/rayons/ est trouvée, quelle
     que soit son extension courante.
  2. Absente : rien — la tuile garde son icône, aucune image inventée.
  3. Le nom demandé ne sort jamais du dossier (« ../ »).
  4. Aucune image n'est chargée depuis un site extérieur.

  Lancer : npm run test:rayons-images
*/

import assert from "node:assert/strict";
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { rayonImage } from "../src/lib/rayon-images.ts";

let passed = 0;
function check(name: string, run: () => void) { run(); passed += 1; console.log(`  ✓ ${name}`); }

const SLUG = `essai-${process.pid}`;
const FILE = `public/images/rayons/${SLUG}.webp`;

check("une photo déposée est trouvée", () => {
  writeFileSync(FILE, "x");
  try {
    assert.equal(rayonImage(SLUG), `/images/rayons/${SLUG}.webp`);
  } finally {
    rmSync(FILE);
  }
});

check("absente : null, la tuile garde son icône", () => {
  assert.equal(rayonImage(`absente-${process.pid}`), null);
});

check("un nom qui sortirait du dossier est refusé, même si le fichier existe", () => {
  /* Un vrai fichier, juste au-dessus du dossier des rayons. */
  const outside = `public/images/evasion-${process.pid}.webp`;
  writeFileSync(outside, "x");
  try {
    assert.equal(rayonImage(`../evasion-${process.pid}`), null);
  } finally {
    rmSync(outside);
  }
  for (const slug of ["..", "a/b", "Meubles", "meubles.jpg", ""]) {
    assert.equal(rayonImage(slug), null, slug);
  }
});

check("aucune image chargée depuis l'extérieur", () => {
  const source = readFileSync("src/lib/rayon-images.ts", "utf8");
  assert.doesNotMatch(source.replace(/\/\*[\s\S]*?\*\//g, ""), /https?:\/\//);
  assert.match(source, /`\/images\/rayons\/\$\{slug\}\.\$\{found\}`/);
});

console.log(`\n${passed} vérifications passées.`);
