/*
  Les textes publics gérés depuis l'administration.

  LE PRINCIPE QUI GOUVERNE CE FICHIER : une page légale n'est jamais vide.

  Trois situations, un seul comportement visible :

  - une version est publiée → elle s'affiche ;
  - aucune n'est publiée → le texte écrit dans le code s'affiche ;
  - le backend ne répond pas → le texte écrit dans le code s'affiche.

  Les deux derniers cas sont traités pareil, et c'est délibéré. Une page
  de conditions générales qui afficherait « service indisponible » est
  pire qu'inutile : c'est la page qu'on consulte justement quand
  quelque chose ne va pas, et un visiteur qui y trouve une erreur
  conclut que l'entreprise n'a pas de conditions.

  Le texte d'origine reste donc dans le code, comme filet. Il n'est pas
  du code mort : c'est ce qui s'affiche tant que personne n'a rien
  publié, et c'est vrai aujourd'hui.
*/

import { medusaFetch } from "./client";

export type PublishedPolicy = {
  slug: string;
  title: string;
  summary: string | null;
  body: string;
  version: number;
  contentHash: string | null;
  publishedAt: string | null;
};

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/*
  `null` veut dire « affiche le texte d'origine ». C'est la réponse
  aussi bien quand rien n'est publié que quand la lecture échoue :
  l'appelant n'a qu'un cas à traiter, et ne peut donc pas oublier le
  second.

  L'échec n'est pas tu pour autant — il part au journal du serveur par
  `medusaFetch`. Ce qui est silencieux, c'est l'écran, pas la trace.
*/
export async function fetchPolicy(slug: string): Promise<PublishedPolicy | null> {
  const result = await medusaFetch<{ policy?: Record<string, unknown> | null }>(
    `/store/policies/${encodeURIComponent(slug)}`,
    {},
    /*
      Dix minutes. Ces textes changent quelques fois par an ; les relire
      à chaque affichage coûterait un aller-retour au backend sur chaque
      page légale, y compris celles qu'un robot d'indexation parcourt en
      boucle.
    */
    { revalidate: 600, tags: ["policies", `policy-${slug}`] }
  );

  if (!result.ok || !result.data.policy) return null;

  const policy = result.data.policy;

  const body = str(policy.body);

  /* Une version publiée sans texte ne vaut pas mieux que pas de version. */
  if (!body) return null;

  return {
    slug: str(policy.slug) ?? slug,
    title: str(policy.title) ?? "",
    summary: str(policy.summary),
    body,
    version: Number(policy.version) || 1,
    contentHash: str(policy.content_hash),
    publishedAt: str(policy.published_at),
  };
}

export type PolicyBlock =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string };

/*
  Le texte saisi en administration, découpé en blocs.

  Une seule convention : une ligne commençant par « ## » est un titre.
  Le reste est du texte, les lignes vides séparent les paragraphes.

  Pourquoi pas du Markdown complet

  Parce qu'il faudrait alors interpréter du balisage — liens, images,
  HTML brut — écrit dans un champ d'administration et affiché à tous
  les visiteurs. Une convention d'une seule ligne n'a rien à
  interpréter : chaque bloc reste du TEXTE, que React échappe comme
  tel. Il n'y a aucun chemin par lequel une balise saisie ici
  deviendrait une balise dans la page.
*/
export function parsePolicyBody(body: string): PolicyBlock[] {
  const blocks: PolicyBlock[] = [];

  /* Les fins de ligne Windows donneraient des paragraphes fantômes. */
  const lines = body.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

  let buffer: string[] = [];

  const flush = () => {
    const text = buffer.join(" ").trim();

    if (text) blocks.push({ kind: "paragraph", text });

    buffer = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("##")) {
      flush();

      const heading = trimmed.replace(/^#+/, "").trim();

      if (heading) blocks.push({ kind: "heading", text: heading });

      continue;
    }

    if (!trimmed) {
      flush();
      continue;
    }

    buffer.push(trimmed);
  }

  flush();

  return blocks;
}
