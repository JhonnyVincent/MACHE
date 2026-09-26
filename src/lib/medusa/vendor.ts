/*
  Session vendeur, côté Mercur.

  Le contrat, tel qu'il est réellement — quatre points qu'aucune lecture
  de la documentation Medusa ne donne, et que seul l'essai a révélés :

  1. L'acteur s'appelle « member », pas « seller ». Les routes
     /auth/seller/* existent et répondent 401 quoi qu'on envoie, ce qui
     donne l'illusion d'un mot de passe refusé.
  2. Les routes /vendor/* exigent un en-tête `x-seller-id`. Sans lui,
     réponse 400 « x-seller-id header is required », même avec un jeton
     parfaitement valide. C'est le modèle de Mercur : un membre peut
     appartenir à plusieurs boutiques, il faut donc dire laquelle.
  3. Créer une boutique demande `member_email` ET `currency_code` ;
     l'omission du premier rend une erreur qui ne le nomme qu'en second
     appel.
  4. Une boutique naît au statut `pending_approval`. Elle existe, son
     propriétaire peut la configurer, mais MACHÉ doit l'approuver.

  Périmètre

  Cette session ne sert QUE la vitrine personnalisable, qui est une
  fonctionnalité MACHÉ absente de Mercur. Tout le reste du métier vendeur
  — produits, stock, commandes, versements — se fait dans le panneau
  Mercur, et rien ici ne le double.
*/

import { cookies } from "next/headers";
import { getMedusaConfig } from "./config";
import { toHandle } from "@/lib/handle";
import {
  backendTimeoutSignal,
  isTimeout,
  TIMEOUT_MESSAGE,
} from "./timeout";

const TOKEN_COOKIE = "mache_vendor_token";
const SELLER_COOKIE = "mache_vendor_seller";

export type VendorSeller = {
  id: string;
  name: string;
  handle: string;
  status: string;
  description: string | null;
  logo: string | null;
  banner: string | null;
  metadata: Record<string, unknown> | null;
};

type Raw = Record<string, unknown>;
/*
  `status` porte le code HTTP quand l'échec vient du backend.

  Sans lui, un appelant ne peut pas distinguer « le backend a refusé les
  identifiants » de « le backend n'a pas répondu ». La connexion vendeur
  confondait les deux et annonçait « mot de passe incorrect » à un
  vendeur dont le mot de passe était bon — voir `loginVendor`.

  Absent quand rien n'a été reçu : délai dépassé, réseau coupé,
  configuration manquante.
*/
type Result<T> =
  | { ok: true; data: T }
  | { ok: false; reason: string; status?: number };

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/*
  Ce que le backend répond, dit en français.

  Mercur répond en anglais, et ces phrases remontaient telles quelles
  dans le formulaire : « Seller with name: Bawon Lakwa, already
  exists. » Un commerçant haïtien n'a pas à déchiffrer un message
  d'erreur d'un moteur de commerce pour comprendre qu'un nom est déjà
  pris.

  On ne traduit que ce qu'un vendeur peut rencontrer et corriger
  lui-même. Le reste passe tel quel : une phrase inconnue déformée en
  français approximatif serait pire que l'originale, et empêcherait de
  chercher l'erreur.
*/
function translate(message: string): string {
  const cases: [RegExp, string][] = [
    [
      /Seller with name: (.+), already exists/i,
      "Une boutique porte déjà le nom « $1 ». Choisissez-en un autre.",
    ],
    [
      /Seller with handle: (.+), already exists/i,
      "L'adresse « $1 » est déjà prise. Choisissez-en une autre.",
    ],
    [
      /already exists/i,
      "Ces informations correspondent à une boutique existante.",
    ],
    [
      /You must be authenticated to access seller information/i,
      "Ce compte n'est rattaché à aucune boutique.",
    ],
    [/Unauthorized/i, "Adresse e-mail ou mot de passe incorrect."],
  ];

  for (const [pattern, replacement] of cases) {
    if (!pattern.test(message)) continue;

    /*
      Le message d'origine finit par un point, la traduction aussi : on
      se retrouvait avec « … un autre.. ». On enlève la ponctuation
      restante plutôt que de compter sur la forme exacte du message.
    */
    return message.replace(pattern, replacement).replace(/\.\.+$/, ".");
  }

  return message;
}

async function request<T>(
  path: string,
  init: {
    method?: string;
    body?: unknown;
    token?: string | null;
    sellerId?: string | null;
  } = {}
): Promise<Result<T>> {
  const configured = getMedusaConfig();

  if (!configured.ok) return { ok: false, reason: configured.reason };

  const headers: Record<string, string> = {
    "x-publishable-api-key": configured.config.key,
    "content-type": "application/json",
    accept: "application/json",
  };

  if (init.token) headers.authorization = `Bearer ${init.token}`;
  if (init.sellerId) headers["x-seller-id"] = init.sellerId;

  try {
    const response = await fetch(`${configured.config.url}${path}`, {
      /* Une attente qui ne finit jamais fige l\'écran sans rien dire. */
      signal: backendTimeoutSignal(),
      method: init.method ?? "GET",
      headers,
      body: init.body ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => ({}))) as Raw;

    if (!response.ok) {
      return {
        ok: false,
        reason: str(payload.message)
          ? translate(str(payload.message) as string)
          : `Le backend a répondu ${response.status}.`,
        status: response.status,
      };
    }

    return { ok: true, data: payload as T };
  } catch (error) {
    /*
      Un abandon n\'est pas une panne réseau : il vaut la peine
      d\'être réessayé, et le dire évite de renoncer.
    */
    if (isTimeout(error)) {
      return { ok: false, reason: TIMEOUT_MESSAGE };
    }

    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, reason: `Backend injoignable : ${message}` };
  }
}

async function readSession() {
  const store = await cookies();

  return {
    token: store.get(TOKEN_COOKIE)?.value ?? null,
    sellerId: store.get(SELLER_COOKIE)?.value ?? null,
  };
}

async function writeSession(token: string, sellerId: string) {
  const store = await cookies();

  const options = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  };

  store.set(TOKEN_COOKIE, token, options);
  store.set(SELLER_COOKIE, sellerId, options);
}

export async function clearVendorSession() {
  const store = await cookies();
  store.delete(TOKEN_COOKIE);
  store.delete(SELLER_COOKIE);
}

function mapSeller(raw: Raw): VendorSeller {
  return {
    id: String(raw.id),
    name: str(raw.name) ?? "Boutique",
    handle: str(raw.handle) ?? String(raw.id),
    status: str(raw.status) ?? "pending_approval",
    description: str(raw.description),
    logo: str(raw.logo),
    banner: str(raw.banner),
    metadata:
      raw.metadata && typeof raw.metadata === "object"
        ? (raw.metadata as Record<string, unknown>)
        : null,
  };
}

/*
  Connexion.

  Le vendeur indique sa boutique en plus de ses identifiants. Ce n'est pas
  un oubli d'ergonomie : l'API vendeur de Mercur n'expose aucune route qui
  liste les boutiques d'un membre sans déjà connaître l'identifiant de
  l'une d'elles. `/vendor/sellers/select` ressemble à cette route, mais
  c'est un POST qui SÉLECTIONNE une boutique dont on donne déjà
  l'identifiant — appelé en GET, il est interprété comme
  `/vendor/sellers/:id` et répond « Seller with id: select was not found ».

  La sécurité ne repose pas sur cette saisie. L'adresse publique d'une
  boutique est connue de tous ; ce qui est vérifié, c'est l'appartenance :
  `/vendor/sellers/me` rend 400 ou 401 si le membre connecté n'appartient
  pas à la boutique demandée. C'est le backend qui tranche, pas ce
  formulaire.
*/
/*
  Les boutiques dont ce compte est membre.

  On ne passe plus par l'API publique des boutiques pour retrouver la
  sienne : une boutique en attente d'approbation n'y figure pas, et un
  vendeur qui venait de s'inscrire ne pouvait donc pas se reconnecter —
  « Aucune boutique ne porte l'adresse … », alors qu'elle existait.

  Cette route-ci rend les boutiques du membre authentifié, approuvées ou
  non. C'est le backend qui décide de l'appartenance ; on ne la déduit
  de rien.
*/
async function sellersOfMember(token: string): Promise<Result<VendorSeller[]>> {
  const result = await request<{ seller_members?: Raw[] }>("/vendor/sellers", {
    token,
  });

  if (!result.ok) return result;

  const sellers = (result.data.seller_members ?? [])
    .map((membership) => membership.seller)
    .filter((seller): seller is Raw => Boolean(seller && typeof seller === "object"))
    .map(mapSeller);

  return { ok: true, data: sellers };
}

/*
  Connexion d'un vendeur.

  `storeHandle` ne sert plus qu'à départager quand un compte est membre
  de plusieurs boutiques. Laissé vide avec une seule boutique, on entre
  dans celle-là : demander son adresse à quelqu'un qui n'en a qu'une est
  une question dont on connaît déjà la réponse.
*/
export async function loginVendor(
  email: string,
  password: string,
  storeHandle = ""
): Promise<Result<VendorSeller>> {
  const configured = getMedusaConfig();

  if (!configured.ok) return { ok: false, reason: configured.reason };

  const auth = await request<{ token?: string }>("/auth/member/emailpass", {
    method: "POST",
    body: { email, password },
  });

  if (!auth.ok) {
    /*
      UN REFUS N'EST PAS UNE PANNE, ET L'INVERSE NON PLUS.

      Tout échec était annoncé « mot de passe incorrect ». Un backend
      endormi — ce qui arrive à chaque réveil de l'hébergement, et que
      cette page annonce elle-même sous le bouton — envoyait donc le
      vendeur vérifier un mot de passe qui était bon, puis le changer,
      puis douter de son compte. Signalé par un vendeur qui n'a pas pu
      se reconnecter à une boutique qu'il venait de créer.

      Seul un refus du backend (400 ou 401) parle des identifiants. Un
      500, un délai dépassé, un réseau coupé parlent d'autre chose, et
      le message d'origine dit déjà quoi faire — « réessayez dans une
      minute » plutôt que « votre mot de passe est faux ».
    */
    const refused = auth.status === 401 || auth.status === 400;

    if (refused) {
      /* Pas de distinction e-mail / mot de passe : sinon on énumère les comptes. */
      return { ok: false, reason: "Adresse e-mail ou mot de passe incorrect." };
    }

    return auth;
  }

  const token = str(auth.data.token);

  if (!token) return { ok: false, reason: "Aucun jeton n'a été délivré." };

  const mine = await sellersOfMember(token);

  /*
    Un membre sans aucune boutique reçoit un 401 de Mercur — « You must
    be authenticated » — alors qu'il vient précisément de s'authentifier.
    Le jeton en main, on sait que ce n'est pas un problème
    d'identifiants : c'est qu'il n'a pas de boutique. Laisser passer le
    message d'origine enverrait quelqu'un vérifier son mot de passe
    pendant des heures.
  */
  /*
    Même piège qu'au-dessus, et même remède. Mercur répond 401 à un
    membre sans boutique ; un backend endormi, lui, ne répond pas du
    tout. Les confondre annonçait « vous n'avez aucune boutique » à un
    vendeur qui en a une, ce qui l'envoie en ouvrir une seconde.
  */
  if (!mine.ok && mine.status !== 401) return mine;

  if (!mine.ok || mine.data.length === 0) {
    return {
      ok: false,
      reason:
        "Ce compte n'est rattaché à aucune boutique. Ouvrez-en une, ou demandez à son responsable de vous inviter.",
    };
  }

  /*
    LA MÊME NORMALISATION QU'À L'INSCRIPTION, ET PAS UNE AUTRE.

    L'adresse d'une boutique est calculée par `toHandle` quand elle est
    créée : « Bawon Lakwa » y devient « bawon-lakwa ». Ici, le champ
    saisi n'était que mis en minuscules — « Bawon Lakwa » donnait
    « bawon lakwa », qui ne peut correspondre à rien. Le vendeur lisait
    « ce compte n'est pas membre de la boutique », devant une boutique
    dont il était le seul membre.

    On accepte aussi le NOM de la boutique, normalisé pareil : c'est ce
    qu'un vendeur a en tête, et c'est ce qu'il tape. Lui refuser
    l'entrée parce qu'il a écrit « Bawon Lakwa » au lieu de
    « bawon-lakwa » serait une devinette, pas une vérification.
  */
  const wanted = toHandle(storeHandle);

  const seller = wanted
    ? mine.data.find(
        (entry) =>
          toHandle(entry.handle) === wanted || toHandle(entry.name) === wanted
      )
    : mine.data[0];

  if (!seller) {
    /*
      Le vendeur est authentifié : lui montrer SES boutiques ne révèle
      rien qu'il ne puisse déjà lire dans son espace, et lui évite de
      deviner l'orthographe exacte. Un message qui se contente de
      refuser laisse chercher sans rien pour chercher.
    */
    const owned = mine.data.map((entry) => entry.handle).join(", ");

    return {
      ok: false,
      reason: `Ce compte n'est pas membre de la boutique « ${storeHandle.trim()} ». Il gère : ${owned}. Laissez le champ vide si vous n'avez qu'une boutique.`,
    };
  }

  await writeSession(token, seller.id);

  return { ok: true, data: seller };
}

/*
  Ouvrir une boutique depuis MACHÉ.

  Le parcours passait par le panneau Mercur, servi par le backend : une
  autre application, en anglais, sur une autre adresse. Un commerçant
  qui cliquait « ouvrir ma boutique » sur MACHÉ se retrouvait ailleurs,
  sans comprendre s'il était encore chez MACHÉ.

  Deux appels : le compte de la personne, puis la boutique. La session
  est ouverte dans la foulée — on vient de créer le compte, redemander
  le mot de passe n'apprendrait rien à personne.

  La boutique naît EN ATTENTE D'APPROBATION et n'est pas visible du
  public tant que MACHÉ ne l'a pas approuvée. L'écran le dit : sans
  cela, le vendeur chercherait sa boutique dans le catalogue et la
  croirait perdue.
*/
export async function registerVendor(input: {
  shopName: string;
  handle: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  description: string;
}): Promise<Result<VendorSeller>> {
  const configured = getMedusaConfig();

  if (!configured.ok) return { ok: false, reason: configured.reason };

  const auth = await request<{ token?: string }>(
    "/auth/member/emailpass/register",
    { method: "POST", body: { email: input.email, password: input.password } }
  );

  /*
    Le compte existe déjà : on se connecte avec, plutôt que d'annoncer
    que cette adresse est prise — ce qui révélerait qui a un compte chez
    MACHÉ. Un mot de passe faux échoue ensuite comme il se doit.
  */
  let token = auth.ok ? str(auth.data.token) : null;

  if (!token) {
    const retry = await request<{ token?: string }>("/auth/member/emailpass", {
      method: "POST",
      body: { email: input.email, password: input.password },
    });

    if (!retry.ok) {
      /*
        Encore le même piège, au moment le plus coûteux : une panne
        annonçait à un nouveau vendeur que son adresse était déjà prise.
        Il en essaie une autre, puis une troisième, et finit avec
        plusieurs comptes — ou renonce.
      */
      const refused = retry.status === 401 || retry.status === 400;

      if (!refused) return retry;

      return {
        ok: false,
        reason:
          "Ce compte existe déjà avec un autre mot de passe. Connectez-vous, ou choisissez une autre adresse e-mail.",
      };
    }

    token = str(retry.data.token);
  }

  if (!token) return { ok: false, reason: "Aucun jeton n'a été délivré." };

  const created = await request<{ seller: Raw }>("/vendor/sellers", {
    method: "POST",
    token,
    body: {
      name: input.shopName,
      handle: input.handle,
      email: input.email,
      member_email: input.email,
      first_name: input.firstName || null,
      last_name: input.lastName || null,
      description: input.description || null,
      /*
        MACHÉ vend en gourdes. La devise d'une boutique n'est pas un
        choix d'interface : elle décide dans quelle monnaie ses prix
        sont saisis, et une boutique haïtienne qui afficherait des
        euros n'aurait aucun sens ici.
      */
      currency_code: "htg",
    },
  });

  if (!created.ok) return created;

  const seller = created.data.seller;

  if (!seller) {
    return { ok: false, reason: "La boutique n'a pas été créée." };
  }

  const mapped = mapSeller(seller);

  /*
    LE JETON D'ENREGISTREMENT NE VAUT RIEN UNE FOIS LA BOUTIQUE CRÉÉE.

    `/auth/member/emailpass/register` délivre un jeton dont
    `actor_id` est VIDE : au moment où il est émis, aucun membre
    n'existe encore. Il sert exactement une fois, à créer la boutique,
    et le backend refuse ensuite tout appel `/vendor/*` fait avec lui —
    « You must be authenticated to access seller information. »

    Conservé tel quel, il donnait à chaque nouveau vendeur une session
    morte : l'inscription réussissait, la boutique était bien créée,
    puis son espace l'accueillait comme un visiteur non connecté. On
    concluait que l'inscription avait échoué — alors qu'elle avait
    abouti, et qu'une seconde tentative butait sur une adresse déjà
    prise.

    On se ré-authentifie donc, une fois le membre existant, pour
    obtenir un jeton qui porte son identité.
  */
  const session = await request<{ token?: string }>(
    "/auth/member/emailpass",
    { method: "POST", body: { email: input.email, password: input.password } }
  );

  const sessionToken = session.ok ? str(session.data.token) : null;

  /*
    La boutique est créée : c'est l'essentiel, et on ne le perd pas
    parce que la session a échoué. On renvoie le succès, et le vendeur
    se connectera — plutôt que de lui annoncer un échec devant une
    boutique qui existe.
  */
  if (!sessionToken) {
    await clearVendorSession();

    return { ok: true, data: mapped };
  }

  await writeSession(sessionToken, mapped.id);

  return { ok: true, data: mapped };
}

/* Rend null plutôt qu'une erreur : ne pas être connecté est un état normal. */
export async function getVendorSeller(): Promise<VendorSeller | null> {
  const { token, sellerId } = await readSession();

  if (!token || !sellerId) return null;

  const result = await request<{ seller: Raw }>("/vendor/sellers/me", {
    token,
    sellerId,
  });

  if (!result.ok || !result.data.seller) return null;

  return mapSeller(result.data.seller);
}

/*
  Écriture d'une clé du champ libre du vendeur.

  Le champ `metadata` est partagé : la vitrine y vit, le profil aussi, et
  d'autres écrans pourront s'y ajouter. On relit donc l'existant avant
  d'écrire, et on ne remplace que la clé visée. Envoyer un objet complet
  effacerait en silence ce qu'un autre écran y a rangé.
*/
async function saveSellerMetadata(
  key: string,
  value: unknown
): Promise<Result<VendorSeller>> {
  const { token, sellerId } = await readSession();

  if (!token || !sellerId) {
    return { ok: false, reason: "Session vendeur expirée. Reconnectez-vous." };
  }

  const current = await request<{ seller: Raw }>("/vendor/sellers/me", {
    token,
    sellerId,
  });

  const existing =
    current.ok && current.data.seller?.metadata &&
    typeof current.data.seller.metadata === "object"
      ? (current.data.seller.metadata as Record<string, unknown>)
      : {};

  const result = await request<{ seller: Raw }>("/vendor/sellers/me", {
    method: "POST",
    token,
    sellerId,
    body: { metadata: { ...existing, [key]: value } },
  });

  if (!result.ok) return result;

  return { ok: true, data: mapSeller(result.data.seller) };
}

/*
  Profil déclaré de la boutique : particulier, business, fournisseur,
  marque. C'est le vendeur qui le choisit — et l'affichage public le dit
  comme tel, sans laisser croire à une vérification de MACHÉ.
*/
export async function saveSellerProfile(
  profile: string
): Promise<Result<VendorSeller>> {
  return saveSellerMetadata("profile", profile);
}

/*
  Enregistrement de la vitrine.

  On n'envoie QUE `metadata` : une mise à jour qui renverrait tout l'objet
  écraserait en silence ce que le vendeur vient de changer dans le panneau
  Mercur — son nom, son logo, sa description.
*/
/*
  Commande minimum de la boutique, en gourdes.

  Zéro retire la condition. On l'écrit quand même plutôt que de
  supprimer la clé : une clé absente et une clé à zéro veulent dire la
  même chose à la lecture, et garder la trace explicite évite de se
  demander si le vendeur a choisi ou n'a jamais rien saisi.
*/
export async function saveSellerMinimum(
  amount: number
): Promise<Result<VendorSeller>> {
  return saveSellerMetadata("min_order", Math.max(0, Math.floor(amount)));
}

/*
  Thème de la vitrine. L'identifiant est vérifié par l'appelant contre
  la liste fermée : rien d'autre n'atteint la base.
*/
export async function saveSellerTheme(
  themeId: string
): Promise<Result<VendorSeller>> {
  return saveSellerMetadata("theme", themeId);
}

export async function saveStorefrontLayout(
  layout: unknown
): Promise<Result<VendorSeller>> {
  return saveSellerMetadata("storefront", layout);
}

/* -------------------------------------------------------------------------- */
/* Contrats reçus de MACHÉ                                                    */
/* -------------------------------------------------------------------------- */

export type VendorContract = {
  id: string;
  displayId: number;
  title: string;
  version: number;
  contentHash: string;
  status: "sent" | "viewed" | "signed" | "declined" | "revoked";
  sentAt: string | null;
  viewedAt: string | null;
  signedAt: string | null;
  declinedAt: string | null;
  signerName: string | null;
  signerRole: string | null;
  declineReason: string | null;
  proofHash: string | null;
  dueAt: string | null;
};

function mapContract(raw: Raw): VendorContract {
  return {
    id: String(raw.id),
    displayId: Number(raw.display_id) || 0,
    title: str(raw.contract_title) ?? "Contrat",
    version: Number(raw.contract_version) || 1,
    contentHash: str(raw.content_hash) ?? "",
    status: (str(raw.status) ?? "sent") as VendorContract["status"],
    sentAt: str(raw.sent_at),
    viewedAt: str(raw.viewed_at),
    signedAt: str(raw.signed_at),
    declinedAt: str(raw.declined_at),
    signerName: str(raw.signer_name),
    signerRole: str(raw.signer_role),
    declineReason: str(raw.decline_reason),
    proofHash: str(raw.proof_hash),
    dueAt: str(raw.due_at),
  };
}

export async function getVendorContracts(): Promise<Result<VendorContract[]>> {
  const { token, sellerId } = await readSession();

  if (!token || !sellerId) return { ok: false, reason: "Session expirée." };

  const result = await request<{ contracts?: Raw[] }>("/vendor/contracts", {
    token,
    sellerId,
  });

  if (!result.ok) return result;

  return { ok: true, data: (result.data.contracts ?? []).map(mapContract) };
}

/*
  Le texte intégral, avec son empreinte.

  Le backend refuse de servir le texte si son empreinte ne correspond
  plus à celle figée à l'envoi — il répond alors une erreur, qui remonte
  telle quelle. C'est le cas qu'il ne faut surtout pas masquer : un
  contrat dont le texte a bougé ne doit pas pouvoir être signé, et le
  marchand doit savoir pourquoi.
*/
export async function getVendorContract(
  id: string
): Promise<Result<{ contract: VendorContract; body: string; summary: string | null }>> {
  const { token, sellerId } = await readSession();

  if (!token || !sellerId) return { ok: false, reason: "Session expirée." };

  const result = await request<{
    contract?: Raw;
    body?: string;
    summary?: string | null;
  }>(`/vendor/contracts/${encodeURIComponent(id)}`, { token, sellerId });

  if (!result.ok) return result;

  if (!result.data.contract) {
    return { ok: false, reason: "Contrat introuvable." };
  }

  return {
    ok: true,
    data: {
      contract: mapContract(result.data.contract),
      body: typeof result.data.body === "string" ? result.data.body : "",
      summary: str(result.data.summary),
    },
  };
}

export async function signVendorContract(
  id: string,
  input: { signerName: string; signerRole?: string; signerEmail?: string }
): Promise<Result<VendorContract>> {
  const { token, sellerId } = await readSession();

  if (!token || !sellerId) return { ok: false, reason: "Session expirée." };

  const result = await request<{ contract?: Raw }>(
    `/vendor/contracts/${encodeURIComponent(id)}`,
    {
      method: "POST",
      token,
      sellerId,
      body: {
        action: "sign",
        signer_name: input.signerName,
        signer_role: input.signerRole,
        signer_email: input.signerEmail,
        /*
          La confirmation est envoyée comme un booléen distinct du nom.
          Le backend exige les deux : c'est ce qui fait que signer
          demande deux gestes et non un réflexe.
        */
        agreed: true,
      },
    }
  );

  if (!result.ok) return result;

  return { ok: true, data: mapContract(result.data.contract ?? {}) };
}

export async function declineVendorContract(
  id: string,
  reason: string
): Promise<Result<VendorContract>> {
  const { token, sellerId } = await readSession();

  if (!token || !sellerId) return { ok: false, reason: "Session expirée." };

  const result = await request<{ contract?: Raw }>(
    `/vendor/contracts/${encodeURIComponent(id)}`,
    { method: "POST", token, sellerId, body: { action: "decline", reason } }
  );

  if (!result.ok) return result;

  return { ok: true, data: mapContract(result.data.contract ?? {}) };
}

export const CONTRACT_STATUS: Record<string, string> = {
  sent: "À lire",
  viewed: "Lu, non signé",
  signed: "Signé",
  declined: "Refusé",
  revoked: "Retiré par MACHÉ",
};

/* -------------------------------------------------------------------------- */
/* Les livraisons de la boutique                                              */
/* -------------------------------------------------------------------------- */

/*
  CE QUE CE TYPE NE CONTIENT PAS : LE CODE DE REMISE.

  Le backend ne le donne à personne d'autre qu'à l'acheteur, et c'est
  toute la valeur du dispositif. Si le vendeur pouvait le lire, il
  pourrait confirmer lui-même une livraison qu'il n'a pas faite — et la
  confirmation ne prouverait plus rien du tout.

  Le vendeur SAISIT ce code, il ne le consulte pas. Pour le saisir, il
  doit l'avoir obtenu de l'acheteur, en main propre. C'est là que se
  situe la preuve.
*/
export type VendorDelivery = {
  id: string;
  orderId: string;
  status: string;
  method: string;
  recipientName: string | null;
  recipientPhone: string | null;
  recipientAddress: string | null;
  recipientDepartment: string | null;
  carrierName: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  relayPointId: string | null;
  confirmedBy: string | null;
  confirmedAt: string | null;
  /* Combien d'essais de code restent avant blocage. */
  attemptsLeft: number;
  /*
    L'état du versement : « held » tant que la remise n'est pas
    prouvée, « releasable » une fois le code saisi. C'est la réponse à
    « quand serai-je payé », et elle est mécanique.
  */
  payoutState: string;
  createdAt: string | null;
};

function mapDelivery(raw: Raw): VendorDelivery {
  return {
    id: str(raw.id) ?? "",
    orderId: str(raw.order_id) ?? "",
    status: str(raw.status) ?? "pending",
    method: str(raw.method) ?? "seller",
    recipientName: str(raw.recipient_name),
    recipientPhone: str(raw.recipient_phone),
    recipientAddress: str(raw.recipient_address),
    recipientDepartment: str(raw.recipient_department),
    carrierName: str(raw.carrier_name),
    trackingNumber: str(raw.tracking_number),
    trackingUrl: str(raw.tracking_url),
    relayPointId: str(raw.relay_point_id),
    confirmedBy: str(raw.confirmed_by),
    confirmedAt: str(raw.confirmed_at),
    attemptsLeft: Number(raw.attempts_left) || 0,
    payoutState: str(raw.payout_state) ?? "held",
    createdAt: str(raw.created_at),
  };
}

export async function getVendorDeliveries(): Promise<Result<VendorDelivery[]>> {
  const { token, sellerId } = await readSession();

  if (!token || !sellerId) return { ok: false, reason: "Session expirée." };

  const result = await request<{ deliveries?: Raw[] }>("/vendor/deliveries", {
    token,
    sellerId,
  });

  if (!result.ok) return result;

  return { ok: true, data: (result.data.deliveries ?? []).map(mapDelivery) };
}

/*
  Ouvrir un acheminement.

  Le jeton de suivi revient UNE SEULE FOIS, ici. C'est le lien qu'un
  acheteur sans compte utilisera pour voir où en est son colis — et y
  lire son code. Ne pas le transmettre le laisse sans aucun moyen de
  suivre sa commande ; le backend ne le redonnera pas.
*/
export async function createVendorDelivery(input: {
  orderId: string;
  method: "seller" | "agent" | "relay" | "carrier";
  recipientName?: string | null;
  recipientPhone?: string | null;
  recipientAddress?: string | null;
  recipientDepartment?: string | null;
  relayPointId?: string | null;
  carrierName?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
}): Promise<Result<{ delivery: VendorDelivery; accessToken: string | null }>> {
  const { token, sellerId } = await readSession();

  if (!token || !sellerId) return { ok: false, reason: "Session expirée." };

  const result = await request<{ delivery?: Raw; access_token?: string }>(
    "/vendor/deliveries",
    {
      method: "POST",
      token,
      sellerId,
      body: {
        order_id: input.orderId,
        method: input.method,
        recipient_name: input.recipientName || null,
        recipient_phone: input.recipientPhone || null,
        recipient_address: input.recipientAddress || null,
        recipient_department: input.recipientDepartment || null,
        relay_point_id: input.relayPointId || null,
        carrier_name: input.carrierName || null,
        tracking_number: input.trackingNumber || null,
        tracking_url: input.trackingUrl || null,
      },
    }
  );

  if (!result.ok) return result;

  return {
    ok: true,
    data: {
      delivery: mapDelivery(result.data.delivery ?? {}),
      accessToken: str(result.data.access_token),
    },
  };
}

/*
  Faire avancer un acheminement.

  `delivered` n'est jamais accepté ici : on n'y arrive qu'en saisissant
  le code de l'acheteur. C'est refusé par le backend, et l'écran ne le
  propose pas non plus — pour qu'aucun des deux ne soit le seul rempart.
*/
export async function advanceVendorDelivery(
  id: string,
  status: string
): Promise<Result<VendorDelivery>> {
  const { token, sellerId } = await readSession();

  if (!token || !sellerId) return { ok: false, reason: "Session expirée." };

  const result = await request<{ delivery?: Raw }>(
    `/vendor/deliveries/${encodeURIComponent(id)}`,
    { method: "POST", token, sellerId, body: { status } }
  );

  if (!result.ok) return result;

  return { ok: true, data: mapDelivery(result.data.delivery ?? {}) };
}

/*
  Confirmer la remise avec le code de l'acheteur.

  Chaque essai raté est compté, y compris celui-ci — le backend
  l'incrémente avant de répondre. Cinq essais et la confirmation par
  code est close : un code à six caractères se devine, en quelques
  milliers d'essais, si on laisse essayer indéfiniment.
*/
export async function confirmVendorDelivery(
  id: string,
  code: string,
  note?: string | null
): Promise<Result<VendorDelivery>> {
  const { token, sellerId } = await readSession();

  if (!token || !sellerId) return { ok: false, reason: "Session expirée." };

  const result = await request<{ delivery?: Raw }>(
    `/vendor/deliveries/${encodeURIComponent(id)}/confirm`,
    { method: "POST", token, sellerId, body: { code, note: note || null } }
  );

  if (!result.ok) return result;

  return { ok: true, data: mapDelivery(result.data.delivery ?? {}) };
}

export const DELIVERY_METHOD_LABELS: Record<string, string> = {
  seller: "Livrée par la boutique",
  agent: "Confiée à un agent MACHÉ",
  relay: "Déposée en point de retrait",
  carrier: "Confiée à un transporteur",
};

export const DELIVERY_STATUS_LABELS: Record<string, string> = {
  pending: "Pas encore partie",
  assigned: "Remise à l'agent ou au point",
  in_transit: "En route",
  ready_for_pickup: "À retirer",
  delivered: "Remise, prouvée par code",
  failed: "Échec de remise",
  cancelled: "Annulée",
};

/*
  Les suites possibles, par méthode. La liste vient du backend, qui la
  fait respecter ; la reproduire ici sert à ne pas proposer un bouton
  qui sera refusé — pas à décider à sa place.

  `delivered` n'y figure nulle part, et c'est le point entier du
  dispositif.
*/
export const DELIVERY_NEXT: Record<string, Record<string, string[]>> = {
  seller: {
    pending: ["in_transit", "cancelled"],
    in_transit: ["failed"],
    failed: ["in_transit"],
  },
  agent: {
    pending: ["assigned", "cancelled"],
    assigned: ["in_transit", "failed"],
    in_transit: ["failed"],
    failed: ["in_transit"],
  },
  relay: {
    pending: ["assigned", "cancelled"],
    assigned: ["in_transit", "failed"],
    in_transit: ["ready_for_pickup", "failed"],
    ready_for_pickup: ["failed"],
    failed: ["ready_for_pickup"],
  },
  carrier: {
    pending: ["in_transit", "cancelled"],
    in_transit: ["failed"],
    failed: ["in_transit"],
  },
};

/* Une livraison peut-elle être confirmée par code, maintenant ? */
export function awaitsDeliveryCode(delivery: VendorDelivery): boolean {
  if (delivery.method === "carrier") return false;

  return ["in_transit", "ready_for_pickup", "assigned"].includes(delivery.status);
}

/*
  Les points de retrait ouverts, pour le choix du vendeur.

  La route est publique : un point de retrait est une adresse qu'on
  publie, et le vendeur n'a pas besoin d'un privilège pour savoir où il
  peut déposer un colis. Elle ne rend que les points OUVERTS — proposer
  un point fermé enverrait un client à une porte close.
*/
export type OpenRelayPoint = {
  id: string;
  name: string;
  code: string;
  department: string;
  commune: string | null;
  address: string;
};

export async function getOpenRelayPoints(): Promise<Result<OpenRelayPoint[]>> {
  const result = await request<{ relay_points?: Raw[] }>("/store/relay-points");

  if (!result.ok) return result;

  return {
    ok: true,
    data: (result.data.relay_points ?? []).map((raw) => ({
      id: str(raw.id) ?? "",
      name: str(raw.name) ?? "",
      code: str(raw.code) ?? "",
      department: str(raw.department) ?? "",
      commune: str(raw.commune),
      address: str(raw.address) ?? "",
    })),
  };
}
