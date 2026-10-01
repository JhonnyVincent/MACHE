/*
  L'équipe : un propriétaire qui détient tout, des rôles délégués limités
  à leur espace — côté serveur, pas seulement dans les menus.
*/
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { staffMayCall, staffRole, STAFF_ROLES as BACK_ROLES } from "../backend/packages/api/src/lib/staff.ts";
import { roleMaySee, parseStaffRole, STAFF_ROLES as SITE_ROLES } from "../src/lib/staff.ts";

let passed = 0;
function check(name: string, run: () => void) {
  run();
  passed += 1;
  console.log(`  ✓ ${name}`);
}
const read = (file: string) => readFileSync(file, "utf8");

console.log("\nÉquipe et délégation");

check("sans rôle noté, un compte est propriétaire ; seuls les rôles connus délèguent", () => {
  assert.equal(staffRole({}), "owner");
  assert.equal(staffRole(null), "owner");
  assert.equal(staffRole({ mache_staff_role: "support" }), "support");
  assert.equal(staffRole({ mache_staff_role: "contenu" }), "contenu");
  /* Une valeur inventée ne donne pas un rôle délégué : elle retombe sur le propriétaire (seul un admin écrit ce champ). */
  assert.equal(staffRole({ mache_staff_role: "nimportequoi" }), "owner");
});

check("le propriétaire atteint toutes les routes", () => {
  for (const [method, path] of [["POST", "/admin/mache/team"], ["POST", "/admin/mache/payout-freezes"], ["GET", "/admin/mache/revenue"], ["POST", "/admin/sellers/sel_1/suspend"]]) {
    assert.equal(staffMayCall("owner", method, path), true, path);
  }
});

check("suivi des clients : messages, comptes pro, avis, clients — rien d'autre", () => {
  for (const [method, path] of [["GET", "/admin/mache/messages"], ["POST", "/admin/mache/messages/msg_1"], ["POST", "/admin/mache/pros/cus_1"], ["POST", "/admin/customer-groups/g/customers"], ["POST", "/admin/reviews/r_1"], ["GET", "/admin/customers?q=a"]]) {
    assert.equal(staffMayCall("support", method, path), true, `${method} ${path}`);
  }
  for (const [method, path] of [["GET", "/admin/mache/revenue"], ["POST", "/admin/mache/payout-freezes"], ["POST", "/admin/mache/team"], ["GET", "/admin/mache/team"], ["POST", "/admin/mache/theme"], ["POST", "/admin/sellers/sel_1/suspend"], ["POST", "/admin/mache/seller-invites"], ["POST", "/admin/mache/partners"]]) {
    assert.equal(staffMayCall("support", method, path), false, `${method} ${path}`);
  }
});

check("site et mises à jour : apparence, textes, promotions, partenaires — rien d'autre", () => {
  for (const [method, path] of [["POST", "/admin/mache/theme"], ["POST", "/admin/mache/policies/p_1"], ["POST", "/admin/mache/promotions"], ["POST", "/admin/mache/partners/ptn_1"], ["POST", "/admin/promotions/promo_1"], ["GET", "/admin/mache/apps"]]) {
    assert.equal(staffMayCall("contenu", method, path), true, `${method} ${path}`);
  }
  for (const [method, path] of [["GET", "/admin/mache/messages"], ["POST", "/admin/mache/pros/cus_1"], ["GET", "/admin/mache/revenue"], ["POST", "/admin/mache/team"], ["POST", "/admin/mache/apps"], ["POST", "/admin/customer-groups/g/customers"]]) {
    assert.equal(staffMayCall("contenu", method, path), false, `${method} ${path}`);
  }
});

check("les chiffres de la vue d'ensemble sont en lecture seule pour tous les délégués", () => {
  for (const role of ["support", "contenu"] as const) {
    assert.equal(staffMayCall(role, "GET", "/admin/orders"), true);
    assert.equal(staffMayCall(role, "GET", "/admin/sellers"), true);
    assert.equal(staffMayCall(role, "POST", "/admin/sellers/sel_1/terminate"), false);
    assert.equal(staffMayCall(role, "POST", "/admin/orders/o_1/cancel"), false);
  }
});

check("un préfixe voisin ne passe pas (« /admin/mache/pros-secret »)", () => {
  assert.equal(staffMayCall("support", "GET", "/admin/mache/pros-secret"), false);
  assert.equal(staffMayCall("support", "GET", "/admin/mache/messages/../revenue"), false);
  assert.equal(staffMayCall("support", "GET", "/admin/mache/messages/%2e%2e/revenue"), false);
});

check("les rôles du site et du backend sont les mêmes", () => {
  assert.deepEqual([...SITE_ROLES], [...BACK_ROLES]);
  assert.equal(parseStaffRole({ mache_staff_role: "support" }), "support");
});

check("le menu du site : un délégué ne voit que son espace", () => {
  assert.equal(roleMaySee("owner", "/dashboard/admin/equipe"), true);
  assert.equal(roleMaySee("support", "/dashboard/admin/messages"), true);
  assert.equal(roleMaySee("support", "/dashboard/admin/revenus"), false);
  assert.equal(roleMaySee("support", "/dashboard/admin/equipe"), false);
  assert.equal(roleMaySee("contenu", "/dashboard/admin/partenaires"), true);
  assert.equal(roleMaySee("contenu", "/dashboard/admin/stores"), false);
  assert.equal(roleMaySee("contenu", "/dashboard/admin"), true);
});

check("le garde est branché sur toutes les routes d'administration ; la création d'équipe et l'invitation en dépendent", () => {
  const mw = read("backend/packages/api/src/api/middlewares.ts");
  assert.match(mw, /matcher: "\/admin\/\*"[\s\S]*?staffGuard/);
  const guard = read("backend/packages/api/src/api/staff-guard.ts");
  /* Panne de lecture du compte : refus, pas passage. */
  assert.match(guard, /status\(503\)/);
  assert.match(read("backend/packages/api/src/api/admin/mache/team/[id]/route.ts"), /Le propriétaire ne peut être ni modifié ni retiré/);
  assert.match(read("backend/packages/api/src/api/admin/mache/team/route.ts"), /generateResetPasswordTokenWorkflow/);
  assert.match(read("src/app/dashboard/admin/stores/page.tsx"), /Inviter un vendeur/);
});

console.log(`\n${passed} vérifications réussies.`);
