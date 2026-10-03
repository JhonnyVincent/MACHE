/*
  Génère les deux listes de catalogue (site et backend) à partir de
  scripts/catalogue-source.mjs. À relancer après toute modification :
    node scripts/generate-categories.mjs
*/
import { writeFileSync } from "node:fs";
import { SOURCE, LEGACY, ICONS } from "./catalogue-source.mjs";

const slugify = (label) =>
  label.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/['’]/g, "-").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const dups = [];
const slugs = new Set();
const labels = new Set();
const norm = (l) => l.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

function make(label) {
  const slug = LEGACY[label] ?? slugify(label);
  if (slugs.has(slug) || labels.has(norm(label))) { dups.push(label); }
  slugs.add(slug);
  labels.add(norm(label));
  return { slug, label };
}

const tree = SOURCE.map(([label, kids]) => {
  const top = make(label);
  return {
    ...top,
    icon: ICONS[top.slug],
    children: kids.map((kid) => {
      const [l2, leaves] = Array.isArray(kid) ? kid : [kid, []];
      return { ...make(l2), children: leaves.map((leaf) => make(leaf)) };
    }),
  };
});

if (dups.length) { console.error("Doublons :", dups); process.exit(1); }
const count = slugs.size;
const json = (v) => JSON.stringify(v, null, 2);

writeFileSync(
  "src/lib/categories-data.ts",
  `/* GÉNÉRÉ par scripts/generate-categories.mjs : ne pas modifier à la main. */\n\nexport type CategoryChild = {\n  slug: string;\n  label: string;\n  children?: { slug: string; label: string }[];\n};\n\nexport type CategoryNode = {\n  slug: string;\n  label: string;\n  icon?: string;\n  children?: CategoryChild[];\n};\n\nexport const CATEGORY_TREE: CategoryNode[] = ${json(tree)};\n`
);

const backend = tree.map((t) => ({
  handle: t.slug,
  name: t.label,
  children: t.children.map((c) => ({ handle: c.slug, name: c.label, children: c.children.map((g) => ({ handle: g.slug, name: g.label })) })),
}));
writeFileSync(
  "backend/packages/api/src/scripts/mache-categories-data.ts",
  `/* GÉNÉRÉ par scripts/generate-categories.mjs : ne pas modifier à la main. */\n\nexport type MacheCategory = {\n  handle: string;\n  name: string;\n  children: { handle: string; name: string; children: { handle: string; name: string }[] }[];\n};\n\nexport const MACHE_CATEGORY_TREE: MacheCategory[] = ${json(backend)};\n`
);
console.log(`${count} catalogues générés.`);
