/*
  TESTS : ce qu'une vitrine a le droit d'enregistrer.

  `sanitizeProps` et `sanitizeLayout` sont la frontière entre le
  navigateur d'un vendeur et la base de données. L'éditeur visuel poste
  une mise en page entière en JSON : tout ce qui franchit cette frontière
  ressort ensuite sur une page publique, dans le navigateur de n'importe
  quel client de la boutique.

  Ces vérifications ne sont pas décoratives. Elles fixent ce qui a été
  constaté en relisant le code : un lien « javascript: » posé dans le
  bouton d'un bandeau s'exécutait dans la session du visiteur, et une
  image « data:image/svg+xml » servie depuis la même origine pouvait
  porter du script.

  Lancer : npm run test:vitrine
*/

import assert from "node:assert/strict";
import { sanitizeProps, sanitizeLayout } from "@/lib/storefront/blocks";

let passed = 0;

function check(name: string, run: () => void) {
  run();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

console.log("\nLiens posés par un vendeur");

check("refuse javascript:, quelle que soit la casse", () => {
  for (const href of [
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    " javascript:alert(1)",
    "vbscript:msgbox(1)",
    "data:text/html,<script>alert(1)</script>",
  ]) {
    assert.equal(sanitizeProps("hero", { ctaHref: href }).ctaHref, undefined, href);
  }
});

check("refuse les adresses protocol-relative, qui partent chez un tiers", () => {
  for (const href of ["//evil.example", "/\\evil.example"]) {
    assert.equal(sanitizeProps("hero", { ctaHref: href }).ctaHref, undefined, href);
  }
});

check("refuse un retour chariot, qui permettrait d'injecter un en-tête", () => {
  assert.equal(
    sanitizeProps("hero", { ctaHref: "/a\r\nSet-Cookie: x=1" }).ctaHref,
    undefined
  );
});

check("conserve ce qu'un commerçant a de bonnes raisons d'écrire", () => {
  for (const href of [
    "#produits",
    "/shop",
    "https://exemple.ht",
    "mailto:contact@exemple.ht",
    "tel:+50912345678",
  ]) {
    assert.equal(sanitizeProps("hero", { ctaHref: href }).ctaHref, href, href);
  }
});

console.log("\nImages");

check("n'accepte que http(s)", () => {
  assert.equal(
    sanitizeProps("image", { url: "data:image/svg+xml,<svg onload=alert(1)>" }).url,
    undefined
  );
  assert.equal(sanitizeProps("image", { url: "/local.png" }).url, undefined);
  assert.equal(sanitizeProps("image", { url: "//evil.example/x.png" }).url, undefined);
  assert.equal(
    sanitizeProps("image", { url: "https://exemple.ht/a.png" }).url,
    "https://exemple.ht/a.png"
  );
});

console.log("\nChamps et bornes");

check("écarte toute propriété non déclarée pour ce bloc", () => {
  const props = sanitizeProps("banner", {
    message: "Livraison offerte",
    onerror: "alert(1)",
    dangerouslySetInnerHTML: { __html: "<img onerror=1>" },
    id: "puck-id",
  });
  assert.deepEqual(props, { message: "Livraison offerte" });
});

check("borne le nombre de produits d'une grille", () => {
  assert.equal(sanitizeProps("products", { limit: 9999 }).limit, 24);
  assert.equal(sanitizeProps("products", { limit: -5 }).limit, 1);
  assert.equal(sanitizeProps("products", { limit: "abc" }).limit, undefined);
});

check("n'accepte qu'une sélection de produits qui existe", () => {
  assert.equal(sanitizeProps("products", { selection: "bestsellers" }).selection, undefined);
  assert.equal(sanitizeProps("products", { selection: "discounted" }).selection, "discounted");
});

check("borne le nombre de questions et la longueur des textes", () => {
  const items = Array.from({ length: 200 }, (_, i) => ({ question: `q${i}`, answer: "a" }));
  assert.equal((sanitizeProps("faq", { items }).items as unknown[]).length, 20);
  assert.equal(String(sanitizeProps("text", { body: "x".repeat(50_000) }).body).length, 4000);
});

check("écarte une question sans réponse plutôt que d'afficher un vide", () => {
  const items = [{ question: "Livrez-vous ?", answer: "" }, { question: "", answer: "Oui" }];
  assert.equal(sanitizeProps("faq", { items }).items, undefined);
});

console.log("\nMise en page entière");

check("écarte les types de blocs inconnus et les compte", () => {
  const { layout, ignored } = sanitizeLayout({
    content: [
      { type: "banner", props: { message: "ok" } },
      { type: "script", props: { src: "https://evil.example/x.js" } },
    ],
  });
  assert.equal(layout.content.length, 1);
  assert.equal(layout.content[0].type, "banner");
  assert.equal(ignored, 1);
});

check("borne le nombre de blocs d'une vitrine", () => {
  const content = Array.from({ length: 60 }, () => ({
    type: "banner",
    props: { message: "spam" },
  }));
  const { layout, ignored } = sanitizeLayout({ content });
  assert.equal(layout.content.length, 30);
  assert.equal(ignored, 30);
});

check("vide toujours la racine, que personne n'affiche", () => {
  const { layout } = sanitizeLayout({
    root: { props: { evil: "<script>alert(1)</script>" } },
    content: [],
  });
  assert.deepEqual(layout.root, {});
});

check("ne casse pas sur une donnée absente ou malformée", () => {
  for (const value of [null, undefined, 42, "texte", [], { content: "pas un tableau" }]) {
    const { layout } = sanitizeLayout(value);
    assert.deepEqual(layout.content, []);
  }
});

console.log(`\n${passed} vérifications passées.\n`);
