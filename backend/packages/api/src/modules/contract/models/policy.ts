import { model } from "@medusajs/framework/utils";

/*
  MODÈLE : un texte public de MACHÉ — confidentialité, conditions
  générales, retours, livraison.

  Pourquoi ce modèle existe

  Ces pages étaient écrites en dur dans le code du site. Changer une
  phrase de la politique de confidentialité demandait un développeur,
  une modification, un déploiement. Autant dire qu'elle ne changeait
  pas — et une politique de confidentialité qui ne suit pas ce que fait
  réellement l'entreprise est un texte faux affiché en permanence.

  Elle vit donc en base, écrite depuis l'administration.

  Pourquoi il est dans le module des contrats

  Parce que c'est la même mécanique, et qu'elle est déjà écrite et
  éprouvée : un texte, une version, une empreinte, un état publié qui
  ne se modifie plus. Un second module recopierait tout cela pour la
  seule raison que le mot « contrat » ne recouvre pas « politique de
  confidentialité » — un argument de vocabulaire contre une duplication
  réelle.

  Ce qui change par rapport à un contrat

  Un contrat s'ADRESSE à quelqu'un et se signe. Un texte public
  s'AFFICHE, et une seule version est en vigueur à la fois : c'est
  `slug` qui désigne la page, et `live` l'état de celle qui s'affiche.

  Publier une version met la précédente en `archived` — sans
  l'effacer. Un client qui a accepté les conditions du mois dernier a
  accepté CE texte-là ; le supprimer rendrait impossible de dire à quoi
  il s'est engagé.
*/
const Policy = model.define("mache_policy", {
  id: model.id({ prefix: "pol" }).primaryKey(),
  display_id: model.autoincrement(),

  /*
    La page visée : « confidentialite », « conditions », « retours »…
    Plusieurs lignes partagent un slug — ce sont ses versions
    successives — et une seule est `live`.
  */
  slug: model.text().index(),

  title: model.text(),
  /* Ce que la page annonce sous son titre. */
  summary: model.text().nullable(),

  body: model.text(),

  version: model.number().default(1),

  /* SHA-256 du texte, calculée à la publication. */
  content_hash: model.text().nullable(),

  status: model.enum(["draft", "live", "archived"]).default("draft"),

  published_at: model.dateTime().nullable(),
  published_by: model.text().nullable(),

  created_by: model.text().nullable(),

  /*
    Une note interne : pourquoi cette version a été écrite. Elle ne
    s'affiche jamais au public.

    Six mois plus tard, « version 4 » ne dit rien à personne. « Ajout
    du paragraphe sur les points de retrait » dit tout, et évite de
    comparer deux textes ligne à ligne pour retrouver ce qui a changé.
  */
  change_note: model.text().nullable(),
});

export default Policy;
