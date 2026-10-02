/*
  Les habillages saisonniers : chaque couleur du bouton principal doit
  rester lisible avec du texte blanc, et les liens colorés sur fond blanc.
*/
import assert from "node:assert/strict";
import { THEMES, THEME_KEYS, themeOf, resolveTheme } from "../backend/packages/api/src/api/mache-themes.ts";

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

import { easterSunday, seasonOn, seasonWindows } from "../backend/packages/api/src/lib/season-calendar.ts";
import { SEASON_RAILS, seasonProducts } from "../src/lib/seasons.ts";

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

check("les nouveaux habillages existent", () => {
  for (const key of ["fete-des-meres", "fete-des-peres", "journee-creole", "vertieres", "semaine-sainte", "black-friday"]) {
    assert.ok(THEME_KEYS.includes(key as never), key);
  }
});

check("calendrier : Pâques et ses voisins", () => {
  assert.equal(easterSunday(2026).toISOString().slice(0, 10), "2026-04-05");
  assert.equal(seasonOn("2026-04-05"), "paques");
  assert.equal(seasonOn("2026-03-30"), "semaine-sainte");
  assert.equal(seasonOn("2026-02-14"), "saint-valentin");
});

check("calendrier : Black Friday 2026 (27 nov), Noël, fêtes des mères/pères", () => {
  assert.equal(seasonOn("2026-11-27"), "black-friday");
  assert.equal(seasonOn("2026-11-30"), "black-friday");
  assert.equal(seasonOn("2026-12-10"), "noel");
  assert.equal(seasonOn("2026-05-31"), "fete-des-meres");
  assert.equal(seasonOn("2026-06-21"), "fete-des-peres");
  assert.equal(seasonOn("2026-10-27"), "journee-creole");
  assert.equal(seasonOn("2026-11-18"), "vertieres");
});

check("calendrier : entre deux fêtes, rien ; chaque fenêtre vise un thème existant", () => {
  assert.equal(seasonOn("2026-03-01"), null);
  for (const w of seasonWindows(2026)) assert.ok(THEME_KEYS.includes(w.key), w.key);
});

check("mode automatique suit le calendrier, le mode manuel l'ignore", () => {
  assert.equal(resolveTheme("auto", "2026-12-10").key, "noel");
  assert.equal(resolveTheme("auto", "2026-03-01").key, "default");
  assert.equal(resolveTheme("octobre-rose", "2026-12-10").key, "octobre-rose");
});

check("chaque rangée de fête correspond à un habillage existant", () => {
  for (const key of Object.keys(SEASON_RAILS)) assert.ok(THEME_KEYS.includes(key as never), key);
});

const mk = (title: string, price: number, originalPrice: number | null) =>
  ({ id: title, title, description: null, collectionTitle: null, price, originalPrice }) as never;

check("rangée Noël : seulement les produits qui correspondent", () => {
  const r = seasonProducts("noel", [mk("Coffret cadeau", 10, null), mk("Pneu", 5, null)]);
  assert.equal(r.length, 1);
});

check("Black Friday : uniquement les vraies promotions", () => {
  const r = seasonProducts("black-friday", [mk("A", 5, 10), mk("B", 10, 10), mk("C", 10, null)]);
  assert.deepEqual(r.map((p) => p.title), ["A"]);
});

check("été : un maillot de bain est proposé, sans accent aussi", () => {
  assert.equal(seasonProducts("ete", [mk("Maillot de bain une pièce", 1, null)]).length, 1);
});

console.log(`\n${passed} vérifications réussies.`);
