/*
  L'adresse d'une boutique dans une URL.

  Elle se déduit du nom que le commerçant donne à sa boutique, et vit
  ensuite dans « /store/… » : elle doit donc tenir dans une adresse web,
  sans accent ni espace, et rester lisible — c'est ce qu'un vendeur
  écrira sur sa devanture ou enverra par message.

  Elle est calculée côté serveur, jamais reprise telle quelle du
  formulaire : une adresse est un identifiant public, et sa forme n'est
  pas laissée au navigateur.
*/
export function toHandle(value: string): string {
  return value
    .normalize("NFD")
    /* Retire les signes diacritiques : « Épicerie » devient « epicerie ». */
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
