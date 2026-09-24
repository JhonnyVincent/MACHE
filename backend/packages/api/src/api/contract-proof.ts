/*
  Les empreintes qui donnent leur valeur aux contrats.

  Le problème qu'elles résolvent

  « Ce marchand a signé le contrat n° 4 » ne prouve rien : le contrat
  n° 4 a pu changer depuis. Il faut pouvoir dire « ce marchand a signé
  un texte dont l'empreinte est celle-ci », et recalculer cette
  empreinte des années plus tard sur le document qu'on présente.

  Si les deux valeurs coïncident, c'est bien ce texte-là. Si elles
  diffèrent, le document a été modifié — et on le sait, même si la base
  de données affirme le contraire.

  Pourquoi SHA-256 sans étirement

  Ce n'est pas un mot de passe. Il n'y a pas de secret à protéger, pas
  de dictionnaire à opposer : on veut seulement qu'il soit impossible
  de fabriquer un second texte ayant la même empreinte. C'est
  exactement ce que SHA-256 garantit.

  La normalisation, et ses limites

  On normalise les fins de ligne avant de hacher. Sans cela, le même
  contrat recopié depuis Windows et depuis un Mac donnerait deux
  empreintes différentes, et une vérification honnête échouerait pour
  une raison qui n'a rien à voir avec le contenu.

  On ne normalise RIEN d'autre. Pas les espaces, pas la casse, pas la
  ponctuation : « le vendeur paie 8 % » et « Le Vendeur paie 8% » sont
  deux textes différents, et un contrat doit les distinguer.
*/

import crypto from "crypto";

export function normalizeBody(body: string): string {
  /* Fins de ligne uniformes, et rien de plus. */
  return body.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

export function contentHash(body: string): string {
  return crypto
    .createHash("sha256")
    .update(normalizeBody(body), "utf8")
    .digest("hex");
}

export type ProofFacts = {
  contract_id: string;
  contract_version: number;
  content_hash: string;
  seller_id: string;
  signer_name: string;
  signer_role: string | null;
  signer_email: string | null;
  signed_at: string;
  signer_ip: string | null;
};

/*
  L'empreinte de l'ensemble des faits de la signature.

  Les clés sont TRIÉES avant d'être sérialisées. Sans ce tri,
  l'empreinte dépendrait de l'ordre dans lequel JavaScript énumère un
  objet — c'est-à-dire de détails d'implémentation — et une
  vérification pourtant honnête échouerait sans qu'on comprenne
  pourquoi.

  Ce qu'elle apporte en plus de `content_hash` : elle scelle aussi QUI,
  QUAND et D'OÙ. Modifier après coup l'heure de signature en base ne
  recalculerait pas cette valeur, et l'écart se verrait.
*/
export function proofHash(facts: ProofFacts): string {
  const ordered: Record<string, unknown> = {};

  for (const key of Object.keys(facts).sort()) {
    ordered[key] = (facts as Record<string, unknown>)[key];
  }

  return crypto
    .createHash("sha256")
    .update(JSON.stringify(ordered), "utf8")
    .digest("hex");
}

export type ProofCheck = {
  /* Le texte présenté est-il celui qui a été signé ? */
  body_matches: boolean;
  /* Les faits enregistrés sont-ils ceux qui ont été scellés ? */
  facts_match: boolean;
  expected_content_hash: string;
  recomputed_proof_hash: string;
};

/*
  La vérification, telle qu'on la ferait devant un tiers.

  Elle sépare les deux questions, et c'est important : un texte qui ne
  correspond pas et des faits altérés ne racontent pas la même
  histoire. La première dit que le document présenté n'est pas celui
  qui fut signé ; la seconde, que la base a été retouchée.
*/
export function verifyProof(
  presentedBody: string,
  stored: { content_hash: string; proof_hash: string | null },
  facts: ProofFacts
): ProofCheck {
  const recomputedContent = contentHash(presentedBody);
  const recomputedProof = proofHash(facts);

  return {
    body_matches: recomputedContent === stored.content_hash,
    /*
      Une signature sans `proof_hash` — un enregistrement antérieur à
      ce scellement — n'est pas déclarée valide par défaut. Répondre
      « vrai » faute de mieux ferait passer l'absence de preuve pour une
      preuve.
    */
    facts_match: stored.proof_hash !== null && stored.proof_hash === recomputedProof,
    expected_content_hash: recomputedContent,
    recomputed_proof_hash: recomputedProof,
  };
}

/*
  L'adresse d'où est venue la signature.

  Derrière un répartiteur de charge — c'est le cas sur Render —
  l'adresse de la connexion est celle du répartiteur, la même pour
  tout le monde. La vraie adresse est en tête `x-forwarded-for`, dont
  on prend la PREMIÈRE valeur : les suivantes sont les relais
  traversés.

  À ne pas confondre avec une identification. Une adresse IP désigne
  une connexion à un instant, pas une personne — elle vaut comme indice
  concordant, jamais comme preuve d'identité.
*/
export function clientIp(headers: Record<string, unknown>): string | null {
  const forwarded = headers["x-forwarded-for"];

  const raw =
    typeof forwarded === "string"
      ? forwarded
      : Array.isArray(forwarded)
        ? String(forwarded[0] ?? "")
        : "";

  const first = raw.split(",")[0]?.trim();

  if (first) return first.slice(0, 64);

  const real = headers["x-real-ip"];

  return typeof real === "string" && real.trim() ? real.trim().slice(0, 64) : null;
}
