/*
  TESTS : les panneaux Mercur appellent le serveur qui les a servis.

  La panne qu'ils gardent : le panneau vendeur affichait « Failed to
  fetch » à la connexion, mot de passe juste. Il avait été construit en
  visant http://localhost:9000 — l'ordinateur du vendeur — parce que la
  variable qui devait lui donner l'adresse du serveur manquait.

  Il utilise désormais l'adresse de la page (`window.location.origin`),
  juste par construction puisque le backend sert lui-même les panneaux.

  Lancer : npm run test:panneaux
*/

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { sameOriginBackend } from "../backend/apps/same-origin-backend.ts";

let passed = 0;
function check(name: string, run: () => void) { run(); passed += 1; console.log(`  ✓ ${name}`); }

const plugin = sameOriginBackend();
const CONFIG_ID = "\0virtual:mercur/config";

/* La forme exacte que produit le greffon Mercur : `export default ${JSON.stringify(config)}`. */
const mercurModule = `export default ${JSON.stringify({
  backendUrl: "http://localhost:9000",
  base: "/seller/",
  imageLimit: 2097152,
})}`;

check("la configuration du panneau vise l'adresse de la page", () => {
  const out = plugin.transform(mercurModule, CONFIG_ID);

  assert.ok(out, "le module de configuration doit être réécrit");
  assert.match(out!.code, /"backendUrl":window\.location\.origin/);
  assert.doesNotMatch(out!.code, /localhost:9000/, "plus aucune adresse figée");
});

check("la réécriture reste du JavaScript valide", () => {
  const out = plugin.transform(mercurModule, CONFIG_ID)!;
  const body = out.code.replace(/^export default /, "return ");
  const config = new Function("window", body)({ location: { origin: "https://mache.example" } });

  assert.equal(config.backendUrl, "https://mache.example");
  assert.equal(config.base, "/seller/", "le reste de la configuration est intact");
});

check("les écrans propres à MACHÉ visent aussi l'adresse de la page", () => {
  /* Devis et statistiques lisent __BACKEND_URL__ directement. */
  const config = plugin.config() as { define: Record<string, string> };

  assert.equal(config.define.__BACKEND_URL__, "window.location.origin");
});

check("si Mercur change sa configuration, la construction s'arrête", () => {
  /* Continuer en silence reconstruirait exactement la panne d'origine. */
  assert.throws(
    () => plugin.transform(`export default {"base":"/seller/"}`, CONFIG_ID),
    /backendUrl` introuvable/
  );
});

check("les autres modules ne sont pas touchés", () => {
  assert.equal(plugin.transform(`const backendUrl = "x"`, "/src/app.tsx"), null);
});

check("le développement local garde son backend local", () => {
  assert.equal(plugin.apply, "build", "le greffon ne doit agir qu'à la construction");
  assert.equal(plugin.enforce, "post", "il doit passer après le greffon Mercur");
});

check("les deux panneaux l'enregistrent, après le greffon Mercur", () => {
  for (const app of ["vendor", "admin"]) {
    const source = readFileSync(`backend/apps/${app}/vite.config.ts`, "utf8");
    /*
      Dans le tableau `plugins` seulement : le nom apparaît aussi dans un
      commentaire plus haut, et une recherche dans tout le fichier le
      trouverait là — avant le greffon Mercur, ce qui ne dit rien.
    */
    const plugins = source.slice(source.indexOf("plugins: ["));
    const mercur = plugins.indexOf("mercurDashboardPlugin({");
    const ours = plugins.indexOf("sameOriginBackend(),");

    assert.ok(mercur > -1, `${app} : greffon Mercur introuvable`);
    assert.ok(ours > mercur, `${app} : sameOriginBackend() doit être enregistré après le greffon Mercur`);
  }
});

check("l'empaquetage refuse un panneau qui viserait une adresse figée", () => {
  const script = readFileSync("backend/packages/api/scripts/bundle-dashboards.mjs", "utf8");

  assert.match(script, /includes\('backendUrl:window\.location\.origin'\)/);
  assert.doesNotMatch(
    script,
    /!process\.env\.MERCUR_BACKEND_URL/,
    "la variable n'est plus exigée : l'exiger referait échouer des constructions saines"
  );
});

console.log(`\n${passed} vérifications passées.\n`);
