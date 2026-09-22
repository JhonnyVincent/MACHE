/*
  Les profils de vendeur.

  MACHÉ présente quatre façons de vendre, chacune avec sa page :
  particulier, business, fournisseur, marque officielle. Jusqu'ici
  c'était du discours : les quatre pages menaient au même endroit, et
  rien dans le système ne savait à quel profil appartenait une boutique.
  Un acheteur ne pouvait donc pas distinguer un artisan d'un grossiste.

  Où c'est rangé

  Dans `seller.metadata.profile`, que le vendeur renseigne lui-même
  depuis son espace.

  Ce que le profil est, et ce qu'il n'est pas

  C'est une DÉCLARATION du vendeur, pas un contrôle de MACHÉ. Le champ
  `metadata` d'un vendeur est écrit par le vendeur : tout ce qui s'y
  trouve vient de lui. Un profil affiché dit donc « ce vendeur se
  présente comme un grossiste », et l'interface ne doit pas laisser
  entendre autre chose.

  C'est pourquoi il n'y a pas ici de « vérifié ». Un badge de
  vérification qui se poserait soi-même ne vérifie rien — il ne ferait
  que donner l'apparence d'un contrôle à quelqu'un qui l'a réclamée.
  La vérification est une décision de MACHÉ, elle vit ailleurs, dans un
  champ que le vendeur ne peut pas écrire.
*/

export type SellerProfile =
  | "particulier"
  | "business"
  | "fournisseur"
  | "marque";

export type SellerProfileInfo = {
  id: SellerProfile;
  /* Ce que le vendeur choisit dans son espace. */
  label: string;
  /* Ce qu'un acheteur lit sur la boutique, en une ligne. */
  badge: string;
  /* Ce que cela lui dit, concrètement. */
  meaning: string;
  /* La page qui présente ce profil aux futurs vendeurs. */
  sellPage: string;
  /*
    Vrai quand la boutique vend d'abord à d'autres entreprises : la
    fiche produit met alors en avant les prix par quantité plutôt que le
    prix à l'unité.
  */
  wholesale: boolean;
};

export const SELLER_PROFILES: SellerProfileInfo[] = [
  {
    id: "particulier",
    label: "Particulier",
    badge: "Vendeur particulier",
    meaning:
      "Une personne qui vend ses propres articles, en petite quantité.",
    sellPage: "/sell/particulier",
    wholesale: false,
  },
  {
    id: "business",
    label: "Business / Boutique",
    badge: "Boutique",
    meaning:
      "Un commerce déclaré, avec un catalogue suivi et des horaires.",
    sellPage: "/sell/business",
    wholesale: false,
  },
  {
    id: "fournisseur",
    label: "Fournisseur / Grossiste",
    badge: "Grossiste",
    meaning:
      "Vend en gros, avec des prix qui baissent selon la quantité commandée.",
    sellPage: "/sell/fournisseur",
    wholesale: true,
  },
  {
    id: "marque",
    label: "Marque officielle",
    badge: "Marque",
    meaning:
      "La marque vend elle-même ses produits, sans intermédiaire.",
    sellPage: "/sell/marque-officielle",
    wholesale: false,
  },
];

export function profileInfo(id: SellerProfile): SellerProfileInfo {
  /*
    Le tableau contient les quatre identifiants du type : la recherche
    aboutit toujours. Le repli existe pour les données venues de la base,
    qui ne passent pas par le typage.
  */
  return SELLER_PROFILES.find((entry) => entry.id === id) ?? SELLER_PROFILES[0];
}

/*
  Lecture du profil déclaré par une boutique.

  Renvoie null plutôt qu'un profil par défaut : une boutique qui n'a
  rien déclaré n'est pas « un particulier ». Afficher un profil qu'on a
  choisi à sa place, c'est faire dire à un vendeur ce qu'il n'a pas dit.
*/
export function readSellerProfile(
  metadata: Record<string, unknown> | null | undefined
): SellerProfile | null {
  const raw = (metadata ?? {})["profile"];

  if (typeof raw !== "string") return null;

  const match = SELLER_PROFILES.find((entry) => entry.id === raw.trim());

  return match ? match.id : null;
}

export function isSellerProfile(value: unknown): value is SellerProfile {
  return (
    typeof value === "string" &&
    SELLER_PROFILES.some((entry) => entry.id === value)
  );
}

/*
  Les profils qui vendent en gros.

  Le champ `wholesale` existait depuis la création de ce fichier sans
  être lu nulle part : il décrivait une intention — « cette boutique
  vend d'abord à d'autres entreprises » — que rien n'exploitait. Une
  déclaration qu'aucun écran ne lit ne sert à personne, ni à
  l'acheteur qui cherche un grossiste, ni au vendeur qui s'est
  déclaré comme tel.

  Il sert maintenant à répondre à la question : qui vend en gros ?
*/
export function isWholesaleProfile(profile: SellerProfile | null): boolean {
  if (!profile) return false;

  return profileInfo(profile).wholesale;
}
