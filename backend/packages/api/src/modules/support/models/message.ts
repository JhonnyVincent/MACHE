import { model } from "@medusajs/framework/utils";

/*
  MODÈLE : un message dans une conversation.

  `author` dit de quel côté il vient, et rien d'autre ne le dit. Le nom
  affiché est recopié ici : un client qui change de nom plus tard ne
  doit pas réécrire rétroactivement qui a dit quoi dans un échange
  passé.

  Ce modèle ne connaît pas de « brouillon » ni de « modification ». Un
  message envoyé reste tel quel. Une messagerie dont on peut récrire
  les tours passés ne sert plus à établir ce qui a été dit — et c'est
  souvent pour cela qu'on la relit.
*/
const ThreadMessage = model.define("mache_thread_message", {
  id: model.id({ prefix: "thm" }).primaryKey(),

  thread_id: model.text().index(),

  /* « sender » = la personne qui a écrit à MACHÉ. « mache » = nous. */
  author: model.enum(["sender", "mache"]),

  /* Recopié au moment de l'envoi, pour que l'échange reste lisible. */
  author_name: model.text(),

  body: model.text(),

  /*
    Un message interne n'est jamais rendu au demandeur. Il sert à noter
    ce qu'on a vérifié, ou à passer le dossier à quelqu'un d'autre.
    Le filtrage se fait dans les routes publiques, jamais ici.
  */
  internal: model.boolean().default(false),
});

export default ThreadMessage;
