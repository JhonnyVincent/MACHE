/*
  Autorisation des revendeurs : qui est « la marque » d'un produit.
*/
import assert from "node:assert/strict";
import { brandStatus, type ProductRow } from "../backend/packages/api/src/lib/brand-authorization.ts";

let passed = 0;
function check(name: string, run: () => void) {
  run();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

const product = (sellers: string[], metadata: Record<string, unknown> | null = null): ProductRow => ({
  id: "prod_1",
  title: "Sac",
  metadata,
  sellers: sellers.map((id) => ({ id })),
});

console.log("\nMarque et revendeurs");

check("seule boutique autorisée, pas encore marquée : elle peut réclamer le produit", () => {
  assert.equal(brandStatus(product(["sel_a"]), "sel_a"), "claimable");
});

check("une boutique autorisée plus tard ne peut pas réclamer un produit déjà pris", () => {
  assert.equal(brandStatus(product(["sel_a", "sel_b"]), "sel_b"), "no");
  assert.equal(brandStatus(product(["sel_a", "sel_b"]), "sel_a"), "no");
});

check("produit marqué : seule la marque propriétaire est reconnue", () => {
  const owned = product(["sel_a", "sel_b"], { brand_seller_id: "sel_a" });
  assert.equal(brandStatus(owned, "sel_a"), "owned");
  assert.equal(brandStatus(owned, "sel_b"), "no");
});

check("un produit sans aucune autorisation n'est à personne", () => {
  assert.equal(brandStatus(product([]), "sel_a"), "no");
});

console.log(`\n${passed} vérifications réussies.`);
