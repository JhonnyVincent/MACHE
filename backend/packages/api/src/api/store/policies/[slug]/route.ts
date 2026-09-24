/*
  ROUTE PUBLIQUE : le texte en vigueur d'une page légale.

  Elle rend la version `live`, ou rien.

  Pourquoi « ou rien » plutôt qu'une erreur

  Parce que l'absence de texte publié est un état NORMAL : tant que
  personne n'a écrit la politique de confidentialité depuis
  l'administration, le site affiche celle qui est dans son code. Répondre
  404 ferait traiter ce cas comme une panne, et la page finirait par
  afficher un message d'erreur au lieu d'un texte parfaitement valable.

  Le storefront lit donc : version publiée s'il y en a une, texte
  d'origine sinon. Une page légale ne doit jamais être vide.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { CONTRACT_MODULE } from "../../../../modules/contract";
import { isPolicySlug } from "../../../policy-pages";

type PolicyRow = {
  slug: string;
  title: string;
  summary: string | null;
  body: string;
  version: number;
  content_hash: string | null;
  published_at: string | Date | null;
};

type Service = {
  listPolicies: (filters?: unknown, config?: unknown) => Promise<PolicyRow[]>;
};

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const slug = req.params.slug;

  if (!isPolicySlug(slug)) {
    return res.json({ policy: null });
  }

  const service = req.scope.resolve(CONTRACT_MODULE) as Service;

  const live = await service.listPolicies(
    { slug, status: "live" },
    { take: 1, order: { version: "DESC" } }
  );

  const policy = live[0];

  if (!policy) return res.json({ policy: null });

  return res.json({
    policy: {
      slug: policy.slug,
      title: policy.title,
      summary: policy.summary,
      body: policy.body,
      version: policy.version,
      /*
        L'empreinte est publique : un visiteur — ou une autorité — peut
        vérifier que le texte affiché est bien celui qui a été publié.
      */
      content_hash: policy.content_hash,
      published_at: policy.published_at,
    },
  });
}
