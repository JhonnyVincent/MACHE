/*
  ROUTES : un texte public, côté administration.

  BROUILLON — tout se modifie, rien n'est en ligne.
  EN VIGUEUR — c'est la version que les visiteurs lisent. Son texte ne
               bouge plus.
  ARCHIVÉ    — une version remplacée. Conservée, jamais effacée.

  Pourquoi une version en vigueur ne se modifie plus

  Parce qu'un client qui a accepté les conditions le mois dernier a
  accepté CE texte-là. Si on pouvait le récrire sous ses pieds, son
  acceptation porterait sur des clauses qu'il n'a jamais lues — c'est
  la même fraude que pour un contrat, en plus discrète, parce que
  personne ne relit une politique de confidentialité.

  Corriger crée donc une version suivante, en brouillon, qu'on publie
  quand elle est prête. La précédente passe alors en archive et reste
  lisible : c'est à elle qu'on se réfère pour dire à quoi quelqu'un s'est
  engagé à l'époque.

  UNE SEULE VERSION EN VIGUEUR À LA FOIS

  Publier rétrograde la précédente. Sans cette règle, deux versions
  seraient « en vigueur » et la page afficherait celle que le hasard du
  tri ferait remonter — un texte juridique choisi par un ORDER BY.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { CONTRACT_MODULE } from "../../../../../modules/contract";
import { text } from "../../../../delivery-helpers";
import { contentHash } from "../../../../contract-proof";
import { publicPolicy, type PolicyRow } from "../route";

type Service = {
  listPolicies: (filters?: unknown, config?: unknown) => Promise<PolicyRow[]>;
  updatePolicies: (data: Record<string, unknown>) => Promise<PolicyRow>;
};

async function loadPolicy(req: MedusaRequest): Promise<PolicyRow | null> {
  const id = req.params.id;

  if (!id) return null;

  const service = req.scope.resolve(CONTRACT_MODULE) as Service;

  const [policy] = await service.listPolicies({ id }, { take: 1 });

  return policy ?? null;
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const policy = await loadPolicy(req);

  if (!policy) return res.status(404).json({ message: "Texte introuvable." });

  return res.json({ policy: publicPolicy(policy) });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const policy = await loadPolicy(req);

  if (!policy) return res.status(404).json({ message: "Texte introuvable." });

  const body = (req.body ?? {}) as Record<string, unknown>;

  const action = typeof body.action === "string" ? body.action : "edit";

  const service = req.scope.resolve(CONTRACT_MODULE) as Service;

  /* ---------------------------------------------------------------- */
  if (action === "edit") {
    if (policy.status !== "draft") {
      return res.status(409).json({
        message:
          "Ce texte est en vigueur : il ne se modifie plus. Créez une nouvelle version.",
      });
    }

    const patch: Record<string, unknown> = { id: policy.id };

    if (body.title !== undefined) {
      const title = text(body.title, 300);

      if (!title) return res.status(400).json({ message: "Titre manquant." });

      patch.title = title;
    }

    if (body.summary !== undefined) patch.summary = text(body.summary, 500);
    if (body.change_note !== undefined) patch.change_note = text(body.change_note, 500);

    if (body.body !== undefined) {
      const content = typeof body.body === "string" ? body.body.trim() : "";

      if (!content) return res.status(400).json({ message: "Le texte est vide." });

      patch.body = content;
    }

    const updated = await service.updatePolicies(patch);

    return res.json({ policy: publicPolicy(updated) });
  }

  /* ---------------------------------------------------------------- */
  if (action === "publish") {
    if (policy.status !== "draft") {
      return res.status(409).json({ message: "Ce texte n'est pas un brouillon." });
    }

    /*
      La version en vigueur est rétrogradée AVANT que la nouvelle ne
      prenne sa place. Dans l'autre ordre, un incident entre les deux
      écritures laisserait deux versions en vigueur — et la page
      afficherait celle que le tri ferait remonter.

      Dans cet ordre, le pire cas laisse la page sans version en
      vigueur : le site retombe alors sur son texte d'origine, ce qui
      est visible et réparable, plutôt que faux et silencieux.
    */
    const live = await service.listPolicies({ slug: policy.slug, status: "live" });

    for (const previous of live) {
      await service.updatePolicies({ id: previous.id, status: "archived" });
    }

    const updated = await service.updatePolicies({
      id: policy.id,
      status: "live",
      content_hash: contentHash(policy.body),
      published_at: new Date(),
      published_by:
        (req as { auth_context?: { actor_id?: string } }).auth_context?.actor_id ??
        null,
    });

    return res.json({ policy: publicPolicy(updated), replaced: live.length });
  }

  /* ---------------------------------------------------------------- */
  if (action === "new_version") {
    const content = typeof body.body === "string" ? body.body.trim() : "";

    if (!content) return res.status(400).json({ message: "Le nouveau texte est vide." });

    const family = await service.listPolicies({ slug: policy.slug });

    const next = Math.max(...family.map((item) => item.version)) + 1;

    const service2 = req.scope.resolve(CONTRACT_MODULE) as Service & {
      createPolicies: (data: Record<string, unknown>) => Promise<PolicyRow>;
    };

    const created = await service2.createPolicies({
      slug: policy.slug,
      title: text(body.title, 300) ?? policy.title,
      summary: body.summary === undefined ? policy.summary : text(body.summary, 500),
      body: content,
      version: next,
      status: "draft",
      change_note: text(body.change_note, 500),
      created_by:
        (req as { auth_context?: { actor_id?: string } }).auth_context?.actor_id ??
        null,
    });

    return res.status(201).json({ policy: publicPolicy(created) });
  }

  /* ---------------------------------------------------------------- */
  if (action === "archive") {
    /*
      Retirer la version en vigueur laisse la page sans texte publié :
      le site retombe sur celui qui est écrit dans son code. Ce n'est
      pas une panne — c'est un repli prévu — mais ce n'est probablement
      pas ce qu'on voulait, et la réponse le dit.
    */
    const updated = await service.updatePolicies({
      id: policy.id,
      status: "archived",
    });

    return res.json({
      policy: publicPolicy(updated),
      warning:
        policy.status === "live"
          ? "Cette page n'a plus de version publiée : le site affiche à nouveau son texte d'origine."
          : null,
    });
  }

  return res.status(400).json({ message: "Action inconnue." });
}
