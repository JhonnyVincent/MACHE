/*
  PAGE : la boîte de réception de MACHÉ.

  Elle remplace quatre adresses e-mail qui n'existaient pas.

  L'ORDRE DE LA PILE

  Ce qui attend MACHÉ d'abord, et dans ce groupe, LE PLUS ANCIEN EN
  PREMIER. C'est l'inverse d'une boîte mail, et c'est voulu : un écran
  de support rangé par date fait remonter ce qui vient d'arriver et
  laisse dormir au fond la question posée mardi. On traite une file
  d'attente par son début.

  Le tri vient du backend, pas d'ici — pour que la règle ne dépende pas
  de l'écran qui l'affiche.
*/

import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getAdminUser,
  fetchThreads,
  ADMIN_THREAD_STATUS,
  THREAD_CATEGORY_LABELS,
} from "@/lib/medusa/admin";
import { formatDate } from "@/lib/seller";
import { PageHeader, Panel, Badge, Button, EmptyState, Notice } from "@/components/seller/ui";

export const dynamic = "force-dynamic";

const TONES: Record<string, "neutral" | "info" | "success" | "warning"> = {
  open: "warning",
  answered: "info",
  closed: "neutral",
};

const FILTERS = [
  { key: "", label: "Tout" },
  { key: "open", label: "À traiter" },
  { key: "answered", label: "Répondu" },
  { key: "closed", label: "Closes" },
];

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const user = await getAdminUser();

  if (!user) redirect("/dashboard/admin/connexion");

  const query = searchParams ? await searchParams : {};

  const status = FILTERS.some((f) => f.key === query.status) ? query.status ?? "" : "";

  const result = await fetchThreads(status || undefined);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Messages"
        subtitle={
          result.ok
            ? `${result.data.waiting} conversation${result.data.waiting > 1 ? "s" : ""} attend${
                result.data.waiting > 1 ? "ent" : ""
              } une réponse de MACHÉ.`
            : undefined
        }
        actions={
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((filter) => (
              <Button
                key={filter.key || "all"}
                href={
                  filter.key
                    ? `/dashboard/admin/messages?status=${filter.key}`
                    : "/dashboard/admin/messages"
                }
                variant={filter.key === status ? "primary" : "secondary"}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        }
      />

      {/*
        La limite, rappelée sur l'écran de celui qui répond : sa réponse
        ne prévient personne. Sans cela, on croit le dossier traité
        parce qu'on a écrit.
      */}
      <Notice tone="warning" title="Vos réponses ne préviennent personne">
        MACHÉ n&apos;a pas de service d&apos;envoi d&apos;e-mails. Une réponse
        s&apos;affiche dans la conversation, et la personne la découvre en
        revenant. Pour les urgences, le téléphone laissé par le demandeur est
        le seul canal immédiat.
      </Notice>

      {!result.ok ? (
        <Notice tone="danger" title="Les messages ne s'affichent pas">
          {result.reason}
        </Notice>
      ) : result.data.threads.length === 0 ? (
        <EmptyState
          title="Aucun message"
          description={
            status
              ? "Aucune conversation dans cet état."
              : "Personne n'a encore écrit à MACHÉ."
          }
        />
      ) : (
        <Panel title={`${result.data.threads.length} conversation${result.data.threads.length > 1 ? "s" : ""}`}>
          <ul className="space-y-2">
            {result.data.threads.map((thread) => (
              <li
                key={thread.id}
                className={`rounded-[6px] border bg-white p-3 ${
                  thread.awaitingMache
                    ? "border-[#f3d9a5] bg-[#fdf6e8]"
                    : "border-[#d5d9d9]"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/admin/messages/${thread.id}`}
                      className="text-md font-semibold text-[#0f1111] hover:underline"
                    >
                      {thread.subject}
                    </Link>

                    <p className="mt-0.5 text-xs text-[#565959]">
                      {thread.fromName} · {thread.fromEmail}
                      {thread.fromPhone ? ` · ${thread.fromPhone}` : ""}
                    </p>

                    <p className="mt-0.5 text-xs text-[#767676]">
                      {THREAD_CATEGORY_LABELS[thread.category] ?? thread.category} ·
                      dernier message le {formatDate(thread.lastMessageAt)}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {thread.awaitingMache && <Badge tone="warning">Attend MACHÉ</Badge>}
                    <Badge tone={TONES[thread.status]}>
                      {ADMIN_THREAD_STATUS[thread.status]}
                    </Badge>
                    <Button href={`/dashboard/admin/messages/${thread.id}`} variant="secondary">
                      Ouvrir
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
