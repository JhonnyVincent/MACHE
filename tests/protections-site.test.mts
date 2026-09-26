/*
  TESTS : les protections du site.

  Deux choses que rien d'autre ne rattraperait si elles disparaissaient,
  parce qu'aucune ne casse quoi que ce soit en s'en allant. Un site sans
  plafond de connexion marche parfaitement — jusqu'à ce qu'on lui prenne
  un mot de passe. Un site sans en-têtes s'affiche très bien — jusqu'à
  ce qu'on encadre son espace admin.

  C'est justement pourquoi ils ont besoin d'un test : leur absence est
  silencieuse.

  Lancer : npm run test:protections
*/

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  throttleLogin,
  resetLoginThrottle,
  LOGIN_THROTTLE,
} from "../backend/packages/api/src/api/login-throttle.ts";

let passed = 0;

function check(name: string, run: () => void) {
  run();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

/* ------------------------------------------------------------------ */
/* Le plafond de tentatives de connexion                               */
/* ------------------------------------------------------------------ */

/*
  Un faux couple requête/réponse. `finish` est le moment où le
  middleware apprend si l'essai a échoué — c'est toute la mécanique, et
  elle doit être rejouée fidèlement, sinon le test ne prouve rien.
*/
function essai(email: string, ip: string, statut: number) {
  const listeners: (() => void)[] = [];

  let code = 0;
  let corps: Record<string, unknown> | null = null;

  const req = {
    headers: { "x-forwarded-for": ip },
    body: { email },
    socket: { remoteAddress: ip },
  };

  const res = {
    statusCode: statut,
    setHeader() {},
    status(value: number) {
      code = value;
      return res;
    },
    json(payload: Record<string, unknown>) {
      corps = payload;
      return res;
    },
    on(event: string, handler: () => void) {
      if (event === "finish") listeners.push(handler);
      return res;
    },
  };

  let passeAuSuivant = false;

  throttleLogin(req as never, res as never, (() => {
    passeAuSuivant = true;
  }) as never);

  /* Le serveur répond : c'est là que le compteur est mis à jour. */
  if (passeAuSuivant) for (const handler of listeners) handler();

  return {
    bloque: code === 429,
    passeAuSuivant,
    message: corps ? String((corps as Record<string, unknown>).message) : "",
  };
}

check("le plafond reste dans une fourchette qui protège vraiment", () => {
  /*
    Les autres vérifications pilotent leur boucle avec cette constante :
    portée à 100 000, elles resteraient toutes vertes pendant que le
    site redeviendrait ouvert à la force brute. Constaté en la changeant
    exprès. C'est donc la VALEUR qu'il faut épingler, pas seulement la
    mécanique autour.

    Trop bas enferme un vendeur qui tâtonne ; trop haut ne protège de
    rien. Entre trois et vingt essais par fenêtre d'au moins cinq
    minutes, on est dans ce qui sert.
  */
  assert.ok(
    LOGIN_THROTTLE.MAX_ATTEMPTS >= 3 && LOGIN_THROTTLE.MAX_ATTEMPTS <= 20,
    `un plafond de ${LOGIN_THROTTLE.MAX_ATTEMPTS} essais ne protège de rien`
  );

  assert.ok(
    LOGIN_THROTTLE.WINDOW_MS >= 5 * 60 * 1000,
    "une fenêtre trop courte se contourne en attendant quelques secondes"
  );
});

check("huit échecs passent, le neuvième est refusé", () => {
  resetLoginThrottle();

  for (let i = 1; i <= LOGIN_THROTTLE.MAX_ATTEMPTS; i += 1) {
    const r = essai("cible@exemple.test", "10.0.0.1", 401);

    assert.equal(r.bloque, false, `l'essai ${i} ne devait pas être refusé`);
  }

  const neuvieme = essai("cible@exemple.test", "10.0.0.1", 401);

  assert.equal(neuvieme.bloque, true, "le neuvième essai doit être refusé");
  assert.equal(neuvieme.passeAuSuivant, false, "il ne doit pas atteindre le backend");
  assert.match(
    neuvieme.message,
    /Trop de tentatives/,
    "et le dire, en conseillant de changer le mot de passe"
  );
});

check("une réussite remet le compteur à zéro", () => {
  /*
    Sans cela, un vendeur qui travaille toute la journée finirait
    bloqué par son propre usage.
  */
  resetLoginThrottle();

  for (let i = 1; i <= LOGIN_THROTTLE.MAX_ATTEMPTS - 1; i += 1) {
    essai("vendeur@exemple.test", "10.0.0.2", 401);
  }

  essai("vendeur@exemple.test", "10.0.0.2", 200);

  for (let i = 1; i <= LOGIN_THROTTLE.MAX_ATTEMPTS; i += 1) {
    const r = essai("vendeur@exemple.test", "10.0.0.2", 401);

    assert.equal(r.bloque, false, `après une réussite, l'essai ${i} doit repartir de zéro`);
  }
});

check("bloquer un compte ne bloque pas les autres depuis la même adresse", () => {
  /*
    Le piège de la limite par IP seule : en Haïti, tout un opérateur
    mobile peut sortir par la même adresse. Bloquer sur l'IP seule
    fermerait le site à des milliers de gens parce qu'un seul s'est
    trompé.
  */
  resetLoginThrottle();

  for (let i = 0; i <= LOGIN_THROTTLE.MAX_ATTEMPTS; i += 1) {
    essai("victime@exemple.test", "41.222.0.9", 401);
  }

  const voisin = essai("quelquun-dautre@exemple.test", "41.222.0.9", 401);

  assert.equal(voisin.bloque, false, "un autre compte doit pouvoir se connecter");
});

check("viser une adresse depuis partout ne bloque pas son titulaire", () => {
  /*
    L'attaque inverse : viser le compte du patron depuis n'importe où
    pour l'empêcher d'entrer. La clé associe l'IP ET l'identifiant,
    donc l'attaquant ne bloque que lui-même.
  */
  resetLoginThrottle();

  for (let i = 0; i <= LOGIN_THROTTLE.MAX_ATTEMPTS; i += 1) {
    essai("patron@mache.ht", `203.0.113.${i}`, 401);
  }

  const patron = essai("patron@mache.ht", "192.168.1.50", 401);

  assert.equal(
    patron.bloque,
    false,
    "le vrai titulaire doit pouvoir se connecter depuis chez lui"
  );
});

/* ------------------------------------------------------------------ */
/* Les en-têtes de sécurité                                            */
/* ------------------------------------------------------------------ */

const CONFIG = readFileSync("next.config.mjs", "utf8");

check("les six en-têtes sont déclarés", () => {
  /*
    Vérifiés servis par un vrai serveur avant d'écrire ce test ; celui-ci
    est là pour qu'ils ne disparaissent pas en silence.
  */
  const attendus: [string, RegExp][] = [
    ["X-Content-Type-Options", /nosniff/],
    ["X-Frame-Options", /DENY/],
    ["Content-Security-Policy", /frame-ancestors 'none'/],
    ["Referrer-Policy", /strict-origin-when-cross-origin/],
    ["Permissions-Policy", /camera=\(\)/],
    ["Strict-Transport-Security", /max-age=\d+/],
  ];

  for (const [nom, valeur] of attendus) {
    assert.ok(CONFIG.includes(nom), `en-tête « ${nom} » absent`);
    assert.match(CONFIG, valeur, `valeur de « ${nom} » inattendue`);
  }
});

check("les en-têtes couvrent toutes les pages", () => {
  /*
    Une source qui ne viserait que l'accueil laisserait l'espace admin
    — la page qu'on veut justement protéger du clic détourné — sans
    aucune protection.
  */
  assert.match(
    CONFIG,
    /source:\s*"\/:path\*"/,
    "les en-têtes doivent s'appliquer à toutes les adresses"
  );
});

console.log(`\n${passed} vérifications passées.\n`);
