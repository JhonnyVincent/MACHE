/*
  TESTS : l'attente du backend, et sa fin.

  Ce qui est vérifié ici répond à un symptôme précis rapporté sur le
  site en ligne : « rien ne se passe quand je fais créer un compte,
  même pas d'erreur ».

  Ce n'était pas une panne silencieuse. C'était une attente sans fin :
  aucun appel au backend n'avait de limite, et un hébergement gratuit
  endort son serveur après un moment sans trafic. La requête partait,
  le serveur acceptait la connexion et ne répondait jamais, et l'écran
  restait identique.

  Deux choses doivent donc tenir : une attente finit toujours, et elle
  finit par une phrase qu'on peut lire.

  Lancer : npm run test:attente
*/

import assert from "node:assert/strict";
import {
  BACKEND_TIMEOUT_MS,
  backendTimeoutSignal,
  isTimeout,
  TIMEOUT_MESSAGE,
} from "@/lib/medusa/timeout";

let passed = 0;

function check(name: string, run: () => void) {
  run();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

console.log("\nAttente du backend");

check("la limite laisse le temps d'un réveil", () => {
  /*
    Un hébergement gratuit met souvent quarante à soixante secondes à
    réveiller son serveur. Une limite plus courte ferait échouer la
    première inscription de la journée, systématiquement — un échec
    plus déroutant qu'une attente annoncée.
  */
  assert.ok(BACKEND_TIMEOUT_MS >= 45_000, "limite trop courte pour un réveil");

  /* Mais elle doit finir : au-delà, personne n'attend plus. */
  assert.ok(BACKEND_TIMEOUT_MS <= 120_000, "limite trop longue");
});

check("un abandon est reconnu comme tel", () => {
  for (const name of ["TimeoutError", "AbortError"]) {
    const error = new Error("abandon");
    error.name = name;

    assert.equal(isTimeout(error), true, name);
  }
});

check("une panne réseau n'est pas un abandon", () => {
  /*
    Les confondre ferait renoncer quelqu'un dont la demande serait
    passée au second essai — ou fait réessayer indéfiniment quelqu'un
    dont le serveur est éteint.
  */
  assert.equal(isTimeout(new TypeError("fetch failed")), false);
  assert.equal(isTimeout(new Error("ECONNREFUSED")), false);
  assert.equal(isTimeout(null), false);
  assert.equal(isTimeout(undefined), false);
  assert.equal(isTimeout("TimeoutError"), false);
});

check("le message dit quoi faire, sans terme technique", () => {
  const message = TIMEOUT_MESSAGE.toLowerCase();

  /* Il propose une action. */
  assert.ok(message.includes("réessayez"), "aucune action proposée");

  /*
    Et il ne cite ni variable d'environnement, ni nom de fichier, ni
    code d'erreur : cette phrase s'adresse à quelqu'un qui remplit un
    formulaire.
  */
  for (const jargon of ["fetch", "timeout", "abort", "500", "undefined", "next_"]) {
    assert.equal(message.includes(jargon), false, jargon);
  }
});

/*
  La vérification qui compte : un serveur qui accepte la connexion et ne
  répond jamais — le comportement exact d'une instance en veille — doit
  produire un abandon, pas une attente infinie.
*/
const net = await import("node:net");

const server = net.createServer(() => {});

await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));

const address = server.address();

if (!address || typeof address === "string") {
  throw new Error("port de test indisponible");
}

const started = Date.now();

try {
  await fetch(`http://127.0.0.1:${address.port}/`, {
    signal: backendTimeoutSignal(300),
  });

  throw new Error("la requête aurait dû être abandonnée");
} catch (error) {
  assert.equal(isTimeout(error), true, "abandon non reconnu");

  /* Et dans le délai demandé, pas « un jour ». */
  assert.ok(Date.now() - started < 5_000, "abandon trop tardif");

  passed += 1;
  console.log("  ✓ l'attente finit vraiment");
} finally {
  server.close();
}

console.log(`\n${passed} vérifications passées.\n`);
