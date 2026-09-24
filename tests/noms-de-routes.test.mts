/*
  TEST : les noms de dossiers de routes du backend.

  Le bug qu'il empêche

  Mercur transcrit chaque segment d'URL en NOM DE PROPRIÉTÉ TypeScript,
  sans guillemets. Un dossier nommé « 2fa » produit donc :

      2fa: typeof import("../src/api/admin/mache/2fa/route");

  ce qu'aucun analyseur TypeScript n'accepte — un identifiant ne
  commence pas par un chiffre. Le fichier généré devient illisible d'un
  bout à l'autre, et les deux panneaux d'administration ne compilent
  plus.

  Pourquoi ce test plutôt qu'une bonne résolution

  Parce que la faute ne se voit pas là où on travaille. `medusa build`
  passe : le backend ne lit pas ce fichier généré. Seuls les panneaux
  le lisent, et on ne les construit pas à chaque modification de route.
  La faute est donc partie en intégration continue, et c'est là qu'elle
  a été découverte.

  Un test qui lit les noms de dossiers coûte une seconde et supprime
  toute la catégorie.

  Lancer : npm run test:routes
*/

import assert from "node:assert/strict";
import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

let passed = 0;

function check(name: string, run: () => void) {
  run();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

const ROOT = "backend/packages/api/src/api";

/* Tous les dossiers sous l'arborescence des routes, chemin compris. */
function segments(dir: string, prefix = ""): { segment: string; path: string }[] {
  if (!existsSync(dir)) return [];

  const found: { segment: string; path: string }[] = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const path = prefix ? `${prefix}/${entry.name}` : entry.name;

    found.push({ segment: entry.name, path });
    found.push(...segments(join(dir, entry.name), path));
  }

  return found;
}

console.log("\nNoms de dossiers de routes");

check("l'arborescence des routes est bien là où on la cherche", () => {
  /*
    Sans cette vérification, un déplacement du dossier rendrait le test
    vert sur une liste vide — il certifierait alors quelque chose qu'il
    n'a pas regardé.
  */
  assert.equal(existsSync(ROOT), true, `${ROOT} est introuvable`);
  assert.equal(segments(ROOT).length > 5, true, "trop peu de dossiers trouvés");
});

check("aucun segment ne commence par un chiffre", () => {
  /*
    C'est la règle qui a été enfreinte. Un paramètre entre crochets —
    « [id] » — est transcrit en « $id » et reste valide.
  */
  for (const { segment, path } of segments(ROOT)) {
    assert.equal(
      /^[0-9]/.test(segment),
      false,
      `« ${path} » commence par un chiffre : le type généré serait invalide. Renommez-le (par exemple « two-factor » plutôt que « 2fa »).`
    );
  }
});

check("aucun segment ne contient de caractère qui casserait un identifiant", () => {
  /*
    Point, espace, accent, symbole : le générateur les recopierait tels
    quels dans un nom de propriété. Les crochets des paramètres sont la
    seule exception, et ils sont convertis.
  */
  for (const { segment, path } of segments(ROOT)) {
    const stripped = segment.replace(/^\[/, "").replace(/\]$/, "").replace(/^\.\.\./, "");

    assert.equal(
      /^[A-Za-z][A-Za-z0-9_-]*$/.test(stripped),
      true,
      `« ${path} » : seuls les lettres, chiffres, tirets et soulignés sont sûrs, et le premier caractère doit être une lettre.`
    );
  }
});

console.log(`\n${passed} vérifications passées.\n`);
