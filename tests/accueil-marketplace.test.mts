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

  2. LE GRAND BANDEAU N'EMPRUNTE DE PHOTOS QU'AUX VRAIS PRODUITS

  Ce qui meuble l'accueil d'une grande place de marché, ce sont des
  photos. MACHÉ n'en a aucune à lui, hormis sa carte et son logo : les
  visuels de stock ont été retirés volontairement, et en remettre
  décorerait le site avec des articles qui n'existent pas. Les
  diapositives empruntent donc leurs vignettes aux produits que les
  vendeurs ont réellement mis en ligne — et un rayon encore vide
  s'adresse aux vendeurs au lieu de faire semblant d'être rempli.

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
const HERO = readFileSync("src/components/home/hero.tsx", "utf8");
const PAGE = readFileSync("src/app/page.tsx", "utf8");
const SECTIONS = readFileSync("src/components/home/sections.tsx", "utf8");
const SLIDER = readFileSync("src/components/slider.tsx", "utf8");
const HOME = readFileSync("src/lib/medusa/home.ts", "utf8");
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

check("le grand bandeau s'ouvre toujours sur la carte d'Haïti", () => {
  const slider = HERO.slice(HERO.indexOf('<Slider variant="hero"'));
  const map = slider.indexOf("<MapSlide");
  const others = slider.indexOf("slides.map(");
  assert.ok(map > -1 && others > -1 && map < others, "la carte doit être la première diapositive, avant toutes les autres");
});

check("le bandeau n'utilise aucune image décorative", () => {
  /*
    Le garde-fou qui compte. Des visuels de stock avaient déjà été
    retirés une fois : ils décoraient MACHÉ avec des articles que
    personne n'y vendait. La tentation revient dès qu'un accueil paraît
    vide — c'est précisément le moment où elle est la plus mauvaise.
  */
  const sources = [...HERO.matchAll(/src=(\{[^}]+\}|"[^"]*")/g)].map((m) => m[1]);
  const allowed = ['"/images/carte-haiti-mache.png"', '"/images/logo-haiti-mache-hibiscus.png"', "{product.image}", "{seller.logo}"];
  for (const source of sources) {
    assert.ok(allowed.includes(source), `image non autorisée dans le bandeau : ${source}`);
  }
  assert.ok(sources.includes("{product.image}"), "les vignettes viennent des produits");
  assert.doesNotMatch(HERO + HOME, /unsplash|picsum|placeholder\.|via\.placeholder/i);
});

check("le bandeau montre boutiques, promotions et partenaires — et rien d'inventé", () => {
  assert.match(HERO, /if \(slide\.kind === "shops"\)/);
  assert.match(HERO, /if \(slide\.kind === "promotions"\)/);
  assert.match(
    HOME,
    /if \(deals\.length > 0 \|\| promotions\.length > 0\) \{/,
    "pas de diapositive « Promotions » sans remise réelle ni code actif"
  );
});

check("les plus vendus ne sont pas classés sans assez de ventes", () => {
  /*
    C'est LE rayon qu'on invente le plus volontiers : quatre produits
    pris au hasard, personne ne peut vérifier, et l'accueil paraît
    plein. Il ment à deux personnes à la fois — l'acheteur, qui croit
    suivre le choix des autres, et le vendeur, qui se croit mis en
    avant par son mérite alors qu'il a été tiré au sort.
  */
  const route = readFileSync(
    "backend/packages/api/src/api/store/bestsellers/route.ts",
    "utf8"
  );

  const seuil = route.match(/MIN_SALES_TO_RANK = (\d+)/);

  assert.ok(seuil, "un seuil en dessous duquel on ne classe pas doit exister");

  const valeur = Number(seuil![1]);

  assert.ok(
    valeur >= 5 && valeur <= 500,
    `le seuil doit rester dans une fourchette qui protège vraiment, or il vaut ${valeur}`
  );

  assert.match(
    route,
    /if \(total < MIN_SALES_TO_RANK\)[\s\S]{0,120}ranked: false/,
    "en dessous du seuil, la route doit refuser de classer"
  );

  assert.match(
    route,
    /IGNORED_STATUSES = new Set\(\["canceled", "draft"\]\)/,
    "une commande annulée n'est pas une vente"
  );

  const client = readFileSync("src/lib/medusa/bestsellers.ts", "utf8");

  assert.match(
    client,
    /ranked === false\) return \[\]/,
    "l'accueil ne doit pas contourner le refus du backend"
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

/* ------------------------------------------------------------------ */
/* L'ordre de la page, et ce qu'elle ne prétend pas                    */
/* ------------------------------------------------------------------ */

const HEADER_SRC = HEADER;

check("la page suit l'ordre voulu", () => {
  const order = [
    "<HeroCarousel",
    "<MainNav",
    "<Spotlight",
    "<CategoryTiles",
    "<NewsletterCta",
    'title="Nouvelles boutiques"',
    "<BrandsMarquee",
    "<PartnersStrip",
    "home.forYou &&",
    "<SellCta",
  ];
  let last = -1;
  for (const marker of order) {
    const at = PAGE.indexOf(marker);
    assert.ok(at > last, `« ${marker} » est absent ou mal placé`);
    last = at;
  }
});

check("sur l'accueil, le menu noir descend sous le bandeau ; ailleurs il reste en haut", () => {
  assert.match(HEADER_SRC, /\{pathname !== "\/" && <MainNav \/>\}/);
});

check("la bande du haut défile en continu, et s'arrête pour qui réduit les animations", () => {
  assert.match(HEADER_SRC, /mache-ticker mache-ticker-fast/);
  const css = readFileSync("src/app/globals.css", "utf8");
  assert.match(css, /prefers-reduced-motion: reduce\)[\s\S]*\.mache-ticker-fast[\s\S]*animation: none/);
});

check("« Sur MACHÉ en ce moment » fait passer chaque vendeur à son tour", () => {
  assert.match(HOME, /rotateFairly\(pool, \(product\) => map\.get\(product\.id\) \?\? null, seed, SPOTLIGHT_COUNT\)/);
  assert.match(HOME, /const seed = hourSeed\(now\);/);
});

check("« pour vous » seulement d'après les favoris ; sinon « À découvrir »", () => {
  const personal = HOME.indexOf('title: "Nos suggestions pour vous"');
  const guard = HOME.lastIndexOf("if (favoriteCategoryIds.length > 0)", personal);
  assert.ok(personal > -1 && guard > -1, "« pour vous » doit dépendre des favoris");
  assert.match(HOME, /title: "À découvrir"/);
});

check("les catégories : cinq rayons, puis le ➕ vers le catalogue", () => {
  assert.match(HOME, /const TILE_COUNT = 5;/);
  assert.match(SECTIONS, /href="\/shop"[\s\S]{0,800}➕/);
  assert.match(HOME, /DEFAULT_TILES = \["maison", "mode", "electronique", "bio", "fait-a-la-main"\]/);
});

check("« Nos marques » ne montre que des boutiques qui se déclarent marque", () => {
  assert.match(HOME, /readSellerProfile\(seller\.metadata\) === "marque"/);
  assert.match(SECTIONS, /Les boutiques qui se présentent comme marque officielle/);
});

check("l'accueil ne suit pas ce que regardent les visiteurs", () => {
  for (const source of [HOME, HERO, PAGE, SECTIONS, SLIDER]) {
    assert.doesNotMatch(source, /document\.cookie|localStorage|sessionStorage/);
  }
});

check("le défilement automatique s'arrête quand il le faut", () => {
  assert.match(
    SLIDER,
    /autoplayMs > 0 && count > 1 && !reduced && !hovered && !focused && !touched/
  );
});

check("« Devenez vendeur » ne promet pas d'audience", () => {
  const cta = SECTIONS.slice(SECTIONS.indexOf("export function SellCta"));
  assert.ok(cta.includes("Devenez vendeur chez MACHÉ"));
  assert.doesNotMatch(cta, /déjà visité|des milliers|audience/i);
});

console.log(`\n${passed} vérifications passées.\n`);
