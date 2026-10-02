/*
  Les habillages saisonniers : chaque couleur du bouton principal doit
  rester lisible avec du texte blanc, et les liens colorés sur fond blanc.
*/
import assert from "node:assert/strict";
import { THEMES, THEME_KEYS, themeOf } from "../backend/packages/api/src/api/mache-themes.ts";

let passed = 0;
function check(name: string, run: () => void) {
  run();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

console.log("\nHabillages saisonniers");

check("les habillages annoncés existent", () => {
  for (const key of ["noel", "octobre-rose", "saint-valentin", "drapeau", "bonne-annee", "independance", "carnaval", "paques", "ete", "rentree", "halloween", "toussaint-gede"]) {
    assert.ok(THEME_KEYS.includes(key as never), key);
  }
});

check("bouton principal : texte blanc lisible (contraste 4,5 ou plus), couleur foncée très lisible", () => {
  for (const key of THEME_KEYS) {
    const v = THEMES[key].variables;
    if (!v["--mache-primary"]) continue;
    assert.ok(contrast("#ffffff", v["--mache-primary"]) >= 4.5, `${key} primaire ${contrast("#ffffff", v["--mache-primary"]).toFixed(2)}`);
    assert.ok(contrast("#ffffff", v["--mache-primary-dark"]) >= 7, `${key} foncé`);
  }
});

check("lien coloré sur fond clair du thème lisible", () => {
  for (const key of THEME_KEYS) {
    const v = THEMES[key].variables;
    if (!v["--mache-primary"]) continue;
    assert.ok(contrast(v["--mache-primary"], v["--mache-bg-2"]) >= 4.5, `${key} sur fond ${contrast(v["--mache-primary"], v["--mache-bg-2"]).toFixed(2)}`);
    assert.ok(contrast(v["--mache-primary"], v["--mache-primary-soft"]) >= 4.5, `${key} sur doux`);
  }
});

check("chaque couleur est une valeur hexadécimale sûre (pas d'injection dans le CSS)", () => {
  for (const key of THEME_KEYS) {
    for (const value of Object.values(THEMES[key].variables)) assert.match(value, /^#[0-9a-f]{6}$/i, `${key}`);
  }
});

check("pas de promesse commerciale dans les bandeaux", () => {
  for (const key of THEME_KEYS) {
    const banner = THEMES[key].banner ?? "";
    assert.doesNotMatch(banner, /%|promo|solde|réduction|gratuit|offre/i, key);
  }
});

check("une clé inconnue retombe sur l'habillage habituel", () => {
  assert.equal(themeOf("nimportequoi").key, "default");
  assert.equal(themeOf(undefined).key, "default");
});

console.log(`\n${passed} vérifications réussies.`);
