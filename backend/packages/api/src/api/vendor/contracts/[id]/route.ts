/*
  ROUTE : lire un contrat reçu, le signer, ou le refuser.

  Le texte est rendu ICI, et vérifié

  On renvoie le corps du contrat ET on recalcule son empreinte pour la
  comparer à celle qui a été figée à l'envoi. Si les deux diffèrent, on
  ne sert pas le texte : quelque chose a changé le document depuis
  l'envoi, et faire signer dans ces conditions serait exactement le
  piège que ce module existe pour empêcher.

  La lecture est enregistrée

  Le passage à « vu » est horodaté. C'est ce qui permet plus tard de
  distinguer un marchand qui n'a jamais ouvert le contrat d'un marchand
  qui l'a lu et n'a pas répondu — deux situations qui n'appellent pas
  la même relance.

  La signature exige trois gestes, pas un

  Le nom tapé, la qualité déclarée, et une confirmation explicite. Un
  seul bouton « j'accepte » recueille des clics distraits ; taper son
  nom demande de s'arrêter. C'est aussi ce qui donne sa consistance à
  la preuve : on peut montrer ce que la personne a écrit.

  Ce que cela n'est pas

  Une signature électronique qualifiée. MACHÉ ne vérifie l'identité de
  personne : il enregistre un consentement horodaté et scelle
  l'intégrité du texte. Suffisant pour un accord commercial ordinaire,
  insuffisant pour ce que la loi réserve à la signature qualifiée.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { CONTRACT_MODULE } from "../../../../modules/contract";
import { text, MAX_NOTE } from "../../../delivery-helpers";
import { contentHash, proofHash, clientIp } from "../../../contract-proof";
import { sellerId, vendorSignature, type SignatureRow } from "../route";

type ContractRow = {
  id: string;
  title: string;
  summary: string | null;
  body: string;
  version: number;
  content_hash: string | null;
  status: string;
};

type Service = {
  listContractSignatures: (filters?: unknown, config?: unknown) => Promise<SignatureRow[]>;
  updateContractSignatures: (data: Record<string, unknown>) => Promise<SignatureRow>;
  listContracts: (filters?: unknown, config?: unknown) => Promise<ContractRow[]>;
};

async function load(
  req: MedusaRequest
): Promise<{ row: SignatureRow; contract: ContractRow } | null> {
  const seller = sellerId(req);

  const id = req.params.id;

  if (!seller || !id) return null;

  const service = req.scope.resolve(CONTRACT_MODULE) as Service;

  /* La boutique est dans le filtre, pas vérifiée après coup. */
  const [row] = await service.listContractSignatures(
    { id, seller_id: seller },
    { take: 1 }
  );

  if (!row) return null;

  const [contract] = await service.listContracts({ id: row.contract_id }, { take: 1 });

  if (!contract) return null;

  return { row, contract };
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const found = await load(req);

  if (!found) return res.status(404).json({ message: "Contrat introuvable." });

  const { row, contract } = found;

  /*
    Le texte servi est-il bien celui qui a été envoyé ? On ne se fie
    pas au fait que le contrat soit censé être immuable : on vérifie.
  */
  const recomputed = contentHash(contract.body);

  if (recomputed !== row.content_hash) {
    return res.status(409).json({
      message:
        "Le texte de ce contrat ne correspond plus à celui qui vous a été envoyé. Il ne peut pas être signé en l'état. Signalez-le à MACHÉ.",
      expected: row.content_hash,
      found: recomputed,
    });
  }

  const service = req.scope.resolve(CONTRACT_MODULE) as Service;

  /* Première ouverture : on l'horodate. */
  let current = row;

  if (row.status === "sent") {
    current = await service.updateContractSignatures({
      id: row.id,
      status: "viewed",
      viewed_at: new Date(),
    });
  }

  return res.json({
    contract: vendorSignature(current),
    body: contract.body,
    summary: contract.summary,
    /*
      L'empreinte accompagne le texte : le marchand peut la recalculer
      de son côté s'il le souhaite, aujourd'hui ou dans dix ans.
    */
    content_hash: row.content_hash,
  });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const found = await load(req);

  if (!found) return res.status(404).json({ message: "Contrat introuvable." });

  const { row, contract } = found;

  if (row.status === "signed") {
    return res.status(409).json({ message: "Ce contrat est déjà signé." });
  }

  if (row.status === "revoked") {
    return res.status(409).json({ message: "Cet envoi a été retiré par MACHÉ." });
  }

  const body = (req.body ?? {}) as Record<string, unknown>;

  const action = typeof body.action === "string" ? body.action : "";

  const service = req.scope.resolve(CONTRACT_MODULE) as Service;

  /* ---------------------------------------------------------------- */
  if (action === "decline") {
    const updated = await service.updateContractSignatures({
      id: row.id,
      status: "declined",
      declined_at: new Date(),
      decline_reason: text(body.reason, MAX_NOTE),
    });

    return res.json({ contract: vendorSignature(updated) });
  }

  /* ---------------------------------------------------------------- */
  if (action === "sign") {
    /*
      La vérification est refaite AU MOMENT DE SIGNER, et pas seulement
      à la lecture. Entre les deux, quelques minutes ont pu passer.
      C'est le seul instant qui compte vraiment.
    */
    if (contentHash(contract.body) !== row.content_hash) {
      return res.status(409).json({
        message:
          "Le texte de ce contrat a changé depuis son envoi. Il ne peut pas être signé.",
      });
    }

    const name = text(body.signer_name, 200);

    if (!name || name.length < 3) {
      return res.status(400).json({
        message: "Tapez votre nom complet pour signer.",
      });
    }

    /*
      La case cochée est exigée séparément du nom. Deux gestes valent
      mieux qu'un : on ne coche pas une case et on ne tape pas son nom
      par le même réflexe.
    */
    if (body.agreed !== true) {
      return res.status(400).json({
        message: "Confirmez que vous acceptez ce contrat.",
      });
    }

    const signedAt = new Date();

    const facts = {
      contract_id: row.contract_id,
      contract_version: row.contract_version,
      content_hash: row.content_hash,
      seller_id: row.seller_id,
      signer_name: name,
      signer_role: text(body.signer_role, 200),
      signer_email: text(body.signer_email, 320),
      signed_at: signedAt.toISOString(),
      signer_ip: clientIp(req.headers as Record<string, unknown>),
    };

    const userAgent = req.headers["user-agent"];

    const updated = await service.updateContractSignatures({
      id: row.id,
      status: "signed",
      signed_at: signedAt,
      signer_name: facts.signer_name,
      signer_role: facts.signer_role,
      signer_email: facts.signer_email,
      signer_ip: facts.signer_ip,
      signer_user_agent:
        typeof userAgent === "string" ? userAgent.slice(0, 500) : null,
      /*
        Le sceau. Il couvre le texte ET les circonstances : modifier
        après coup l'un de ces champs en base ne recalculerait pas cette
        valeur, et l'écart se verrait.
      */
      proof_hash: proofHash(facts),
    });

    return res.json({ contract: vendorSignature(updated) });
  }

  return res.status(400).json({ message: "Action inconnue." });
}
