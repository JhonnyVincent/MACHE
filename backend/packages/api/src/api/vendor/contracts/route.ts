/*
  ROUTE : les contrats adressés à la boutique connectée.

  Le filtre par vendeur vient de la session Mercur, jamais de la
  requête : un vendeur qui écrirait l'identifiant d'un concurrent
  lirait sinon les contrats qu'on lui propose, avec ses conditions.

  Le jeton d'accès n'est PAS renvoyé ici. Il sert de lien privé pour un
  signataire qui n'est pas connecté ; l'inclure dans une liste le ferait
  traîner dans les caches et les journaux du navigateur pour rien.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { CONTRACT_MODULE } from "../../../modules/contract";

const DEFAULT_LIMIT = 50;

export type SignatureRow = {
  id: string;
  display_id: number;
  contract_id: string;
  contract_version: number;
  contract_title: string;
  content_hash: string;
  seller_id: string;
  access_token: string;
  status: string;
  sent_at: string | Date | null;
  viewed_at: string | Date | null;
  signed_at: string | Date | null;
  declined_at: string | Date | null;
  signer_name: string | null;
  signer_role: string | null;
  signer_email: string | null;
  signer_ip: string | null;
  signer_user_agent: string | null;
  decline_reason: string | null;
  proof_hash: string | null;
  due_at: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
};

type Service = {
  listAndCountContractSignatures: (
    filters?: unknown,
    config?: unknown
  ) => Promise<[SignatureRow[], number]>;
};

export function sellerId(req: MedusaRequest): string | null {
  return (
    (req as unknown as { seller_context?: { seller_id?: string } }).seller_context
      ?.seller_id ?? null
  );
}

/* Ce que le marchand voit de son propre envoi. Jamais le jeton. */
export function vendorSignature(row: SignatureRow) {
  return {
    id: row.id,
    display_id: row.display_id,
    contract_id: row.contract_id,
    contract_version: row.contract_version,
    contract_title: row.contract_title,
    content_hash: row.content_hash,
    status: row.status,
    sent_at: row.sent_at,
    viewed_at: row.viewed_at,
    signed_at: row.signed_at,
    declined_at: row.declined_at,
    signer_name: row.signer_name,
    signer_role: row.signer_role,
    decline_reason: row.decline_reason,
    proof_hash: row.proof_hash,
    due_at: row.due_at,
  };
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const seller = sellerId(req);

  if (!seller) return res.status(401).json({ message: "Boutique non identifiée." });

  const service = req.scope.resolve(CONTRACT_MODULE) as Service;

  const limit = Math.min(Math.max(Number(req.query.limit) || DEFAULT_LIMIT, 1), 100);
  const offset = Math.max(Number(req.query.offset) || 0, 0);

  const status = typeof req.query.status === "string" ? req.query.status : null;

  const [rows, count] = await service.listAndCountContractSignatures(
    { seller_id: seller, ...(status ? { status } : {}) },
    { skip: offset, take: limit, order: { created_at: "DESC" } }
  );

  return res.json({ contracts: rows.map(vendorSignature), count, offset, limit });
}
