/*
  TESTS : ce que MACHÉ a le droit d'écrire sur ses partenaires.

  C'est la page qu'on remplit le plus facilement de logos qu'on n'a pas
  le droit d'afficher. Un nom posé sur une page d'accueil vaut caution :
  le visiteur en conclut que cette entreprise travaille avec MACHÉ. Si
  c'est faux, c'est un mensonge, et en droit une atteinte à la marque.

  Trois règles :

  1. UN PARTENAIRE N'EST NOMMÉ QU'AVEC SON ADRESSE — sans lien, un nom
     n'est pas vérifiable, et un visiteur ne peut pas aller voir.

  2. RIEN NE S'AFFICHE QUAND LA LISTE EST VIDE — ni bande « Nos
     partenaires » creuse, ni cases grises qui annoncent un réseau
     inexistant.

  3. UN SERVICE QUI NE PASSE PAS PAR MACHÉ LE DIT — sans quoi un vendeur
     croit qu'ouvrir une boutique ici lui ouvre un financement, et MACHÉ
     se retrouve à répondre d'un refus qu'elle n'a pas décidé.

  Lancer : npm run test:partenaires
*/

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PARTNERS } from "../src/lib/partners.js";

let passed = 0;

function check(name: string, run: () => void) {
  run();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

const STRIP = readFileSync("src/components/partners-strip.tsx", "utf8");
const PAGE = readFileSync("src/app/partenaires/page.tsx", "utf8");

check("chaque partenaire nommé porte une adresse qu'on peut aller voir", () => {
  for (const partner of PARTNERS) {
    assert.ok(partner.name.trim().length > 0, "un partenaire sans nom");

    assert.match(
      partner.href,
      /^https:\/\/\S+\.\S+/,
      `« ${partner.name} » est nommé sans adresse vérifiable`
    );

    assert.ok(
      partner.does.trim().length > 0,
      `« ${partner.name} » est nommé sans dire ce qu'il fait`
    );
  }
});

check("aucun partenaire ne se voit prêter une promesse chiffrée", () => {
  /*
    MACHÉ ne fixe ni taux, ni plafond, ni délai chez un partenaire, et
    ne les vérifie pas. Les écrire à sa place engagerait MACHÉ sur des
    conditions qu'elle ne maîtrise pas.
  */
  for (const partner of PARTNERS) {
    assert.equal(
      /\d+\s?%|\d+\s?(jours?|heures?|gourdes?|USD|\$)/i.test(partner.does),
      false,
      `« ${partner.name} » se voit prêter un chiffre que MACHÉ ne tient pas`
    );
  }
});

check("la bande disparaît quand aucun partenaire n'a signé", () => {
  assert.match(
    STRIP,
    /PARTNERS\.length === 0\) return null/,
    "une section « Nos partenaires » vide annonce un réseau qui n'existe pas"
  );
});

check("la page ne dit plus « personne » quand quelqu'un est là", () => {
  /*
    L'encadré était écrit en dur : il serait resté au-dessus des
    premiers partenaires signés, à démentir la liste juste en dessous.
  */
  const index = PAGE.indexOf("ne liste encore personne");

  assert.ok(index > -1, "l'encadré des débuts doit rester pour le jour où la liste se vide");

  const avant = PAGE.slice(0, index);

  assert.match(
    avant.slice(-600),
    /PARTNERS\.length === 0 \? \(/,
    "l'encadré doit être conditionné à une liste réellement vide"
  );
});

check("aucun logo de partenaire n'est affiché", () => {
  /*
    Afficher une marque demande un accord écrit. MACHÉ n'en a aucun.
  */
  for (const source of [STRIP, PAGE]) {
    assert.equal(
      /<img|next\/image/.test(source),
      false,
      "un logo affiché sans accord est une atteinte à la marque"
    );
  }
});

check("un service qui ne passe pas par MACHÉ le dit", () => {
  const direct = PARTNERS.filter((partner) => !partner.mediated);

  assert.ok(
    direct.length > 0,
    "aucun partenaire en direct : cette vérification doit suivre le cas réel"
  );

  assert.match(
    PAGE,
    /!partner\.mediated && \(/,
    "la page doit distinguer un service rendu en direct"
  );

  assert.match(
    PAGE,
    /MACHÉ ne dépose pas le dossier, ne\s+garantit rien/,
    "et écrire franchement que MACHÉ ne garantit rien"
  );
});

check("les liens sortants sont signalés comme tels", () => {
  for (const source of [STRIP, PAGE]) {
    assert.match(
      source,
      /rel="noopener noreferrer"/,
      "un lien qui quitte le site doit le dire au navigateur"
    );
  }
});

console.log(`\n${passed} vérifications passées.\n`);
