/*
  Configuration de l'accès au backend commerce.

  Le storefront ne parle qu'à Medusa pour tout ce qui touche au commerce.
  Trois valeurs suffisent, et elles sont lues ici une seule fois :

  - l'URL du backend ;
  - la clé publiable, qui identifie le canal de vente. Elle est publique
    par conception : elle ne donne accès qu'aux données de boutique déjà
    visibles de tous, et n'autorise aucune écriture privilégiée ;
  - la région, dont dépendent la devise et le calcul des prix. Medusa
    refuse de calculer un prix sans elle — c'est volontaire de sa part, et
    c'est pourquoi elle est traitée ici comme une donnée de configuration
    et non comme un détail.

  Aucune de ces valeurs n'est devinée. Quand il en manque une, les pages
  affichent un état honnête plutôt qu'une erreur ou un catalogue vide qui
  ferait croire à une marketplace sans vendeurs.
*/

/*
  Lectures statiques et non calculées : Next remplace `process.env.X` par
  sa valeur au build uniquement quand l'expression est écrite en toutes
  lettres. Une lecture dynamique renverrait undefined dans le navigateur.
*/
export function medusaBackendUrl() {
  return (
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
    process.env.MEDUSA_BACKEND_URL ||
    ""
  ).replace(/\/+$/, "");
}

export function medusaPublishableKey() {
  return process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";
}

export function medusaRegionId() {
  return process.env.NEXT_PUBLIC_MEDUSA_REGION_ID || "";
}

export type MedusaConfig = {
  url: string;
  key: string;
  regionId: string;
};

/*
  Renvoie la configuration, ou la raison précise de son absence.

  Un seul message générique — « configuration manquante » — obligerait à
  fouiller les variables une par une. Celui-ci nomme ce qui manque.
*/
export function getMedusaConfig():
  | { ok: true; config: MedusaConfig }
  | { ok: false; reason: string } {
  const url = medusaBackendUrl();
  const key = medusaPublishableKey();
  const regionId = medusaRegionId();

  const missing: string[] = [];

  if (!url) missing.push("NEXT_PUBLIC_MEDUSA_BACKEND_URL");
  if (!key) missing.push("NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY");

  if (missing.length > 0) {
    return {
      ok: false,
      reason: `Backend commerce non configuré : ${missing.join(", ")} absente(s).`,
    };
  }

  return { ok: true, config: { url, key, regionId } };
}

export function isMedusaConfigured() {
  return getMedusaConfig().ok;
}
