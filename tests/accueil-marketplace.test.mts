/*
  TESTS : ce que l'accueil a le droit de montrer.

  Deux règles, et elles disent la même chose sous deux formes : l'accueil
  ne meuble jamais avec de l'inventé.

  1. LE BANDEAU NE DIT QUE DES PROMOTIONS RÉELLES

  Il annonçait un texte écrit en dur — « −30 % », « Livraison offerte » —
  alors qu'aucune remise n'existait. Un bandeau qui ment est pire qu'un
  bandeau absent : il use la confiance sur la première ligne que voit un
  visiteur. Il lit maintenant les promotions en cours, et disparaît
  quand il n'y en a aucune.

  2. LA MOSAÏQUE N'EMPRUNTE DE PHOTOS QU'AUX VRAIS PRODUITS

  Ce qui meuble l'accueil d'une grande place de marché, ce sont des
  photos. MACHÉ n'en a aucune à lui : les visuels de stock ont été
  retirés volontairement, et en remettre décorerait le site avec des
  articles qui n'existent pas. Les tuiles empruntent donc leurs
  vignettes aux produits que les vendeurs ont réellement mis en ligne.

  3. UNE SEULE PORTE DE CONNEXION

  Il y en avait quatre qui se chevauchaient. Un commerçant cliquait sur
  la première, atterrissait dans un espace client sans boutique, et
  concluait que son compte était cassé.

  Lancer : npm run test:accueil
*/

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

let passed = 0;

function check(name: string, run: () => void) {
  run();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

const HEADER = readFileSync("src/components/header.tsx", "utf8");
const MOSAIC = readFileSync("src/components/home/rails.tsx", "utf8");
const ROUTE = readFileSync(
  "backend/packages/api/src/api/store/promotions/route.ts",
  "utf8"
);

/* ------------------------------------------------------------------ */
/* Le bandeau                                                          */
/* ------------------------------------------------------------------ */

check("le bandeau n'affiche aucune promotion écrite en dur", () => {
  /*
    La forme exacte des anciens mensonges : un pourcentage, un prix ou
    une promesse de livraison posés dans le code. S'ils reviennent, ils
    reviendront comme ça.
  */
  const suspects = [
    /-\s?\d+\s?%/,
    /−\s?\d+\s?%/,
    /[Ll]ivraison\s+(offerte|gratuite)/,
    /[Ss]oldes?/,
  ];

  for (const motif of suspects) {
    assert.equal(
      motif.test(HEADER),
      false,
      `« ${motif} » ne doit pas être écrit dans l'en-tête : le bandeau lit les vraies promotions`
    );
  }
});

check("le bandeau disparaît quand il n'y a aucune promotion", () => {
  /*
    Une bande rouge vide est du bruit, et une bande remplie pour meubler
    est un faux. Son absence lui rend son sens : s'il est là, c'est
    qu'il y a quelque chose.
  */
  assert.match(
    HEADER,
    /promotions\.length > 0 && \(/,
    "le bandeau doit être conditionné à l'existence d'une promotion"
  );
});

check("le bandeau ne montre que les promotions de MACHÉ", () => {
  /*
    Y faire défiler la promotion d'une boutique lui donnerait une
    vitrine que les autres n'ont pas, sans que personne ne l'ait décidé.
  */
  assert.match(
    ROUTE,
    /filter\(\(promotion\) => !promotion\.seller\)/,
    "les promotions rattachées à un vendeur doivent être écartées"
  );
});

check("le bandeau n'annonce pas une promotion en brouillon", () => {
  /*
    Vérifié aussi en conditions réelles : une promotion à −90 % laissée
    en brouillon ne sort pas de la route.
  */
  assert.match(
    ROUTE,
    /filters:\s*\{\s*status:\s*"active"\s*\}/,
    "seules les promotions actives doivent être publiées"
  );
});

check("une promotion automatique n'annonce pas de code", () => {
  /*
    Elle s'applique seule. Annoncer un code enverrait l'acheteur en
    chercher un qui n'existe pas.
  */
  assert.match(
    ROUTE,
    /if \(promotion\.is_automatic\) return remise;/,
    "une promotion automatique ne doit pas réclamer de code"
  );
});

/* ------------------------------------------------------------------ */
/* La mosaïque                                                         */
/* ------------------------------------------------------------------ */

check("la mosaïque n'utilise aucune image décorative", () => {
  /*
    Le garde-fou qui compte. Des visuels de stock avaient déjà été
    retirés une fois du site : ils décoraient MACHÉ avec des articles
    que personne n'y vendait. La tentation revient dès qu'un accueil
    paraît vide — c'est précisément le moment où elle est la plus
    mauvaise.
  */
  const debut = MOSAIC.indexOf("export function CategoryMosaicSection");

  assert.ok(debut > -1, "la mosaïque doit exister");

  const section = MOSAIC.slice(debut);

  assert.equal(
    /(unsplash|placeholder|picsum|via\.placeholder|\/images\/(?!logo))/i.test(section),
    false,
    "les vignettes doivent venir des produits, pas d'une banque d'images"
  );

  assert.match(
    section,
    /src=\{src\}/,
    "chaque vignette doit venir de la liste passée en donnée"
  );
});

check("un rayon vide le dit au lieu d'être illustré", () => {
  const section = MOSAIC.slice(MOSAIC.indexOf("export function CategoryMosaicSection"));

  assert.match(
    section,
    /tile\.thumbnails\.length > 0 \?/,
    "une tuile sans produit doit suivre un autre chemin"
  );

  assert.match(
    section,
    /Aucun article pour l/,
    "et dire franchement qu'elle est vide"
  );
});

/* ------------------------------------------------------------------ */
/* L'en-tête                                                           */
/* ------------------------------------------------------------------ */

check("il ne reste qu'une seule porte de connexion", () => {
  const portes = [
    ...HEADER.matchAll(/href="\/(compte\/connexion|compte\/inscription|dashboard\/seller\/connexion|dashboard\/admin\/connexion|login|register)"/g),
  ];

  assert.equal(
    portes.length,
    0,
    `l'en-tête ne doit pas nommer de porte précise, or il en nomme ${portes.length} : ${portes.map((p) => p[1]).join(", ")}`
  );

  assert.match(
    HEADER,
    /href="\/dashboard"/,
    "une seule entrée, qui aiguille vers le bon espace"
  );
});

console.log(`\n${passed} vérifications passées.\n`);
