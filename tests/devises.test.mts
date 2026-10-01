/*
  Conversion indicative des prix : taux du jour, jamais de taux inventé.
*/
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import http from "node:http";
import { convert, getRates, isDisplayCurrency } from "../src/lib/fx.ts";

let passed = 0;
async function check(name: string, run: () => void | Promise<void>) {
  await run();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

console.log("\nConversion de devises");

const server = http.createServer((req, res) => {
  if (req.url === "/ok") {
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ time_last_update_utc: "Thu, 01 Oct 2026", rates: { USD: 1, HTG: 130, EUR: 0.9, CAD: 1.4 } }));
  } else if (req.url === "/sans-gourde") {
    res.end(JSON.stringify({ rates: { USD: 1, EUR: 0.9 } }));
  } else {
    res.statusCode = 500;
    res.end("erreur");
  }
});
await new Promise<void>((resolve) => server.listen(9611, resolve));

await check("les devises d'affichage sont une liste fermée", () => {
  for (const ok of ["HTG", "USD", "EUR", "CAD"]) assert.equal(isDisplayCurrency(ok), true);
  for (const bad of ["XXX", "usd", "", null, undefined, "<script>"]) assert.equal(isDisplayCurrency(bad), false);
});

await check("taux lus du service, convertis dans les deux sens", async () => {
  process.env.FX_API_URL = "http://127.0.0.1:9611/ok";
  const rates = await getRates();
  assert.ok(rates);
  assert.equal(convert(2600, "HTG", "USD", rates!), 20);
  assert.equal(convert(20, "USD", "HTG", rates!), 2600);
  assert.equal(convert(1300, "HTG", "EUR", rates!), 9);
  assert.equal(convert(10, "ZZZ", "USD", rates!), null);
});

await check("service en panne ou incomplet : AUCUN taux (pas de taux inventé)", async () => {
  process.env.FX_API_URL = "http://127.0.0.1:9611/panne";
  assert.equal(await getRates(), null);
  process.env.FX_API_URL = "http://127.0.0.1:9611/sans-gourde";
  assert.equal(await getRates(), null);
  process.env.FX_API_URL = "http://127.0.0.1:1/injoignable";
  assert.equal(await getRates(), null);
});

await check("l'estimation est branchée sur la fiche produit, le panier et le paiement", () => {
  for (const file of ["src/app/product/[slug]/page.tsx", "src/app/cart/page.tsx", "src/app/checkout/page.tsx"]) {
    assert.match(readFileSync(file, "utf8"), /<ApproxPrice /, file);
  }
  assert.match(readFileSync("src/components/header.tsx", "utf8"), /<CurrencyPicker \/>/);
  const component = readFileSync("src/components/approx-price.tsx", "utf8");
  assert.match(component, /Estimation indicative/);
  assert.match(component, /if \(value === null\) return null;/);
});

server.close();
console.log(`\n${passed} vérifications réussies.`);
