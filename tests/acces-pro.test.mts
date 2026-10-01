/*
  TESTS : qui voit les grossistes, et le compte professionnel.

  Ce qu'ils gardent

  1. Un grossiste (profil « fournisseur ») est invisible du public :
     ni ses produits, ni son prix, ni sa vitrine, ni son nom sur
     l'accueil, la carte ou le plan du site.
  2. Seuls un vendeur connecté ou un compte professionnel validé voient
     les grossistes et peuvent demander un devis — et le serveur le
     refuse lui aussi, pas seulement l'écran.
  3. Les marques restent publiques ET figurent dans l'annuaire.
  4. Le compte professionnel : le client DEMANDE, MACHE ACCORDE. Un champ
     libre écrit par le client n'accorde rien.
  5. Une boutique n'apparaît qu'une fois sur une fiche produit.
  6. Le panneau vendeur démarre en français, par une page « Bien démarrer ».

  Lancer : npm run test:acces-pro
*/

import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require_ = createRequire(import.meta.url);
import { readFileSync } from "node:fs";
import {
  PRO_TYPES, parseProRequest, proStatus, readProRequest,
} from "../backend/packages/api/src/lib/pro-buyers.ts";
import { isTradeOnlyProfile } from "../src/lib/trade-access.ts";
import { readSellerProfile } from "../src/lib/seller-profile.ts";

let passed = 0;
function check(name: string, run: () => void) { run(); passed += 1; console.log(`  ✓ ${name}`); }
const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

/* ------------------------------------------------------------------ */
/* Le compte professionnel                                            */
/* ------------------------------------------------------------------ */

const NOW = new Date("2026-10-01T10:00:00.000Z");

const valid = { organisation: "  Hôtel   Le Jacmelien ", type: "hotel", city: "Jacmel", phone: "+509 37 00 00 00", note: "Linge de maison" };

check("une demande valide est nettoyée et horodatée", () => {
  const parsed = parseProRequest(valid, NOW);
  assert.ok(parsed.ok);
  if (parsed.ok) {
    assert.equal(parsed.value.organisation, "Hôtel Le Jacmelien");
    assert.equal(parsed.value.requested_at, NOW.toISOString());
  }
});

check("une demande incomplète est refusée, avec la raison", () => {
  for (const [field, value, message] of [
    ["organisation", "A", /organisation/i],
    ["type", "licorne", /type/i],
    ["city", "", /ville/i],
    ["phone", "12", /téléphone/i],
  ] as const) {
    const parsed = parseProRequest({ ...valid, [field]: value }, NOW);
    assert.ok(!parsed.ok, field);
    if (!parsed.ok) assert.match(parsed.reason, message);
  }
  assert.ok(PRO_TYPES.includes("ecole") && PRO_TYPES.includes("ong"));
});

check("une demande trop longue est tronquée, jamais stockée en entier", () => {
  const parsed = parseProRequest({ ...valid, organisation: "x".repeat(999), note: "y".repeat(5000) }, NOW);
  assert.ok(parsed.ok);
  if (parsed.ok) {
    assert.equal(parsed.value.organisation.length, 120);
    assert.equal(parsed.value.note?.length, 500);
  }
});

const asked = (at = NOW.toISOString()) => ({ mache_pro_request: { organisation: "Hôtel", type: "hotel", city: "Jacmel", phone: "+50937000000", note: null, requested_at: at } });

check("le groupe fait foi : accordé seulement par l'appartenance, jamais par le champ libre", () => {
  assert.equal(proStatus(false, { mache_pro_approved: true, mache_pro_status: "approved", ...asked() }), "pending");
  assert.equal(proStatus(false, { status: "approved" }), "none");
  assert.equal(proStatus(true, null), "approved");
  assert.equal(proStatus(true, asked()), "approved");
});

check("statuts : aucune demande, en attente, refusée, et une nouvelle demande remplace un refus", () => {
  assert.equal(proStatus(false, null), "none");
  assert.equal(proStatus(false, {}), "none");
  assert.equal(proStatus(false, asked()), "pending");
  assert.equal(proStatus(false, { ...asked("2026-10-01T10:00:00.000Z"), mache_pro_refused: { reason: "x", at: "2026-10-02T10:00:00.000Z" } }), "refused");
  assert.equal(proStatus(false, { ...asked("2026-10-03T10:00:00.000Z"), mache_pro_refused: { reason: "x", at: "2026-10-02T10:00:00.000Z" } }), "pending");
});

check("un champ de demande abîmé ne fait pas planter la lecture", () => {
  assert.equal(readProRequest({ mache_pro_request: "n'importe quoi" }), null);
  assert.equal(readProRequest({ mache_pro_request: { organisation: "X", type: "licorne" } }), null);
  assert.equal(readProRequest(undefined), null);
});

/* ------------------------------------------------------------------ */
/* Qui est un grossiste                                               */
/* ------------------------------------------------------------------ */

check("seul le profil « fournisseur » est réservé ; la marque reste publique", () => {
  assert.equal(isTradeOnlyProfile("fournisseur"), true);
  for (const open of ["marque", "vendeur", "business", "particulier", null, undefined, ""]) assert.equal(isTradeOnlyProfile(open as string), false);
  assert.equal(readSellerProfile({ profile: "fournisseur" }), "fournisseur");
});

/* ------------------------------------------------------------------ */
/* Les écrans et les routes                                           */
/* ------------------------------------------------------------------ */

check("le catalogue cache par défaut les produits de grossistes ; seul l'accès vérifié les montre", () => {
  const catalog = read("src/lib/medusa/catalog.ts");
  assert.match(catalog, /if \(!query\.includeWholesale\) \{/);
  assert.match(catalog, /export async function wholesaleOnlyProductIds\(\)/);
  /* Un produit qu'une boutique propose aussi reste public. */
  assert.match(catalog, /const retail = new Set\(fromOthers\.data\);/);
  assert.match(catalog, /fromWholesale\.data\.filter\(\(id\) => !retail\.has\(id\)\)/);
  /* En cas de panne de lecture, rien n'est masqué. */
  assert.match(catalog, /if \(!fromWholesale\.ok \|\| !fromOthers\.ok\) return new Set\(\);/);
  assert.match(read("src/app/shop/page.tsx"), /includeWholesale: access\.allowed/);
  assert.match(read("src/app/store/[slug]/page.tsx"), /includeWholesale: access\.allowed/);
});

check("le filtre « Grossiste » du catalogue n'existe pas pour le public", () => {
  const shop = read("src/app/shop/page.tsx");
  assert.match(shop, /requested && \(access\.allowed \|\| !isTradeOnlyProfile\(requested\)\)/);
  assert.match(shop, /SELLER_PROFILES\.filter\(\(entry\) => access\.allowed \|\| !isTradeOnlyProfile\(entry\.id\)\)/);
});

check("fiche produit : offres de grossistes masquées, prix et paliers masqués, boutique listée une fois", () => {
  const page = read("src/app/product/[slug]/page.tsx");
  assert.match(page, /!access\.allowed && isTradeOnlyProfile\(readSellerProfile\(offer\.sellerMetadata\)\)/);
  assert.match(page, /if \(seenSellers\.has\(offer\.sellerId\)\) return false;/);
  assert.match(page, /\{!tradeOnly && \(\s+<div className="mt-4 flex flex-wrap items-baseline/);
  assert.match(page, /\{!tradeOnly && selected && selected\.tiers\.length > 0 && \(/);
  /* Le bouton « Demander un devis » n'existe que pour qui y a droit. */
  assert.match(page, /\{access\.allowed && \(\s+<Link\s+href=\{`\/devis\/nouveau/);
  /* Rien dans l'aperçu de partage ni dans Google. */
  assert.match(page, /\(await wholesaleOnlyProductIds\(\)\)\.has\(result\.data\.id\)/);
});

check("la vitrine d'un grossiste est une page d'explication pour le public", () => {
  const store = read("src/app/store/[slug]/page.tsx");
  assert.match(store, /!access\.allowed && isTradeOnlyProfile\(readSellerProfile\(seller\.metadata\)\)/);
  assert.match(store, /Ouvrir un compte professionnel/);
});

check("les devis sont refusés par l'écran ET par l'action serveur sans accès", () => {
  assert.match(read("src/app/devis/nouveau/page.tsx"), /if \(!access\.allowed\) \{[\s\S]*Devis réservés aux professionnels/);
  const action = read("src/app/devis/actions.ts");
  assert.match(action, /if \(!\(await getTradeAccess\(\)\)\.allowed\) \{\s+fail\(back, "Les devis sont réservés/);
});

check("l'accès = vendeur connecté ou compte professionnel VALIDÉ, rien d'autre", () => {
  const access = read("src/lib/trade-access.ts");
  assert.match(access, /if \(seller\) \{\s+return \{ allowed: true, as: "vendeur"/);
  assert.match(access, /if \(pro\?\.status === "approved"\) \{\s+return \{ allowed: true, as: "pro"/);
  assert.match(access, /return \{ allowed: false, as: null/);
  /* Une demande en attente ou refusée n'ouvre rien. */
  assert.doesNotMatch(access, /status === "pending"\) \{\s+return \{ allowed: true/);
});

check("les grossistes ne figurent ni sur l'accueil, ni sur la carte, ni sur le plan du site", () => {
  const catalog = read("src/lib/medusa/catalog.ts");
  assert.match(catalog, /readSellerProfile\(seller\.metadata\) !== "fournisseur"/);
  for (const file of ["src/lib/medusa/home.ts", "src/app/haiti/page.tsx", "src/app/sitemap.ts", "src/app/about/page.tsx"]) {
    assert.match(read(file), /fetchPublicSellers\(/, file);
    assert.doesNotMatch(read(file), /\bfetchSellers\(/, file);
  }
  /* L'annuaire, lui, lit la liste complète. */
  assert.match(read("src/app/gros/page.tsx"), /fetchSellers\(200\)/);
});

check("l'annuaire montre grossistes ET marques, et explique l'accès aux autres", () => {
  const page = read("src/app/gros/page.tsx");
  assert.match(page, /const SUPPLIER_PROFILES: SellerProfile\[\] = \["fournisseur", "marque"\];/);
  assert.match(page, /if \(!access\.allowed\) \{/);
  assert.match(page, /Vous vendez sur MACHE/);
  assert.match(page, /Ouvrir un compte professionnel/);
  /* Un refus ou une attente se lisent sur la page. */
  assert.match(page, /Votre demande est en cours d&apos;examen/);
});

check("le serveur ne laisse un client s'accorder rien : l'accord passe par l'administration", () => {
  const client = read("backend/packages/api/src/api/store/pro/route.ts");
  assert.match(client, /export async function GET/);
  assert.match(client, /export async function POST/);
  assert.doesNotMatch(client, /addCustomerToGroup/);
  assert.match(client, /if \(await isProBuyer\(req\.scope, me\)\) \{\s+return res\.status\(409\)/);
  assert.match(client, /Connectez-vous à votre compte\./);

  const admin = read("backend/packages/api/src/api/admin/mache/pros/[id]/route.ts");
  assert.match(admin, /addCustomerToGroup\(pair\)/);
  assert.match(admin, /removeCustomerFromGroup\(pair\)/);
  /* Un refus exige un motif, qui part au client. */
  assert.match(admin, /if \(reason\.length < 3\) return res\.status\(400\)/);
  /* Retirer laisse une trace : sinon l'ancienne demande le remettrait en attente. */
  assert.match(admin, /Compte professionnel retiré par MACHE/);
});

check("le groupe des acheteurs professionnels est créé au démarrage", () => {
  assert.match(read("backend/packages/api/src/api/agent-identity.ts"), /export const PRO_MARKER = "mache_pro_buyer";/);
  const groups = read("backend/packages/api/src/scripts/agent-groups.ts");
  assert.match(groups, /const hasPro = rows\.some/);
  assert.match(groups, /\[PRO_MARKER\]: true/);
});

check("l'administration a son écran, et le client sa page", () => {
  assert.match(read("src/app/dashboard/admin/layout.tsx"), /Comptes professionnels", href: "\/dashboard\/admin\/pros"/);
  const page = read("src/app/dashboard/admin/pros/page.tsx");
  assert.match(page, /À décider/);
  assert.match(page, /placeholder="Motif du refus \(envoyé au client\)"/);
  assert.match(read("src/app/compte/pro/page.tsx"), /if \(!customer\) redirect\("\/compte\/connexion\?next=\/compte\/pro"\);/);
  assert.match(read("src/app/compte/pro/actions.ts"), /requestProAccount\(/);
});

check("les marques : visibles du public ET proposées aux revendeurs, dit dans la définition", () => {
  const profiles = read("src/lib/seller-profile.ts");
  assert.match(profiles, /Crée un produit et le confie à des revendeurs ; elle peut aussi le vendre elle-même\./);
  assert.doesNotMatch(profiles, /sans intermédiaire/);
  assert.match(read("src/app/sell/marque-officielle/page.tsx"), /Visible des revendeurs/);
});

check("panneau vendeur : en français d'office, menu simplifié, annuaire des fournisseurs", () => {
  const html = read("backend/apps/vendor/index.html");
  assert.match(html, /<html lang="fr">/);
  assert.match(html, /window\.localStorage\.setItem\("lng", "fr"\)/);
  /* Un choix déjà fait (cookie ou stockage) n'est jamais écrasé. */
  assert.match(html, /!\/\(\^\|;\\s\*\)lng=\/\.test\(document\.cookie\) && !window\.localStorage\.getItem\("lng"\)/);
  /* Bascule unique vers le français, même si l'anglais était déjà retenu ; ensuite le choix de l'utilisateur prime. */
  assert.match(html, /mache\.lng\.fr/);
  const nav = read("backend/apps/vendor/src/_navigation.ts");
  /* Le menu complet est gardé : rien n'est masqué. */
  assert.doesNotMatch(nav, /hidden: true/);
  assert.match(nav, /label: "Avis"/);
  assert.match(read("backend/apps/vendor/src/routes/bien-demarrer/page.tsx"), /rank: 0,/);
  /* L'accueil vendeur est composé de blocs que le vendeur affiche, masque et range. */
  const home = read("backend/apps/vendor/src/routes/bien-demarrer/page.tsx");
  for (const block of ["premiers-pas", "demandes", "ventes", "grossiste", "boutique", "pub", "avis"]) assert.match(home, new RegExp(`id: "${block}"`), block);
  assert.match(home, /Personnaliser mon accueil/);
  assert.match(home, /localStorage\.setItem\(STORAGE_KEY/);
  /* Visite guidée : s'ouvre une fois, se passe d'un clic, se relance à la demande. */
  assert.match(home, /Passer la visite/);
  assert.match(home, /localStorage\.setItem\(TOUR_KEY/);
  assert.match(home, /Visite guidée/);
  /* La publicité n'existe pas encore : le bloc ne promet rien. */
  assert.match(home, /ne sont pas encore ouverts/);
  /* Applications : par vendeur, honnêtes (« intéressé » tant que l'outil n'est pas là). */
  const apps = read("backend/apps/vendor/src/routes/applications/page.tsx");
  assert.match(apps, /label: "Applications"/);
  for (const id of ["shopify", "woocommerce", "alibaba", "aliexpress"]) assert.match(apps, new RegExp(`id: "${id}"`), id);
  assert.doesNotMatch(apps, /live: true,/);
  assert.match(apps, /Je suis intéressé/);
  assert.match(apps, /metadata: \{ \.\.\.metadata, apps: next \}/);
  assert.match(read("backend/packages/api/src/api/admin/mache/apps/route.ts"), /\.sort\(\(a, b\) => b\.count - a\.count\)/);
  assert.match(read("backend/apps/vendor/src/routes/fournisseurs/page.tsx"), /\/vendor\/suppliers/);
  const route = read("backend/packages/api/src/api/vendor/suppliers/route.ts");
  assert.match(route, /seller\.id !== me && seller\.status === "open"/);
  assert.match(route, /SUPPLIER_PROFILES = \["fournisseur", "marque"\]/);
});

check("panneau vendeur : les phrases que Mercur laisse en anglais sont traduites", () => {
  const fr = JSON.parse(read("backend/apps/vendor/src/i18n/fr.json"));
  assert.match(fr.promotions.list.noRecords.title, /Aucune promotion/);
  assert.match(fr.priceLists.list.noRecords.message, /Créez/);
  assert.match(fr.inventory.list.noRecordsTitle, /Aucun/);
  assert.match(fr.app.menus.store.editStore, /Modifier la boutique/);
  assert.match(read("backend/apps/vendor/src/i18n/index.ts"), /fr: \{\s+translation: fr/);
});

check("« MACHE Boutik » est un nom interne : il n'apparaît jamais dans un texte affiché", () => {
  const { execSync } = require_("node:child_process");
  const found = execSync(`grep -rln "Boutik" src backend/packages/api/src backend/apps/vendor/src backend/apps/vendor/index.html backend/apps/admin/index.html || true`, { encoding: "utf8" })
    .split("\n").filter(Boolean).filter((file) => !file.endsWith("src/lib/spaces.ts"));
  assert.deepEqual(found, []);
});

check("accueil vendeur : vendeur, grossiste et marque ne voient pas la même chose", () => {
  const home = read("backend/apps/vendor/src/routes/bien-demarrer/page.tsx");
  for (const text of ["Vous êtes vendeur", "Vous êtes grossiste", "Vous êtes une marque"]) assert.match(home, new RegExp(text), text);
  assert.match(home, /gros: "fournisseur", marque: "marque"/);
  assert.match(home, /\["demandes", "gros"\]/);
  assert.match(home, /particulier" \|\| raw === "business"/);
  /* Le suivi des revendeurs d'une marque est lu dans les offres (route /vendor/resellers). */
  assert.match(home, /\/vendor\/resellers/);
  assert.match(home, /Aucun revendeur ne propose encore vos produits/);
});

check("marque : ses revendeurs sont lus dans les offres, et portent le tag « Revendeur de @Marque »", () => {
  const route = read("backend/packages/api/src/api/vendor/resellers/route.ts");
  assert.match(route, /entity: "offer"/);
  assert.match(route, /filters: \{ product_id: productIds \}/);
  assert.match(route, /seller === me/);
  assert.match(route, /seller\.status === "open"/);
  const page = read("src/app/product/[slug]/page.tsx");
  assert.match(page, /=== "marque"\);/);
  assert.match(page, /Revendeur de @\{brandOffer\.sellerName\}/);
  assert.match(page, /brandOffer\.sellerId !== offer\.sellerId/);
});

check("profil de partenaire : champs facultatifs, jamais de promesse de MACHE", () => {
  const page = read("src/app/partenaires/[slug]/page.tsx");
  for (const field of ["partner.logo", "partner.banner", "partner.whatsapp", "partner.phone", "partner.facebook", "partner.instagram", "partner.location"]) {
    assert.match(page, new RegExp(`${field.replace(".", "\\.")} &&|${field.replace(".", "\\.")} \\?`), field);
  }
  assert.match(page, /entreprise indépendante/);
  assert.match(page, /ne garantit rien/);
  assert.match(read("src/lib/partners.ts"), /slug: "bawon"/);
  assert.match(read("src/app/partenaires/page.tsx"), /Voir le profil/);
});

console.log(`\n${passed} vérifications réussies.`);
