/*
  SCRIPT : ramener en minuscules les adresses déjà enregistrées.

  Pourquoi il existe

  Le backend met désormais en minuscules toute adresse reçue à la
  connexion (voir api/email-case.ts). Un compte enregistré AVANT ce
  correctif avec une majuscule — « Jean@… », créé depuis le panneau
  Mercur ou depuis un téléphone — ne serait alors plus jamais retrouvé :
  on chercherait « jean@… », qui n'existe pas. Le correctif aurait
  enfermé dehors ceux qu'il devait laisser entrer.

  Ce script aligne donc les adresses enregistrées sur la règle. Il
  tourne à chaque démarrage, et ne fait rien quand tout est déjà en
  minuscules — c'est-à-dire presque toujours.

  Ce qu'il ne fait PAS : fusionner

  Si « Jean@… » et « jean@… » existent tous les deux, ce sont deux
  comptes distincts, chacun avec son mot de passe, peut-être ses
  commandes. Décider lequel garder n'est pas un choix qu'un script peut
  faire. Il n'y touche pas, et le signale — sans écrire les adresses
  dans les journaux, qui se consultent et se conservent.

  L'index d'unicité couvre aussi les comptes supprimés : la recherche de
  doublons les inclut, sans quoi une conversion pourrait heurter un
  compte effacé et faire échouer le démarrage.
*/

import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

type Knex = {
  raw: (sql: string) => Promise<{ rows: Array<Record<string, unknown>> }>;
};

/* Une autre identité — même supprimée — porte déjà cette adresse, casse ignorée. */
const HAS_TWIN = `
  EXISTS (
    SELECT 1 FROM provider_identity q
    WHERE q.provider = 'emailpass'
      AND q.id <> p.id
      AND lower(btrim(q.entity_id)) = lower(btrim(p.entity_id))
  )`;

export default async function emailCaseExisting({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const db = container.resolve(ContainerRegistrationKeys.PG_CONNECTION) as Knex;

  const fixed = await db.raw(`
    UPDATE provider_identity p
    SET entity_id = lower(btrim(p.entity_id)), updated_at = now()
    WHERE p.provider = 'emailpass'
      AND p.deleted_at IS NULL
      AND p.entity_id <> lower(btrim(p.entity_id))
      AND NOT ${HAS_TWIN}
    RETURNING p.id
  `);

  const blocked = await db.raw(`
    SELECT count(*)::int AS n FROM provider_identity p
    WHERE p.provider = 'emailpass'
      AND p.deleted_at IS NULL
      AND p.entity_id <> lower(btrim(p.entity_id))
      AND ${HAS_TWIN}
  `);

  const count = fixed.rows.length;
  const twins = Number(blocked.rows[0]?.n ?? 0);

  if (count > 0) {
    logger.info(
      `Adresses de connexion : ${count} compte(s) ramené(s) en minuscules. Ils se connectent désormais quelle que soit la casse saisie.`
    );
  }

  if (twins > 0) {
    logger.warn(
      `Adresses de connexion : ${twins} compte(s) ont un double qui ne diffère que par les majuscules. Ils sont laissés tels quels — deux comptes distincts, à départager à la main.`
    );
  }
}
