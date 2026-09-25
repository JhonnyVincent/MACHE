/*
  ROUTE : modifier un point de retrait.

  Ce qu'elle permet : corriger la fiche, désigner qui tient le point,
  l'ouvrir ou le fermer.

  Ce qu'elle ne permet pas : SUPPRIMER.

  Un point fermé garde les livraisons qui y ont transité. Effacer la
  ligne rendrait illisibles des livraisons déjà faites — un suivi qui
  dirait « déposé chez » suivi de rien. Fermer retire le point du choix
  des vendeurs et des clients à l'instant même ; c'est tout ce qu'on
  veut, et c'est réversible.

  LE CODE NE CHANGE PAS

  Il est imprimé sur des colis, répété au téléphone, noté quelque part
  par un client. Le renommer ferait pointer ces références vers rien.
  Un point qui doit changer de code est un autre point.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { DELIVERY_MODULE } from "../../../../../modules/delivery";
import { text, MAX_SHORT, MAX_NOTE } from "../../../../delivery-helpers";

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
  agent_customer_id: string | null;
  active: boolean;
  note: string | null;
};

type Service = {
  listRelayPoints: (filters?: unknown, config?: unknown) => Promise<RelayRow[]>;
  updateRelayPoints: (data: Record<string, unknown>) => Promise<RelayRow>;
};

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const id = req.params.id;

  const service = req.scope.resolve(DELIVERY_MODULE) as Service;

  const [point] = await service.listRelayPoints({ id }, { take: 1 });

  if (!point) {
    return res.status(404).json({ message: "Point de retrait introuvable." });
  }

  const body = (req.body ?? {}) as Record<string, unknown>;

  const changes: Record<string, unknown> = { id };

  /*
    Chaque champ n'est écrit que s'il est présent dans la requête. Un
    formulaire qui n'envoie que l'ouverture ne doit pas effacer
    l'adresse au passage.
  */
  if ("name" in body) {
    const name = text(body.name, MAX_SHORT);

    if (!name) {
      return res.status(400).json({ message: "Le nom ne peut pas être vide." });
    }

    changes.name = name;
  }

  if ("department" in body) {
    const department = text(body.department, MAX_SHORT);

    if (!department) {
      return res.status(400).json({ message: "Le département ne peut pas être vide." });
    }

    changes.department = department;
  }

  if ("address" in body) {
    const address = text(body.address, MAX_NOTE);

    if (!address) {
      return res.status(400).json({
        message: "L'adresse ne peut pas être vide : c'est ce qu'un client lit pour s'y rendre.",
      });
    }

    changes.address = address;
  }

  if ("commune" in body) changes.commune = text(body.commune, MAX_SHORT);
  if ("landmark" in body) changes.landmark = text(body.landmark, MAX_SHORT);
  if ("phone_public" in body) changes.phone_public = text(body.phone_public, MAX_SHORT);
  if ("opening_hours" in body) changes.opening_hours = text(body.opening_hours, MAX_SHORT);
  if ("note" in body) changes.note = text(body.note, MAX_NOTE);

  /*
    Qui tient le point aujourd'hui. Vide est un état normal, et pas une
    erreur : un point existe sans tenant désigné, et les colis qui y
    sont déposés ne bougent pas pour autant.
  */
  if ("agent_customer_id" in body) {
    changes.agent_customer_id = text(body.agent_customer_id, MAX_SHORT);
  }

  if ("active" in body) changes.active = body.active === true;

  const updated = await service.updateRelayPoints(changes);

  return res.json({ relay_point: updated });
}
