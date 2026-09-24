/*
  TESTS : l'habillage saisonnier du site.

  Pourquoi ce fichier existe

  Ce réglage prend une valeur reçue par le réseau et la recopie dans une
  feuille de style servie à TOUS les visiteurs. C'est le seul endroit du
  storefront qui fasse cela. Une valeur mal filtrée n'y produit pas une
  couleur laide : elle referme la règle CSS et en ouvre une autre, sur
  chaque page du site.

  Le backend n'envoie que des clés d'une liste fermée. Ces tests ne s'y
  fient pas — c'est précisément l'hypothèse qu'on regrette d'avoir faite
  le jour où elle devient fausse.

  Lancer : npm run test:habillage
*/

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { themeStyle, DEFAULT_THEME, type SiteTheme } from "@/lib/medusa/theme";

let passed = 0;

function check(name: string, run: () => void) {
  run();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

/*
  Le filtre vit dans `fetchSiteTheme`, qui fait un appel réseau. On le
  reproduit ici à l'identique plutôt que de lancer un serveur : ce qui
  est testé, c'est la règle, et elle doit être vérifiable sans backend.

  Si les deux venaient à diverger, ces tests passeraient sur une règle
  qui n'est plus appliquée — d'où les deux dernières vérifications, qui
  comparent le texte des expressions régulières du module lui-même.
*/
const NAME = /^--mache-[a-z0-9-]+$/;
const HEX = /^#[0-9a-fA-F]{3,8}$/;

function filtre(raw: Record<string, unknown>): Record<string, string> {
  const safe: Record<string, string> = {};

  for (const [name, value] of Object.entries(raw)) {
    if (!NAME.test(name)) continue;
    if (typeof value !== "string" || !HEX.test(value)) continue;
    safe[name] = value;
  }

  return safe;
}

function theme(variables: Record<string, string>): SiteTheme {
  return { key: "test", label: "Test", banner: null, variables };
}

console.log("\nHabillage saisonnier du site");

check("une couleur normale passe", () => {
  const safe = filtre({ "--mache-primary": "#0f7b4b" });

  assert.deepEqual(safe, { "--mache-primary": "#0f7b4b" });
});

check("une valeur qui referme la règle CSS est rejetée", () => {
  /*
    L'attaque réelle : la valeur ferme l'accolade de :root, ouvre une
    règle à elle, et cache le site entier.
  */
  const safe = filtre({
    "--mache-primary": "red; } body { display: none } .x {",
  });

  assert.deepEqual(safe, {});
});

check("une valeur avec une expression ou une URL est rejetée", () => {
  const safe = filtre({
    "--mache-primary": "url(https://ailleurs.example/x.png)",
    "--mache-bg": "expression(alert(1))",
    "--mache-line": "var(--autre)",
  });

  assert.deepEqual(safe, {});
});

check("un nom de variable hors du préfixe MACHÉ est rejeté", () => {
  /*
    Sans cette règle, une réponse pourrait redéfinir n'importe quelle
    variable de la page, y compris celles de la mise en page.
  */
  const safe = filtre({
    "--tw-ring-color": "#000000",
    "background": "#000000",
    "--mache-primary": "#123456",
  });

  assert.deepEqual(safe, { "--mache-primary": "#123456" });
});

check("un nom avec des majuscules ou des parenthèses est rejeté", () => {
  const safe = filtre({
    "--mache-PRIMARY": "#123456",
    "--mache-x(y)": "#123456",
    "--mache-x;y": "#123456",
  });

  assert.deepEqual(safe, {});
});

check("ce qui n'est pas une chaîne est rejeté", () => {
  const safe = filtre({
    "--mache-primary": 123 as unknown as string,
    "--mache-bg": null as unknown as string,
    "--mache-line": { toString: () => "#fff" } as unknown as string,
  });

  assert.deepEqual(safe, {});
});

check("la règle produite ne contient que des paires nom/couleur", () => {
  const style = themeStyle(theme({ "--mache-primary": "#0f7b4b", "--mache-bg-2": "#eef7f1" }));

  assert.equal(style, ":root{--mache-primary:#0f7b4b;--mache-bg-2:#eef7f1}");

  /*
    Une seule paire d'accolades : celle de :root. S'il y en avait deux,
    c'est qu'une valeur aurait réussi à ouvrir sa propre règle.
  */
  assert.equal((style ?? "").split("{").length, 2);
  assert.equal((style ?? "").split("}").length, 2);
});

check("un thème sans couleur n'ajoute aucune balise style", () => {
  /*
    Sinon chaque page de l'année porterait un <style></style> vide.
  */
  assert.equal(themeStyle(DEFAULT_THEME), null);
  assert.equal(themeStyle(theme({})), null);
});

check("l'habillage par défaut ne change rien et n'affiche aucun bandeau", () => {
  assert.deepEqual(DEFAULT_THEME.variables, {});
  assert.equal(DEFAULT_THEME.banner, null);
  assert.equal(DEFAULT_THEME.key, "default");
});

/*
  Les deux vérifications qui empêchent ce fichier de mentir : elles
  lisent les expressions régulières du module lui-même. Si quelqu'un
  les assouplit là-bas sans toucher ici, ces tests tombent.
*/
check("le filtre testé est bien celui du module", () => {
  /*
    Lecture SYNCHRONE, et c'est le point.

    Écrite en `async`, cette vérification rendrait une promesse que le
    lanceur n'attend pas : l'assertion échouerait dans le vide, le test
    serait compté comme passé, et ce fichier certifierait un filtre
    qu'il n'a pas regardé. Un test qui ne peut pas échouer est pire que
    pas de test — il rassure.
  */
  const source = readFileSync("src/lib/medusa/theme.ts", "utf8");

  assert.equal(
    source.includes("const NAME = /^--mache-[a-z0-9-]+$/"),
    true,
    "le motif des noms a changé dans le module sans changer dans ce test"
  );
  assert.equal(
    source.includes("const HEX = /^#[0-9a-fA-F]{3,8}$/"),
    true,
    "le motif des couleurs a changé dans le module sans changer dans ce test"
  );
});

console.log(`\n${passed} vérifications passées.\n`);
