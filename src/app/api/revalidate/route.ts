/*
  ROUTE : invalidation du cache, appelée par le backend commerce.

  Le site met les réponses de Medusa en cache — 60 secondes pour les
  produits, 5 minutes pour les collections. Sans cette route, un vendeur
  qui change un prix voyait l'ancien s'afficher jusqu'à l'expiration du
  délai, sans rien pouvoir y faire.

  Le backend possède déjà le déclencheur : un abonné écoute les
  évènements produit et offre, et appelle ici avec les étiquettes de
  cache concernées. Cette adresse manquait : les appels partaient vers
  une page qui n'existait pas, et l'invalidation n'a jamais eu lieu.

  Qui a le droit d'appeler

  Purger le cache d'un site est une opération que n'importe qui aurait
  pu déclencher en boucle. L'appel porte donc un secret partagé,
  comparé en temps constant : une comparaison ordinaire s'arrête au
  premier caractère différent, ce qui laisse deviner le secret caractère
  par caractère en mesurant le temps de réponse.

  Si le secret n'est pas configuré, la route refuse tout. Elle ne
  bascule pas en accès libre « le temps de la mise en place » : c'est
  précisément ainsi qu'une porte reste ouverte.
*/

import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { timingSafeEqual } from "node:crypto";

export const dynamic = "force-dynamic";

/* Au-delà, ce n'est plus une invalidation ciblée mais un vidage complet. */
const MAX_TAGS = 50;

function secretMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);

  /*
    `timingSafeEqual` exige deux tampons de même longueur. Comparer les
    longueurs d'abord ne révèle que la longueur du secret, ce qui
    n'aide pas à le deviner.
  */
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const expected = process.env.STOREFRONT_REVALIDATE_SECRET || "";

  if (!expected) {
    return NextResponse.json(
      { error: "Invalidation non configurée." },
      { status: 503 }
    );
  }

  const provided = request.headers.get("x-revalidate-secret") || "";

  if (!secretMatches(provided, expected)) {
    return NextResponse.json({ error: "Refusé." }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps illisible." }, { status: 400 });
  }

  const raw = (body as { tags?: unknown })?.tags;

  if (!Array.isArray(raw)) {
    return NextResponse.json(
      { error: "Attendu : { tags: string[] }" },
      { status: 400 }
    );
  }

  /*
    Les étiquettes viennent du backend, donc de l'extérieur. On ne
    revalide que des chaînes courtes et non vides : `revalidateTag`
    accepte n'importe quoi, et une étiquette fabriquée ne ferait rien
    d'utile tout en occupant le serveur.
  */
  const tags = raw
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0 && tag.length <= 200)
    .slice(0, MAX_TAGS);

  for (const tag of tags) {
    revalidateTag(tag);
  }

  return NextResponse.json({ revalidated: tags.length, tags });
}
