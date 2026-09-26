/*
  TESTS : « Sur MACHÉ en ce moment » fait passer chaque vendeur à son tour.

  Lancer : npm run test:rotation
*/

import assert from "node:assert/strict";
import { rotateFairly, hourSeed } from "../src/lib/rotation.ts";

let passed = 0;
function check(name: string, run: () => void) { run(); passed += 1; console.log(`  ✓ ${name}`); }

type P = { id: string; seller: string };

/* Une grosse boutique (50 articles) et quatre petites (1 article chacune). */
const products: P[] = [
  ...Array.from({ length: 50 }, (_, i) => ({ id: `gros-${i}`, seller: "grosse" })),
  ...["a", "b", "c", "d"].map((s) => ({ id: `petit-${s}`, seller: s })),
];
const sellerOf = (p: P) => p.seller;

check("une grosse boutique n'occupe pas la section à elle seule", () => {
  const picked = rotateFairly(products, sellerOf, 42, 5);
  assert.equal(new Set(picked.map((p) => p.seller)).size, 5, "cinq places, cinq boutiques différentes");
});

check("chaque boutique passe avant qu'une autre repasse", () => {
  const picked = rotateFairly(products, sellerOf, 7, 12);
  const firstFive = picked.slice(0, 5).map((p) => p.seller);
  assert.equal(new Set(firstFive).size, 5);
});

check("le tirage change d'une heure à l'autre", () => {
  const h = hourSeed(new Date("2026-10-01T10:30:00Z"));
  const orders = new Set(
    Array.from({ length: 6 }, (_, i) => rotateFairly(products, sellerOf, h + i, 5).map((p) => p.id).join(","))
  );
  assert.ok(orders.size > 1, "six heures de suite ne doivent pas donner six fois la même sélection");
});

check("même heure, même sélection pour tout le monde", () => {
  const a = rotateFairly(products, sellerOf, 123, 8).map((p) => p.id);
  const b = rotateFairly(products, sellerOf, 123, 8).map((p) => p.id);
  assert.deepEqual(a, b);
});

check("un article sans boutique connue n'est pas écarté", () => {
  const picked = rotateFairly([{ id: "x", seller: "" }], () => null, 1, 3);
  assert.equal(picked.length, 1);
});

console.log(`\n${passed} vérifications passées.\n`);
