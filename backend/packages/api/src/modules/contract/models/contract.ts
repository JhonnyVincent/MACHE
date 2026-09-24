import { model } from "@medusajs/framework/utils";

/*
  MODÈLE : un contrat que MACHÉ propose à ses marchands.

  LA RÈGLE QUI FAIT TOUT TENIR : un contrat publié ne se modifie plus.

  Sans elle, « signé » ne voudrait rien dire. Un administrateur
  pourrait faire signer un texte, puis le récrire — et la signature
  recueillie se retrouverait attachée à des clauses que le marchand
  n'a jamais lues. C'est la fraude la plus simple à commettre avec un
  contrat en ligne, et la plus difficile à prouver après coup.

  Corriger un contrat publié crée donc une VERSION suivante, qui est
  une autre ligne. Les signatures déjà recueillies continuent de
  pointer la version signée, mot pour mot.

  `content_hash` est l'empreinte du texte

  Elle est calculée à la publication et recopiée dans chaque signature.
  Deux empreintes identiques prouvent deux textes identiques ; une
  différence se voit immédiatement. C'est ce qui permet, des années
  plus tard, de démontrer que le document présenté est bien celui qui
  a été signé — sans avoir à se fier à la base de données elle-même.

  Ce que ce modèle n'est pas

  Une signature électronique qualifiée au sens de la loi. Celle-ci
  demande un prestataire certifié qui vérifie l'identité du signataire.
  Ce que MACHÉ enregistre est un consentement horodaté et une preuve
  d'intégrité du texte : suffisant pour un accord commercial ordinaire,
  insuffisant pour ce que la loi réserve à la signature qualifiée.
  Les écrans le disent ; ce commentaire est là pour qu'on ne l'oublie
  pas en les récrivant.
*/
const Contract = model.define("mache_contract", {
  id: model.id({ prefix: "ctr" }).primaryKey(),
  display_id: model.autoincrement(),

  title: model.text(),
  /* À quoi sert ce contrat, en une phrase, pour le marchand. */
  summary: model.text().nullable(),

  /* Le texte intégral. Immuable une fois publié. */
  body: model.text(),

  /*
    La version. Une correction après publication n'écrase rien : elle
    crée la ligne suivante, avec le même `family` et une version de plus.
  */
  version: model.number().default(1),

  /*
    Ce qui relie les versions successives d'un même contrat. La
    première version se le donne à elle-même.
  */
  family: model.text().index(),

  /* SHA-256 du texte, calculée à la publication. */
  content_hash: model.text().nullable(),

  status: model.enum(["draft", "published", "archived"]).default("draft"),

  published_at: model.dateTime().nullable(),
  /* Qui a publié. Un contrat sans auteur n'engage personne. */
  published_by: model.text().nullable(),

  created_by: model.text().nullable(),
});

export default Contract;
