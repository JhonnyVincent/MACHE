/*
  CE QUI FAIT D'UN CLIENT UN AGENT, ET CE QUI LE SUSPEND.

  Deux étiquettes, et rien d'autre. Elles vivent ici parce que trois
  fichiers en dépendent — la résolution de l'agent connecté, la
  vérification publique par code, et le script qui crée les groupes — et
  que les loger dans l'un d'eux obligerait les deux autres à importer
  une route ou un point d'entrée pour lire une constante. L'un des deux
  sens créait en plus un cycle.

  POURQUOI DES GROUPES ET PAS LE CHAMP LIBRE DU CLIENT

  Parce qu'un client écrit son propre champ libre : c'est là que vivent
  ses favoris, et la route publique de Medusa accepte n'importe quelle
  clé — vérifié dans son validateur, qui déclare
  `metadata: z.record(z.string(), z.unknown())`.

  L'habilitation suivait déjà cette règle. Sa SUSPENSION, non : elle
  vivait dans le champ libre. Un agent suspendu n'avait donc qu'à
  s'écrire « non suspendu » pour recommencer à confirmer des
  livraisons, et pour que la page de vérification — celle qu'on
  consulte avant de remettre de l'argent liquide à un inconnu — le
  déclare de nouveau digne de confiance.

  POURQUOI DES ÉTIQUETTES ET PAS LES NOMS DES GROUPES

  Un nom se renomme depuis le panneau d'administration. La
  vérification s'arrêterait alors de fonctionner sans que personne ne
  fasse le lien.
*/

/* Les groupes qui désignent un agent, et la fonction que chacun porte. */
export const AGENT_GROUPS: Record<string, string> = {
  "mache-point-relais": "Point de relais",
  "mache-livreur": "Livreur",
  "mache-commercial": "Commercial",
};

/*
  L'étiquette du groupe « agents suspendus ».

  Un agent suspendu RESTE dans son groupe de fonction : la vérification
  publique doit répondre « connu MAIS suspendu », et non « inconnu » —
  qui se lit comme une faute de frappe et pousse à réessayer, alors que
  la bonne réponse est « ne lui remettez rien ».
*/
export const SUSPENDED_MARKER = "mache_agent_suspended";
