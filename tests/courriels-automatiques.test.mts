/*
  TESTS : les e-mails automatiques (commande, devis, messages, boutiques).

  Ce qu'ils gardent

  1. Chaque événement qui compte prévient la bonne personne : vendeur
     (commande, devis, approbation), acheteur (confirmation, réponse au
     devis), demandeur (réponse de MACHE), équipe (nouvelle boutique,
     nouveau message).
  2. Rien d'inventé : le paiement n'est annoncé que s'il est connu ; la
     réponse d'un message ne recopie pas son texte (confidentialité).
  3. Ce qui vient d'un utilisateur est échappé : un nom de boutique ne
     peut pas injecter de HTML ni de lien.
  4. Les liens sont construits sur STOREFRONT_URL, jamais ailleurs.
  5. Un e-mail raté ne fait jamais échouer ce qui l'a déclenché.

  Lancer : npm run test:courriels
*/

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

process.env.STOREFRONT_URL = "https://mache.test";
process.env.MAIL_FROM = "equipe@mache.test";
delete process.env.ADMIN_ALERT_EMAIL;

const E = await import("../backend/packages/api/src/lib/notification-emails.ts");
const O = await import("../backend/packages/api/src/lib/order-notifications.ts");
const { notify } = await import("../backend/packages/api/src/lib/notify.ts");

let passed = 0;
async function check(name: string, run: () => void | Promise<void>) { await run(); passed += 1; console.log(`  ✓ ${name}`); }

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

const order = {
  id: "order_1", display_id: 12, email: "client@exemple.ht", currency_code: "htg", total: 9030,
  items: [{ product_title: "Panier en paille", title: "Grand", quantity: 2 }],
  shipping_address: { first_name: "Lucie", last_name: "Achat", address_1: "5 rue Pavée", city: "Cap-Haïtien", province: "Nord", country_code: "ht", phone: "+50938000000" },
  seller: { id: "sel_1", name: "Atelier <b>Jacmel</b>", email: "atelier@exemple.ht", handle: "atelier-jacmel" },
};

await check("vendeur : la commande porte articles, total, client, téléphone et adresse", () => {
  const mail = E.orderForSellerEmail({
    order: O.summary(order), customerName: O.customerName(order), phone: order.shipping_address.phone,
    address: O.addressText(order.shipping_address), cashOnDelivery: true,
  });
  assert.match(mail.subject, /Nouvelle commande n° 12/);
  assert.match(mail.text, /9\s030\sHTG/u);
  for (const part of ["2 × Panier en paille", "Lucie Achat", "+50938000000", "Cap-Haïtien", "Haïti", "À régler à la livraison"]) {
    assert.ok(mail.text.includes(part), `absent : ${part}`);
  }
  assert.match(mail.text, /https:\/\/mache\.test\/dashboard\/seller/);
});

await check("un nom de boutique avec du HTML est échappé", () => {
  const mail = E.orderForSellerEmail({ order: O.summary(order), customerName: "x", phone: null, address: "", cashOnDelivery: true });
  assert.doesNotMatch(mail.html, /<b>Jacmel<\/b>/);
  assert.match(mail.html, /&lt;b&gt;Jacmel&lt;\/b&gt;/);
  const hostile = E.quoteRequestEmail({ sellerName: "S", displayId: 1, productTitle: '"><script>alert(1)</script>', quantity: 3, buyerName: "<img src=x onerror=1>", buyerCompany: null, message: null });
  assert.doesNotMatch(hostile.html, /<script|<img/);
});

await check("paiement : annoncé seulement s'il est connu", () => {
  assert.equal(O.isCashOnDelivery(["pp_system_default"]), true);
  assert.equal(O.isCashOnDelivery(["pp_stripe_stripe"]), false);
  assert.equal(O.isCashOnDelivery(["pp_system_default", "pp_stripe_stripe"]), false);
  assert.equal(O.isCashOnDelivery([]), null);
  const unknown = E.orderConfirmationEmail({ customerName: "Lucie", orders: [O.summary(order)], cashOnDelivery: null });
  assert.doesNotMatch(unknown.text, /Paiement|livraison, en main propre|Rien n'a été prélevé/);
  const cod = E.orderConfirmationEmail({ customerName: "Lucie", orders: [O.summary(order)], cashOnDelivery: true });
  assert.match(cod.text, /À régler à la livraison/);
  assert.match(cod.text, /Rien n'a été prélevé/);
});

await check("acheteur : un seul e-mail pour un panier de plusieurs boutiques", () => {
  const second = { ...order, display_id: 13, seller: { ...order.seller, name: "Kay Bio" } };
  const mail = E.orderConfirmationEmail({ customerName: "Lucie", orders: [O.summary(order), O.summary(second)], cashOnDelivery: true });
  assert.match(mail.text, /2 boutiques/);
  assert.match(mail.text, /n° 12/);
  assert.match(mail.text, /n° 13 — Kay Bio/);
  assert.match(mail.text, /https:\/\/mache\.test\/dashboard\/buyer\/orders/);
});

await check("devis : le lien de l'acheteur porte son jeton, sur l'adresse du site", () => {
  assert.equal(E.quoteLink("quo_1", "abc def"), "https://mache.test/devis/quo_1?jeton=abc%20def");
  assert.equal(E.threadLink("thr_1", "t/k"), "https://mache.test/messages/thr_1?token=t%2Fk");
  assert.equal(E.quoteLink("quo_1", "x", null), null);
  const mail = E.quoteAnsweredEmail({ buyerName: "Lucie", displayId: 68, productTitle: "Sac", accepted: true, link: E.quoteLink("quo_1", "tok") });
  assert.match(mail.text, /devis\/quo_1\?jeton=tok/);
  assert.match(mail.text, /Rien n'est réservé ni payé/);
});

await check("réponse de MACHE : le lien, jamais le texte de la réponse", () => {
  const mail = E.messageReplyEmail({ name: "Marc", displayId: 2, subject: "Livraison", link: E.threadLink("thr_9", "tok") });
  assert.match(mail.text, /messages\/thr_9\?token=tok/);
  assert.match(mail.text, /la réponse ne figure pas dans cet e-mail/);
});

await check("alertes de l'équipe : ADMIN_ALERT_EMAIL, sinon MAIL_FROM", () => {
  assert.equal(E.adminAlertAddress(), "equipe@mache.test");
  process.env.ADMIN_ALERT_EMAIL = "Alertes@Mache.test";
  assert.equal(E.adminAlertAddress(), "alertes@mache.test");
  process.env.ADMIN_ALERT_EMAIL = "pas-une-adresse";
  assert.equal(E.adminAlertAddress(), null);
  delete process.env.ADMIN_ALERT_EMAIL;
});

await check("un e-mail raté ne lève jamais d'erreur, et le journal ne cite pas l'adresse", async () => {
  const logs: string[] = [];
  const logger = { info: (m: string) => logs.push(m), warn: (m: string) => logs.push(m), error: (m: string) => logs.push(m) };
  delete process.env.BREVO_API_KEY;
  const mail = E.sellerApprovedEmail({ sellerName: "Atelier", handle: "atelier" });
  assert.equal(await notify(logger, "test", "secret@exemple.ht", mail), false);
  assert.equal(await notify(logger, "test", "pas une adresse", mail), false);
  assert.ok(logs.every((line) => !line.includes("secret@exemple.ht")));
});

await check("les événements sont branchés : commande, groupe, boutique, devis, messages", () => {
  assert.match(read("backend/packages/api/src/subscribers/order-placed-notify.ts"), /event: "order\.placed"/);
  assert.match(read("backend/packages/api/src/subscribers/order-group-notify.ts"), /event: "order_group\.created"/);
  assert.match(read("backend/packages/api/src/subscribers/seller-notify.ts"), /\["seller\.created", "seller\.approved"\]/);
  assert.match(read("backend/packages/api/src/api/store/quotes/route.ts"), /void notifySellerOfQuote\(req, created\)/);
  const answer = read("backend/packages/api/src/api/vendor/quotes/[id]/route.ts");
  assert.match(answer, /void notifyBuyer\(req, updated, false\)/);
  assert.match(answer, /void notifyBuyer\(req, updated, true\)/);
  assert.match(read("backend/packages/api/src/api/store/messages/route.ts"), /nouveau message \(équipe\)/);
  /* Une note interne ne part chez personne. */
  assert.match(read("backend/packages/api/src/api/admin/mache/messages/[id]/route.ts"), /if \(!internal\) \{\s+void notify\(/);
});

console.log(`\n${passed} vérifications réussies.`);
