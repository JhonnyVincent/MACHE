/*
  TESTS : la preuve attachée à un contrat signé.

  Ce qui est en jeu

  Un contrat signé ne vaut que si l'on peut démontrer, plus tard, QUEL
  TEXTE a été signé. La fraude la plus simple avec un contrat en ligne
  consiste à le faire signer puis à le récrire. Ces vérifications
  portent sur le seul mécanisme qui l'empêche : l'empreinte figée.

  Elles importent le code du backend plutôt que de le recopier — une
  copie finirait par diverger sans que rien ne le signale. Le fichier
  `contract-proof.ts` ne dépend que de `node:crypto`.

  Lancer : npm run test:contrats
*/

import assert from "node:assert/strict";
import {
  contentHash,
  normalizeBody,
  proofHash,
  verifyProof,
  clientIp,
  type ProofFacts,
} from "../backend/packages/api/src/api/contract-proof";

let passed = 0;

function check(name: string, run: () => void) {
  run();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

const TEXTE = "Article 1 — Le vendeur reverse 8 % de commission à MACHÉ.";

function facts(over: Partial<ProofFacts> = {}): ProofFacts {
  return {
    contract_id: "ctr_1",
    contract_version: 2,
    content_hash: contentHash(TEXTE),
    seller_id: "sel_1",
    signer_name: "Jean Baptiste",
    signer_role: "Gérant",
    signer_email: "jean@exemple.ht",
    signed_at: "2026-09-24T21:00:00.000Z",
    signer_ip: "203.0.113.7",
    ...over,
  };
}

console.log("\nPreuve attachée à un contrat signé");

check("l'empreinte est stable pour un même texte", () => {
  assert.equal(contentHash(TEXTE), contentHash(TEXTE));
  assert.equal(contentHash(TEXTE).length, 64);
});

check("changer un seul caractère change l'empreinte", () => {
  /*
    Le cas réel : « 8 % » devient « 18 % » après signature. C'est
    précisément ce qu'il faut rendre détectable.
  */
  assert.notEqual(
    contentHash(TEXTE),
    contentHash(TEXTE.replace("8 %", "18 %"))
  );
});

check("les fins de ligne Windows et Unix donnent la même empreinte", () => {
  /*
    Sans cette normalisation, le même contrat recopié depuis Windows
    échouerait à la vérification pour une raison sans rapport avec son
    contenu — et on conclurait à tort à une falsification.
  */
  assert.equal(contentHash("a\r\nb\r\nc"), contentHash("a\nb\nc"));
  assert.equal(normalizeBody("a\r\nb\rc"), "a\nb\nc");
});

check("la casse et les espaces NE sont PAS normalisés", () => {
  /*
    « le vendeur paie 8 % » et « Le Vendeur paie 8% » sont deux textes
    différents. Un contrat doit les distinguer : les rapprocher
    laisserait passer une réécriture discrète.
  */
  assert.notEqual(contentHash("le vendeur paie 8 %"), contentHash("Le Vendeur paie 8 %"));
  assert.notEqual(contentHash("paie 8 %"), contentHash("paie 8%"));
});

check("le sceau ne dépend pas de l'ordre des clés", () => {
  /*
    Sans le tri, l'empreinte dépendrait de l'ordre d'énumération d'un
    objet JavaScript, et une vérification honnête échouerait sans
    raison compréhensible.
  */
  const a = facts();

  const reordered = Object.fromEntries(
    Object.entries(a).reverse()
  ) as unknown as ProofFacts;

  assert.equal(proofHash(a), proofHash(reordered));
});

check("modifier un seul fait change le sceau", () => {
  const base = proofHash(facts());

  assert.notEqual(base, proofHash(facts({ signer_name: "Jean Baptiste " })));
  assert.notEqual(base, proofHash(facts({ signed_at: "2026-09-24T21:00:01.000Z" })));
  assert.notEqual(base, proofHash(facts({ contract_version: 3 })));
  assert.notEqual(base, proofHash(facts({ seller_id: "sel_2" })));
  assert.notEqual(base, proofHash(facts({ signer_ip: null })));
});

check("une signature intacte se vérifie", () => {
  const f = facts();

  const result = verifyProof(
    TEXTE,
    { content_hash: f.content_hash, proof_hash: proofHash(f) },
    f
  );

  assert.equal(result.body_matches, true);
  assert.equal(result.facts_match, true);
});

check("un texte modifié après signature est détecté", () => {
  const f = facts();

  const result = verifyProof(
    TEXTE.replace("8 %", "18 %"),
    { content_hash: f.content_hash, proof_hash: proofHash(f) },
    f
  );

  assert.equal(result.body_matches, false);
  /* Les faits, eux, n'ont pas bougé : les deux questions sont distinctes. */
  assert.equal(result.facts_match, true);
});

check("des faits retouchés en base sont détectés", () => {
  const f = facts();

  const sealed = proofHash(f);

  /* Quelqu'un antidate la signature directement dans la base. */
  const tampered = facts({ signed_at: "2026-01-01T00:00:00.000Z" });

  const result = verifyProof(
    TEXTE,
    { content_hash: f.content_hash, proof_hash: sealed },
    tampered
  );

  assert.equal(result.body_matches, true);
  assert.equal(result.facts_match, false);
});

check("une signature sans sceau n'est PAS déclarée valide", () => {
  /*
    Répondre « vrai » faute de sceau ferait passer l'absence de preuve
    pour une preuve — exactement l'erreur qu'un enregistrement ancien
    pourrait introduire sans qu'on y pense.
  */
  const f = facts();

  const result = verifyProof(
    TEXTE,
    { content_hash: f.content_hash, proof_hash: null },
    f
  );

  assert.equal(result.body_matches, true);
  assert.equal(result.facts_match, false);
});

check("l'adresse retenue est la première de x-forwarded-for", () => {
  /*
    Derrière un répartiteur de charge, l'adresse de connexion est celle
    du répartiteur. La vraie est la première de l'en-tête ; les
    suivantes sont les relais traversés.
  */
  assert.equal(
    clientIp({ "x-forwarded-for": "203.0.113.7, 70.41.3.18, 150.172.238.178" }),
    "203.0.113.7"
  );
  assert.equal(clientIp({ "x-forwarded-for": ["198.51.100.4"] }), "198.51.100.4");
});

check("x-real-ip sert de repli, et l'absence rend null", () => {
  assert.equal(clientIp({ "x-real-ip": "192.0.2.9" }), "192.0.2.9");
  assert.equal(clientIp({}), null);
  assert.equal(clientIp({ "x-forwarded-for": "  " }), null);
});

check("une adresse démesurée est tronquée", () => {
  /*
    Cet en-tête vient du client : il peut contenir n'importe quoi, y
    compris de quoi remplir une colonne de base de données.
  */
  const long = clientIp({ "x-forwarded-for": "a".repeat(5000) });

  assert.equal(long !== null && long.length <= 64, true);
});

console.log(`\n${passed} vérifications passées.\n`);
