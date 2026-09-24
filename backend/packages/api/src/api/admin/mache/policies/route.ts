/*
  ROUTES : les textes publics du site, côté administration.

  GET liste, POST crée un brouillon.

  Ces textes étaient écrits en dur dans le code : changer une phrase de
  la politique de confidentialité demandait un développeur et un
  déploiement. Autant dire qu'elle ne changeait pas — et une politique
  de confidentialité qui ne suit pas ce que fait réellement
  l'entreprise est un texte faux affiché en permanence.

  Un texte naît brouillon, comme un contrat, et pour la même raison :
  publier fige son contenu, et c'est la dernière occasion de se relire.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { CONTRACT_MODULE } from "../../../../modules/contract";
import { text } from "../../../delivery-helpers";
import { POLICY_PAGES, POLICY_SLUGS, isPolicySlug } from "../../../policy-pages";

const MAX_BODY = 200_000;

export type PolicyRow = {
  id: string;
  display_id: number;
  slug: string;
  title: string;
  summary: string | null;
  body: string;
  version: number;
  content_hash: string | null;
  status: string;
  published_at: string | Date | null;
  published_by: string | null;
  change_note: string | null;
  created_at: string | Date;
  updated_at: string | Date;
};

type Service = {
  listPolicies: (filters?: unknown, config?: unknown) => Promise<PolicyRow[]>;
  createPolicies: (data: Record<string, unknown>) => Promise<PolicyRow>;
};

export function publicPolicy(policy: PolicyRow) {
  return {
    id: policy.id,
    display_id: policy.display_id,
    slug: policy.slug,
    title: policy.title,
    summary: policy.summary,
    body: policy.body,
    version: policy.version,
    content_hash: policy.content_hash,
    status: policy.status,
    published_at: policy.published_at,
    change_note: policy.change_note,
    created_at: policy.created_at,
    updated_at: policy.updated_at,
  };
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(CONTRACT_MODULE) as Service;

  const slug = typeof req.query.slug === "string" ? req.query.slug : null;

  const policies = await service.listPolicies(
    slug ? { slug } : {},
    { order: { slug: "ASC", version: "DESC" }, take: 500 }
  );

  return res.json({
    policies: policies.map(publicPolicy),
    /*
      Le catalogue des pages voyage avec la réponse. L'écran n'a donc
      pas à tenir sa propre liste — deux listes finiraient par diverger,
      et l'administration proposerait une page qui n'existe plus.
    */
    pages: POLICY_SLUGS.map((key) => ({
      slug: key,
      label: POLICY_PAGES[key].label,
      path: POLICY_PAGES[key].path,
      hint: POLICY_PAGES[key].hint,
    })),
  });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body ?? {}) as Record<string, unknown>;

  if (!isPolicySlug(body.slug)) {
    return res.status(400).json({
      message: `Page inconnue. Les pages gérables sont : ${POLICY_SLUGS.join(", ")}.`,
    });
  }

  const title = text(body.title, 300);
  const content = typeof body.body === "string" ? body.body.trim() : "";

  if (!title) return res.status(400).json({ message: "Titre manquant." });

  if (!content) return res.status(400).json({ message: "Le texte est vide." });

  if (content.length > MAX_BODY) {
    return res.status(400).json({ message: "Ce texte dépasse la taille acceptée." });
  }

  const service = req.scope.resolve(CONTRACT_MODULE) as Service;

  /*
    La version suivante se calcule sur la page entière : deux brouillons
    créés le même jour porteraient sinon le même numéro, et l'historique
    deviendrait illisible.
  */
  const existing = await service.listPolicies({ slug: body.slug });

  const next =
    existing.length === 0
      ? 1
      : Math.max(...existing.map((item) => item.version)) + 1;

  const created = await service.createPolicies({
    slug: body.slug,
    title,
    summary: text(body.summary, 500),
    body: content,
    version: next,
    status: "draft",
    change_note: text(body.change_note, 500),
    created_by:
      (req as { auth_context?: { actor_id?: string } }).auth_context?.actor_id ?? null,
  });

  return res.status(201).json({ policy: publicPolicy(created) });
}
