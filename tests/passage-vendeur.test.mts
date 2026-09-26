/*
  TESTS : le laissez-passer vers le panneau vendeur Mercur.

  Ce qu'ils gardent

  1. Un vendeur connecté sur MACHÉ entre dans le panneau sans
     redemander ses identifiants — dans SA boutique.
  2. Le laissez-passer ne se falsifie pas, expire en 60 secondes, et ne
     sert qu'une fois.
  3. Il ne vaut pas jeton de connexion : signé avec une clé dérivée,
     pas avec le secret du backend.
  4. La route d'entrée ne redirige que vers le panneau, et régénère la
     session avant d'y écrire l'identité.

  Lancer : npm run test:passage
*/

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHmac } from "node:crypto";
import {
  issuePass, readPass, consumePass, resetUsedPasses, PASS_TTL_MS,
} from "../backend/packages/api/src/lib/vendor-pass.ts";

let passed = 0;
function check(name: string, run: () => void) { run(); passed += 1; console.log(`  ✓ ${name}`); }

const SECRET = "secret-du-backend";
const NOW = 1_800_000_000_000;
const ctx = {
  actor_id: "mem_1",
  actor_type: "member",
  auth_identity_id: "authid_1",
  app_metadata: { member_id: "mem_1", roles: ["seller_administration"] },
};

check("un laissez-passer valable ouvre la session du bon membre et de la bonne boutique", () => {
  const pass = issuePass(ctx, "sel_1", SECRET, NOW);
  const payload = readPass(pass, SECRET, NOW + 1000)!;
  assert.ok(payload);
  assert.equal(payload.ctx.actor_id, "mem_1");
  assert.equal(payload.ctx.actor_type, "member");
  assert.equal(payload.ctx.auth_identity_id, "authid_1");
  assert.equal(payload.seller_id, "sel_1");
});

check("les rôles ne sont pas figés dans le laissez-passer (Mercur les recalcule)", () => {
  const payload = readPass(issuePass(ctx, "sel_1", SECRET, NOW), SECRET, NOW)!;
  assert.equal("roles" in payload.ctx.app_metadata, false);
  assert.equal(payload.ctx.app_metadata.member_id, "mem_1");
});

check("il expire au bout de 60 secondes", () => {
  const pass = issuePass(ctx, "sel_1", SECRET, NOW);
  assert.equal(PASS_TTL_MS, 60_000);
  assert.ok(readPass(pass, SECRET, NOW + PASS_TTL_MS - 1));
  assert.equal(readPass(pass, SECRET, NOW + PASS_TTL_MS), null);
});

check("une autre boutique ou un autre membre glissés dedans : refusé", () => {
  const pass = issuePass(ctx, "sel_1", SECRET, NOW);
  const [body, signature] = pass.split(".");
  const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  data.seller_id = "sel_concurrent";
  const forged = `${Buffer.from(JSON.stringify(data)).toString("base64url")}.${signature}`;
  assert.equal(readPass(forged, SECRET, NOW), null);
});

check("signé avec un autre secret : refusé", () => {
  assert.equal(readPass(issuePass(ctx, "sel_1", "autre", NOW), SECRET, NOW), null);
});

check("n'importe quoi à la place : refusé sans planter", () => {
  for (const junk of [undefined, null, 42, "", "abc", "a.b.c", "x".repeat(5000), ["a"]]) {
    assert.equal(readPass(junk, SECRET, NOW), null);
  }
});

check("seul un membre vendeur peut en recevoir un", () => {
  const pass = issuePass({ ...ctx, actor_type: "customer" }, "sel_1", SECRET, NOW);
  assert.equal(readPass(pass, SECRET, NOW), null);
});

check("il ne sert qu'une fois", () => {
  resetUsedPasses();
  const payload = readPass(issuePass(ctx, "sel_1", SECRET, NOW), SECRET, NOW)!;
  assert.equal(consumePass(payload, NOW), true);
  assert.equal(consumePass(payload, NOW), false);
});

check("deux laissez-passer successifs sont distincts, chacun utilisable", () => {
  resetUsedPasses();
  const a = readPass(issuePass(ctx, "sel_1", SECRET, NOW), SECRET, NOW)!;
  const b = readPass(issuePass(ctx, "sel_1", SECRET, NOW), SECRET, NOW)!;
  assert.notEqual(a.nonce, b.nonce);
  assert.equal(consumePass(a, NOW), true);
  assert.equal(consumePass(b, NOW), true);
});

check("il ne vaut pas jeton de connexion : pas signé avec le secret du backend lui-même", () => {
  const pass = issuePass(ctx, "sel_1", SECRET, NOW);
  const [body, signature] = pass.split(".");
  const direct = createHmac("sha256", SECRET).update(body).digest("base64url");
  assert.notEqual(signature, direct);
  /* Et ce n'est pas un JWT (trois parties) que Medusa accepterait. */
  assert.equal(pass.split(".").length, 2);
});

/* ------------------------------------------------------------------ */
/* Les routes                                                          */
/* ------------------------------------------------------------------ */

const entry = readFileSync("backend/packages/api/src/api/mache/passage-vendeur/route.ts", "utf8");
const issue = readFileSync("backend/packages/api/src/api/vendor/passage/route.ts", "utf8");

check("la route d'entrée ne redirige que vers le panneau (pas de redirection ouverte)", () => {
  const code = entry.replace(/\/\*[\s\S]*?\*\//g, "");
  const targets = [...code.matchAll(/res\.redirect\(([^)]*)\)/g)].map((m) => m[1]);
  assert.ok(targets.length >= 2);
  for (const target of targets) assert.equal(target.trim(), "303, PANEL");
  assert.match(code, /const PANEL = "\/seller";/);
});

/* La route d'entrée, exécutée pour de vrai avec une session simulée. */
const { GET } = await import("../backend/packages/api/src/api/mache/passage-vendeur/route.ts");

function fakeRequest(jeton: unknown) {
  const log: string[] = [];
  const makeSession = (label: string): any => ({
    label,
    regenerate(cb: (err?: unknown) => void) { log.push(`regenerate:${label}`); req.session = makeSession("neuve"); cb(); },
    save(cb: (err?: unknown) => void) { log.push(`save:${this.label}`); cb(); },
  });
  const req: any = {
    query: { jeton },
    session: makeSession("ancienne"),
    scope: {
      resolve: (key: string) =>
        key === "configModule"
          ? { projectConfig: { http: { jwtSecret: SECRET } } }
          : { warn: () => {}, error: () => {}, info: () => {} },
    },
  };
  const res: any = { headers: {} as Record<string, string>, redirected: null as null | [number, string],
    setHeader(k: string, v: string) { this.headers[k] = v; },
    redirect(code: number, to: string) { this.redirected = [code, to]; } };
  return { req, res, log };
}

async function acheck(name: string, run: () => Promise<void>) { await run(); passed += 1; console.log(`  ✓ ${name}`); }

await acheck("la route ouvre une session NEUVE, avec le membre et sa boutique, puis entre dans le panneau", async () => {
  resetUsedPasses();
  const { req, res, log } = fakeRequest(issuePass(ctx, "sel_1", SECRET));
  await GET(req, res);
  assert.deepEqual(res.redirected, [303, "/seller"]);
  assert.deepEqual(log, ["regenerate:ancienne", "save:neuve"]);
  assert.equal(req.session.label, "neuve");
  assert.equal(req.session.auth_context.actor_id, "mem_1");
  assert.equal(req.session.seller_id, "sel_1");
  assert.equal(res.headers["referrer-policy"], "no-referrer");
});

await acheck("un laissez-passer déjà servi, ou faux : pas de session, écran de connexion du panneau", async () => {
  resetUsedPasses();
  const pass = issuePass(ctx, "sel_1", SECRET);
  await GET(fakeRequest(pass).req, fakeRequest(pass).res);
  for (const jeton of [pass, "faux.jeton", undefined]) {
    const { req, res, log } = fakeRequest(jeton);
    await GET(req, res);
    assert.deepEqual(res.redirected, [303, "/seller"]);
    assert.deepEqual(log, []);
    assert.equal(req.session.auth_context, undefined);
  }
});

check("la boutique vient du contrôle de Mercur, jamais de la requête", () => {
  const code = issue.replace(/\/\*[\s\S]*?\*\//g, "");
  assert.match(code, /seller_context\?\.seller_id/);
  assert.doesNotMatch(code, /req\.(body|query|headers|get\()/);
});

check("le site envoie le vendeur au panneau par le laissez-passer, plus par un simple lien", () => {
  const page = readFileSync("src/app/dashboard/seller/page.tsx", "utf8");
  assert.match(page, /action=\{openVendorPanelAction\}/);
  assert.doesNotMatch(page, /href=\{vendorUrl\}/);
  const vendor = readFileSync("src/lib/medusa/vendor.ts", "utf8");
  assert.match(vendor, /"\/vendor\/passage"/);
  assert.match(vendor, /\/mache\/passage-vendeur\?jeton=/);
});

console.log(`\n${passed} vérifications passées.`);
