/*
  TESTS : le profil déclaré d'une boutique.

  Ce profil vient du champ libre du vendeur, qui est écrit par le
  vendeur. Tout ce qui en sort s'affiche sur une page publique et sert à
  filtrer le catalogue : rien n'y passe sans être reconnu.

  Lancer : npm run test:profil
*/

import assert from "node:assert/strict";
import {
  SELLER_PROFILES,
  isSellerProfile,
  readSellerProfile,
  profileInfo,
} from "@/lib/seller-profile";

let passed = 0;

function check(name: string, run: () => void) {
  run();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

console.log("\nProfil déclaré d'une boutique");

check("les quatre profils annoncés par les pages /sell existent", () => {
  assert.deepEqual(
    SELLER_PROFILES.map((entry) => entry.id).sort(),
    ["business", "fournisseur", "marque", "particulier"]
  );

  /* Chaque profil renvoie vers la page qui le présente. */
  for (const entry of SELLER_PROFILES) {
    assert.match(entry.sellPage, /^\/sell\//, entry.id);
  }
});

check("refuse tout ce qui n'est pas un profil déclaré", () => {
  for (const value of [
    "verifie",
    "admin",
    "PARTICULIER",
    " fournisseur ",
    "",
    null,
    undefined,
    42,
    { id: "marque" },
    ["marque"],
  ]) {
    assert.equal(isSellerProfile(value), false, JSON.stringify(value));
  }
});

check("accepte les quatre identifiants exacts", () => {
  for (const entry of SELLER_PROFILES) {
    assert.equal(isSellerProfile(entry.id), true, entry.id);
  }
});

check("lit le profil rangé dans le champ libre du vendeur", () => {
  assert.equal(readSellerProfile({ profile: "fournisseur" }), "fournisseur");
  /* Les espaces d'un copier-coller ne doivent pas perdre le profil. */
  assert.equal(readSellerProfile({ profile: " marque " }), "marque");
});

check("ne choisit pas de profil à la place du vendeur", () => {
  /*
    Une boutique qui n'a rien déclaré n'est pas « un particulier » :
    afficher un profil qu'on a choisi soi-même ferait dire au vendeur ce
    qu'il n'a pas dit.
  */
  for (const metadata of [
    null,
    undefined,
    {},
    { profile: "" },
    { profile: "grossiste" },
    { profile: 7 },
    { storefront: { content: [] } },
  ]) {
    assert.equal(readSellerProfile(metadata as never), null, JSON.stringify(metadata));
  }
});

check("aucun profil ne se présente comme vérifié par MACHÉ", () => {
  /*
    Un badge qui se pose lui-même ne vérifie rien. Le vocabulaire des
    profils ne doit donc jamais suggérer un contrôle : c'est ce qui
    distingue une déclaration d'une garantie.
  */
  const interdits = /vérifi|verifi|certifi|officiel|garanti|approuv/i;

  for (const entry of SELLER_PROFILES) {
    assert.doesNotMatch(entry.badge, interdits, `badge ${entry.id}`);
    assert.doesNotMatch(entry.meaning, interdits, `sens ${entry.id}`);
  }
});

check("un seul profil met en avant les prix par quantité", () => {
  const gros = SELLER_PROFILES.filter((entry) => entry.wholesale);
  assert.deepEqual(gros.map((entry) => entry.id), ["fournisseur"]);
});

check("profileInfo rend toujours un profil affichable", () => {
  for (const entry of SELLER_PROFILES) {
    assert.equal(profileInfo(entry.id).id, entry.id);
    assert.ok(profileInfo(entry.id).badge.length > 0);
  }
});

console.log(`\n${passed} vérifications passées.\n`);
