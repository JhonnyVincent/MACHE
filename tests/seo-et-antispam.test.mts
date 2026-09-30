/*
  TESTS : référencement, aperçus de partage et anti-spam.

  Ce qu'ils gardent

  1. Chaque page a un vrai titre ; une fiche produit met son prix et sa
     photo dans l'aperçu WhatsApp / Facebook.
  2. Les pages privées restent hors de Google ; « Ouvrir ma boutique »,
     posée sous /dashboard, reste trouvable.
  3. Le plan du site et robots.txt existent et se répondent.
  4. Anti-spam : champ piège, délai minimum, plafond par adresse IP
     (large, pour les connexions partagées d'Haïti), IP non falsifiable.
  5. Le logo et la carte ne pèsent plus plus d'un mégaoctet chacun.

  Lancer : npm run test:seo
*/

import assert from "node:assert/strict";
import { readFileSync, statSync, existsSync } from "node:fs";
import { pageMetadata, privateMetadata, privateSectionMetadata, productMetadata, cleanDescription, siteUrl } from "../src/lib/seo.ts";
import {
  looksAutomated, allowSubmission, resetSpamCounters, clientIpFrom, HOURLY_LIMITS, MIN_FILL_MS,
  HONEYPOT_FIELD, RENDERED_AT_FIELD,
} from "../src/lib/anti-spam.ts";
import { analyticsToken } from "../src/lib/analytics.ts";

let passed = 0;
function check(name: string, run: () => void) { run(); passed += 1; console.log(`  ✓ ${name}`); }
const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

check("fiche produit : prix dans le titre, photo et description dans l'aperçu", () => {
  const meta = productMetadata({ handle: "panier", title: "Panier en paille", description: "<p>Tressé   à la main à Jacmel.</p>", subtitle: null, price: 1500, currency: "htg", thumbnail: "https://cdn.exemple/p.jpg", images: [] });
  assert.match(String(meta.title), /^Panier en paille — 1\s500\sHTG$/u);
  assert.equal(meta.description, "Tressé à la main à Jacmel.");
  const og = meta.openGraph as { images: Array<{ url: string }> };
  assert.equal(og.images[0].url, "https://cdn.exemple/p.jpg");
  assert.deepEqual(meta.robots, { index: true, follow: true });
});

check("sans photo ni description : image MACHE et phrase par défaut, jamais vide", () => {
  const meta = productMetadata({ handle: "x", title: "Savon", description: null, subtitle: null, price: null, currency: null, thumbnail: null, images: [] });
  assert.equal(meta.title, "Savon");
  assert.match(String(meta.description), /Savon, en vente sur MACHE/);
  const og = meta.openGraph as { images: Array<{ url: string }> };
  assert.match(og.images[0].url, /\/images\/partage-mache\.jpg$/);
});

check("description coupée proprement pour Google", () => {
  const long = "mot ".repeat(100);
  const clean = cleanDescription(long)!;
  assert.ok(clean.length <= 160 && clean.endsWith("…"));
  assert.equal(cleanDescription("   "), null);
});

check("pages privées hors de Google, pages publiques explicitement ouvertes", () => {
  assert.deepEqual(privateMetadata("Mon panier").robots, { index: false, follow: false });
  assert.deepEqual(pageMetadata({ title: "x", path: "/x", noIndex: true }).robots, { index: false, follow: false });
  assert.deepEqual(pageMetadata({ title: "x", path: "/x" }).robots, { index: true, follow: true });
  assert.match(read("src/app/dashboard/layout.tsx"), /privateSectionMetadata\("Mon espace"\)/);
  assert.doesNotMatch(read("src/app/dashboard/seller/inscription/page.tsx"), /noIndex: true/);
  assert.match(read("src/app/cart/page.tsx"), /privateMetadata\("Mon panier"\)/);
});

check("sections privées : le modèle « | MACHE » transmis, sans suffixe en double", () => {
  const meta = privateSectionMetadata("Mon compte client");
  assert.deepEqual(meta.title, { default: "Mon compte client", template: "%s | MACHE" });
  assert.deepEqual(meta.robots, { index: false, follow: false });
});

check("adresse du site : variable, sinon celle que Render pose, sans barre finale", () => {
  const saved = { a: process.env.NEXT_PUBLIC_SITE_URL, b: process.env.RENDER_EXTERNAL_URL };
  delete process.env.NEXT_PUBLIC_SITE_URL;
  process.env.RENDER_EXTERNAL_URL = "https://mache-1.onrender.com/";
  assert.equal(siteUrl(), "https://mache-1.onrender.com");
  process.env.NEXT_PUBLIC_SITE_URL = "https://mache.ht";
  assert.equal(siteUrl(), "https://mache.ht");
  process.env.NEXT_PUBLIC_SITE_URL = saved.a ?? ""; if (!saved.a) delete process.env.NEXT_PUBLIC_SITE_URL;
  if (saved.b) process.env.RENDER_EXTERNAL_URL = saved.b; else delete process.env.RENDER_EXTERNAL_URL;
});

check("aucune page n'est titrée « MACHE » tout seul ; pas de « MACHE » en double", () => {
  const layout = read("src/app/layout.tsx");
  assert.match(layout, /template: `%s \| \$\{SITE_NAME\}`/);
  assert.doesNotMatch(layout, /title: "MACHE",/);
  for (const page of ["src/app/gros/page.tsx", "src/app/faq/page.tsx", "src/app/legal/terms/page.tsx"]) {
    assert.doesNotMatch(read(page), /title: "[^"]*(— MACHE|· MACHE)"/, page);
  }
  for (const page of ["src/app/page.tsx", "src/app/shop/page.tsx", "src/app/product/[slug]/page.tsx", "src/app/store/[slug]/page.tsx", "src/app/sell/page.tsx"]) {
    assert.match(read(page), /export (const metadata|async function generateMetadata)/, page);
  }
});

check("plan du site, robots.txt, icônes et page 404 en place", () => {
  const robots = read("src/app/robots.ts");
  assert.match(robots, /disallow: \[\s*"\/dashboard\/"/);
  assert.match(robots, /allow: \["\/", "\/dashboard\/seller\/inscription"\]/);
  assert.match(robots, /sitemap: `\$\{siteUrl\(\)\}\/sitemap\.xml`/);
  assert.match(read("src/app/sitemap.ts"), /\/product\/\$\{encodeURIComponent\(product\.handle\)\}/);
  for (const file of ["src/app/favicon.ico", "src/app/icon.png", "src/app/apple-icon.png", "public/images/partage-mache.jpg"]) assert.ok(existsSync(file), file);
  assert.match(read("src/app/not-found.tsx"), /Cette page n&apos;existe pas/);
});

check("images allégées : logo et carte bien sous le mégaoctet", () => {
  assert.ok(statSync("public/images/logo-mache.webp").size < 40_000);
  assert.ok(statSync("public/images/carte-haiti-mache.webp").size < 150_000);
  assert.ok(!existsSync("public/images/logo-haiti-mache-hibiscus.png"), "l'ancien logo de 1,2 Mo ne doit plus être servi");
  assert.doesNotMatch(read("src/components/header.tsx"), /logo-haiti-mache-hibiscus\.png/);
});

check("anti-spam : champ piège rempli = robot", () => {
  const form = new FormData(); form.set(HONEYPOT_FIELD, "http://spam");
  assert.equal(looksAutomated(form, 10_000_000), true);
  const empty = new FormData(); empty.set(HONEYPOT_FIELD, "");
  assert.equal(looksAutomated(empty, 10_000_000), false);
});

check("anti-spam : envoyé plus vite qu'un humain = robot ; horodatage absent = toléré", () => {
  const now = 10_000_000;
  const fast = new FormData(); fast.set(RENDERED_AT_FIELD, String(now - 500));
  assert.equal(looksAutomated(fast, now), true);
  const human = new FormData(); human.set(RENDERED_AT_FIELD, String(now - MIN_FILL_MS - 1));
  assert.equal(looksAutomated(human, now), false);
  assert.equal(looksAutomated(new FormData(), now), false);
});

check("anti-spam : plafond par heure et par adresse, remis à zéro après une heure", () => {
  resetSpamCounters();
  const limit = HOURLY_LIMITS.inscription;
  for (let i = 0; i < limit; i += 1) assert.equal(allowSubmission("inscription", "1.2.3.4", 0), true);
  assert.equal(allowSubmission("inscription", "1.2.3.4", 0), false);
  assert.equal(allowSubmission("inscription", "5.6.7.8", 0), true, "une autre adresse n'est pas touchée");
  assert.equal(allowSubmission("contact", "1.2.3.4", 0), true, "un autre formulaire n'est pas touché");
  assert.equal(allowSubmission("inscription", "1.2.3.4", 60 * 60 * 1000 + 1), true);
  assert.ok(HOURLY_LIMITS.inscription >= 20, "plafond large : en Haïti, beaucoup d'abonnés partagent une adresse");
});

check("anti-spam : l'adresse retenue est la dernière (celle constatée par Render), pas celle du visiteur", () => {
  assert.equal(clientIpFrom("6.6.6.6, 203.0.113.9", null), "203.0.113.9");
  assert.equal(clientIpFrom(null, "198.51.100.2"), "198.51.100.2");
  assert.equal(clientIpFrom(null, null), "inconnu");
});

check("les cinq formulaires publics portent les champs et le contrôle", () => {
  for (const f of ["src/components/home/newsletter.tsx", "src/app/contact/page.tsx", "src/app/compte/inscription/page.tsx", "src/app/dashboard/seller/inscription/page.tsx", "src/app/devis/nouveau/page.tsx"]) {
    assert.match(read(f), /<AntiSpamFields \/>/, f);
  }
  for (const [f, gate] of [["src/app/newsletter-actions.ts", "newsletter"], ["src/app/contact/actions.ts", "contact"], ["src/app/compte/actions.ts", "inscription"], ["src/app/dashboard/seller/inscription/actions.ts", "boutique"], ["src/app/devis/actions.ts", "devis"]]) {
    assert.match(read(f), new RegExp(`spamCheck\\("${gate}", formData\\)`), f);
  }
});

check("statistiques : rien n'est chargé sans jeton valide", () => {
  delete process.env.CF_ANALYTICS_TOKEN;
  assert.equal(analyticsToken(), null);
  process.env.CF_ANALYTICS_TOKEN = '"><script>';
  assert.equal(analyticsToken(), null);
  process.env.CF_ANALYTICS_TOKEN = "0123456789abcdef0123456789abcdef";
  assert.equal(analyticsToken(), "0123456789abcdef0123456789abcdef");
  delete process.env.CF_ANALYTICS_TOKEN;
});

console.log(`\n${passed} vérifications réussies.`);
