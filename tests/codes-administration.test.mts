/*
  TESTS : les codes à usage unique de l'administration.

  Pourquoi ce fichier importe le code du BACKEND

  Parce que c'est là qu'il vit, et qu'une copie ici finirait par
  diverger de l'original sans que rien ne le signale. Le fichier
  `totp.ts` ne dépend que de `node:crypto` — aucun Medusa, aucun
  réseau — donc il se charge tel quel.

  Ce que ces vérifications protègent

  1. La CONFORMITÉ. Cet algorithme est écrit à la main. S'il s'écarte
     de la RFC 6238, aucune application d'authentification du monde ne
     produira le bon code, et le compte d'administration sera
     inaccessible. Les six vecteurs officiels de la RFC sont donc
     rejoués ici : ils ne dépendent ni de l'heure, ni de la machine.

  2. L'ÉTROITESSE DE LA FENÊTRE. Un code accepté trop longtemps est un
     code qu'on peut lire par-dessus une épaule et utiliser ensuite.

  3. L'ABSENCE DE REJEU. Sans cela, le point 2 ne servirait à rien.

  Lancer : npm run test:codes
*/

import assert from "node:assert/strict";
import {
  base32Encode,
  base32Decode,
  codeForStep,
  currentStep,
  verifyTotp,
  otpauthUri,
  newRecoveryCodes,
  hashRecovery,
  matchRecovery,
} from "../backend/packages/api/src/api/totp";

let passed = 0;

function check(name: string, run: () => void) {
  run();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

console.log("\nCodes à usage unique de l'administration");

/* Le secret des vecteurs de la RFC : la chaîne ASCII « 12345678901234567890 ». */
const RFC_SECRET = base32Encode(Buffer.from("12345678901234567890", "ascii"));

check("le secret des vecteurs officiels s'encode comme attendu", () => {
  assert.equal(RFC_SECRET, "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
});

check("les six vecteurs officiels de la RFC 6238 sont reproduits", () => {
  /*
    La RFC publie des codes à huit chiffres ; MACHÉ en produit six, et
    six chiffres sont les six derniers des huit. Ces valeurs ne
    dépendent pas de l'heure : elles fixent un instant.
  */
  const vectors: [number, string][] = [
    [59, "287082"],
    [1111111109, "081804"],
    [1111111111, "050471"],
    [1234567890, "005924"],
    [2000000000, "279037"],
    [20000000000, "353130"],
  ];

  for (const [seconds, expected] of vectors) {
    assert.equal(
      codeForStep(RFC_SECRET, Math.floor(seconds / 30)),
      expected,
      `T=${seconds}`
    );
  }
});

check("un secret encodé puis décodé revient identique", () => {
  for (let index = 0; index < 100; index += 1) {
    const bytes = Buffer.from(
      Array.from({ length: 20 }, () => Math.floor(Math.random() * 256))
    );

    assert.deepEqual(base32Decode(base32Encode(bytes)), bytes);
  }
});

check("un secret recopié avec espaces et tirets est accepté", () => {
  /*
    Il n'y a pas de code QR : la clé se recopie à la main, par groupes.
    La refuser à cause d'un espace rendrait l'inscription impossible.
  */
  assert.deepEqual(
    base32Decode("GEZD GNBV-GY3T QOJQ GEZD GNBV GY3T QOJQ"),
    Buffer.from("12345678901234567890", "ascii")
  );
});

check("la tolérance d'horloge est d'un pas, pas davantage", () => {
  const now = new Date();
  const step = currentStep(now);

  assert.equal(verifyTotp(RFC_SECRET, codeForStep(RFC_SECRET, step), null, now).ok, true);
  assert.equal(verifyTotp(RFC_SECRET, codeForStep(RFC_SECRET, step - 1), null, now).ok, true);
  assert.equal(verifyTotp(RFC_SECRET, codeForStep(RFC_SECRET, step + 1), null, now).ok, true);

  /*
    Deux pas, c'est une minute. Un code valable une minute est un code
    qu'on a le temps de lire et de retaper ailleurs.
  */
  assert.equal(verifyTotp(RFC_SECRET, codeForStep(RFC_SECRET, step - 2), null, now).ok, false);
  assert.equal(verifyTotp(RFC_SECRET, codeForStep(RFC_SECRET, step + 2), null, now).ok, false);
});

check("un code déjà utilisé est refusé, et le dit", () => {
  const now = new Date();
  const step = currentStep(now);
  const code = codeForStep(RFC_SECRET, step);

  const first = verifyTotp(RFC_SECRET, code, null, now);

  assert.equal(first.ok, true);

  const again = verifyTotp(RFC_SECRET, code, first.ok ? first.step : null, now);

  assert.equal(again.ok, false);

  /*
    « Déjà utilisé » et « incorrect » appellent deux gestes différents :
    attendre trente secondes, ou vérifier l'heure du téléphone.
  */
  assert.equal(again.ok === false && again.reason, "replayed");
});

check("un pas antérieur au dernier accepté est refusé", () => {
  const now = new Date();
  const step = currentStep(now);

  const old = verifyTotp(RFC_SECRET, codeForStep(RFC_SECRET, step - 1), step, now);

  assert.equal(old.ok, false);
});

check("ce qui n'est pas six chiffres est refusé avant tout calcul", () => {
  for (const bad of ["", "12345", "1234567", "abcdef", null, undefined, 123456]) {
    const out = verifyTotp(RFC_SECRET, bad, null);

    assert.equal(out.ok, false);
    assert.equal(out.ok === false && out.reason, "format", String(bad));
  }
});

check("l'adresse otpauth nomme l'émetteur deux fois", () => {
  /*
    Les applications ne lisent pas toutes le même endroit. N'en mettre
    qu'un donne une entrée nommée « MACHÉ » chez les unes et par
    l'adresse e-mail seule chez les autres.
  */
  const uri = otpauthUri("JBSWY3DPEHPK3PXP", "chef@exemple.ht");

  assert.equal(uri.startsWith("otpauth://totp/"), true);
  assert.equal(uri.includes("MACHE%3Achef%40exemple.ht"), true);
  assert.equal(uri.includes("issuer=MACHE"), true);
  assert.equal(uri.includes("digits=6"), true);
  assert.equal(uri.includes("period=30"), true);
});

check("les codes de secours évitent les caractères ambigus", () => {
  /*
    Ils se recopient d'un papier, souvent dans l'urgence d'un téléphone
    perdu. Un O pris pour un zéro ferme la porte définitivement.
  */
  const codes = newRecoveryCodes();

  assert.equal(codes.length, 8);
  assert.equal(new Set(codes).size, 8);

  for (const code of codes) {
    assert.equal(/[O0I1]/.test(code), false, code);
  }
});

check("les codes de secours sont rangés hachés, pas en clair", () => {
  const codes = newRecoveryCodes();
  const hashes = codes.map(hashRecovery);

  for (const [index, hash] of hashes.entries()) {
    assert.equal(hash.includes(codes[index].replace("-", "")), false);
    /* SHA-256 en hexadécimal : soixante-quatre caractères. */
    assert.equal(hash.length, 64);
  }
});

check("un code de secours se retrouve quelle que soit sa mise en forme", () => {
  const codes = newRecoveryCodes();
  const hashes = codes.map(hashRecovery);

  assert.equal(matchRecovery(hashes, codes[2]), hashes[2]);
  assert.equal(matchRecovery(hashes, codes[2].toLowerCase()), hashes[2]);
  assert.equal(matchRecovery(hashes, codes[2].replace("-", " ")), hashes[2]);
});

check("un code de secours inventé ou vide ne passe pas", () => {
  const hashes = newRecoveryCodes().map(hashRecovery);

  assert.equal(matchRecovery(hashes, "AAAAA-BBBBB"), null);
  assert.equal(matchRecovery(hashes, ""), null);
  assert.equal(matchRecovery(hashes, null), null);
});

console.log(`\n${passed} vérifications passées.\n`);
