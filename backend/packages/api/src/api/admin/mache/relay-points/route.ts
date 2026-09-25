/*
  ROUTE : les points de retrait, vus par l'administration.

  Pourquoi une route d'administration distincte de la route publique

  La route publique ne montre que les points OUVERTS, et n'en publie
  que ce qu'un client doit savoir. L'administration doit voir aussi les
  points fermés — sans quoi un point qu'on vient de fermer disparaît de
  l'écran et devient impossible à rouvrir — ainsi que les champs
  internes : qui le tient, les notes.

  UN POINT DE RETRAIT EST UN LIEU, PAS UNE PERSONNE

  C'est ce qui justifie que ce ne soit pas une propriété de l'agent.
  L'agent qui tient le point peut être absent, remplacé, ou en tenir
  deux. Si le point n'était qu'un attribut de l'agent, les colis qui y
  attendent deviendraient introuvables le jour où l'agent change.

  ON NE SUPPRIME PAS UN POINT

  Un point fermé garde les livraisons qui y ont transité. Effacer la
  ligne rendrait illisibles des livraisons déjà faites — « déposé
  chez » suivi de rien. Fermer, en revanche, le retire immédiatement du
  choix des vendeurs et des clients.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { DELIVERY_MODULE } from "../../../../modules/delivery";
import { text, MAX_SHORT, MAX_NOTE } from "../../../delivery-helpers";

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
  created_at?: Date | string | null;
};

type Service = {
  listRelayPoints: (filters?: unknown, config?: unknown) => Promise<RelayRow[]>;
  createRelayPoints: (data: Record<string, unknown>) => Promise<RelayRow>;
};

function shape(point: RelayRow) {
  return {
    id: point.id,
    name: point.name,
    code: point.code,
    department: point.department,
    commune: point.commune,
    address: point.address,
    landmark: point.landmark,
    phone_public: point.phone_public,
    opening_hours: point.opening_hours,
    agent_customer_id: point.agent_customer_id,
    active: point.active,
    note: point.note,
    /*
      MikroORM rend une Date ; l'écran attend une chaîne. La
      conversion se fait ici, une fois, plutôt que dans chaque
      lecteur.
    */
    created_at:
      point.created_at instanceof Date
        ? point.created_at.toISOString()
        : (point.created_at ?? null),
  };
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(DELIVERY_MODULE) as Service;

  /* Les fermés compris : un point invisible ne peut pas être rouvert. */
  const points = await service.listRelayPoints(
    {},
    { order: { department: "ASC", name: "ASC" } }
  );

  return res.json({
    relay_points: points.map(shape),
    count: points.length,
  });
}

/*
  Le code court, « PAP-DEL-02 », est ce que le client lit et répète au
  téléphone. Il est mis en majuscules et débarrassé de ses espaces : le
  même point saisi deux fois avec une casse différente créerait deux
  lignes pour une seule adresse, et l'unicité en base ne l'attraperait
  pas.
*/
function normalizeCode(value: unknown): string | null {
  const raw = text(value, 40);

  if (!raw) return null;

  const code = raw.toUpperCase().replace(/\s+/g, "");

  return /^[A-Z0-9-]{3,40}$/.test(code) ? code : null;
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body ?? {}) as Record<string, unknown>;

  const name = text(body.name, MAX_SHORT);
  const code = normalizeCode(body.code);
  const department = text(body.department, MAX_SHORT);
  const address = text(body.address, MAX_NOTE);

  if (!name || !department || !address) {
    return res.status(400).json({
      message:
        "Un point de retrait a besoin d'un nom, d'un département et d'une adresse : c'est ce qu'un client lira pour s'y rendre.",
    });
  }

  if (!code) {
    return res.status(400).json({
      message:
        "Le code court est obligatoire, en lettres, chiffres et tirets — par exemple PAP-DEL-02. C'est lui que le client répète au téléphone.",
    });
  }

  const service = req.scope.resolve(DELIVERY_MODULE) as Service;

  /*
    Le code est unique en base ; l'y laisser échouer rendrait une erreur
    de contrainte illisible. On regarde d'abord, et on explique.
  */
  const [existing] = await service.listRelayPoints({ code }, { take: 1 });

  if (existing) {
    return res.status(409).json({
      message: `Le code ${code} est déjà pris par « ${existing.name} ». Choisissez-en un autre : deux points portant le même code seraient impossibles à distinguer au téléphone.`,
    });
  }

  const created = await service.createRelayPoints({
    name,
    code,
    department,
    commune: text(body.commune, MAX_SHORT),
    address,
    landmark: text(body.landmark, MAX_SHORT),
    phone_public: text(body.phone_public, MAX_SHORT),
    opening_hours: text(body.opening_hours, MAX_SHORT),
    agent_customer_id: text(body.agent_customer_id, MAX_SHORT),
    note: text(body.note, MAX_NOTE),
    active: body.active !== false,
  });

  return res.status(201).json({ relay_point: shape(created) });
}
