/*
  TESTS : la commande minimum d'une boutique.

  Elle décide si une commande peut aboutir. Une erreur ici bloque une
  vente qui devait passer, ou en laisse passer une qui ne respectait pas
  les conditions d'un vendeur — et le vendeur n'a aucun moyen de s'en
  apercevoir avant de recevoir la commande.

  Lancer : npm run test:minimum
*/

import assert from "node:assert/strict";
import {
  readSellerMinimum,
  sanitizeMinimum,
  groupBySeller,
  blockingGroups,
} from "@/lib/seller-minimum";

let passed = 0;

function check(name: string, run: () => void) {
  run();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

const ligne = (sellerId: string | null, total: number, quantity = 1, sellerName = "Boutique") =>
  ({ sellerId, sellerName, total, quantity });

console.log("\nCommande minimum");

check("la plupart des boutiques n'en ont pas", () => {
  /* Vendre à qui veut, quelle que soit la somme, est la règle. */
  for (const metadata of [null, undefined, {}, { min_order: 0 }, { min_order: "" }]) {
    assert.equal(readSellerMinimum(metadata as never), 0, JSON.stringify(metadata));
  }
});

check("refuse un minimum négatif ou absurde", () => {
  assert.equal(readSellerMinimum({ min_order: -500 }), 0);
  assert.equal(readSellerMinimum({ min_order: "abc" }), 0);
  /* Au-delà, ce n'est plus une condition de vente mais une porte fermée. */
  assert.equal(readSellerMinimum({ min_order: 99_000_000 }), 10_000_000);
});

check("accepte ce qu'un vendeur saisit vraiment", () => {
  /* « 5 000 », « 5000 HTG », « 5.000 » : on retient le nombre. */
  assert.equal(sanitizeMinimum("5000"), 5000);
  assert.equal(sanitizeMinimum("5 000 HTG"), 5000);
  assert.equal(sanitizeMinimum("5.000"), 5000);
  assert.equal(sanitizeMinimum(""), 0);
  assert.equal(sanitizeMinimum("zéro"), 0);
  assert.equal(sanitizeMinimum("-12"), 12);
});

check("chaque boutique a son propre total", () => {
  const groups = groupBySeller(
    [
      ligne("sel_a", 3000, 1, "Grossiste A"),
      ligne("sel_b", 800, 2, "Artisan B"),
      ligne("sel_a", 1500, 1, "Grossiste A"),
    ],
    new Map()
  );

  assert.equal(groups.length, 2);

  const a = groups.find((g) => g.sellerId === "sel_a")!;
  assert.equal(a.subtotal, 4500);
  assert.equal(a.itemCount, 2);
  assert.equal(a.sellerName, "Grossiste A");
});

check("le minimum d'une boutique ne s'atteint pas avec les achats faits ailleurs", () => {
  /*
    C'est la raison d'être du regroupement. Additionner les vendeurs
    ferait franchir le seuil d'un grossiste avec le panier d'un autre.
  */
  const groups = groupBySeller(
    [ligne("sel_gros", 2000), ligne("sel_autre", 9000)],
    new Map([["sel_gros", 5000]])
  );

  const gros = groups.find((g) => g.sellerId === "sel_gros")!;
  assert.equal(gros.missing, 3000);
  assert.equal(blockingGroups(groups).length, 1);
});

check("un minimum atteint ne manque de rien", () => {
  const groups = groupBySeller(
    [ligne("sel_gros", 5000)],
    new Map([["sel_gros", 5000]])
  );

  assert.equal(groups[0].missing, 0);
  assert.deepEqual(blockingGroups(groups), []);
});

check("une ligne sans boutique n'est rattachée à personne", () => {
  /*
    La ranger au hasard fausserait le total d'un vendeur, donc sa
    condition de vente.
  */
  const groups = groupBySeller(
    [ligne(null, 9000), ligne("sel_a", 100)],
    new Map([["sel_a", 5000]])
  );

  assert.equal(groups.length, 1);
  assert.equal(groups[0].subtotal, 100);
  assert.equal(groups[0].missing, 4900);
});

check("un panier vide ne bloque rien", () => {
  assert.deepEqual(groupBySeller([], new Map()), []);
  assert.deepEqual(blockingGroups([]), []);
});

console.log(`\n${passed} vérifications passées.\n`);
