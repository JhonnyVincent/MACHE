/*
  TESTS : le gel des versements.

  CE QU'ILS PROTÈGENT

  Une fraude est constatée, on gèle la boutique — et il faut que
  l'argent s'arrête VRAIMENT. Un gel qui n'arrête rien est pire que pas
  de gel : l'écran affiche « gelé », on cesse de surveiller, et les
  versements continuent.

  Deux règles, opposées et toutes deux nécessaires :

  1. Une boutique GELÉE ne libère pas ses versements, même avec un code
     de remise parfaitement valide. C'est le but.

  2. Une boutique gelée enregistre QUAND MÊME la livraison. La remise
     est un FAIT ; le versement est une DÉCISION. Confondre les deux
     ferait perdre le fait — on ne saurait plus si le colis est arrivé —
     et punirait un acheteur qui n'y est pour rien.

  ET LE DÉFAUT EN CAS DE PANNE

  Si la lecture du gel échoue, on RETIENT. C'est l'inverse du choix
  fait pour les comptes bloqués, et c'est voulu : là-bas se fermer sur
  incident aurait arrêté les commandes de tous les clients ; ici, ça
  laisse une somme en attente une heure de plus. Un versement libéré à
  tort pendant une fraude, lui, ne se rattrape pas.

  Lancer : npm run test:gel
*/

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

let passed = 0;

function check(name: string, run: () => void) {
  run();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

const HELPER = "backend/packages/api/src/api/payout-freeze.ts";
const CONFIRM = "backend/packages/api/src/api/delivery-confirm.ts";
const BUYER = "backend/packages/api/src/api/store/deliveries/[id]/route.ts";
const ROUTE = "backend/packages/api/src/api/admin/mache/payout-freezes/route.ts";

function read(path: string): string {
  return readFileSync(path, "utf8");
}

check("aucune route ne libère un versement sans passer par la règle", () => {
  /*
    Le cœur du dispositif. Trois chemins mènent à un versement : la
    confirmation par code (vendeur, agent, point de retrait) et le
    constat de réception d'un colis confié à un transporteur. Un
    « releasable » écrit en dur quelque part serait la porte par
    laquelle la fraude passerait.
  */
  for (const path of [CONFIRM, BUYER]) {
    const source = read(path);

    assert.match(
      source,
      /payout_state: await payoutStateAfterConfirmation\(/,
      `${path} doit demander la règle au lieu de décider seul`
    );

    assert.equal(
      /payout_state:\s*"releasable"/.test(source),
      false,
      `${path} ne doit plus écrire « releasable » en dur`
    );
  }
});

check("le confirmateur reçoit le conteneur, pas le service déjà résolu", () => {
  /*
    C'est ce qui rend la règle impossible à contourner : une route ne
    peut plus confirmer sans que le gel soit consulté.
  */
  assert.match(
    read(CONFIRM),
    /export async function confirmDelivery\(\s*scope: Scope,/,
    "le service seul laissait chaque route décider du versement"
  );
});

check("une boutique gelée retient, une boutique saine libère", () => {
  const source = read(HELPER);

  assert.match(
    source,
    /return freeze \? "held" : "releasable";/,
    "la règle doit retenir quand un gel actif existe, et seulement alors"
  );

  assert.match(
    source,
    /\{ seller_id: sellerId, active: true \}/,
    "un gel levé ne doit plus retenir"
  );
});

check("en cas de panne, on retient au lieu de libérer", () => {
  /*
    Le défaut prudent, et il est l'inverse de celui des comptes
    bloqués. Se tromper ici coûte de l'argent qui ne revient pas.
  */
  const source = read(HELPER);

  assert.match(
    source,
    /\} catch \{[\s\S]{0,200}return "held";/,
    "une lecture qui échoue ne doit jamais libérer un versement"
  );
});

check("le gel n'empêche pas d'enregistrer la remise", () => {
  /*
    La livraison est un fait. Si le gel bloquait la confirmation
    elle-même, on perdrait l'information « le colis est arrivé », et
    l'acheteur resterait avec un colis reçu que le site dit en route.
  */
  const source = read(CONFIRM);

  const bloc = source.slice(source.indexOf("status: \"delivered\""));

  assert.match(
    bloc.slice(0, 1500),
    /payout_state: await payoutStateAfterConfirmation/,
    "le statut « delivered » doit être écrit quoi qu'il arrive, et seul le versement dépendre du gel"
  );
});

check("geler reprend les versements DÉJÀ autorisés", () => {
  /*
    Sans cela, geler n'agirait que sur l'avenir — alors que la fraude
    qu'on vient de constater porte sur des livraisons déjà confirmées.
    Le gel n'attraperait rien de ce qui l'a motivé.
  */
  const source = read(ROUTE);

  assert.match(
    source,
    /payout_state: "releasable"[\s\S]{0,400}payout_state: "held"/,
    "les livraisons déjà « à verser » doivent repasser en retenue"
  );
});

check("geler et dégeler exigent tous deux un motif", () => {
  const source = read(ROUTE);

  /* Deux refus distincts : un pour la pose, un pour la levée. */
  const refus = source.match(/return res\.status\(400\)\.json\(\{/g) ?? [];

  assert.ok(
    refus.length >= 2,
    "un gel sans motif ne se défend pas, un dégel sans motif ne s'explique pas"
  );
});

check("un gel levé n'est pas supprimé", () => {
  const source = read(ROUTE);

  assert.match(source, /active: false/, "un gel levé se désactive");

  assert.equal(
    /deletePayoutFreezes/.test(source),
    false,
    "l'effacer rendrait inexplicable un écart de trésorerie constaté après coup"
  );
});

console.log(`\n${passed} vérifications passées.\n`);
