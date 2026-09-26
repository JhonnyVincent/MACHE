/*
  TESTS : ce que chaque déploiement a le droit de servir.

  LE PARTAGE

  Un seul code tourne deux fois. Une variable d'environnement dit à
  chaque service ce qu'il sert : le site public sans l'administration,
  ou l'administration seule. Sur le domaine public, /dashboard/admin
  répond 404 — les robots qui balaient internet n'y trouvent donc
  aucune porte où essayer des mots de passe.

  LE DÉFAUT DOIT RESTER « TOUT »

  C'est la vérification la plus importante du fichier. Si le défaut
  basculait vers « public », le déploiement actuel — qui n'a pas cette
  variable — perdrait son espace d'administration au premier envoi,
  sans que personne n'ait rien demandé. Une variable nouvelle ne change
  rien tant qu'on ne l'a pas posée.

  ET LE FICHIER DOIT RESTER DANS src/

  Il vivait à la racine, où Next ne le cherche pas quand l'application
  est dans `src/` : il n'était pas compilé du tout, donc il n'a jamais
  tourné. Le remettre à la racine le rendrait muet de la même façon —
  sans erreur, sans rien dans les journaux, et le partage cesserait
  silencieusement de protéger quoi que ce soit.

  Les trois rôles ont été vérifiés sur de vrais serveurs avant l'écriture
  de ce test : absent → tout en 200 ; public → admin en 404 ; admin →
  /shop en 404 et l'accueil en 307.

  Lancer : npm run test:roles
*/

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

let passed = 0;

function check(name: string, run: () => void) {
  run();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

const CHEMIN = "src/middleware.ts";

check("le middleware est là où Next le cherche", () => {
  /*
    Avec une application dans `src/`, Next attend `src/middleware.ts`.
    À la racine, il est ignoré en silence.
  */
  assert.ok(
    existsSync(CHEMIN),
    "src/middleware.ts est absent : le partage ne s'appliquerait plus"
  );

  assert.equal(
    existsSync("middleware.ts"),
    false,
    "un middleware à la racine n'est jamais compilé quand l'application est dans src/"
  );
});

const SOURCE = readFileSync(CHEMIN, "utf8");

check("le défaut sert TOUT, pour ne rien casser", () => {
  /*
    Le cœur du test. Un défaut qui coupe ferait disparaître l'espace
    d'administration du déploiement actuel au premier envoi.
  */
  assert.match(
    SOURCE,
    /return "tout";/,
    "une variable absente ou inconnue doit rendre le comportement d'aujourd'hui"
  );

  const fonction = SOURCE.slice(
    SOURCE.indexOf("function deploymentRole()"),
    SOURCE.indexOf("function deploymentRole()") + 400
  );

  assert.equal(
    /return "public";\s*\}\s*$/.test(fonction.trim()),
    false,
    "le défaut ne doit jamais être « public »"
  );
});

check("le rôle public refuse l'administration, et rien d'autre", () => {
  assert.match(
    SOURCE,
    /if \(role === "public"\)[\s\S]{0,200}versAdmin \? introuvable\(\) : null/,
    "sur le domaine public, seul /dashboard/admin disparaît"
  );
});

check("le rôle admin ne sert que l'administration", () => {
  assert.match(
    SOURCE,
    /if \(versAdmin\) return null;/,
    "l'administration passe"
  );

  assert.match(
    SOURCE,
    /return introuvable\(\);\s*\}\s*$/m,
    "tout le reste est refusé"
  );
});

check("un refus ne révèle rien", () => {
  /*
    Pas la jolie page « introuvable » du site : elle porte l'en-tête, le
    menu, le nom de MACHÉ. Sur une adresse que personne ne doit
    deviner, autant ne rien dire.
  */
  assert.match(
    SOURCE,
    /new NextResponse\(null, \{ status: 404 \}\)/,
    "un 404 nu, sans page ni indice"
  );
});

check("le refus est décidé avant tout le reste", () => {
  /*
    Inutile de poser un cookie ou de faire quoi que ce soit pour une
    requête qu'on s'apprête à refuser.
  */
  const corps = SOURCE.slice(SOURCE.indexOf("export async function middleware"));

  const posRefus = corps.indexOf("refuseHorsRole(request)");
  const posCookie = corps.indexOf("cookies.set");

  assert.ok(posRefus > -1 && posCookie > -1, "les deux étapes doivent exister");
  assert.ok(
    posRefus < posCookie,
    "le refus doit précéder le travail inutile"
  );
});

check("le middleware n'appelle rien au loin", () => {
  /*
    Il tourne sur CHAQUE page. Un appel réseau posé ici — rafraîchir une
    session chez un service tiers, par exemple — se paie sur toutes les
    visites du site, et pas seulement quand il échoue : un hôte qui ne
    répond plus fait attendre chaque page jusqu'au délai. C'est
    exactement ce qui dormait ici avant d'être retiré.

    Plutôt que d'interdire un paquet par son nom — ce qui ne protège que
    de celui-là — on exige que ce fichier n'importe RIEN d'autre que ce
    dont Next a besoin. Tout ajout futur devra passer par ce test, quel
    qu'il soit.
  */
  const imports = [...SOURCE.matchAll(/from\s+"([^"]+)"/g)].map((m) => m[1]);

  assert.deepEqual(
    imports,
    ["next/server"],
    `le middleware ne doit importer que next/server, or il importe : ${imports.join(", ")}`
  );
});

console.log(`\n${passed} vérifications passées.\n`);
