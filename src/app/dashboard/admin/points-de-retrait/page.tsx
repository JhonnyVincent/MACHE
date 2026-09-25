/*
  PAGE : les points de retrait.

  UN POINT DE RETRAIT EST UN LIEU, PAS UNE PERSONNE

  C'est la distinction qui gouverne tout cet écran, et celle que le
  reste du site répète : un point de retrait est une adresse où un
  colis attend — une boutique, une pharmacie, un dépôt. La personne qui
  le tient, un agent MACHÉ, peut être absente, remplacée, ou en tenir
  deux. Si le point n'était qu'un attribut de l'agent, un colis
  deviendrait introuvable le jour où l'agent change.

  C'est pourquoi le tenant se désigne à part, et pourquoi un point sans
  tenant reste un point valable.

  ON N'EN SUPPRIME AUCUN

  Un point fermé garde les livraisons qui y ont transité. Effacer la
  ligne rendrait illisible un suivi qui dirait « déposé chez » suivi de
  rien. Fermer le retire du choix des vendeurs et des clients tout de
  suite, et se défait.

  LE CODE NE SE MODIFIE PAS

  Il est imprimé sur des colis, noté par des clients, répété au
  téléphone. Le changer ferait pointer ces références vers rien. Un
  point qui doit changer de code est un autre point.
*/

import { redirect } from "next/navigation";
import { getAdminUser, fetchRelayPoints, type RelayPoint } from "@/lib/medusa/admin";
import {
  PageHeader, Panel, Badge, Notice, EmptyState, Field, Input, Textarea, Stat, StatRow,
} from "@/components/seller/ui";
import { SubmitButton } from "@/components/submit-button";
import {
  createRelayPointAction,
  setOpenAction,
  setKeeperAction,
} from "./actions";

export const dynamic = "force-dynamic";

function Point({ point }: { point: RelayPoint }) {
  return (
    <Panel
      title={`${point.name} — ${point.code}`}
      description={[point.commune, point.department].filter(Boolean).join(", ")}
    >
      <div className="flex flex-wrap items-center gap-2">
        {point.active ? (
          <Badge tone="success">Ouvert</Badge>
        ) : (
          <Badge tone="neutral">Fermé</Badge>
        )}
        {point.agentCustomerId ? (
          <Badge tone="info">Tenu par un agent</Badge>
        ) : (
          <Badge tone="warning">Aucun tenant désigné</Badge>
        )}
      </div>

      <dl className="mt-3 space-y-1.5 text-sm">
        <div>
          <dt className="text-[#767676]">Adresse</dt>
          <dd className="text-[#0f1111]">{point.address}</dd>
        </div>
        {point.landmark && (
          <div>
            <dt className="text-[#767676]">Repère</dt>
            <dd className="text-[#0f1111]">{point.landmark}</dd>
          </div>
        )}
        {point.openingHours && (
          <div>
            <dt className="text-[#767676]">Horaires</dt>
            <dd className="text-[#0f1111]">{point.openingHours}</dd>
          </div>
        )}
        {point.phonePublic && (
          <div>
            <dt className="text-[#767676]">Téléphone publié</dt>
            <dd className="text-[#0f1111]">{point.phonePublic}</dd>
          </div>
        )}
        {point.note && (
          <div>
            <dt className="text-[#767676]">Note interne</dt>
            <dd className="text-[#565959]">{point.note}</dd>
          </div>
        )}
      </dl>

      <div className="mt-4 flex flex-col gap-3 border-t border-[#e7e7e7] pt-4 sm:flex-row sm:items-end">
        <form action={setKeeperAction} className="flex-1">
          <input type="hidden" name="relay_point_id" value={point.id} />
          <Field
            label="Agent qui tient le point"
            htmlFor={`keeper-${point.id}`}
            hint="Laisser vide retire le tenant. Le point reste ouvert et les colis qui y attendent ne bougent pas."
          >
            <Input
              id={`keeper-${point.id}`}
              name="agent_customer_id"
              defaultValue={point.agentCustomerId ?? ""}
              placeholder="Identifiant client de l'agent"
            />
          </Field>
          <div className="mt-2">
            <SubmitButton pendingLabel="Enregistrement…">Enregistrer le tenant</SubmitButton>
          </div>
        </form>

        <form action={setOpenAction}>
          <input type="hidden" name="relay_point_id" value={point.id} />
          <input type="hidden" name="open" value={point.active ? "false" : "true"} />
          <SubmitButton pendingLabel="…">
            {point.active ? "Fermer ce point" : "Rouvrir ce point"}
          </SubmitButton>
        </form>
      </div>
    </Panel>
  );
}

export default async function AdminRelayPointsPage({
  searchParams,
}: {
  searchParams?: Promise<{ fait?: string; erreur?: string }>;
}) {
  const user = await getAdminUser();

  if (!user) redirect("/dashboard/admin/connexion");

  const query = searchParams ? await searchParams : {};

  const result = await fetchRelayPoints();

  const points = result.ok ? result.data : [];

  const open = points.filter((point) => point.active);

  /*
    Les points ouverts sans tenant sont montrés en tête : un client
    peut y être envoyé alors que personne n'est désigné pour recevoir
    son colis.
  */
  const sansTenant = open.filter((point) => !point.agentCustomerId);

  const sorted = [...points].sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;

    return a.department.localeCompare(b.department) || a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Points de retrait"
        subtitle="Les adresses où un colis peut attendre son destinataire."
      />

      {query.erreur && <Notice tone="danger" title="Rien n'a été changé">{query.erreur}</Notice>}
      {query.fait && <Notice tone="info" title="Enregistré">{query.fait}</Notice>}

      {!result.ok && (
        <Notice tone="danger" title="Liste indisponible">{result.reason}</Notice>
      )}

      {sansTenant.length > 0 && (
        <Notice
          tone="warning"
          title={`${sansTenant.length} point${sansTenant.length > 1 ? "s" : ""} ouvert${sansTenant.length > 1 ? "s" : ""} sans tenant désigné`}
        >
          Un vendeur peut y envoyer un colis alors que personne n&apos;est
          nommément chargé de le recevoir. Ce n&apos;est pas bloquant — le
          point reste une adresse valable — mais il vaut mieux savoir lequel.
        </Notice>
      )}

      <StatRow>
        <Stat label="Points ouverts" value={open.length} />
        <Stat
          label="Points fermés"
          value={points.length - open.length}
          hint="Conservés : les livraisons qui y ont transité restent lisibles."
        />
        <Stat
          label="Sans tenant"
          value={sansTenant.length}
          tone={sansTenant.length > 0 ? "warning" : "default"}
        />
      </StatRow>

      <Panel
        title="Ouvrir un point de retrait"
        description="Le nom, le département et l'adresse sont ce qu'un client lit pour s'y rendre."
      >
        <form action={createRelayPointAction} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nom du point" htmlFor="name" required>
              <Input id="name" name="name" required placeholder="Pharmacie Sainte-Anne" />
            </Field>

            <Field
              label="Code court"
              htmlFor="code"
              required
              hint="Lettres, chiffres et tirets. C'est ce que le client répète au téléphone, et il ne pourra plus être modifié."
            >
              <Input id="code" name="code" required placeholder="PAP-DEL-02" />
            </Field>

            <Field label="Département" htmlFor="department" required>
              <Input id="department" name="department" required placeholder="Ouest" />
            </Field>

            <Field label="Commune" htmlFor="commune">
              <Input id="commune" name="commune" placeholder="Delmas" />
            </Field>
          </div>

          <Field label="Adresse" htmlFor="address" required>
            <Input id="address" name="address" required placeholder="Rue Delmas 33, n° 12" />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Repère"
              htmlFor="landmark"
              hint="Ce qu'on dit vraiment pour trouver l'endroit."
            >
              <Input id="landmark" name="landmark" placeholder="En face de la station" />
            </Field>

            <Field label="Horaires" htmlFor="opening_hours">
              <Input id="opening_hours" name="opening_hours" placeholder="Lun-sam 8h-17h" />
            </Field>

            <Field
              label="Téléphone à publier"
              htmlFor="phone_public"
              hint="Publié sur la page du point. N'y mettez pas le numéro personnel du tenant."
            >
              <Input id="phone_public" name="phone_public" />
            </Field>

            <Field
              label="Agent qui le tient"
              htmlFor="agent_customer_id"
              hint="Facultatif. Un point existe sans tenant désigné."
            >
              <Input id="agent_customer_id" name="agent_customer_id" />
            </Field>
          </div>

          <Field
            label="Note interne"
            htmlFor="note"
            hint="Visible ici seulement, jamais par les clients."
          >
            <Textarea id="note" name="note" rows={2} />
          </Field>

          <SubmitButton pendingLabel="Ouverture…">Ouvrir ce point</SubmitButton>
        </form>
      </Panel>

      {result.ok && sorted.length === 0 && (
        <EmptyState
          title="Aucun point de retrait"
          description="Tant qu'il n'y en a aucun, les vendeurs ne peuvent pas proposer le retrait en point relais — les autres modes d'acheminement restent disponibles."
        />
      )}

      {sorted.map((point) => (
        <Point key={point.id} point={point} />
      ))}
    </div>
  );
}
