/*
  Le bouton « Commander sur WhatsApp » : numéro normalisé, lien correct,
  rien affiché sans numéro, et seulement ce que le vendeur a publié.
*/
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeWhatsapp, readSellerWhatsapp, whatsappLink } from "../src/lib/seller-whatsapp.ts";

let passed = 0;
function check(name: string, run: () => void) {
  run();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

console.log("\nBouton WhatsApp");

check("un numéro haïtien à 8 chiffres reçoit l'indicatif 509", () => {
  assert.equal(normalizeWhatsapp("3712 3456"), "50937123456");
  assert.equal(normalizeWhatsapp("+509 3712-3456"), "50937123456");
  assert.equal(normalizeWhatsapp("00 509 37123456"), "50937123456");
  assert.equal(normalizeWhatsapp("+1 305 555 0123"), "13055550123");
});

check("un numéro illisible est refusé, pas enregistré", () => {
  for (const bad of ["", "abc", "123", "1234567890123456", null, undefined, 42]) {
    assert.equal(normalizeWhatsapp(bad as string), null, String(bad));
  }
});

check("sans numéro dans la fiche, pas de bouton", () => {
  assert.equal(readSellerWhatsapp({}), null);
  assert.equal(readSellerWhatsapp(null), null);
  assert.equal(readSellerWhatsapp({ whatsapp: "50937123456" }), "50937123456");
});

check("le lien wa.me porte le numéro et le message encodé", () => {
  const link = whatsappLink("50937123456", "Bonjour « Képi » & merci");
  assert.ok(link.startsWith("https://wa.me/50937123456?text="));
  assert.ok(!link.includes(" "));
  assert.ok(link.includes(encodeURIComponent("Képi")));
});

check("la fiche produit n'affiche le bouton que si le vendeur a un numéro", () => {
  const page = readFileSync("src/app/product/[slug]/page.tsx", "utf8");
  assert.match(page, /readSellerWhatsapp\(offer\.sellerMetadata\) && \(/);
  assert.match(page, /Commander sur WhatsApp/);
  /* Le vendeur est prévenu que le numéro devient public. */
  const profil = readFileSync("src/app/dashboard/seller/profil/page.tsx", "utf8");
  assert.match(profil, /visible de tous/);
});

console.log(`\n${passed} vérifications réussies.`);
