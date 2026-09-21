/*
  TESTS : la lisibilité des thèmes de vitrine.

  Un vendeur choisit un thème dans une liste. Cette liste est donc une
  promesse : quel que soit son choix, sa vitrine restera lisible par ses
  clients. Ces vérifications tiennent cette promesse.

  Elles calculent le contraste au sens des règles d'accessibilité du web
  (WCAG) et refusent tout thème sous le niveau AA. Ce n'est pas une
  précaution théorique : deux candidats ont été écartés grâce à elles —
  un ambre à 2,56 sur blanc, et le rouge MACHÉ d'origine à 4,46.

  Lancer : npm run test:themes
*/

import assert from "node:assert/strict";
import {
  STOREFRONT_THEMES,
  readSellerTheme,
  themeById,
  isThemeId,
  themeStyle,
  DEFAULT_THEME,
} from "@/lib/storefront/themes";

/* Luminance relative, telle que définie par WCAG. */
function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: string, b: string): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

/* Niveau AA pour du texte normal. */
const AA = 4.5;

let passed = 0;

function check(name: string, run: () => void) {
  run();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

console.log("\nThèmes de vitrine");

check("chaque couleur est un code hexadécimal complet", () => {
  for (const theme of STOREFRONT_THEMES) {
    for (const key of ["primary", "soft", "dark", "strong", "hero"] as const) {
      assert.match(
        theme[key],
        /^#[0-9a-f]{6}$/,
        `${theme.id}.${key} = ${theme[key]}`
      );
    }
  }
});

check("du texte blanc reste lisible sur les boutons", () => {
  for (const theme of STOREFRONT_THEMES) {
    const ratio = contrast("#ffffff", theme.primary);

    assert.ok(
      ratio >= AA,
      `${theme.label} : ${ratio.toFixed(2)} sur blanc, il faut ${AA}`
    );
  }
});

check("le texte des bandeaux reste lisible sur leur fond", () => {
  for (const theme of STOREFRONT_THEMES) {
    const ratio = contrast(theme.dark, theme.soft);

    assert.ok(
      ratio >= AA,
      `${theme.label} : ${ratio.toFixed(2)} entre le texte et le fond du bandeau`
    );
  }
});

check("du texte blanc reste lisible sur le bandeau principal", () => {
  for (const theme of STOREFRONT_THEMES) {
    const ratio = contrast("#ffffff", theme.hero);

    assert.ok(
      ratio >= AA,
      `${theme.label} : ${ratio.toFixed(2)} sur le bandeau principal`
    );
  }
});

check("les thèmes se distinguent les uns des autres", () => {
  /*
    Deux thèmes trop proches donnent un choix qui n'en est pas un : le
    vendeur croit changer quelque chose et ne voit aucune différence.
  */
  const seen = new Set<string>();

  for (const theme of STOREFRONT_THEMES) {
    assert.ok(!seen.has(theme.primary), `${theme.label} reprend une couleur déjà utilisée`);
    seen.add(theme.primary);
  }
});

check("chaque thème a un identifiant unique et un nom", () => {
  const ids = STOREFRONT_THEMES.map((theme) => theme.id);

  assert.equal(new Set(ids).size, ids.length, "identifiants en double");

  for (const theme of STOREFRONT_THEMES) {
    assert.ok(theme.label.length > 0, theme.id);
    assert.ok(theme.hint.length > 0, `${theme.id} n'explique pas ce qu'il évoque`);
  }
});

check("une vitrine a toujours des couleurs", () => {
  /*
    Contrairement au profil, il n'y a pas d'état « sans thème » : une
    page doit bien s'afficher en quelque chose.
  */
  for (const metadata of [null, undefined, {}, { theme: "arc-en-ciel" }, { theme: 42 }]) {
    assert.equal(readSellerTheme(metadata as never).id, DEFAULT_THEME.id);
  }

  assert.equal(readSellerTheme({ theme: "ocean" }).id, "ocean");
});

check("refuse un thème inventé", () => {
  for (const value of ["", "OCEAN", " ocean ", null, 7, {}]) {
    assert.equal(isThemeId(value), false, JSON.stringify(value));
  }

  assert.equal(themeById("inexistant").id, DEFAULT_THEME.id);
});

check("le thème ne touche pas au fond ni au texte de la page", () => {
  /*
    C'est ce qui garantit qu'une boutique reste lisible ET reconnaissable
    comme une boutique MACHÉ. Laisser choisir le fond et le texte, c'est
    laisser produire du jaune sur blanc.
  */
  const style = themeStyle(STOREFRONT_THEMES[1]);

  for (const interdit of [
    "--mache-bg",
    "--mache-text",
    "--mache-line",
    "--mache-white",
    "--mache-muted",
  ]) {
    assert.ok(!(interdit in style), `le thème redéfinit ${interdit}`);
  }
});

console.log("\n  contrastes mesurés :");
for (const theme of STOREFRONT_THEMES) {
  console.log(
    `    ${theme.label.padEnd(10)} bouton ${contrast("#ffffff", theme.primary)
      .toFixed(2)
      .padStart(5)}   bandeau ${contrast(theme.dark, theme.soft)
      .toFixed(2)
      .padStart(5)}   entête ${contrast("#ffffff", theme.hero).toFixed(2).padStart(5)}`
  );
}

console.log(`\n${passed} vérifications passées.\n`);
