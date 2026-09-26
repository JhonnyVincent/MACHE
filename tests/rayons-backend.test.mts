/*
  TESTS : les rayons du backend sont ceux du site.

  La liste de référence vit côté site (src/lib/categories.ts) ; le
  backend en garde une copie, qu'il crée au démarrage. Deux listes
  finissent toujours par diverger — un rayon ajouté d'un côté seulement
  apparaît dans les menus du site mais ne peut recevoir aucun produit,
  ou l'inverse. Ce test échoue au premier écart.

  Lancer : npm run test:rayons
*/

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CATEGORY_TREE } from "../src/lib/categories.ts";
import { MACHE_CATEGORY_TREE } from "../backend/packages/api/src/scripts/mache-categories.ts";

let passed = 0;
function check(name: string, run: () => void) { run(); passed += 1; console.log(`  ✓ ${name}`); }

check("les mêmes rayons principaux, dans le même ordre", () => {
  assert.deepEqual(
    MACHE_CATEGORY_TREE.map((c) => [c.handle, c.name]),
    CATEGORY_TREE.map((c) => [c.slug, c.label]),
    "src/lib/categories.ts et backend/…/mache-categories.ts doivent lister les mêmes rayons"
  );
});

check("les mêmes sous-rayons sous chaque rayon", () => {
  for (const site of CATEGORY_TREE) {
    const backend = MACHE_CATEGORY_TREE.find((c) => c.handle === site.slug)!;
    assert.deepEqual(
      backend.children.map((k) => [k.handle, k.name]),
      (site.children ?? []).map((k) => [k.slug, k.label]),
      `sous-rayons de « ${site.label} »`
    );
  }
});

check("les trois rayons demandés sont bien là", () => {
  const handles = MACHE_CATEGORY_TREE.map((c) => c.handle);
  for (const wanted of ["fait-a-la-main", "fait-maison", "bio", "electronique", "mode"]) {
    assert.ok(handles.includes(wanted), `rayon « ${wanted} » absent`);
  }
  const main = MACHE_CATEGORY_TREE.find((c) => c.handle === "fait-a-la-main")!;
  assert.ok(main.children.some((k) => k.handle === "crochet-tricot"), "le crochet a sa place");
});

check("aucun identifiant en double — il est unique dans la base", () => {
  const all = MACHE_CATEGORY_TREE.flatMap((c) => [c.handle, ...c.children.map((k) => k.handle)]);
  assert.equal(new Set(all).size, all.length);
});

check("le démarrage crée les rayons, sans jamais rien supprimer ni renommer", () => {
  const script = readFileSync("backend/packages/api/src/scripts/mache-categories.ts", "utf8");
  const code = script.slice(script.indexOf("export default async function"));
  assert.doesNotMatch(code, /delete|softDelete|update|Update/, "le script ne fait qu'ajouter");
  assert.match(code, /filter\(\(\{ parent \}\) => !byHandle\.has\(parent\.handle\)\)/);
  const boot = readFileSync("backend/packages/api/src/scripts/bootstrap.ts", "utf8");
  assert.match(boot, /await macheCategories\(args\);/);
});

console.log(`\n${passed} vérifications passées.\n`);
