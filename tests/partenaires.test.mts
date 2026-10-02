/*
  Partenaires de services : saisie nettoyée, rien de dangereux affiché,
  l'e-mail jamais public, modération complète côté administration.
*/
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parsePartner, publicPartner, slugify, webUrl, whatsappDigits, PARTNER_CATEGORIES } from "../backend/packages/api/src/lib/partner-input.ts";
import { PARTNER_CATEGORIES as SITE_CATEGORIES } from "../src/lib/partner-categories.ts";

let passed = 0;
function check(name: string, run: () => void) {
  run();
  passed += 1;
  console.log(`  ✓ ${name}`);
}
const read = (file: string) => readFileSync(file, "utf8");

console.log("\nPartenaires de services");

const valid = { name: "Studio Lumière", category: "Photographie", contact_email: "Contact@Studio.ht" };

check("une fiche minimale est acceptée, l'e-mail est mis en minuscules", () => {
  const parsed = parsePartner(valid);
  assert.equal(parsed.ok, true);
  if (parsed.ok) assert.equal(parsed.value.contact_email, "contact@studio.ht");
});

check("nom, catégorie et e-mail sont obligatoires", () => {
  assert.equal(parsePartner({ ...valid, name: "" }).ok, false);
  assert.equal(parsePartner({ ...valid, category: "Piratage" }).ok, false);
  assert.equal(parsePartner({ ...valid, contact_email: "pas-un-mail" }).ok, false);
});

check("les adresses web : https ajouté, javascript: et data: refusés", () => {
  assert.equal(webUrl("monsite.ht"), "https://monsite.ht/");
  assert.equal(webUrl("http://a.ht/x"), "http://a.ht/x");
  assert.equal(webUrl(""), null);
  for (const bad of ["javascript:alert(1)", "data:text/html,x", "ftp://x.ht", "nimportequoi"]) {
    assert.equal(webUrl(bad), "invalid", bad);
  }
  assert.equal(parsePartner({ ...valid, website: "javascript:alert(1)" }).ok, false);
});

check("WhatsApp : chiffres, indicatif 509 ajouté à un numéro local", () => {
  assert.equal(whatsappDigits("3712 3456"), "50937123456");
  assert.equal(whatsappDigits("+509 3712-3456"), "50937123456");
  assert.equal(whatsappDigits("abc"), "invalid");
  assert.equal(whatsappDigits(""), null);
});

check("l'adresse de la page vient du nom, sans accents ni symboles", () => {
  assert.equal(slugify("Studio Lumière & Fils !"), "studio-lumiere-fils");
  assert.equal(slugify("***"), "partenaire");
});

check("la sortie publique ne contient jamais l'e-mail ni le motif interne", () => {
  const out = publicPartner({ slug: "a", name: "A", category: "Autre", contact_email: "x@y.ht", contact_name: "X", status_reason: "motif", status: "approved" });
  const keys = Object.keys(out);
  for (const secret of ["contact_email", "contact_name", "status_reason", "status"]) assert.ok(!keys.includes(secret), secret);
});

check("les catégories du site et du backend sont les mêmes", () => {
  assert.deepEqual([...SITE_CATEGORIES], [...PARTNER_CATEGORIES]);
});

check("le backend : liste publique = approuvés seulement ; exclu = pas de retour ; exclu ne se supprime pas", () => {
  assert.match(read("backend/packages/api/src/api/store/partners/route.ts"), /status: "approved"/);
  assert.match(read("backend/packages/api/src/api/store/partners/route.ts"), /row\.status === "banned"/);
  assert.match(read("backend/packages/api/src/api/store/partners/\[slug\]/route.ts"), /status: "approved"/);
  const admin = read("backend/packages/api/src/api/admin/mache/partners/[id]/route.ts");
  assert.match(admin, /reason\.length < 3/);
  assert.match(admin, /row\.status === "banned"/);
  assert.match(admin, /softDeletePartners/);
});

check("l'administration peut ajouter, approuver, suspendre, exclure, supprimer, corriger", () => {
  const page = read("backend/apps/admin/src/routes/partenaires/page.tsx");
  for (const action of ["approve", "suspend", "ban", "delete", "update"]) assert.match(page, new RegExp(`"${action}"`), action);
  assert.match(page, /\/admin\/mache\/partners"/);
  assert.match(page, /label: "Partenaires de services"/);
});

check("le site : inscription publique, services listés, profil lu en base", () => {
  assert.match(read("src/app/partenaires/page.tsx"), /Proposer mes services/);
  assert.match(read("src/app/partenaires/inscription/actions.ts"), /spamCheck/);
  assert.match(read("src/app/partenaires/[slug]/page.tsx"), /fetchDbPartner/);
});

console.log(`\n${passed} vérifications réussies.`);
