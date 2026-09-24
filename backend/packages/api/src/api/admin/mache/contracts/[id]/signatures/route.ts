/*
  ROUTE : qui a signé ce contrat, qui l'a refusé, qui n'a rien fait.

  C'est l'écran de suivi. Il répond à une question simple et pratique :
  qui dois-je relancer ?

  Ce que l'administration voit, et que le marchand ne voit pas de lui

  L'adresse IP et le navigateur enregistrés à la signature. Ce sont les
  éléments qu'on produirait en cas de litige. Ils ne sont pas rendus au
  marchand parce qu'ils ne lui apprendraient rien sur son propre geste,
  et qu'un écran en dit toujours trop quand il en dit plus que
  nécessaire.

  Ce que PERSONNE ne voit ici

  Le jeton d'accès. Il ouvre la lecture du contrat sans session ; le
  faire figurer dans une liste consultée par l'administration le ferait
  traîner dans des journaux et des caches pour rien.

  POST : retirer un envoi

  Un contrat envoyé par erreur, ou devenu caduc, se retire. On ne le
  supprime pas : le marchand l'a peut-être déjà lu, et effacer la ligne
  effacerait aussi la trace de cette lecture. Une signature déjà
  recueillie, elle, ne se retire pas du tout — elle a eu lieu.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { CONTRACT_MODULE } from "../../../../../../modules/contract";
import type { SignatureRow } from "../../../../../vendor/contracts/route";

type Service = {
  listAndCountContractSignatures: (
    filters?: unknown,
    config?: unknown
  ) => Promise<[SignatureRow[], number]>;
  listContractSignatures: (filters?: unknown, config?: unknown) => Promise<SignatureRow[]>;
  updateContractSignatures: (data: Record<string, unknown>) => Promise<SignatureRow>;
};

function adminSignature(row: SignatureRow) {
  return {
    id: row.id,
    display_id: row.display_id,
    contract_id: row.contract_id,
    contract_version: row.contract_version,
    contract_title: row.contract_title,
    content_hash: row.content_hash,
    seller_id: row.seller_id,
    status: row.status,
    sent_at: row.sent_at,
    viewed_at: row.viewed_at,
    signed_at: row.signed_at,
    declined_at: row.declined_at,
    signer_name: row.signer_name,
    signer_role: row.signer_role,
    signer_email: row.signer_email,
    /* Pour un litige, pas pour l'affichage courant. */
    signer_ip: row.signer_ip,
    signer_user_agent: row.signer_user_agent,
    decline_reason: row.decline_reason,
    proof_hash: row.proof_hash,
    due_at: row.due_at,
  };
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const contractId = req.params.id;

  if (!contractId) return res.status(400).json({ message: "Contrat manquant." });

  const service = req.scope.resolve(CONTRACT_MODULE) as Service;

  const limit = Math.min(Math.max(Number(req.query.limit) || 200, 1), 500);

  const [rows, count] = await service.listAndCountContractSignatures(
    { contract_id: contractId },
    { take: limit, order: { created_at: "DESC" } }
  );

  /*
    Le décompte par état, calculé ici plutôt que dans l'écran : deux
    écrans qui le recalculeraient chacun de leur côté finiraient par ne
    plus donner le même chiffre.
  */
  const tally = { sent: 0, viewed: 0, signed: 0, declined: 0, revoked: 0 };

  for (const row of rows) {
    if (row.status in tally) {
      tally[row.status as keyof typeof tally] += 1;
    }
  }

  return res.json({ signatures: rows.map(adminSignature), count, tally });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const contractId = req.params.id;

  const body = (req.body ?? {}) as { signature_id?: unknown };

  const signatureId =
    typeof body.signature_id === "string" ? body.signature_id : null;

  if (!contractId || !signatureId) {
    return res.status(400).json({ message: "Envoi manquant." });
  }

  const service = req.scope.resolve(CONTRACT_MODULE) as Service;

  const [row] = await service.listContractSignatures(
    { id: signatureId, contract_id: contractId },
    { take: 1 }
  );

  if (!row) return res.status(404).json({ message: "Envoi introuvable." });

  /*
    Une signature recueillie ne se retire pas. Permettre de la retirer
    reviendrait à laisser effacer un engagement pris — c'est-à-dire à
    vider de sa valeur tout ce module.
  */
  if (row.status === "signed") {
    return res.status(409).json({
      message:
        "Ce contrat a été signé : l'envoi ne peut plus être retiré. Publiez une nouvelle version si les termes doivent changer.",
    });
  }

  const updated = await service.updateContractSignatures({
    id: row.id,
    status: "revoked",
  });

  return res.json({ signature: adminSignature(updated) });
}
