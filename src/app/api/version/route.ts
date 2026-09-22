/*
  ROUTE : quelle version du site est en ligne.

  Pourquoi elle existe

  Deux fois dans ce projet, une panne a été cherchée dans le code alors
  que le site servait une version antérieure aux correctifs. La première
  fois, treize commits de retard — Render attendait une intégration
  continue qui n'existait pas. La seconde, un message d'erreur identique
  au caractère près après plusieurs correctifs : le signe qu'aucun
  n'était en ligne.

  Chercher un bug dans du code qui ne tourne pas coûte des heures, et
  rien ne l'indique : le site répond, les pages s'affichent, seule la
  correction manque.

  Cette adresse répond à la question en une seconde. Elle ne prouve pas
  qu'un correctif fonctionne — elle prouve seulement quelle version
  tourne, ce qui est la première chose à savoir avant de chercher plus
  loin.

  Ce qu'elle ne dit pas

  Rien de secret : un identifiant de commit public, une date, et le nom
  de l'environnement. Ni variables, ni adresses internes, ni état de la
  base. Cette page est publique, et le restera.
*/

import { NextResponse } from "next/server";

/*
  Lecture statique : Next remplace `process.env.X` par sa valeur au
  moment de la construction uniquement quand la clé est écrite en
  toutes lettres.

  Render injecte RENDER_GIT_COMMIT pendant la construction. Ailleurs,
  les noms usuels des autres hébergeurs sont acceptés, puis une valeur
  qui dit franchement qu'on ne sait pas — plutôt qu'un « inconnu »
  qu'on prendrait pour un identifiant.
*/
const COMMIT =
  process.env.RENDER_GIT_COMMIT ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.GIT_COMMIT ||
  "";

const BRANCH =
  process.env.RENDER_GIT_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || "";

/*
  Figée à la construction : c'est précisément ce qu'on veut savoir —
  quand ce build a été fabriqué, pas quand la page est servie.
*/
const BUILT_AT = new Date().toISOString();

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json({
    commit: COMMIT || null,
    /* Les sept premiers caractères suffisent à comparer avec GitHub. */
    commit_court: COMMIT ? COMMIT.slice(0, 7) : null,
    branche: BRANCH || null,
    construit_le: BUILT_AT,
    /*
      Sans identifiant de commit, la comparaison avec GitHub est
      impossible : on le dit, au lieu de laisser croire que l'absence
      de réponse est une réponse.
    */
    note: COMMIT
      ? "Comparez « commit_court » au dernier commit de la branche sur GitHub."
      : "Cet hébergeur n'a pas fourni d'identifiant de commit à la construction. La date de construction reste comparable.",
  });
}
