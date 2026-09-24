/*
  ROUTES : le second facteur de l'administration.

  Ce que ce compte commande

  L'approbation des boutiques, le chiffre d'affaires, l'apparence du
  site pour tous les visiteurs. Jusqu'ici, un mot de passe.

  Où vit le secret

  Dans le champ libre de l'utilisateur Medusa. Il n'en sort jamais,
  SAUF une fois : à l'inscription, le temps que l'application
  d'authentification le lise. Ensuite, aucune route ne le rend.

  L'inscription en deux temps, et pourquoi elle n'en fait pas qu'un

  On crée un secret EN ATTENTE, puis on exige un code valide avant de
  l'activer. Activer d'emblée enfermerait dehors quiconque aurait mal
  recopié le secret — et sans fournisseur d'e-mail, MACHÉ n'aurait aucun
  moyen de le faire rentrer.

  Les codes de secours ont la même raison d'être : un téléphone perdu
  ne doit pas fermer l'administration pour toujours. Ils sont rendus une
  seule fois, en clair, puis rangés hachés.

  LA LIMITE, ÉCRITE ICI POUR QU'ELLE NE SE PERDE PAS

  Ce second facteur protège les écrans MACHÉ. Il ne protège PAS le
  panneau Medusa servi par le backend, ni un appel direct à son API :
  ceux-là acceptent toujours le jeton délivré par le mot de passe seul.
  Le faire tiendrait à modifier l'émission du jeton dans le module
  d'authentification de Medusa, ce qui déborde très largement d'ici.
  Le dire est le minimum ; l'écran de réglage le répète à l'utilisateur.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import {
  newSecret,
  verifyTotp,
  otpauthUri,
  newRecoveryCodes,
  hashRecovery,
  matchRecovery,
} from "../../../totp";

export const FIELDS = {
  pending: "mache_totp_pending",
  secret: "mache_totp_secret",
  lastStep: "mache_totp_last_step",
  recovery: "mache_totp_recovery",
  failures: "mache_totp_failures",
} as const;

/*
  Dix échecs et le second facteur se verrouille.

  Un code à six chiffres se devine une fois sur un million ; répété sans
  limite, il se devine. Le compteur retombe à zéro dès qu'un code juste
  passe — ce n'est pas le compte qui se bloque sur une faute de frappe,
  c'est une série d'échecs qui s'arrête.
*/
const MAX_FAILURES = 10;

type UserRow = { id: string; email?: string; metadata?: Record<string, unknown> };

function actorId(req: MedusaRequest): string | null {
  return (req as { auth_context?: { actor_id?: string } }).auth_context?.actor_id ?? null;
}

async function currentUser(req: MedusaRequest): Promise<UserRow | null> {
  const id = actorId(req);

  if (!id) return null;

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { data: users } = await query.graph({
    entity: "user",
    fields: ["id", "email", "metadata"],
    filters: { id },
  });

  return ((users ?? [])[0] as UserRow) ?? null;
}

async function patchMetadata(
  req: MedusaRequest,
  user: UserRow,
  patch: Record<string, unknown>
) {
  /*
    Le service est pris avec son vrai type. Le coiffer d'une interface
    écrite à la main ne ferait que masquer un décalage éventuel : le
    jour où la signature change, on veut que la compilation le dise.
  */
  const service = req.scope.resolve(Modules.USER);

  /*
    Le champ libre est fusionné, pas remplacé : il peut porter d'autres
    réglages, et les perdre en activant une sécurité serait un comble.
  */
  await service.updateUsers({
    id: user.id,
    metadata: { ...(user.metadata ?? {}), ...patch },
  });
}

function num(value: unknown): number | null {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

/* L'état, sans jamais rendre le secret. */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const user = await currentUser(req);

  if (!user) return res.status(401).json({ message: "Session invalide." });

  const metadata = user.metadata ?? {};

  return res.json({
    enabled: typeof metadata[FIELDS.secret] === "string",
    pending: typeof metadata[FIELDS.pending] === "string",
    recovery_left: strings(metadata[FIELDS.recovery]).length,
    locked: (num(metadata[FIELDS.failures]) ?? 0) >= MAX_FAILURES,
    /*
      La limite voyage avec l'état, pour que l'écran n'ait pas à la
      connaître de son côté — et ne puisse donc pas cesser de l'afficher
      par distraction.
    */
    scope_note:
      "Ce code protège les écrans MACHÉ. Le panneau d'administration servi par le backend reste accessible avec le mot de passe seul.",
  });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const user = await currentUser(req);

  if (!user) return res.status(401).json({ message: "Session invalide." });

  const body = (req.body ?? {}) as { action?: unknown; code?: unknown; recovery?: unknown };

  const action = typeof body.action === "string" ? body.action : "";

  const metadata = user.metadata ?? {};

  const secret = typeof metadata[FIELDS.secret] === "string" ? (metadata[FIELDS.secret] as string) : null;
  const pending = typeof metadata[FIELDS.pending] === "string" ? (metadata[FIELDS.pending] as string) : null;
  const lastStep = num(metadata[FIELDS.lastStep]);
  const failures = num(metadata[FIELDS.failures]) ?? 0;

  /* ---------------------------------------------------------------- */
  if (action === "start") {
    if (secret) {
      return res.status(409).json({
        message: "Un second facteur est déjà actif. Désactivez-le d'abord.",
      });
    }

    const fresh = newSecret();

    await patchMetadata(req, user, { [FIELDS.pending]: fresh });

    /*
      Le seul endroit du système où le secret sort. Il faut bien que
      l'application puisse le lire.
    */
    return res.json({
      secret: fresh,
      uri: otpauthUri(fresh, user.email ?? "MACHÉ"),
    });
  }

  /* ---------------------------------------------------------------- */
  if (action === "confirm") {
    if (!pending) {
      return res.status(409).json({
        message: "Aucune inscription en cours. Recommencez.",
      });
    }

    const check = verifyTotp(pending, body.code, null);

    if (!check.ok) {
      return res.status(400).json({
        message:
          check.reason === "format"
            ? "Le code fait six chiffres."
            : "Ce code ne correspond pas. Vérifiez l'heure de votre téléphone.",
      });
    }

    const codes = newRecoveryCodes();

    await patchMetadata(req, user, {
      [FIELDS.secret]: pending,
      [FIELDS.pending]: null,
      [FIELDS.lastStep]: check.step,
      [FIELDS.recovery]: codes.map(hashRecovery),
      [FIELDS.failures]: 0,
    });

    /*
      Les codes de secours, en clair, une seule fois. Ils sont rangés
      hachés : personne — pas même cette route au prochain appel — ne
      pourra les relire.
    */
    return res.json({ enabled: true, recovery_codes: codes });
  }

  /* ---------------------------------------------------------------- */
  if (action === "verify") {
    if (!secret) {
      return res.status(409).json({ message: "Aucun second facteur actif." });
    }

    if (failures >= MAX_FAILURES) {
      return res.status(429).json({
        message:
          "Trop de codes erronés. Utilisez un code de secours pour débloquer ce compte.",
      });
    }

    /* Un code de secours est accepté à la place du code de l'application. */
    if (body.recovery) {
      const hashes = strings(metadata[FIELDS.recovery]);

      const used = matchRecovery(hashes, body.recovery);

      if (!used) {
        await patchMetadata(req, user, { [FIELDS.failures]: failures + 1 });

        return res.status(400).json({ message: "Ce code de secours n'est pas valable." });
      }

      /*
        À usage unique : il est retiré de la liste. Un code de secours
        réutilisable serait un second mot de passe, écrit sur un papier.
      */
      await patchMetadata(req, user, {
        [FIELDS.recovery]: hashes.filter((hash) => hash !== used),
        [FIELDS.failures]: 0,
      });

      return res.json({ verified: true, used: "recovery", recovery_left: hashes.length - 1 });
    }

    const check = verifyTotp(secret, body.code, lastStep);

    if (!check.ok) {
      /*
        Un rejeu ne compte pas comme un échec : c'est le bon code, saisi
        deux fois. Le compter rapprocherait du verrouillage quelqu'un
        qui a seulement rechargé la page.
      */
      if (check.reason !== "replayed") {
        await patchMetadata(req, user, { [FIELDS.failures]: failures + 1 });
      }

      return res.status(400).json({
        message:
          check.reason === "format"
            ? "Le code fait six chiffres."
            : check.reason === "replayed"
              ? "Ce code a déjà servi. Attendez celui d'après."
              : "Code incorrect.",
        attempts_left: Math.max(0, MAX_FAILURES - failures - 1),
      });
    }

    /* Le pas est noté : ce code ne repassera plus. */
    await patchMetadata(req, user, {
      [FIELDS.lastStep]: check.step,
      [FIELDS.failures]: 0,
    });

    return res.json({ verified: true, used: "totp" });
  }

  /* ---------------------------------------------------------------- */
  if (action === "disable") {
    if (!secret) {
      return res.status(409).json({ message: "Aucun second facteur actif." });
    }

    /*
      On exige un code pour désactiver. Sans cela, quelqu'un qui aurait
      le mot de passe — exactement ce contre quoi ce facteur protège —
      n'aurait qu'à le couper.
    */
    const check = verifyTotp(secret, body.code, lastStep);

    const recovered = check.ok
      ? null
      : matchRecovery(strings(metadata[FIELDS.recovery]), body.recovery);

    if (!check.ok && !recovered) {
      return res.status(400).json({
        message: "Saisissez un code valide, ou un code de secours, pour désactiver.",
      });
    }

    await patchMetadata(req, user, {
      [FIELDS.secret]: null,
      [FIELDS.pending]: null,
      [FIELDS.lastStep]: null,
      [FIELDS.recovery]: [],
      [FIELDS.failures]: 0,
    });

    return res.json({ enabled: false });
  }

  return res.status(400).json({ message: "Action inconnue." });
}
