/*
  TESTS : la commande depuis l'étranger, « sur confirmation ».

  Ce qu'ils gardent

  1. Les pays proposés sur le site sont exactement ceux que le backend
     ouvre : un pays affiché mais refusé redonnerait l'erreur « Country
     with code fr is not within region Haïti ».
  2. Rien n'est inventé pour l'étranger : pas de frais d'expédition
     chiffrés, pas de « paiement à la livraison » ; le vendeur est prié
     de ne rien expédier avant la confirmation, et l'équipe est alertée.
  3. Haïti garde ses propres modes, sans le mode international.
  4. La page de commande réaffiche ce qui a été saisi.

  Lancer : npm run test:international
*/

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

process.env.STOREFRONT_URL = "https://mache.test";

const site = await import("../src/lib/countries.ts");
const back = await import("../backend/packages/api/src/lib/international.ts");
const E = await import("../backend/packages/api/src/lib/notification-emails.ts");

let passed = 0;
function check(name: string, run: () => void) { run(); passed += 1; console.log(`  ✓ ${name}`); }
const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

check("les pays du site et du backend sont les mêmes", () => {
  assert.deepEqual(site.INTERNATIONAL_COUNTRIES.map((c) => c.code), [...back.INTERNATIONAL_COUNTRIES]);
  assert.equal(site.INTERNATIONAL_OPTION_NAME, back.INTERNATIONAL_OPTION_NAME);
  assert.equal(site.HOME_COUNTRY, "ht");
  for (const code of ["us", "ca", "fr"]) assert.ok((back.INTERNATIONAL_COUNTRIES as readonly string[]).includes(code), code);
  assert.ok(!(back.INTERNATIONAL_COUNTRIES as readonly string[]).includes("ht"));
});

check("Haïti n'est pas l'étranger ; le reste l'est, quelle que soit la casse", () => {
  assert.equal(back.isInternational("ht"), false);
  assert.equal(back.isInternational("HT"), false);
  assert.equal(back.isInternational("fr"), true);
  assert.equal(back.isInternational(""), false);
  assert.equal(site.isInternational("US"), true);
  assert.equal(site.countryLabel("us"), "États-Unis");
});

check("ajout de pays à une zone : complet, sans doublon, et rien à faire au second passage", () => {
  const first = back.withCountries(["ht", "FR"], ["fr", "us"]);
  assert.deepEqual(first.all, ["ht", "fr", "us"]);
  assert.deepEqual(first.added, ["us"]);
  assert.deepEqual(back.withCountries(first.all, ["fr", "us"]).added, []);
});

check("e-mail vendeur : commande internationale, ne rien expédier avant confirmation", () => {
  const order = { displayId: 6, sellerName: "Atelier", lines: [{ title: "Panier", quantity: 1 }], total: 8680, currency: "htg" };
  const mail = E.orderForSellerEmail({ order, customerName: "Anne", phone: "+33600000000", address: "Paris", cashOnDelivery: true, international: true });
  assert.match(mail.subject, /^Commande internationale n° 6/);
  assert.match(mail.text, /N'EXPÉDIEZ RIEN avant la confirmation de MACHE/);
  assert.match(mail.text, /hors frais d'expédition/);
  assert.doesNotMatch(mail.text, /À régler à la livraison/);
});

check("e-mail acheteur : frais à confirmer, rien à payer avant son accord", () => {
  const order = { displayId: 6, sellerName: "Atelier", lines: [{ title: "Panier", quantity: 1 }], total: 8680, currency: "htg" };
  const mail = E.orderConfirmationEmail({ customerName: "Anne", orders: [order], cashOnDelivery: true, international: true });
  assert.match(mail.subject, /frais d'expédition à confirmer/);
  assert.match(mail.text, /Rien n'est expédié, et rien ne vous est demandé, avant votre accord/);
  assert.doesNotMatch(mail.text, /À régler à la livraison|en main propre/);
  const local = E.orderConfirmationEmail({ customerName: "Jean", orders: [order], cashOnDelivery: true });
  assert.match(local.text, /À régler à la livraison/);
});

check("l'équipe est alertée d'une commande internationale", () => {
  const subscriber = read("backend/packages/api/src/subscribers/order-placed-notify.ts");
  assert.match(subscriber, /if \(international\) \{/);
  assert.match(subscriber, /commande internationale \(équipe\)/);
  assert.match(subscriber, /adminAlertAddress\(\)/);
});

check("le backend ouvre la région et le mode international à chaque démarrage et toutes les heures", () => {
  const boot = read("backend/packages/api/src/scripts/bootstrap.ts");
  assert.match(boot, /await livraisonInternationale\(args\)/);
  const script = read("backend/packages/api/src/scripts/livraison-internationale.ts");
  assert.match(script, /updateRegionsWorkflow/);
  assert.match(script, /prices: \[\{ currency_code: "htg", amount: 0 \}\]/);
  /* Une boutique qui ne livre nulle part n'est pas configurée à sa place. */
  assert.match(script, /if \(options\.length === 0\) continue;/);
  assert.match(read("backend/packages/api/src/jobs/livraison-internationale.ts"), /schedule: "17 \* \* \* \*"/);
  /* Les modes de la démonstration ne servent plus qu'Haïti, en français. */
  const demo = read("backend/packages/api/src/scripts/demo-shipping-haiti.ts");
  assert.match(demo, /"Standard Shipping": "Livraison standard en Haïti"/);
  assert.match(demo, /geo_zones: \[\{ country_code: HAITI, type: "country" as const \}\]/);
});

check("page de commande : pays de la diaspora, textes pour l'étranger, champs réaffichés", () => {
  const page = read("src/app/checkout/page.tsx");
  assert.match(page, /INTERNATIONAL_COUNTRIES\.map/);
  assert.match(page, /commande sur confirmation/);
  assert.match(page, /Rien à payer maintenant/);
  assert.match(page, /"Total \(hors expédition\)"/);
  assert.match(page, /option\.name === INTERNATIONAL_OPTION_NAME\s+\? "À confirmer"/);
  for (const field of ["email", "firstName", "lastName", "address1", "city", "phone"]) {
    assert.match(page, new RegExp(`defaultValue=\\{prefill\\.${field}\\}`), field);
  }
  assert.match(page, /defaultValue=\{prefill\.countryCode\}/);
  assert.match(read("src/lib/medusa/checkout.ts"), /international: hasAddress && isInternational\(prefill\.countryCode\)/);
});

check("confirmation : le numéro de commande, pas la référence technique", () => {
  const success = read("src/app/checkout/success/page.tsx");
  assert.match(success, /orderNumbers\.map\(\(number\) => `n° \$\{number\}`\)/);
  assert.match(success, /confirmation\?\.international/);
  assert.match(read("src/lib/medusa/checkout.ts"), /\?fields=id,orders\.id,orders\.display_id/);
});

check("aucun texte du site ne dit plus que l'étranger n'est pas servi", () => {
  const faq = read("src/lib/faq.tsx");
  assert.match(faq, /q: "J'habite hors d'Haïti : puis-je commander \?"/);
  assert.match(faq, /HOME_FAQ_QUESTIONS = \[[^\]]*"J'habite hors d'Haïti : puis-je commander \?"/);
  for (const file of ["src/lib/faq.tsx", "src/components/chat-assistant.tsx", "src/app/about/page.tsx", "src/app/services/page.tsx", "src/app/export/page.tsx"]) {
    const text = read(file);
    assert.doesNotMatch(text, /Pas encore\. Les vendeurs livrent|L&apos;export n&apos;est pas encore ouvert|L'export hors d'Haïti n'est pas ouvert|aujourd'hui c'est Haïti/, file);
  }
  /* « À propos » ne prétend plus que tout le site est en créole. */
  assert.doesNotMatch(read("src/app/about/page.tsx"), /Le site est en français et en créole/);
  assert.match(read("src/app/legal/shipping/page.tsx"), /Hors d&apos;Haïti : la commande sur confirmation/);
});

console.log(`\n${passed} vérifications réussies.`);
