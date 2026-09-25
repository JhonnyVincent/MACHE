/*
  PAGE : les livraisons de la boutique.

  CE QUE CET ÉCRAN NE MONTRE JAMAIS : LE CODE DE REMISE.

  C'est la règle qui fait tenir tout le reste. Le code est montré à
  l'ACHETEUR, sur sa page de suivi, et saisi par CELUI QUI LIVRE. Si le
  vendeur pouvait le lire, il pourrait confirmer lui-même une livraison
  qu'il n'a pas faite, et la confirmation ne prouverait plus rien.

  Le sens de la preuve n'est pas un détail : l'inverse — un code que le
  vendeur montre et que l'acheteur saisit — ne démontrerait aucune
  remise, puisque le vendeur détiendrait déjà ce qu'il doit prouver.

  AUCUN BOUTON NE MARQUE « REMIS »

  On n'y arrive pas en changeant un statut. On y arrive en saisissant
  le code de l'acheteur, et c'est le seul chemin. Le backend le refuse,
  cet écran ne le propose pas, et l'action serveur le refuse aussi :
  trois barrières pour une règle qui décide quand un vendeur est payé.

  QUATRE ACHEMINEMENTS, QUATRE TRAJETS RÉELS

  Un colis confié à un agent est d'abord REMIS à l'agent ; un colis
  déposé en point de retrait ATTEND que le client vienne ; un colis que
  le vendeur porte lui-même ne fait ni l'un ni l'autre. Les suites
  proposées diffèrent donc par méthode — une liste unique laisserait
  marquer « prêt au retrait » une livraison faite à domicile.

  Le transporteur externe est à part : MACHÉ ne le contrôle pas, et la
  remise n'y est pas prouvée par code. L'écran le dit plutôt que de
  laisser croire à une garantie qui n'existe pas.

  LE JETON DE SUIVI N'APPARAÎT QU'UNE FOIS

  À la création, et jamais plus. C'est le lien qu'un acheteur sans
  compte utilisera pour suivre son colis et y lire son code. Ne pas le
  transmettre le laisse sans aucun moyen de suivre sa commande.
*/

import { redirect } from "next/navigation";
import {
  getVendorSeller,
  getVendorDeliveries,
  getOpenRelayPoints,
  DELIVERY_METHOD_LABELS,
  DELIVERY_STATUS_LABELS,
  DELIVERY_NEXT,
  awaitsDeliveryCode,
  type VendorDelivery,
} from "@/lib/medusa/vendor";
import { formatDate } from "@/lib/seller";
import {
  PageHeader, Panel, Badge, Button, Notice, EmptyState, Field, Input, Select, Textarea,
} from "@/components/seller/ui";
import { SubmitButton } from "@/components/submit-button";
import {
  createDeliveryAction,
  advanceDeliveryAction,
  confirmDeliveryAction,
} from "./actions";

export const dynamic = "force-dynamic";

const STATUS_TONES: Record<string, "neutral" | "info" | "success" | "warning" | "danger"> = {
  pending: "neutral",
  assigned: "info",
  in_transit: "info",
  ready_for_pickup: "warning",
  delivered: "success",
  failed: "danger",
  cancelled: "neutral",
};

/* Le libellé du bouton, pour chaque suite possible. */
const NEXT_LABELS: Record<string, string> = {
  assigned: "Remis à l'agent ou au point",
  in_transit: "C'est parti",
  ready_for_pickup: "Arrivé, à retirer",
  failed: "Remise échouée",
  cancelled: "Annuler",
};

function Delivery({ delivery }: { delivery: VendorDelivery }) {
  const next = DELIVERY_NEXT[delivery.method]?.[delivery.status] ?? [];

  const canConfirm = awaitsDeliveryCode(delivery);

  return (
    <Panel
      title={`Commande ${delivery.orderId}`}
      description={DELIVERY_METHOD_LABELS[delivery.method] ?? delivery.method}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={STATUS_TONES[delivery.status] ?? "neutral"}>
          {DELIVERY_STATUS_LABELS[delivery.status] ?? delivery.status}
        </Badge>

        {delivery.payoutState === "held" ? (
          <Badge tone="warning">Versement retenu</Badge>
        ) : (
          <Badge tone="success">Versement débloqué</Badge>
        )}
      </div>

      <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
        {delivery.recipientName && (
          <div>
            <dt className="text-[#767676]">Destinataire</dt>
            <dd className="text-[#0f1111]">{delivery.recipientName}</dd>
          </div>
        )}
        {delivery.recipientPhone && (
          <div>
            <dt className="text-[#767676]">Téléphone</dt>
            <dd className="text-[#0f1111]">{delivery.recipientPhone}</dd>
          </div>
        )}
        {delivery.recipientAddress && (
          <div className="sm:col-span-2">
            <dt className="text-[#767676]">Adresse</dt>
            <dd className="text-[#0f1111]">{delivery.recipientAddress}</dd>
          </div>
        )}
        {delivery.carrierName && (
          <div>
            <dt className="text-[#767676]">Transporteur</dt>
            <dd className="text-[#0f1111]">
              {delivery.carrierName}
              {delivery.trackingNumber ? ` · ${delivery.trackingNumber}` : ""}
            </dd>
          </div>
        )}
        {delivery.confirmedAt && (
          <div>
            <dt className="text-[#767676]">Remise confirmée</dt>
            <dd className="text-[#0f1111]">{formatDate(delivery.confirmedAt)}</dd>
          </div>
        )}
      </dl>

      {delivery.method === "carrier" && delivery.status !== "delivered" && (
        <div className="mt-3">
          <Notice tone="warning" title="Remise non prouvée par code">
            Ce colis est confié à un transporteur que MACHÉ ne contrôle pas. Le
            suivi vient de lui, et la remise n&apos;est pas prouvée par un code
            — le versement suit donc vos accords habituels, pas ce dispositif.
          </Notice>
        </div>
      )}

      {next.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-[#e7e7e7] pt-4">
          {next.map((status) => (
            <form key={status} action={advanceDeliveryAction}>
              <input type="hidden" name="delivery_id" value={delivery.id} />
              <input type="hidden" name="status" value={status} />
              <SubmitButton pendingLabel="…">
                {NEXT_LABELS[status] ?? status}
              </SubmitButton>
            </form>
          ))}
        </div>
      )}

      {canConfirm && (
        <form
          action={confirmDeliveryAction}
          className="mt-4 space-y-3 border-t border-[#e7e7e7] pt-4"
        >
          <input type="hidden" name="delivery_id" value={delivery.id} />

          <Field
            label="Code donné par l'acheteur"
            htmlFor={`code-${delivery.id}`}
            required
            hint={`Demandez-le au moment de la remise. Il reste ${delivery.attemptsLeft} essai${delivery.attemptsLeft > 1 ? "s" : ""} avant que la confirmation par code ne se ferme.`}
          >
            <Input
              id={`code-${delivery.id}`}
              name="code"
              required
              autoComplete="off"
              placeholder="6 caractères"
              className="tnum uppercase"
            />
          </Field>

          <Field
            label="Note"
            htmlFor={`note-${delivery.id}`}
            hint="Facultatif : qui a reçu le colis, une remarque sur la remise."
          >
            <Textarea id={`note-${delivery.id}`} name="note" rows={2} />
          </Field>

          <SubmitButton pendingLabel="Vérification…">
            Confirmer la remise
          </SubmitButton>
        </form>
      )}
    </Panel>
  );
}

export default async function SellerDeliveriesPage({
  searchParams,
}: {
  searchParams?: Promise<{
    fait?: string;
    erreur?: string;
    jeton?: string;
    livraison?: string;
  }>;
}) {
  const seller = await getVendorSeller();

  if (!seller) redirect("/dashboard/seller/connexion");

  const query = searchParams ? await searchParams : {};

  const [result, relayResult] = await Promise.all([
    getVendorDeliveries(),
    getOpenRelayPoints(),
  ]);

  const deliveries = result.ok ? result.data : [];

  const relayPoints = relayResult.ok ? relayResult.data : [];

  /* Ce qui bouge d'abord ; les remises et les annulations sont des archives. */
  const DONE = ["delivered", "cancelled"];

  const active = deliveries.filter((item) => !DONE.includes(item.status));
  const settled = deliveries.filter((item) => DONE.includes(item.status));

  return (
    <div className="mx-auto max-w-[900px] space-y-5 p-3 sm:p-5">
      <PageHeader
        title="Livraisons"
        subtitle={`Les acheminements de ${seller.name}, et leur preuve de remise.`}
        actions={<Button href="/dashboard/seller" variant="secondary">Retour</Button>}
      />

      {query.erreur && (
        <Notice tone="danger" title="Rien n'a été changé">{query.erreur}</Notice>
      )}

      {query.fait && <Notice tone="info" title="Enregistré">{query.fait}</Notice>}

      {query.jeton && query.livraison && (
        <Notice tone="warning" title="Transmettez ce lien à l'acheteur — il ne sera plus affiché">
          <p>
            C&apos;est par là qu&apos;un acheteur sans compte suit son colis et
            lit son code de remise. MACHÉ n&apos;envoie pas d&apos;e-mail :
            sans ce lien, il n&apos;a aucun moyen d&apos;y accéder, et vous
            n&apos;aurez aucun code à saisir.
          </p>
          <p className="tnum mt-2 break-all rounded-[3px] border border-[#d5d9d9] bg-white px-2.5 py-2 text-xs">
            /suivi/{query.livraison}?jeton={query.jeton}
          </p>
        </Notice>
      )}

      <Panel
        title="Ouvrir un acheminement"
        description="Le code de remise est tiré à cet instant. L'acheteur peut le lire ; vous, non."
      >
        <form action={createDeliveryAction} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Numéro de commande" htmlFor="order_id" required>
              <Input id="order_id" name="order_id" required />
            </Field>

            <Field
              label="Comment part le colis"
              htmlFor="method"
              required
              hint="Ce choix décide de la suite du suivi — et, pour le transporteur, du fait qu'il n'y aura pas de preuve par code."
            >
              <Select id="method" name="method" required defaultValue="seller">
                <option value="seller">Je le livre moi-même</option>
                <option value="agent">Je le confie à un agent MACHÉ</option>
                <option value="relay">Je le dépose en point de retrait</option>
                <option value="carrier">Je le confie à un transporteur</option>
              </Select>
            </Field>

            <Field label="Nom du destinataire" htmlFor="recipient_name">
              <Input id="recipient_name" name="recipient_name" />
            </Field>

            <Field label="Téléphone" htmlFor="recipient_phone">
              <Input id="recipient_phone" name="recipient_phone" />
            </Field>
          </div>

          <Field label="Adresse de livraison" htmlFor="recipient_address">
            <Input id="recipient_address" name="recipient_address" />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Département" htmlFor="recipient_department">
              <Input id="recipient_department" name="recipient_department" />
            </Field>

            <Field
              label="Point de retrait"
              htmlFor="relay_point_id"
              hint={
                relayPoints.length === 0
                  ? "Aucun point de retrait n'est ouvert pour l'instant. Les autres acheminements restent disponibles."
                  : "À renseigner seulement si vous déposez en point de retrait."
              }
            >
              <Select
                id="relay_point_id"
                name="relay_point_id"
                defaultValue=""
                disabled={relayPoints.length === 0}
              >
                <option value="">—</option>
                {relayPoints.map((point) => (
                  <option key={point.id} value={point.id}>
                    {point.code} · {point.name} ({point.department})
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Transporteur"
              htmlFor="carrier_name"
              hint="À renseigner seulement si vous confiez le colis à un transporteur."
            >
              <Input id="carrier_name" name="carrier_name" />
            </Field>

            <Field label="Numéro de suivi du transporteur" htmlFor="tracking_number">
              <Input id="tracking_number" name="tracking_number" />
            </Field>
          </div>

          <Field label="Lien de suivi du transporteur" htmlFor="tracking_url">
            <Input id="tracking_url" name="tracking_url" type="url" />
          </Field>

          <SubmitButton pendingLabel="Ouverture…">Ouvrir l&apos;acheminement</SubmitButton>
        </form>
      </Panel>

      {!result.ok && (
        <Notice tone="danger" title="Vos livraisons ne s'affichent pas">
          {result.reason}
        </Notice>
      )}

      {result.ok && deliveries.length === 0 && (
        <EmptyState
          title="Aucun acheminement"
          description="Ouvrez-en un ci-dessus pour une commande à livrer. Le code de remise se génère à ce moment-là."
        />
      )}

      {active.map((delivery) => (
        <Delivery key={delivery.id} delivery={delivery} />
      ))}

      {settled.length > 0 && (
        <>
          <h2 className="pt-2 text-sm font-semibold uppercase tracking-label text-[#565959]">
            Terminées
          </h2>
          {settled.map((delivery) => (
            <Delivery key={delivery.id} delivery={delivery} />
          ))}
        </>
      )}
    </div>
  );
}
