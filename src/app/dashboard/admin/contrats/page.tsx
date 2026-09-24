/*
  PAGE : les contrats de MACHÉ.

  La liste, et la création d'un brouillon.

  Pourquoi un contrat naît toujours brouillon

  Parce que publier fige son texte pour toujours. Créer directement un
  contrat publié priverait de la seule occasion de se relire avant que
  le texte ne devienne immuable — et un contrat se relit.

  Ce que la page rappelle à l'endroit où l'on écrit

  Que ce texte ne sera plus modifiable une fois publié. Pas en note de
  bas de page : au-dessus du champ, avant qu'on tape.
*/

import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getAdminUser,
  fetchContracts,
  CONTRACT_STATUS_LABELS,
} from "@/lib/medusa/admin";
import { formatDate } from "@/lib/seller";
import {
  PageHeader, Panel, Badge, Button, EmptyState, Notice, Field, Input, Textarea,
} from "@/components/seller/ui";
import { SubmitButton } from "@/components/submit-button";
import { createContractAction } from "./actions";

export const dynamic = "force-dynamic";

const TONES: Record<string, "neutral" | "info" | "success" | "warning"> = {
  draft: "warning",
  published: "success",
  archived: "neutral",
};

export default async function AdminContractsPage({
  searchParams,
}: {
  searchParams?: Promise<{ success?: string; error?: string; nouveau?: string }>;
}) {
  const user = await getAdminUser();

  if (!user) redirect("/dashboard/admin/connexion");

  const query = searchParams ? await searchParams : {};

  const result = await fetchContracts();

  const writing = query.nouveau === "1";

  return (
    <div className="space-y-5">
      <PageHeader
        title="Contrats"
        subtitle="Ce que MACHÉ fait accepter à ses marchands."
        actions={
          writing ? (
            <Button href="/dashboard/admin/contrats" variant="secondary">
              Annuler
            </Button>
          ) : (
            <Button href="/dashboard/admin/contrats?nouveau=1">
              Écrire un contrat
            </Button>
          )
        }
      />

      {query.success && (
        <Notice tone="info" title="C'est fait">
          {query.success}
        </Notice>
      )}
      {query.error && (
        <Notice tone="danger" title="Ça n'a pas marché">
          {query.error}
        </Notice>
      )}

      {writing && (
        <Panel
          title="Nouveau contrat"
          description="Il sera créé en brouillon : rien n'est envoyé tant que vous ne l'avez pas publié."
        >
          {/*
            L'avertissement est AVANT le champ, pas après. Placé en
            dessous, il serait lu une fois le texte écrit — donc trop
            tard pour changer la façon de l'écrire.
          */}
          <Notice tone="warning" title="Ce texte deviendra immuable">
            Une fois publié, un contrat ne se modifie plus. Le corriger crée
            une nouvelle version, qu&apos;il faut renvoyer. C&apos;est ce qui
            permet de prouver, plus tard, quel texte un marchand a signé.
          </Notice>

          <form action={createContractAction} className="mt-4 space-y-3">
            <Field label="Titre" required>
              <Input name="title" required maxLength={300} />
            </Field>

            <Field
              label="En une phrase"
              hint="Ce que le marchand lit avant d'ouvrir le contrat."
            >
              <Input name="summary" maxLength={500} />
            </Field>

            <Field
              label="Texte du contrat"
              required
              hint="Les sauts de ligne et les alinéas sont conservés tels quels."
            >
              <Textarea name="body" required rows={18} className="font-mono text-sm" />
            </Field>

            <SubmitButton pendingLabel="Création…">Créer le brouillon</SubmitButton>
          </form>
        </Panel>
      )}

      {!result.ok ? (
        <Notice tone="danger" title="Les contrats ne s'affichent pas">
          {result.reason}
        </Notice>
      ) : result.data.length === 0 ? (
        !writing && (
          <EmptyState
            title="Aucun contrat"
            description="Rien n'a encore été écrit."
            action={
              <Button href="/dashboard/admin/contrats?nouveau=1">
                Écrire le premier
              </Button>
            }
          />
        )
      ) : (
        <Panel title={`${result.data.length} contrat${result.data.length > 1 ? "s" : ""}`}>
          <ul className="space-y-2">
            {result.data.map((contract) => (
              <li
                key={contract.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-[#d5d9d9] bg-white p-3"
              >
                <div className="min-w-0">
                  <Link
                    href={`/dashboard/admin/contrats/${contract.id}`}
                    className="text-md font-semibold text-[#0f1111] hover:underline"
                  >
                    {contract.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-[#565959]">
                    Version {contract.version}
                    {contract.publishedAt
                      ? ` · publié le ${formatDate(contract.publishedAt)}`
                      : ` · créé le ${formatDate(contract.createdAt)}`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge tone={TONES[contract.status] ?? "neutral"}>
                    {CONTRACT_STATUS_LABELS[contract.status]}
                  </Badge>
                  <Button href={`/dashboard/admin/contrats/${contract.id}`} variant="secondary">
                    Ouvrir
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
