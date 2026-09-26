/*
  UNE ADRESSE E-MAIL NE DÉPEND PAS DES MAJUSCULES.

  Ce que ce fichier corrige

  « Mot de passe incorrect », avec le bon mot de passe.

  Medusa retrouve un compte en comparant l'adresse saisie à l'adresse
  enregistrée, caractère pour caractère — et la base compare les
  majuscules. Or MACHÉ enregistre toujours ses adresses en minuscules,
  tandis que le panneau vendeur de Mercur envoie l'adresse telle qu'elle
  a été tapée. Un téléphone met une majuscule à la première lettre d'un
  champ : « Jean@… » ne retrouvait plus « jean@… », et le vendeur, sûr
  de son mot de passe, concluait que son compte était cassé.

  Où c'est corrigé, et pourquoi là

  Sur le backend, pour TOUTES les routes d'authentification : connexion,
  inscription, demande de nouveau mot de passe. Pas dans chaque
  formulaire : le site de MACHÉ n'est pas le seul client — il y a les
  deux panneaux Mercur, que MACHÉ ne peut pas modifier, et quiconque
  appelle l'API directement. Corriger un formulaire aurait laissé les
  autres chemins cassés.

  Les deux noms du champ

  `email` pour se connecter et s'inscrire, `identifier` pour demander un
  nouveau mot de passe. Oublier le second, c'était laisser la
  récupération de mot de passe échouer en silence — elle répond
  toujours « envoyé », même quand l'adresse ne correspond à personne.

  Les comptes déjà enregistrés avec une majuscule sont ramenés en
  minuscules au démarrage : voir scripts/email-case-existing.ts. Sans
  cela, ce correctif les aurait, eux, rendus inaccessibles.
*/

import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";

const FIELDS = ["email", "identifier"] as const;

export function normalizeEmail(value: unknown): unknown {
  return typeof value === "string" ? value.trim().toLowerCase() : value;
}

export function normalizeAuthEmail(
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) {
  const body = req.body as Record<string, unknown> | undefined;

  if (body && typeof body === "object") {
    for (const field of FIELDS) {
      if (field in body) body[field] = normalizeEmail(body[field]);
    }
  }

  next();
}
