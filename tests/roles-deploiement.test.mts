/*
  TESTS : l'administration n'est pas sur le site public.

  L'administration de MACHE est le panneau du backend (/dashboard sur
  l'adresse du backend). Le site ne contient plus aucune page
  « /dashboard/admin » : si quelqu'un tape l'ancienne adresse, il obtient
  un 404 nu, sans page ni indice — pas même le nom de MACHE. Les robots
  qui balaient /admin, /dashboard, /wp-admin n'y trouvent aucune porte.

  ET LE FICHIER DOIT RESTER DANS src/

  Il vivait à la racine, où Next ne le cherche pas quand l'application
  est dans `src/` : il n'était pas compilé du tout, donc il n'a jamais
  tourné. Le remettre à la racine le rendrait muet de la même façon.

  Lancer : npm run test:roles
*/

import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";

let passed = 0;

function check(name: string, run: () => void) {
  run();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

const CHEMIN = "src/middleware.ts";

check("le middleware est là où Next le cherche", () => {
  assert.ok(existsSync(CHEMIN), "src/middleware.ts est absent");
  assert.equal(existsSync("middleware.ts"), false, "un middleware à la racine n'est jamais compilé quand l'application est dans src/");
});

const SOURCE = readFileSync(CHEMIN, "utf8");

check("l'ancienne adresse de l'administration répond 404, sans rien révéler", () => {
  assert.match(SOURCE, /const ADMIN_PREFIX = "\/dashboard\/admin";/);
  assert.match(SOURCE, /pathname === ADMIN_PREFIX \|\| pathname\.startsWith\(`\$\{ADMIN_PREFIX\}\/`\)/);
  assert.match(SOURCE, /new NextResponse\(null, \{ status: 404 \}\)/, "un 404 nu, sans page ni indice");
});

check("le refus est décidé avant tout le reste", () => {
  const corps = SOURCE.slice(SOURCE.indexOf("export async function middleware"));
  const posRefus = corps.indexOf("refuseAdmin(request)");
  const posCookie = corps.indexOf("cookies.set");

  assert.ok(posRefus > -1 && posCookie > -1, "les deux étapes doivent exister");
  assert.ok(posRefus < posCookie, "le refus doit précéder le travail inutile");
});

check("le middleware n'appelle rien au loin", () => {
  /* Il tourne sur CHAQUE page : tout appel réseau se paierait sur toutes les visites. */
  const imports = [...SOURCE.matchAll(/from\s+"([^"]+)"/g)].map((m) => m[1]);

  assert.deepEqual(imports, ["next/server"], `le middleware ne doit importer que next/server, or il importe : ${imports.join(", ")}`);
});

check("le site ne contient plus aucune page d'administration", () => {
  assert.equal(existsSync("src/app/dashboard/admin"), false, "l'administration vit dans le panneau du backend, pas sur le site");
});

check("aucune page publique ne renvoie vers l'ancienne adresse", () => {
  const dossiers = ["src/app", "src/components"];
  const trouvés: string[] = [];

  const parcourir = (dir: string) => {
    for (const entrée of readdirSync(dir, { withFileTypes: true })) {
      const chemin = `${dir}/${entrée.name}`;

      if (entrée.isDirectory()) parcourir(chemin);
      else if (/\.(tsx?|mdx?)$/.test(entrée.name) && readFileSync(chemin, "utf8").includes("/dashboard/admin")) trouvés.push(chemin);
    }
  };

  dossiers.forEach(parcourir);

  assert.deepEqual(trouvés, [], `ces fichiers mènent encore à /dashboard/admin : ${trouvés.join(", ")}`);
});

check("le panneau d'administration du backend porte les pages MACHE", () => {
  const pages = readdirSync("backend/apps/admin/src/routes");

  for (const page of ["mache", "boutiques", "messages", "revenus", "promotions-qui-paie", "gel-des-versements", "pros", "applications", "partenaires", "agents", "points-de-retrait", "comptes-clients", "apparence", "contrats", "textes", "moderation", "equipe"]) {
    assert.ok(pages.includes(page), `la page « ${page} » manque dans le panneau d'administration`);
  }
});

console.log(`\n${passed} vérifications passées.\n`);
