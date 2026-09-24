/*
  ROUTE : envoyer un contrat publié à des marchands.

  Ce que l'envoi FIGE, et pourquoi c'est tout l'enjeu

  La version et l'empreinte du texte sont recopiées dans la ligne
  d'envoi. Elles ne seront plus jamais relues depuis le contrat.

  Sans cette recopie, une signature dirait « a signé le contrat n° 4 »,
  et le contrat n° 4 pourrait désigner un autre texte plus tard. Avec
  elle, elle dit « a signé un texte dont l'empreinte est celle-ci » —
  ce qui se vérifie encore dans dix ans en recalculant l'empreinte du
  document qu'on présente.

  Pourquoi un contrat non publié ne s'envoie pas

  Un brouillon se modifie. L'envoyer reviendrait à faire signer un
  texte mouvant.

  Pourquoi on n'envoie pas deux fois le même contrat au même marchand

  Deux exemplaires en attente chez la même boutique, et personne ne
  saurait lequel fait foi. Un envoi déjà signé, en revanche, n'empêche
  pas d'envoyer une VERSION suivante : c'est un autre texte.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { CONTRACT_MODULE } from "../../../../../../modules/contract";
import { newAccessToken } from "../../../../../delivery-helpers";
import { loadContract } from "../route";

const MAX_RECIPIENTS = 200;

type SignatureRow = {
  id: string;
  contract_id: string;
  seller_id: string;
  status: string;
};

type Service = {
  listContractSignatures: (filters?: unknown, config?: unknown) => Promise<SignatureRow[]>;
  createContractSignatures: (data: Record<string, unknown>[]) => Promise<SignatureRow[]>;
};

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const contract = await loadContract(req);

  if (!contract) return res.status(404).json({ message: "Contrat introuvable." });

  if (contract.status !== "published" || !contract.content_hash) {
    return res.status(409).json({
      message:
        "Seul un contrat publié peut être envoyé : un brouillon se modifie encore.",
    });
  }

  const body = (req.body ?? {}) as { seller_ids?: unknown; due_at?: unknown };

  const sellerIds = Array.isArray(body.seller_ids)
    ? [...new Set(
        body.seller_ids.filter(
          (id): id is string => typeof id === "string" && id.trim().length > 0
        )
      )]
    : [];

  if (sellerIds.length === 0) {
    return res.status(400).json({ message: "Aucune boutique désignée." });
  }

  if (sellerIds.length > MAX_RECIPIENTS) {
    return res.status(400).json({
      message: `Pas plus de ${MAX_RECIPIENTS} boutiques à la fois.`,
    });
  }

  const service = req.scope.resolve(CONTRACT_MODULE) as Service;

  /* Qui l'a déjà reçu — pour ne pas créer un second exemplaire en attente. */
  const existing = await service.listContractSignatures({
    contract_id: contract.id,
    seller_id: sellerIds,
  });

  const already = new Set(existing.map((row) => row.seller_id));

  const fresh = sellerIds.filter((id) => !already.has(id));

  if (fresh.length === 0) {
    return res.status(409).json({
      message: "Toutes ces boutiques ont déjà reçu ce contrat.",
      skipped: sellerIds.length,
    });
  }

  const due = typeof body.due_at === "string" ? new Date(body.due_at) : null;

  const now = new Date();

  const created = await service.createContractSignatures(
    fresh.map((sellerId) => ({
      contract_id: contract.id,
      /* Figés. C'est la ligne la plus importante de ce fichier. */
      contract_version: contract.version,
      content_hash: contract.content_hash,
      contract_title: contract.title,
      seller_id: sellerId,
      access_token: newAccessToken(),
      status: "sent",
      sent_at: now,
      due_at: due && !Number.isNaN(due.getTime()) ? due : null,
    }))
  );

  return res.status(201).json({
    sent: created.length,
    skipped: sellerIds.length - fresh.length,
  });
}
