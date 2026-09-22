/*
  TESTS : les devis.

  Ce qui est vérifié ici décide de deux choses graves.

  D'abord, qui peut lire une demande. Le jeton est la seule chose qui
  protège la demande d'un acheteur sans compte : son nom, son adresse,
  son téléphone, et le prix qu'un vendeur lui a consenti. Une comparaison
  laxiste ouvrirait tout cela.

  Ensuite, ce qu'un prix veut dire. Un montant absent doit rester absent :
  zéro se lit « gratuit », et une proposition périmée affichée comme
  valable engagerait un vendeur sur un prix qu'il a retiré.

  Lancer : npm run test:devis
*/

import assert from "node:assert/strict";
import {
  text,
  email,
  quantity,
  newAccessToken,
  tokenMatches,
  publicQuote,
  withExpiry,
  MAX_QUANTITY,
} from "../backend/packages/api/src/api/quote-helpers";

let passed = 0;

function check(name: string, run: () => void) {
  run();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

console.log("\nDevis");

check("un texte vide n'est pas un texte", () => {
  for (const value of ["", "   ", "\n", null, undefined, 42, {}]) {
    assert.equal(text(value as never), null, JSON.stringify(value));
  }
});

check("un texte trop long est coupé, pas rejeté", () => {
  /*
    Couper plutôt que refuser : un acheteur qui a écrit trop long ne
    doit pas perdre sa demande, et le vendeur lira l'essentiel.
  */
  const result = text("a".repeat(5000), 200);

  assert.equal(result?.length, 200);
});

check("une adresse sans arobase ou sans domaine est refusée", () => {
  for (const value of ["marie", "marie@", "@exemple.ht", "marie@exemple", "a b@c.ht"]) {
    assert.equal(email(value), null, value);
  }
});

check("une adresse valable est conservée en minuscules", () => {
  assert.equal(email("  Marie@Exemple.HT "), "marie@exemple.ht");
});

check("une quantité nulle, négative ou absurde est refusée", () => {
  for (const value of [0, -1, "", null, "beaucoup", NaN, Infinity, MAX_QUANTITY + 1]) {
    assert.equal(quantity(value as never), null, String(value));
  }
});

check("une quantité décimale est ramenée à l'entier inférieur", () => {
  /* « 2,7 sacs » se commande en 2 : arrondir au-dessus facturerait plus. */
  assert.equal(quantity("2.7"), 2);
  assert.equal(quantity(1), 1);
  assert.equal(quantity(MAX_QUANTITY), MAX_QUANTITY);
});

check("deux jetons tirés de suite diffèrent", () => {
  const seen = new Set<string>();

  for (let index = 0; index < 50; index += 1) {
    const token = newAccessToken();

    assert.ok(token.length >= 32, "jeton trop court");
    assert.equal(seen.has(token), false, "jeton répété");

    seen.add(token);
  }
});

check("seul le jeton exact ouvre la demande", () => {
  const token = newAccessToken();

  assert.equal(tokenMatches(token, token), true);

  /* Ni vide, ni tronqué, ni d'un autre type. */
  for (const wrong of [
    "",
    token.slice(0, -1),
    `${token}x`,
    token.toUpperCase() === token ? token.toLowerCase() : token.toUpperCase(),
    null,
    undefined,
    0,
    {},
  ]) {
    assert.equal(tokenMatches(token, wrong as never), false, String(wrong));
  }
});

check("un jeton absent côté serveur n'ouvre rien", () => {
  /*
    Si le jeton stocké venait à manquer, comparer « rien » à « rien »
    ouvrirait la demande à quiconque envoie une chaîne vide.
  */
  assert.equal(tokenMatches("", ""), false);
});

const base = {
  id: "quo_1",
  display_id: 7,
  seller_id: "sel_1",
  customer_id: null,
  access_token: "secret-token-abcdefghijklmnop",
  buyer_name: "Marie Joseph",
  buyer_email: "marie@exemple.ht",
  buyer_phone: null,
  buyer_company: null,
  product_id: null,
  variant_id: null,
  product_title: "Sac de riz 25 kg",
  quantity: 200,
  message: null,
  status: "pending",
  seller_message: null,
  quoted_amount: null,
  currency_code: null,
  valid_until: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

check("le jeton ne sort jamais avec la demande", () => {
  const exposed = publicQuote({ ...base });

  assert.equal("access_token" in exposed, false);
  assert.equal(JSON.stringify(exposed).includes("secret-token"), false);
});

check("un montant absent reste absent", () => {
  /* Zéro se lirait « gratuit » — c'est ce que personne n'a dit. */
  assert.equal(publicQuote({ ...base }).quoted_amount, null);
  assert.equal(
    publicQuote({ ...base, quoted_amount: undefined as never }).quoted_amount,
    null
  );
});

check("un montant chiffré est un nombre, même stocké en texte", () => {
  /*
    PostgreSQL rend une colonne numeric sous forme de chaîne. Laissée
    telle quelle, elle se concaténerait au lieu de s'additionner.
  */
  assert.equal(publicQuote({ ...base, quoted_amount: "180000" }).quoted_amount, 180000);
});

check("une proposition dont la date est passée se lit expirée", () => {
  const expired = withExpiry(
    { status: "answered", valid_until: "2020-01-01T00:00:00.000Z" },
    new Date("2026-01-01T00:00:00.000Z")
  );

  assert.equal(expired.status, "expired");
});

check("une proposition encore valable ne l'est pas", () => {
  const live = withExpiry(
    { status: "answered", valid_until: "2027-01-01T00:00:00.000Z" },
    new Date("2026-01-01T00:00:00.000Z")
  );

  assert.equal(live.status, "answered");
});

check("une proposition sans date de fin ne périme pas", () => {
  /*
    Le vendeur n'a fixé aucune limite : lui en inventer une retirerait
    une offre qu'il maintient.
  */
  assert.equal(
    withExpiry({ status: "answered", valid_until: null }).status,
    "answered"
  );
});

check("une date illisible ne fait pas expirer", () => {
  assert.equal(
    withExpiry({ status: "answered", valid_until: "pas une date" }).status,
    "answered"
  );
});

check("un devis accepté ne devient jamais expiré", () => {
  /*
    L'acheteur s'est prononcé. Réécrire son statut effacerait un
    accord passé entre deux personnes.
  */
  for (const status of ["accepted", "declined", "pending"]) {
    assert.equal(
      withExpiry(
        { status, valid_until: "2020-01-01T00:00:00.000Z" },
        new Date("2026-01-01T00:00:00.000Z")
      ).status,
      status
    );
  }
});

console.log(`\n${passed} vérifications passées.\n`);
