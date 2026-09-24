/*
  PAGE : une conversation, côté MACHÉ.

  Le fil entier, notes internes comprises : c'est le poste de travail de
  celui qui répond, et lui cacher ses propres notes n'aurait aucun sens.

  DEUX FORMULAIRES SÉPARÉS, PAS UNE CASE À COCHER

  « Répondre » part chez la personne. « Note interne » reste ici. Une
  case « interne » sur un formulaire unique s'oublie — et elle
  s'oublierait précisément le jour où la note ne devait pas sortir,
  parce que c'est le jour où l'on écrit vite.

  Les notes sont visuellement distinctes du reste du fil, pour la même
  raison : on doit voir d'un coup d'œil ce qui est parti et ce qui est
  resté.
*/

import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getAdminUser,
  fetchThread,
  ADMIN_THREAD_STATUS,
  THREAD_CATEGORY_LABELS,
} from "@/lib/medusa/admin";
import {
  PageHeader, Panel, Badge, Button, Notice, Field, Textarea,
} from "@/components/seller/ui";
import { SubmitButton } from "@/components/submit-button";
import {
  replyAction,
  noteAction,
  closeThreadAction,
  reopenThreadAction,
} from "../actions";

export const dynamic = "force-dynamic";

const TONES: Record<string, "neutral" | "info" | "success" | "warning"> = {
  open: "warning",
  answered: "info",
  closed: "neutral",
};

function when(value: string | null): string {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("fr-FR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ success?: string; error?: string }>;
}) {
  const user = await getAdminUser();

  if (!user) redirect("/dashboard/admin/connexion");

  const { id } = await params;

  const query = searchParams ? await searchParams : {};

  const result = await fetchThread(id);

  if (!result.ok) {
    return (
      <div className="space-y-5">
        <PageHeader title="Conversation" />
        <Notice tone="danger" title="Elle ne s'affiche pas">
          {result.reason}
        </Notice>
      </div>
    );
  }

  const thread = result.data;

  const closed = thread.status === "closed";

  const adminName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;

  return (
    <div className="space-y-5">
      <PageHeader
        title={thread.subject}
        subtitle={`n° ${thread.displayId} · ${
          THREAD_CATEGORY_LABELS[thread.category] ?? thread.category
        }`}
        actions={
          <Button href="/dashboard/admin/messages" variant="secondary">
            Tous les messages
          </Button>
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

      {/* ------------------------------------------------------------ */}
      <Panel title="Qui écrit">
        <dl className="space-y-1.5 text-sm">
          <div className="flex flex-wrap gap-2">
            <dt className="text-[#565959]">Nom</dt>
            <dd className="font-medium text-[#0f1111]">{thread.fromName}</dd>
          </div>
          <div className="flex flex-wrap gap-2">
            <dt className="text-[#565959]">E-mail</dt>
            <dd className="font-medium text-[#0f1111]">{thread.fromEmail}</dd>
          </div>
          {thread.fromPhone && (
            <div className="flex flex-wrap gap-2">
              <dt className="text-[#565959]">Téléphone</dt>
              <dd>
                {/*
                  Cliquable : sans e-mail, c'est le seul canal par lequel
                  MACHÉ peut joindre quelqu'un tout de suite.
                */}
                <a
                  href={`tel:${thread.fromPhone}`}
                  className="font-medium text-[var(--mache-primary)] underline"
                >
                  {thread.fromPhone}
                </a>
              </dd>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <dt className="text-[#565959]">Compte</dt>
            <dd className="text-[#0f1111]">
              {thread.customerId
                ? "Client connecté — il retrouvera la conversation dans son espace."
                : "Sans compte — il n'a que son lien privé pour revenir."}
            </dd>
          </div>
        </dl>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge tone={TONES[thread.status]}>{ADMIN_THREAD_STATUS[thread.status]}</Badge>
          {thread.awaitingMache && <Badge tone="warning">Attend MACHÉ</Badge>}
          {thread.awaitingSender && <Badge tone="info">N&apos;a pas encore lu notre réponse</Badge>}
        </div>
      </Panel>

      {/* ------------------------------------------------------------ */}
      <Panel title="Le fil">
        <ol className="space-y-3">
          {thread.messages.map((message) => {
            const fromMache = message.author === "mache";

            return (
              <li
                key={message.id}
                className={`rounded-[6px] border p-3 ${
                  message.internal
                    ? "border-dashed border-[#c2d4f0] bg-[#eef3fc]"
                    : fromMache
                      ? "border-[#b7dfc9] bg-[#f4fbf7]"
                      : "border-[#d5d9d9] bg-white"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-[#565959]">
                  {message.internal
                    ? `Note interne — ${message.authorName}`
                    : fromMache
                      ? "MACHÉ"
                      : message.authorName}
                  {message.createdAt ? ` · ${when(message.createdAt)}` : ""}
                </p>

                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-[#0f1111]">
                  {message.body}
                </p>
              </li>
            );
          })}
        </ol>
      </Panel>

      {/* ------------------------------------------------------------ */}
      {!closed && (
        <Panel
          title="Répondre"
          description="Ce message s'affichera dans la conversation de la personne."
        >
          <form action={replyAction} className="space-y-3">
            <input type="hidden" name="thread_id" value={thread.id} />

            <Field label="Votre réponse" required>
              <Textarea name="message" required minLength={2} rows={7} />
            </Field>

            <SubmitButton pendingLabel="Envoi…">Envoyer la réponse</SubmitButton>
          </form>
        </Panel>
      )}

      {/* ------------------------------------------------------------ */}
      <Panel
        title="Note interne"
        description="Elle reste ici. La personne ne la verra jamais."
      >
        <form action={noteAction} className="space-y-3">
          <input type="hidden" name="thread_id" value={thread.id} />
          <input type="hidden" name="author_name" value={adminName} />

          <Field
            label="Ce que vous voulez noter"
            hint="Ce que vous avez vérifié, ce qui reste à faire, à qui passer le dossier."
          >
            <Textarea name="message" required minLength={2} rows={4} />
          </Field>

          <SubmitButton
            pendingLabel="Enregistrement…"
            className="!bg-white !text-[#0f1111] !border !border-[#8d9096] hover:!bg-[#f7f8f8]"
          >
            Ajouter la note
          </SubmitButton>
        </form>
      </Panel>

      {/* ------------------------------------------------------------ */}
      <Panel
        title={closed ? "Rouvrir" : "Clore"}
        description={
          closed
            ? "La personne pourra de nouveau écrire dans cette conversation."
            : "La personne ne pourra plus y répondre ; elle devra en ouvrir une nouvelle."
        }
      >
        <form action={closed ? reopenThreadAction : closeThreadAction}>
          <input type="hidden" name="thread_id" value={thread.id} />
          <SubmitButton
            pendingLabel="…"
            className="!bg-white !text-[#0f1111] !border !border-[#8d9096] hover:!bg-[#f7f8f8]"
          >
            {closed ? "Rouvrir la conversation" : "Clore la conversation"}
          </SubmitButton>
        </form>
      </Panel>

      <p className="text-sm text-[#565959]">
        Ce que voit la personne :{" "}
        <Link href={`/messages/${thread.id}`} className="font-medium underline">
          sa page de conversation
        </Link>{" "}
        — sans les notes internes.
      </p>
    </div>
  );
}
