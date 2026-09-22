/*
  TESTS : les tarifs vendeurs.

  Une page de tarifs est un engagement public. Ce qui est vérifié ici :

  - qu'aucun chiffre non décidé ne s'affiche comme décidé. Le taux de
    commission n'est pas arrêté ; s'il valait zéro au lieu de rien, la
    page afficherait « 0 % », c'est-à-dire « gratuit » ;
  - que l'abonnement ne déborde pas sur les profils qui n'en ont pas.
    Facturer un abonnement à un particulier le ferait renoncer avant
    d'avoir essayé ;
  - que la conversion en gourdes reste dans la fourchette annoncée.

  Lancer : npm run test:tarifs
*/

import assert from "node:assert/strict";
import {
  TARIFS,
  COMMISSION_RATE,
  EUR_TO_HTG,
  EUR_TO_HTG_DATE,
  billingLine,
  htgFromEur,
} from "@/lib/tarifs";

let passed = 0;

function check(name: string, run: () => void) {
  run();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

console.log("\nTarifs vendeurs");

check("un taux non décidé n'est pas zéro", () => {
  /*
    `null` se rend « pas encore arrêté ». Zéro se rendrait « 0 % »,
    c'est-à-dire une promesse de gratuité que personne n'a faite.
  */
  assert.notEqual(COMMISSION_RATE, 0);
  assert.equal(COMMISSION_RATE === null || COMMISSION_RATE > 0, true);
});

check("les quatre profils ont un tarif, et un seul", () => {
  const profiles = TARIFS.map((tarif) => tarif.profile);

  assert.deepEqual(
    [...profiles].sort(),
    ["business", "fournisseur", "marque", "particulier"]
  );

  assert.equal(new Set(profiles).size, profiles.length);
});

check("seule la marque officielle a un abonnement", () => {
  /*
    La décision est là : un particulier ou une boutique de quartier ne
    paie rien d'avance. L'étendre par inadvertance se verrait ici.
  */
  const abonnés = TARIFS.filter(
    (tarif) => tarif.billing.kind === "subscription"
  ).map((tarif) => tarif.profile);

  assert.deepEqual(abonnés, ["marque"]);
});

check("les grossistes sont sur devis, pas sur grille", () => {
  const grossiste = TARIFS.find((tarif) => tarif.profile === "fournisseur");

  assert.equal(grossiste?.billing.kind, "quote");
});

check("l'abonnement reste dans la fourchette décidée", () => {
  const marque = TARIFS.find((tarif) => tarif.profile === "marque");

  assert.equal(marque?.billing.kind, "subscription");

  if (marque?.billing.kind !== "subscription") return;

  assert.equal(marque.billing.minEur, 120);
  assert.equal(marque.billing.maxEur, 300);
  assert.ok(marque.billing.minEur < marque.billing.maxEur);
});

check("la phrase de facturation ne promet jamais la gratuité", () => {
  /*
    « Sans abonnement » n'est pas « gratuit » : la commission
    s'applique. Le mot ne doit apparaître nulle part.
  */
  for (const tarif of TARIFS) {
    const line = billingLine(tarif.billing).toLowerCase();

    assert.equal(line.includes("gratuit"), false, tarif.profile);
    assert.equal(line.includes("offert"), false, tarif.profile);
    assert.equal(line.includes("0"), line.includes("300"), tarif.profile);
  }
});

check("la conversion en gourdes suit le taux retenu", () => {
  assert.ok(EUR_TO_HTG > 0, "taux nul ou négatif");

  /* Arrondi au millier : une conversion indicative, pas une facture. */
  assert.equal(htgFromEur(120) % 1000, 0);
  assert.equal(htgFromEur(300) % 1000, 0);

  /* L'arrondi ne doit pas écarter du montant réel de plus de 500 HTG. */
  for (const euros of [120, 300]) {
    assert.ok(
      Math.abs(htgFromEur(euros) - euros * EUR_TO_HTG) <= 500,
      `conversion trop éloignée pour ${euros} €`
    );
  }
});

check("le taux porte une date", () => {
  /*
    Un taux figé sans date se lit comme le taux du jour. Celui-ci est
    daté, et la page affiche cette date.
  */
  assert.ok(EUR_TO_HTG_DATE.trim().length > 0);
  assert.match(EUR_TO_HTG_DATE, /\d{4}/);
});

check("aucun tarif ne vante une fonctionnalité absente", () => {
  /*
    Les lignes « incluses » ne décrivent que ce qui existe. Les mots
    ci-dessous ont désigné, dans les versions précédentes du site, des
    fonctionnalités annoncées et jamais livrées.
  */
  const interdits = ["bientôt", "prochainement", "à venir", "sponsoris"];

  for (const tarif of TARIFS) {
    for (const line of tarif.included) {
      for (const mot of interdits) {
        assert.equal(
          line.toLowerCase().includes(mot),
          false,
          `${tarif.profile} : « ${line} »`
        );
      }
    }
  }
});

console.log(`\n${passed} vérifications passées.\n`);
