/*
  ROUTES : un contrat, côté administration.

  Ce qu'on peut en faire dépend entièrement de son état, et c'est le
  cœur du module.

  BROUILLON : tout se modifie, rien n'est envoyé.

  PUBLIÉ : plus rien ne se modifie. Jamais. Corriger crée la VERSION
  suivante, une autre ligne, avec sa propre empreinte. Les signatures
  déjà recueillies continuent de pointer la version signée.

  Pourquoi cette rigidité

  Parce que la fraude la plus simple avec un contrat en ligne consiste
  à faire signer un texte puis à le récrire. Si le texte publié restait
  modifiable, aucune des signatures recueillies ne vaudrait quoi que ce
  soit — et personne ne pourrait démontrer le contraire.

  ARCHIVÉ : n'est plus proposé, mais rien n'est effacé. Supprimer un
  contrat rendrait illisibles les signatures qui le visent.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { CONTRACT_MODULE } from "../../../../../modules/contract";
import { text } from "../../../../delivery-helpers";
import { contentHash } from "../../../../contract-proof";
import { adminId, publicContract, type ContractRow } from "../route";

type Service = {
  listContracts: (filters?: unknown, config?: unknown) => Promise<ContractRow[]>;
  createContracts: (data: Record<string, unknown>) => Promise<ContractRow>;
  updateContracts: (data: Record<string, unknown>) => Promise<ContractRow>;
};

export async function loadContract(req: MedusaRequest): Promise<ContractRow | null> {
  const id = req.params.id;

  if (!id) return null;

  const service = req.scope.resolve(CONTRACT_MODULE) as Service;

  const [contract] = await service.listContracts({ id }, { take: 1 });

  return contract ?? null;
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const contract = await loadContract(req);

  if (!contract) return res.status(404).json({ message: "Contrat introuvable." });

  return res.json({ contract: publicContract(contract) });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const contract = await loadContract(req);

  if (!contract) return res.status(404).json({ message: "Contrat introuvable." });

  const body = (req.body ?? {}) as Record<string, unknown>;

  const action = typeof body.action === "string" ? body.action : "edit";

  const service = req.scope.resolve(CONTRACT_MODULE) as Service;

  /* ---------------------------------------------------------------- */
  if (action === "edit") {
    if (contract.status !== "draft") {
      return res.status(409).json({
        message:
          "Ce contrat est publié : son texte ne peut plus changer. Créez-en une nouvelle version.",
      });
    }

    const patch: Record<string, unknown> = { id: contract.id };

    if (body.title !== undefined) {
      const title = text(body.title, 300);

      if (!title) return res.status(400).json({ message: "Titre manquant." });

      patch.title = title;
    }

    if (body.summary !== undefined) patch.summary = text(body.summary, 500);

    if (body.body !== undefined) {
      const content = typeof body.body === "string" ? body.body.trim() : "";

      if (!content) return res.status(400).json({ message: "Le contrat est vide." });

      patch.body = content;
    }

    const updated = await service.updateContracts(patch);

    return res.json({ contract: publicContract(updated) });
  }

  /* ---------------------------------------------------------------- */
  if (action === "publish") {
    if (contract.status !== "draft") {
      return res.status(409).json({ message: "Ce contrat n'est pas un brouillon." });
    }

    /*
      L'empreinte est calculée ICI, une fois, sur le texte définitif.
      La recalculer à chaque lecture reviendrait à suivre le texte
      s'il changeait — c'est-à-dire à ne rien prouver du tout.
    */
    const updated = await service.updateContracts({
      id: contract.id,
      status: "published",
      content_hash: contentHash(contract.body),
      published_at: new Date(),
      published_by: adminId(req),
    });

    return res.json({ contract: publicContract(updated) });
  }

  /* ---------------------------------------------------------------- */
  if (action === "new_version") {
    if (contract.status === "draft") {
      return res.status(409).json({
        message: "Ce contrat est encore un brouillon : modifiez-le directement.",
      });
    }

    const content = typeof body.body === "string" ? body.body.trim() : "";

    if (!content) return res.status(400).json({ message: "Le nouveau texte est vide." });

    /*
      La version suivante se calcule sur la famille entière, pas sur
      cette ligne : deux versions créées depuis la même ligne porteraient
      sinon le même numéro.
    */
    const family = await service.listContracts({ family: contract.family });

    const next = Math.max(...family.map((item) => item.version)) + 1;

    const created = await service.createContracts({
      title: text(body.title, 300) ?? contract.title,
      summary: body.summary === undefined ? contract.summary : text(body.summary, 500),
      body: content,
      version: next,
      family: contract.family,
      status: "draft",
      created_by: adminId(req),
    });

    return res.status(201).json({ contract: publicContract(created) });
  }

  /* ---------------------------------------------------------------- */
  if (action === "archive") {
    const updated = await service.updateContracts({
      id: contract.id,
      status: "archived",
    });

    return res.json({ contract: publicContract(updated) });
  }

  return res.status(400).json({ message: "Action inconnue." });
}
