/*
  TESTS : les réseaux sociaux de MACHE, et « Trouver un fournisseur ».

  1. Un réseau ne s'affiche que si son adresse est remplie.
  2. Une adresse remplie est en https, et sur le site du bon réseau :
     une faute de frappe ou une adresse Instagram dans la case Facebook
     est refusée avant d'arriver en ligne.
  3. Les liens s'ouvrent à part, sans donner la main à la page ouverte.
  4. La bande du haut mène aux fournisseurs, sans défiler plus vite.

  Lancer : npm run test:reseaux
*/

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SOCIAL_NETWORKS, SOCIAL_LINKS } from "../src/lib/social.ts";

let passed = 0;
function check(name: string, run: () => void) { run(); passed += 1; console.log(`  ✓ ${name}`); }

check("chaque adresse remplie est en https, sur le site du réseau", () => {
  for (const network of SOCIAL_NETWORKS) {
    if (!network.url.trim()) continue;
    const url = new URL(network.url);
    assert.equal(url.protocol, "https:", `${network.name} : https obligatoire`);
    const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "");
    assert.ok(
      network.domains.some((domain) => host === domain || host.endsWith(`.${domain}`)),
      `${network.name} : ${url.hostname} n'est pas un domaine ${network.name}`
    );
  }
});

check("seuls les réseaux remplis s'affichent", () => {
  assert.deepEqual(
    SOCIAL_LINKS.map((network) => network.key),
    SOCIAL_NETWORKS.filter((network) => network.url.trim() !== "").map((network) => network.key)
  );
  const component = readFileSync("src/components/social-links.tsx", "utf8");
  assert.match(component, /if \(SOCIAL_LINKS\.length === 0\) return null;/);
});

check("chaque logo est un vrai tracé, sur la grille 24 × 24", () => {
  assert.equal(SOCIAL_NETWORKS.length, 6);
  for (const network of SOCIAL_NETWORKS) {
    assert.match(network.path, /^M[\d.\-\s]/, network.name);
    assert.ok(network.path.length > 40, network.name);
  }
  assert.match(readFileSync("src/components/social-links.tsx", "utf8"), /viewBox="0 0 24 24"/);
});

check("les liens s'ouvrent à part, sans donner la main à la page ouverte", () => {
  const component = readFileSync("src/components/social-links.tsx", "utf8");
  assert.match(component, /target="_blank"/);
  assert.match(component, /rel="noopener noreferrer"/);
  assert.match(component, /\(nouvel onglet\)/);
});

check("les logos sont en haut (masqués sur téléphone) et dans le pied de page", () => {
  const header = readFileSync("src/components/header.tsx", "utf8");
  assert.match(header, /<SocialLinks className="hidden shrink-0[^"]*sm:flex"/);
  assert.match(readFileSync("src/components/footer.tsx", "utf8"), /<SocialLinks /);
});

check("« Trouver un fournisseur » mène aux grossistes, en français et en créole", () => {
  const header = readFileSync("src/components/header.tsx", "utf8");
  assert.match(header, /\{ key: "findSupplier", icon: "📦", href: "\/gros" \}/);
  assert.match(header, /findSupplier: "Trouver un fournisseur"/);
  assert.match(header, /findSupplier: "Jwenn yon founisè"/);
});

check("la bande du haut garde sa longueur, donc sa vitesse", () => {
  const header = readFileSync("src/components/header.tsx", "utf8");
  const services = (header.match(/\{ key: "\w+", icon: "[^"]+", href: "[^"]+" \}/g) ?? []).length;
  const copies = Number((header.match(/Array\.from\(\{ length: (\d+) \}\)\.flatMap\(\(_, copy\) =>\s*SERVICES/) ?? [])[1]);
  assert.equal(services * copies, 24, "24 liens, comme avant (8 × 3)");
  assert.equal(copies % 2, 0, "un nombre pair de copies");
});

console.log(`\n${passed} vérifications passées.`);
