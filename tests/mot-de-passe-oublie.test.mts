/*
  TESTS : « mot de passe oublié », et ce qui l'empêche de devenir une arme.

  Ce qu'ils gardent

  1. Le lien mène chez MACHÉ, et seulement chez MACHÉ — construit depuis
     la configuration, jamais depuis la requête.
  2. Le message n'a qu'une chose à faire passer, le lien, et ne laisse
     personne y glisser du HTML.
  3. Demander des liens en boucle ne noie pas la boîte de quelqu'un — et
     ce plafond ne peut pas, à l'inverse, bloquer tout le site.
  4. Le plafond de connexion ne se contourne plus en inventant une
     adresse IP à chaque essai.

  Lancer : npm run test:oubli
*/

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resetLink, resetEmail, isResetActor } from "../backend/packages/api/src/lib/password-reset-email.ts";
import { sendEmail } from "../backend/packages/api/src/lib/mailer.ts";
import { throttleResetRequests, resetResetThrottle, RESET_THROTTLE } from "../backend/packages/api/src/api/reset-throttle.ts";
import { throttleLogin, resetLoginThrottle, LOGIN_THROTTLE } from "../backend/packages/api/src/api/login-throttle.ts";

let passed = 0;
async function check(name: string, run: () => void | Promise<void>) { await run(); passed += 1; console.log(`  ✓ ${name}`); }

const BASE = "https://mache.example";

/* ------------------------------------------------------------------ */
/* Le lien                                                             */
/* ------------------------------------------------------------------ */

await check("le lien mène à la page MACHÉ, avec le bon espace", () => {
  const link = resetLink("member", "abc.def-ghi", BASE)!;
  const url = new URL(link);
  assert.equal(url.origin, BASE);
  assert.equal(url.pathname, "/mot-de-passe/nouveau");
  assert.equal(url.searchParams.get("acteur"), "member");
  assert.equal(url.searchParams.get("token"), "abc.def-ghi");
});

await check("le lien vient de la configuration, jamais de la requête", () => {
  /* Un en-tête se falsifie : construit à partir de lui, le lien mènerait chez un tiers. */
  const source = readFileSync("backend/packages/api/src/lib/password-reset-email.ts", "utf8");
  assert.match(source, /process\.env\.STOREFRONT_URL/);
  assert.doesNotMatch(source, /req\.|headers|host/i);
});

await check("sans adresse de site valable, aucun lien n'est fabriqué", () => {
  assert.equal(resetLink("customer", "t", null), null);
  assert.equal(resetLink("customer", "t", "pas-une-url".match(/^https?:/) ? "x" : null), null);
});

await check("un type de compte sans page de réinitialisation ne reçoit rien", () => {
  assert.equal(resetLink("hacker", "t", BASE), null);
  assert.equal(isResetActor("user"), true);
  assert.equal(isResetActor("admin"), false);
});

await check("un jeton étrange est encodé, il ne casse pas l'adresse", () => {
  const link = resetLink("customer", "a&acteur=user#x", BASE)!;
  const url = new URL(link);
  assert.equal(url.searchParams.get("acteur"), "customer", "le jeton ne doit pas pouvoir changer d'espace");
  assert.equal(url.searchParams.get("token"), "a&acteur=user#x");
});

/* ------------------------------------------------------------------ */
/* Le message                                                          */
/* ------------------------------------------------------------------ */

await check("le message porte le lien, sa durée, et quoi faire si l'on n'a rien demandé", () => {
  const link = resetLink("customer", "jeton", BASE)!;
  const mail = resetEmail("customer", link);
  for (const body of [mail.text, mail.html]) {
    assert.ok(body.includes("15 minutes"));
    assert.ok(body.includes("ignorez ce message"));
  }
  assert.ok(mail.text.includes(link));
});

await check("personne ne peut glisser de HTML dans le message", () => {
  const mail = resetEmail("customer", `${BASE}/x?"><script>alert(1)</script>`);
  assert.doesNotMatch(mail.html, /<script>/);
  assert.match(mail.html, /&quot;&gt;&lt;script&gt;/);
});

await check("sans service d'envoi configuré, rien ne part et on sait pourquoi", async () => {
  const saved = { key: process.env.BREVO_API_KEY, from: process.env.MAIL_FROM };
  delete process.env.BREVO_API_KEY;
  process.env.MAIL_FROM = "contact@exemple.ht";
  const result = await sendEmail({ to: "a@b.ht", subject: "s", text: "t", html: "h" });
  assert.equal(result.sent, false);
  assert.equal((result as { configured: boolean }).configured, false);
  process.env.BREVO_API_KEY = saved.key; process.env.MAIL_FROM = saved.from;
  if (saved.key === undefined) delete process.env.BREVO_API_KEY;
  if (saved.from === undefined) delete process.env.MAIL_FROM;
});

await check("le lien n'est jamais écrit dans les journaux en production", () => {
  const source = readFileSync("backend/packages/api/src/subscribers/password-reset.ts", "utf8");
  const shown = source.indexOf("${link}");
  assert.ok(shown > -1, "le lien n'apparaît qu'à un seul endroit");
  const guard = source.lastIndexOf('process.env.NODE_ENV !== "production"', shown);
  assert.ok(guard > -1 && shown - guard < 400, "et seulement derrière la garde « pas en production »");
  assert.equal(source.split("${link}").length - 1, 1, "un seul endroit, pas deux");
});

/* ------------------------------------------------------------------ */
/* Les plafonds                                                        */
/* ------------------------------------------------------------------ */

function resetRequest(identifier: string, xff: string, path = "/auth/customer/emailpass/reset-password") {
  let code = 0;
  let passed = false;
  /* `path` relatif, comme Express peut le donner sous un point de montage : seule l'adresse complète fait foi. */
  const req = { originalUrl: path, path: path.replace(/^\/auth/, ""), headers: { "x-forwarded-for": xff }, body: { identifier }, socket: { remoteAddress: "10.0.0.1" } };
  const res = { status(v: number) { code = v; return res; }, json() { return res; } };
  throttleResetRequests(req as never, res as never, (() => { passed = true; }) as never);
  return { blocked: code === 429, passed };
}

await check("trois liens par adresse et par heure, pas un de plus", () => {
  resetResetThrottle();
  for (let i = 0; i < RESET_THROTTLE.PER_IDENTIFIER; i += 1) {
    assert.equal(resetRequest("cible@exemple.ht", `9.9.9.${i}`).blocked, false);
  }
  assert.equal(resetRequest("cible@exemple.ht", "9.9.9.200").blocked, true, "le suivant est refusé, même depuis ailleurs");
  assert.ok(RESET_THROTTLE.PER_IDENTIFIER >= 2 && RESET_THROTTLE.PER_IDENTIFIER <= 10);
});

await check("des centaines de clients passant par le site ne se bloquent pas entre eux", () => {
  /*
    Le site appelle le backend depuis son serveur : toutes ses demandes
    ont la MÊME adresse IP. Une limite par IP aurait coupé la
    récupération de mot de passe pour tout le monde au dixième client.
  */
  resetResetThrottle();
  for (let i = 0; i < 300; i += 1) {
    assert.equal(resetRequest(`client${i}@exemple.ht`, "10.1.1.1").blocked, false, `le client n°${i + 1} ne doit pas être refusé`);
  }
});

await check("un client et un vendeur à la même adresse ont chacun leur récupération", () => {
  resetResetThrottle();
  for (let i = 0; i < RESET_THROTTLE.PER_IDENTIFIER; i += 1) resetRequest("jean@exemple.ht", "10.1.1.1");
  assert.equal(resetRequest("jean@exemple.ht", "10.1.1.1").blocked, true);
  assert.equal(resetRequest("jean@exemple.ht", "10.1.1.1", "/auth/member/emailpass/reset-password").blocked, false);
});

await check("les autres routes d'authentification ne sont pas freinées par ce plafond", () => {
  resetResetThrottle();
  for (let i = 0; i < 50; i += 1) {
    assert.equal(resetRequest("x@exemple.ht", "5.5.5.5", "/auth/customer/emailpass").passed, true);
  }
});

function failedLogin(email: string, xff: string) {
  const listeners: (() => void)[] = [];
  let code = 0;
  const req = { headers: { "x-forwarded-for": xff }, body: { email }, socket: { remoteAddress: "10.0.0.1" } };
  const res = {
    statusCode: 401, setHeader() {},
    status(v: number) { code = v; return res; }, json() { return res; },
    on(e: string, h: () => void) { if (e === "finish") listeners.push(h); return res; },
  };
  let next = false;
  throttleLogin(req as never, res as never, (() => { next = true; }) as never);
  if (next) for (const h of listeners) h();
  return { blocked: code === 429 };
}

await check("le plafond de connexion ne se contourne plus en inventant une adresse IP", () => {
  /*
    Render AJOUTE la vraie adresse à la fin de x-forwarded-for et laisse
    le début tel que le client l'a écrit. En lisant le début, un
    attaquant changeait de compteur à chaque essai.
  */
  resetLoginThrottle();
  for (let i = 0; i < LOGIN_THROTTLE.MAX_ATTEMPTS; i += 1) {
    failedLogin("vendeur@exemple.ht", `66.66.66.${i}, 7.7.7.7`);
  }
  assert.equal(failedLogin("vendeur@exemple.ht", "66.66.66.250, 7.7.7.7").blocked, true);
});

/* ------------------------------------------------------------------ */
/* Le site                                                             */
/* ------------------------------------------------------------------ */

await check("les trois pages de connexion mènent à la bonne récupération", () => {
  const pages: Array<[string, string]> = [
    ["src/app/compte/connexion/page.tsx", "customer"],
    ["src/app/dashboard/seller/connexion/page.tsx", "member"],
    ["src/app/dashboard/admin/connexion/page.tsx", "user"],
  ];
  for (const [file, actor] of pages) {
    const source = readFileSync(file, "utf8");
    assert.ok(source.includes(`href="/mot-de-passe?acteur=${actor}"`), `${file} : lien « Mot de passe oublié ? » vers l'espace ${actor}`);
    assert.ok(source.includes("query.reinitialise &&"), `${file} : message après changement`);
  }
});

await check("le site ne dit jamais si une adresse a un compte", () => {
  /* Même confirmation dans les deux cas : sinon, un annuaire des inscrits offert à qui le demande. */
  const lib = readFileSync("src/lib/medusa/password.ts", "utf8");
  const request = lib.slice(lib.indexOf("export async function requestPasswordReset"), lib.indexOf("export async function setNewPassword"));
  assert.doesNotMatch(request, /404|introuvable|aucun compte|n'existe pas/i);
  assert.match(request, /result\.status >= 200 && result\.status < 300\) return \{ ok: true \}/);

  const page = readFileSync("src/app/mot-de-passe/page.tsx", "utf8");
  assert.match(page, /Si un compte existe pour cette adresse, un e-mail vient de partir\./);
});

await check("un lien expiré ou déjà servi le dit, et renvoie vers une nouvelle demande", () => {
  const lib = readFileSync("src/lib/medusa/password.ts", "utf8");
  assert.match(lib, /result\.status === 401 \|\| result\.status === 400\) \{\s*return \{\s*ok: false,\s*expired: true/);
  const actions = readFileSync("src/app/mot-de-passe/actions.ts", "utf8");
  assert.match(actions, /if \(result\.expired\) \{\s*redirect\(`\/mot-de-passe\?acteur=/);
});

await check("la page du nouveau mot de passe ne transmet pas le jeton ailleurs", () => {
  const page = readFileSync("src/app/mot-de-passe/nouveau/page.tsx", "utf8");
  assert.match(page, /referrer: "no-referrer"/);
  assert.match(page, /robots: \{ index: false \}/);
});

console.log(`\n${passed} vérifications passées.\n`);
