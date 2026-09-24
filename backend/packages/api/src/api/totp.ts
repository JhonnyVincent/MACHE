/*
  Les codes à usage unique de l'administration (TOTP, RFC 6238).

  Pourquoi écrits à la main plutôt qu'une bibliothèque

  L'algorithme tient en quarante lignes et ne repose que sur HMAC-SHA1,
  fourni par Node. Ajouter une dépendance pour cela, c'est ajouter au
  chemin critique de l'authentification un paquet qu'on ne relira
  jamais. Ici, tout ce qui décide si quelqu'un entre est sous les yeux.

  Pourquoi une application d'authentification et pas un code par SMS ou
  par e-mail

  D'abord parce que MACHÉ n'a ni fournisseur d'e-mail ni passerelle SMS :
  ce serait impossible aujourd'hui. Mais c'est aussi le meilleur des
  trois — un SMS s'intercepte par détournement de carte SIM, et une
  boîte e-mail compromise donnerait les codes en même temps que le reste.

  Une application génère hors ligne, sans réseau, sans opérateur.

  Les trois décisions qui font la solidité de ce fichier

  1. UNE FENÊTRE ÉTROITE. On accepte le pas courant et un pas de part et
     d'autre — trente secondes de tolérance d'horloge. Élargir rendrait
     valide, pendant plusieurs minutes, un code aperçu par-dessus une
     épaule.

  2. PAS DE REJEU. Un code accepté est noté et ne sera plus accepté.
     Sans cela, un code vu une fois reste utilisable jusqu'à la fin de
     son pas — et c'est exactement la fenêtre dont dispose quelqu'un qui
     regarde l'écran.

  3. DES CODES DE SECOURS. Sans fournisseur d'e-mail, MACHÉ n'a aucun
     moyen de réinitialiser quoi que ce soit : un téléphone perdu
     fermerait l'administration pour toujours. Ils sont stockés HACHÉS —
     une base lue ne doit pas donner de quoi entrer.
*/

import crypto from "crypto";

/* Trente secondes, la valeur qu'attendent toutes les applications. */
const STEP_SECONDS = 30;

/* Six chiffres. */
const DIGITS = 6;

/*
  Un pas de tolérance de chaque côté. Ce nombre est la surface
  d'attaque : à 1 il couvre une horloge décalée d'une demi-minute, ce
  qui est le cas réel ; à 10 il rendrait un code valide cinq minutes.
*/
const WINDOW = 1;

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

export function base32Decode(input: string): Buffer {
  /* On tolère les espaces et le remplissage : un secret se recopie à la main. */
  const clean = input.toUpperCase().replace(/[\s=-]/g, "");

  let bits = 0;
  let value = 0;

  const bytes: number[] = [];

  for (const char of clean) {
    const index = ALPHABET.indexOf(char);

    if (index === -1) {
      throw new Error("Secret invalide.");
    }

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/*
  Vingt octets — la taille recommandée pour HMAC-SHA1, et celle
  qu'attendent les applications d'authentification.
*/
export function newSecret(): string {
  return base32Encode(crypto.randomBytes(20));
}

export function currentStep(at: Date = new Date()): number {
  return Math.floor(at.getTime() / 1000 / STEP_SECONDS);
}

/*
  Le code d'un pas donné. C'est l'algorithme de la RFC, sans variante :
  HMAC-SHA1 du compteur sur huit octets, puis troncature dynamique.
*/
export function codeForStep(secret: string, step: number): string {
  const counter = Buffer.alloc(8);

  counter.writeUInt32BE(Math.floor(step / 2 ** 32), 0);
  counter.writeUInt32BE(step >>> 0, 4);

  const digest = crypto
    .createHmac("sha1", base32Decode(secret))
    .update(counter)
    .digest();

  const offset = digest[digest.length - 1] & 0x0f;

  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  return (binary % 10 ** DIGITS).toString().padStart(DIGITS, "0");
}

export type TotpCheck =
  | { ok: true; step: number }
  | { ok: false; reason: "format" | "invalid" | "replayed" };

/*
  Vérifie un code, et dit POURQUOI il échoue.

  « Déjà utilisé » n'est pas « incorrect » : la première phrase demande
  d'attendre trente secondes, la seconde de vérifier l'heure du
  téléphone. Les confondre ferait ressaisir en boucle un code qui ne
  passera jamais.

  `lastStep` est le dernier pas accepté pour ce compte. Tout pas
  inférieur ou égal est refusé — c'est ce qui interdit le rejeu.
*/
export function verifyTotp(
  secret: string,
  input: unknown,
  lastStep: number | null,
  at: Date = new Date()
): TotpCheck {
  if (typeof input !== "string") return { ok: false, reason: "format" };

  /* Les applications affichent « 123 456 » : on accepte l'espace. */
  const code = input.replace(/\s/g, "");

  if (!/^\d{6}$/.test(code)) return { ok: false, reason: "format" };

  const now = currentStep(at);

  for (let offset = -WINDOW; offset <= WINDOW; offset += 1) {
    const step = now + offset;

    if (step < 0) continue;

    const expected = codeForStep(secret, step);

    /*
      Comparaison à durée constante. Une comparaison ordinaire s'arrête
      au premier chiffre différent, et le temps de réponse laisse
      reconstituer le code chiffre par chiffre.
    */
    const a = Buffer.from(expected);
    const b = Buffer.from(code);

    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) continue;

    if (lastStep !== null && step <= lastStep) {
      return { ok: false, reason: "replayed" };
    }

    return { ok: true, step };
  }

  return { ok: false, reason: "invalid" };
}

/*
  L'adresse que lit une application d'authentification.

  L'émetteur apparaît DEUX fois — dans le chemin et en paramètre — et
  ce n'est pas une redondance : les applications ne lisent pas toutes le
  même. Omettre l'un des deux donne une entrée nommée « MACHÉ » chez les
  uns et par l'adresse e-mail seule chez les autres.
*/
export function otpauthUri(secret: string, account: string, issuer = "MACHE"): string {
  const label = encodeURIComponent(`${issuer}:${account}`);

  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: String(DIGITS),
    period: String(STEP_SECONDS),
  });

  return `otpauth://totp/${label}?${params.toString()}`;
}

/* -------------------------------------------------------------------------- */
/* Codes de secours                                                           */
/* -------------------------------------------------------------------------- */

const RECOVERY_COUNT = 8;

/* Sans O/0/I/1 : ces codes se recopient d'un papier, souvent dans l'urgence. */
const RECOVERY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function newRecoveryCodes(): string[] {
  const codes: string[] = [];

  for (let index = 0; index < RECOVERY_COUNT; index += 1) {
    const bytes = crypto.randomBytes(10);

    let code = "";

    for (const byte of bytes) {
      code += RECOVERY_ALPHABET[byte % RECOVERY_ALPHABET.length];
    }

    /* Coupé en deux moitiés : on ne recopie pas dix caractères d'affilée sans se tromper. */
    codes.push(`${code.slice(0, 5)}-${code.slice(5)}`);
  }

  return codes;
}

/*
  Les codes sont rangés HACHÉS.

  Ils ne sont montrés qu'une fois, au moment où ils sont créés. Les
  garder en clair ferait de la base une liste de clés de
  l'administration ; hachés, elle ne contient que de quoi vérifier.

  SHA-256 sans étirement suffit ici, contrairement à un mot de passe :
  ces codes sont tirés au hasard sur cinquante bits, pas choisis par un
  humain. Il n'y a pas de dictionnaire à leur opposer.
*/
export function hashRecovery(code: string): string {
  const clean = code.toUpperCase().replace(/[\s-]/g, "");

  return crypto.createHash("sha256").update(clean).digest("hex");
}

export function matchRecovery(hashes: string[], input: unknown): string | null {
  if (typeof input !== "string" || !input.trim()) return null;

  const candidate = hashRecovery(input);

  const found = hashes.find((stored) => {
    const a = Buffer.from(stored);
    const b = Buffer.from(candidate);

    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });

  return found ?? null;
}
