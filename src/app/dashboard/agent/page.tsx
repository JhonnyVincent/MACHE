/*
  PAGE : les colis d'un agent.

  Ce qu'elle était

  Elle lisait une ancienne table d'un socle supprimé depuis, et affichait
  donc « espace indisponible » à tout le monde. Elle est passée sur
  Medusa, comme le reste du compte : un agent est un client à qui
  s'ajoute une fonction, il n'a qu'une porte.

  Pourquoi des fiches et pas un tableau

  Un agent lit cet écran debout, sur un téléphone, une main occupée par
  un colis. Un tableau à sept colonnes se consulte assis.

  Le code n'est pas affiché ici

  Il ne l'est nulle part du côté de l'agent. C'est l'acheteur qui le
  détient et le donne au moment de la remise. Un agent qui pourrait le
  lire pourrait confirmer une livraison sans livrer — et la
  confirmation ne prouverait plus rien.
*/

import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomer } from "@/lib/medusa/customer";
import {
  getAgentDeliveries,
  DELIVERY_STATUS,
  DELIVERY_METHOD,
  AGENT_NEXT,
  type AgentDelivery,
} from "@/lib/medusa/agent";
import {
  PageHeader, Panel, Badge, Button, EmptyState, Notice, Input, Field,
} from "@/components/seller/ui";
import { SubmitButton } from "@/components/submit-button";
import { advanceDeliveryAction, confirmDeliveryAction } from "./actions";

export const dynamic = "force-dynamic";

const TONES: Record<string, "neutral" | "info" | "success" | "warning" | "danger"> = {
  pending: "neutral",
  assigned: "info",
  in_transit: "info",
  ready_for_pickup: "warning",
  delivered: "success",
  failed: "danger",
  cancelled: "neutral",
};

function DeliveryCard({ delivery }: { delivery: AgentDelivery }) {
  const next = AGENT_NEXT[delivery.status] ?? [];

  /*
    Le colis peut-il être remis maintenant ? Le backend tranche pour de
    bon ; ici on n'affiche le formulaire que là où il a une chance
    d'aboutir, pour ne pas faire saisir un code qui serait refusé.
  */
  const canConfirm =
    delivery.method !== "carrier" &&
    ["assigned", "in_transit", "ready_for_pickup"].includes(delivery.status);

  return (
    <div className="rounded-[10px] border border-[var(--mache-line)] bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-md font-bold text-[var(--mache-text)]">
            Colis n° {delivery.displayId}
          </p>
          <p className="mt-0.5 text-sm text-[var(--mache-muted)]">
            {DELIVERY_METHOD[delivery.method] ?? delivery.method}
          </p>
        </div>

        <Badge tone={TONES[delivery.status] ?? "neutral"}>
          {DELIVERY_STATUS[delivery.status] ?? delivery.status}
        </Badge>
      </div>

      <dl className="mt-3 space-y-1.5 text-sm">
        {delivery.recipientName && (
          <div className="flex gap-2">
            <dt className="shrink-0 text-[var(--mache-muted)]">Destinataire</dt>
            <dd className="font-medium text-[var(--mache-text)]">{delivery.recipientName}</dd>
          </div>
        )}
        {delivery.recipientAddress && (
          <div className="flex gap-2">
            <dt className="shrink-0 text-[var(--mache-muted)]">Adresse</dt>
            <dd className="text-[var(--mache-text)]">
              {delivery.recipientAddress}
              {delivery.recipientDepartment ? ` — ${delivery.recipientDepartment}` : ""}
            </dd>
          </div>
        )}
        {delivery.recipientPhone && (
          <div className="flex gap-2">
            <dt className="shrink-0 text-[var(--mache-muted)]">Téléphone</dt>
            <dd>
              <a
                href={`tel:${delivery.recipientPhone}`}
                className="font-medium text-[var(--mache-primary)] underline"
              >
                {delivery.recipientPhone}
              </a>
            </dd>
          </div>
        )}
      </dl>

      {delivery.failureReason && (
        <p className="mt-3 rounded-[6px] bg-[#fdecec] px-3 py-2 text-sm text-[#8a1c1c]">
          Échec précédent : {delivery.failureReason}
        </p>
      )}

      {next.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {next.map((step) => (
            <form key={step.status} action={advanceDeliveryAction}>
              <input type="hidden" name="delivery_id" value={delivery.id} />
              <input type="hidden" name="next_status" value={step.status} />
              <SubmitButton pendingLabel="…">{step.label}</SubmitButton>
            </form>
          ))}
        </div>
      )}

      {canConfirm && (
        <form
          action={confirmDeliveryAction}
          className="mt-4 rounded-[8px] border border-dashed border-[var(--mache-line)] bg-[var(--mache-bg)] p-3"
        >
          <input type="hidden" name="delivery_id" value={delivery.id} />

          <p className="text-sm font-semibold text-[var(--mache-text)]">
            Remettre le colis
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--mache-muted)]">
            Demandez son code à l&apos;acheteur au moment où vous lui remettez le
            colis. Vous ne l&apos;avez pas : c&apos;est ce qui fait que votre
            confirmation prouve la remise.
            {delivery.attemptsLeft > 0 && delivery.attemptsLeft < 5 && (
              <> Il vous reste {delivery.attemptsLeft} essai
                {delivery.attemptsLeft > 1 ? "s" : ""}.</>
            )}
          </p>

          <div className="mt-2.5 flex flex-wrap items-end gap-2">
            <Field label="Code de l'acheteur">
              <Input
                name="code"
                required
                autoComplete="off"
                inputMode="text"
                maxLength={12}
                placeholder="6 caractères"
                className="font-mono uppercase tracking-widest"
              />
            </Field>
            <SubmitButton pendingLabel="Vérification…">Confirmer la remise</SubmitButton>
          </div>
        </form>
      )}
    </div>
  );
}

export default async function AgentHomePage({
  searchParams,
}: {
  searchParams?: Promise<{ success?: string; error?: string; scope?: string }>;
}) {
  const query = searchParams ? await searchParams : {};

  const customer = await getCustomer();

  /*
    Pas connecté : on envoie vers la porte des agents, pas vers la
    connexion client générique. Les deux mènent au même compte, mais
    l'agent doit reconnaître l'endroit où on lui demande d'entrer.
  */
  if (!customer) redirect("/dashboard/agent/connexion");

  const scope = query.scope === "all" ? "all" : "open";

  const result = await getAgentDeliveries(scope);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Mes colis"
        subtitle="Ce qui vous a été confié, et ce qui attend dans votre point de retrait."
      />

      {query.success && (
        <Notice tone="info" title="C'est enregistré">
          {query.success}
        </Notice>
      )}
      {query.error && (
        <Notice tone="danger" title="Ça n'a pas marché">
          {query.error}
        </Notice>
      )}

      {!result.ok ? (
        /*
          Trois causes possibles, trois phrases : ce compte n'est pas
          agent, l'habilitation est suspendue, ou le backend ne répond
          pas. Le backend les distingue déjà ; on transmet sa réponse
          plutôt que de la réduire à « accès refusé », qui enverrait un
          agent suspendu vérifier son mot de passe.
        */
        <Notice tone="warning" title="Vos colis ne s'affichent pas">
          {result.reason}
        </Notice>
      ) : (
        <>
          {result.data.card.suspended && (
            <Notice tone="danger" title="Habilitation suspendue">
              Votre habilitation d&apos;agent est suspendue. Vous voyez encore vos
              colis — il faut bien pouvoir dire où ils sont — mais vous ne pouvez
              plus les faire avancer. Contactez MACHÉ.
            </Notice>
          )}

          <Panel
            title={result.data.card.function}
            description={
              [
                result.data.card.code ? `Code ${result.data.card.code}` : null,
                result.data.card.zone,
                result.data.relayPointIds.length
                  ? `${result.data.relayPointIds.length} point de retrait tenu`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ") || undefined
            }
          >
            <div className="flex flex-wrap gap-2">
              <Button
                href={`/dashboard/agent?scope=${scope === "open" ? "all" : "open"}`}
                variant="secondary"
              >
                {scope === "open" ? "Voir tout l'historique" : "Voir seulement les colis en cours"}
              </Button>
              {result.data.card.code && (
                <Button href={`/verify-agent?code=${result.data.card.code}`} variant="secondary">
                  Ce que voit un client qui vérifie mon code
                </Button>
              )}
            </div>
          </Panel>

          {result.data.deliveries.length === 0 ? (
            <EmptyState
              title={scope === "open" ? "Aucun colis en cours" : "Aucun colis"}
              description={
                scope === "open"
                  ? "Rien ne vous est confié pour le moment, et rien n'attend dans votre point de retrait."
                  : "Aucun colis ne vous a encore été confié."
              }
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {result.data.deliveries.map((delivery) => (
                <DeliveryCard key={delivery.id} delivery={delivery} />
              ))}
            </div>
          )}
        </>
      )}

      <p className="text-sm leading-relaxed text-[var(--mache-muted)]">
        Un client peut vérifier votre code sur{" "}
        <Link href="/verify-agent" className="font-medium text-[var(--mache-primary)] underline">
          la page de vérification
        </Link>
        {" "}avant de vous remettre quoi que ce soit. C&apos;est normal, et
        c&apos;est ce qui vous protège aussi.
      </p>
    </div>
  );
}
