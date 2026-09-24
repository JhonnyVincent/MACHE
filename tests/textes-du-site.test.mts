/*
  TESTS : le texte des pages légales, saisi en administration.

  Ce qui est en jeu

  Ce texte est écrit dans un champ d'administration et affiché à tous
  les visiteurs. C'est exactement la forme d'un défaut d'injection : si
  le découpage produisait du balisage, une balise tapée dans
  l'administration deviendrait une balise dans la page.

  La protection n'est pas un filtre — c'est la FORME du résultat. Le
  découpage ne rend que des blocs de texte, que React échappe comme
  tel. Ces vérifications constatent qu'aucune entrée, si tordue
  soit-elle, n'en fait sortir autre chose.

  Lancer : npm run test:textes
*/

import assert from "node:assert/strict";
import { parsePolicyBody } from "@/lib/medusa/policies";

let passed = 0;

function check(name: string, run: () => void) {
  run();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

console.log("\nTextes des pages légales");

check("une ligne ## devient un titre", () => {
  const blocks = parsePolicyBody("## Vos données\nNous en collectons peu.");

  assert.deepEqual(blocks, [
    { kind: "heading", text: "Vos données" },
    { kind: "paragraph", text: "Nous en collectons peu." },
  ]);
});

check("les lignes vides séparent les paragraphes", () => {
  const blocks = parsePolicyBody("Premier paragraphe.\n\nSecond paragraphe.");

  assert.equal(blocks.length, 2);
  assert.equal(blocks[0].text, "Premier paragraphe.");
  assert.equal(blocks[1].text, "Second paragraphe.");
});

check("les lignes d'un même paragraphe sont recollées", () => {
  /*
    Un texte saisi dans un champ se coupe où la fenêtre se termine, pas
    où la phrase s'arrête. Rendre chaque ligne comme un paragraphe
    hacherait le texte.
  */
  const blocks = parsePolicyBody("Une phrase\ncoupée en deux lignes.");

  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].text, "Une phrase coupée en deux lignes.");
});

check("les fins de ligne Windows ne créent pas de paragraphes fantômes", () => {
  const blocks = parsePolicyBody("Premier.\r\n\r\nSecond.");

  assert.equal(blocks.length, 2);
  assert.equal(blocks[1].text, "Second.");
});

check("du HTML saisi reste du TEXTE", () => {
  /*
    Le cas qui compte. Si ce bloc sortait avec un autre `kind`, ou si la
    balise était découpée, il faudrait se demander ce que le rendu en
    fait. Ici elle traverse intacte, comme une suite de caractères.
  */
  const blocks = parsePolicyBody('<script>alert(1)</script>');

  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].kind, "paragraph");
  assert.equal(blocks[0].text, "<script>alert(1)</script>");
});

check("aucune entrée ne produit autre chose qu'un titre ou un paragraphe", () => {
  const tordus = [
    "<img src=x onerror=alert(1)>",
    "## <b>gras</b>",
    "[lien](https://ailleurs.example)",
    "&lt;script&gt;",
    "```js\nalert(1)\n```",
    "{{ template }}",
    "\u0000\u001b[31m",
    "## ".repeat(50),
    "#".repeat(200),
  ];

  for (const entree of tordus) {
    for (const block of parsePolicyBody(entree)) {
      assert.equal(
        block.kind === "heading" || block.kind === "paragraph",
        true,
        entree
      );
      assert.equal(typeof block.text, "string", entree);
    }
  }
});

check("un texte vide ne produit aucun bloc", () => {
  /*
    Sans cela, la page afficherait un paragraphe vide — un espace blanc
    que personne ne comprend.
  */
  assert.deepEqual(parsePolicyBody(""), []);
  assert.deepEqual(parsePolicyBody("   \n\n  \n"), []);
});

check("un titre vide est écarté", () => {
  /*
    « ## » seul sur sa ligne donnerait un titre sans texte : une
    respiration typographique sans raison, au milieu d'un document
    juridique.
  */
  assert.deepEqual(parsePolicyBody("##\n##   \nTexte."), [
    { kind: "paragraph", text: "Texte." },
  ]);
});

check("les dièses supplémentaires sont absorbés", () => {
  /*
    Quelqu'un qui connaît Markdown écrira peut-être ### ou ####. Un seul
    niveau de titre existe ici ; produire un titre de plus bas niveau
    demanderait de décider comment le rendre, et ce n'est pas ce qu'on
    a promis.
  */
  assert.deepEqual(parsePolicyBody("#### Sous-section"), [
    { kind: "heading", text: "Sous-section" },
  ]);
});

console.log(`\n${passed} vérifications passées.\n`);
