/*
  ROUTES : les contrats de MACHÉ, côté administration.

  GET liste, POST crée un brouillon.

  Un contrat naît TOUJOURS brouillon. Il n'est envoyable qu'une fois
  publié, et publier fige son texte : c'est à ce moment que l'empreinte
  est calculée. Créer directement un contrat publié priverait de la
  seule occasion de se relire avant que le texte ne devienne
  immuable — et un contrat se relit.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { CONTRACT_MODULE } from "../../../../modules/contract";
import { text } from "../../../delivery-helpers";

const MAX_BODY = 200_000;
const DEFAULT_LIMIT = 50;

export type ContractRow = {
  id: string;
  display_id: number;
  title: string;
  summary: string | null;
  body: string;
  version: number;
  family: string;
  content_hash: string | null;
  status: string;
  published_at: string | Date | null;
  published_by: string | null;
  created_by: string | null;
  created_at: string | Date;
  updated_at: string | Date;
};

type Service = {
  listAndCountContracts: (
    filters?: unknown,
    config?: unknown
  ) => Promise<[ContractRow[], number]>;
  createContracts: (data: Record<string, unknown>) => Promise<ContractRow>;
  updateContracts: (data: Record<string, unknown>) => Promise<ContractRow>;
};

export function adminId(req: MedusaRequest): string | null {
  return (req as { auth_context?: { actor_id?: string } }).auth_context?.actor_id ?? null;
}

export function publicContract(contract: ContractRow) {
  return {
    id: contract.id,
    display_id: contract.display_id,
    title: contract.title,
    summary: contract.summary,
    body: contract.body,
    version: contract.version,
    family: contract.family,
    content_hash: contract.content_hash,
    status: contract.status,
    published_at: contract.published_at,
    created_at: contract.created_at,
    updated_at: contract.updated_at,
  };
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(CONTRACT_MODULE) as Service;

  const limit = Math.min(Math.max(Number(req.query.limit) || DEFAULT_LIMIT, 1), 100);
  const offset = Math.max(Number(req.query.offset) || 0, 0);

  const status = typeof req.query.status === "string" ? req.query.status : null;

  const [contracts, count] = await service.listAndCountContracts(
    status ? { status } : {},
    { skip: offset, take: limit, order: { created_at: "DESC" } }
  );

  return res.json({ contracts: contracts.map(publicContract), count, offset, limit });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body ?? {}) as Record<string, unknown>;

  const title = text(body.title, 300);
  const content = typeof body.body === "string" ? body.body.trim() : "";

  if (!title) return res.status(400).json({ message: "Titre manquant." });

  if (!content) return res.status(400).json({ message: "Le contrat est vide." });

  if (content.length > MAX_BODY) {
    return res.status(400).json({ message: "Ce contrat dépasse la taille acceptée." });
  }

  const service = req.scope.resolve(CONTRACT_MODULE) as Service;

  const created = await service.createContracts({
    title,
    summary: text(body.summary, 500),
    body: content,
    version: 1,
    /*
      Une famille provisoire : la ligne n'a pas encore d'identifiant.
      Elle est corrigée juste après pour pointer sur elle-même, ce qui
      fait de cette première version la racine de toutes les suivantes.
    */
    family: "pending",
    status: "draft",
    created_by: adminId(req),
  });

  const rooted = await service.updateContracts({
    id: created.id,
    family: created.id,
  });

  return res.status(201).json({ contract: publicContract(rooted) });
}
