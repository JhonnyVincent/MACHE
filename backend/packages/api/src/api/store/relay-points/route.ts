/*
  ROUTE PUBLIQUE : les points de retrait.

  Elle sert à deux moments : quand un acheteur choisit où récupérer sa
  commande, et quand il cherche l'adresse d'un point le jour du retrait.

  Ce qu'elle publie

  Le nom, le code court, le département, l'adresse et les horaires —
  tout ce qu'il faut pour s'y rendre.

  Ce qu'elle ne publie pas

  Le nom et le numéro de la personne qui tient le point. Un point de
  retrait est un LIEU ; son tenant est un agent MACHÉ, dont l'identité
  se vérifie par son code, sur la page prévue pour cela. Publier ici
  « tenu par Jean B., 3xxx xxxx » donnerait à un inconnu de quoi se
  faire passer pour lui devant un client.

  Seuls les points actifs sortent. Un point fermé garde son historique
  de colis, mais envoyer quelqu'un devant un rideau baissé n'a pas de
  prix consolation.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { DELIVERY_MODULE } from "../../../modules/delivery";

type RelayRow = {
  id: string;
  name: string;
  code: string;
  department: string;
  commune: string | null;
  address: string;
  landmark: string | null;
  phone_public: string | null;
  opening_hours: string | null;
  active: boolean;
};

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(DELIVERY_MODULE) as {
    listRelayPoints: (filters?: unknown, config?: unknown) => Promise<RelayRow[]>;
  };

  const department =
    typeof req.query.department === "string" && req.query.department.trim()
      ? req.query.department.trim()
      : null;

  const points = await service.listRelayPoints(
    { active: true, ...(department ? { department } : {}) },
    { order: { department: "ASC", name: "ASC" } }
  );

  return res.json({
    relay_points: points.map((point) => ({
      id: point.id,
      name: point.name,
      code: point.code,
      department: point.department,
      commune: point.commune,
      address: point.address,
      landmark: point.landmark,
      phone_public: point.phone_public,
      opening_hours: point.opening_hours,
    })),
    count: points.length,
  });
}
