/*
  TESTS : quand l'argent d'une vente devient celui du vendeur.

  Deux signatures (remise + réception), ou la date limite : 15 jours en
  Haïti, 25 par transporteur extérieur. Et le gel l'emporte sur tout.

  Lancer : npm run test:delais
*/

import assert from "node:assert/strict";
import {
  payoutStateFor, payoutDueAt, PAYOUT_DELAY_DAYS,
} from "../backend/packages/api/src/api/payout-delay.js";

let passed = 0;
function check(name: string, run: () => void) { run(); passed += 1; console.log(`  ✓ ${name}`); }

const JOUR = 24 * 60 * 60 * 1000;
const t0 = new Date("2026-10-01T12:00:00Z");
const plus = (jours: number) => new Date(t0.getTime() + jours * JOUR);

const base = {
  method: "seller" as const,
  handoverConfirmedAt: null, customerConfirmedAt: null, payoutDueAt: null,
  frozen: false, now: t0,
};

check("les délais annoncés sont bien 15 et 25 jours", () => {
  assert.equal(PAYOUT_DELAY_DAYS.standard, 15);
  assert.equal(PAYOUT_DELAY_DAYS.carrier, 25);
  assert.equal(payoutDueAt("seller", t0).getTime(), plus(15).getTime());
  assert.equal(payoutDueAt("carrier", t0).getTime(), plus(25).getTime());
});

check("la remise seule ne paie pas le vendeur avant le délai", () => {
  assert.equal(payoutStateFor({ ...base, handoverConfirmedAt: t0, payoutDueAt: plus(15), now: plus(3) }), "held");
});

check("remise + réception : le versement part tout de suite", () => {
  assert.equal(payoutStateFor({ ...base, handoverConfirmedAt: t0, customerConfirmedAt: plus(1), payoutDueAt: plus(15), now: plus(1) }), "releasable");
});

check("un acheteur silencieux ne garde pas l'argent au-delà du délai", () => {
  assert.equal(payoutStateFor({ ...base, handoverConfirmedAt: t0, payoutDueAt: plus(15), now: plus(15) }), "releasable");
});

check("sans remise, le temps ne paie jamais à sa place", () => {
  // Créer une livraison, ne rien faire, attendre : la fraude la plus simple.
  assert.equal(payoutStateFor({ ...base, payoutDueAt: plus(15), now: plus(400) }), "held");
});

check("transporteur : la réception de l'acheteur suffit, c'est la seule preuve", () => {
  assert.equal(payoutStateFor({ ...base, method: "carrier", customerConfirmedAt: plus(20), payoutDueAt: plus(25), now: plus(20) }), "releasable");
});

check("transporteur : 25 jours, pas 15 — le colis n'a pas fini la douane", () => {
  const ctx = { ...base, method: "carrier" as const, payoutDueAt: payoutDueAt("carrier", t0) };
  assert.equal(payoutStateFor({ ...ctx, now: plus(16) }), "held");
  assert.equal(payoutStateFor({ ...ctx, now: plus(25) }), "releasable");
});

check("le gel l'emporte sur les deux signatures ET sur le délai", () => {
  const tout = { ...base, handoverConfirmedAt: t0, customerConfirmedAt: plus(1), payoutDueAt: plus(15), now: plus(99), frozen: true };
  assert.equal(payoutStateFor(tout), "held");
  assert.equal(payoutStateFor({ ...tout, method: "carrier" }), "held");
});

console.log(`\n${passed} vérifications passées.\n`);
