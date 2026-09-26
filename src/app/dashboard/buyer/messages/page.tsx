/*
  PAGE : mes échanges avec MACHÉ.

  C'est l'avantage concret d'avoir un compte : la conversation est
  rattachée au client, et il la retrouve ici sans conserver de lien.
  Quelqu'un sans compte n'a que l'adresse privée qu'on lui a donnée à
  l'envoi.

  L'écran distingue ce qui attend le client de ce qui attend MACHÉ. Sans
  e-mail, personne n'est prévenu d'une réponse : c'est cette liste qui
  en tient lieu, et une réponse non lue doit donc s'y voir au premier
  coup d'œil.
*/

import { Link } from "next-view-transitions";
import { redirect } from "next/navigation";
import { getCustomer } from "@/lib/medusa/customer";
import { getMyThreads, THREAD_STATUS_LABELS } from "@/lib/medusa/support";
import { formatDate } from "@/lib/seller";
import { PageHeader, Panel, Badge, Button, EmptyState, Notice } from "@/components/seller/ui";

export const dynamic = "force-dynamic";

const TONES: Record<string, "neutral" | "info" | "success" | "warning"> = {
  open: "warning",
  answered: "success",
  closed: "neutral",
};

export default async function BuyerMessagesPage() {
  const customer = await getCustomer();

  if (!customer) redirect("/compte/connexion?next=/dashboard/buyer/messages");

  const result = await getMyThreads();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Mes messages"
        subtitle="Vos échanges avec l'équipe MACHÉ."
        actions={<Button href="/contact">Écrire à MACHÉ</Button>}
      />

      {!result.ok ? (
        <Notice tone="danger" title="Vos messages ne s'affichent pas">
          {result.reason}
        </Notice>
      ) : result.data.length === 0 ? (
        <EmptyState
          title="Aucun message"
          description="Vous n'avez encore rien écrit à MACHÉ."
          action={<Button href="/contact">Écrire à MACHÉ</Button>}
        />
      ) : (
        <Panel title={`${result.data.length} conversation${result.data.length > 1 ? "s" : ""}`}>
          <ul className="space-y-2">
            {result.data.map((thread) => (
              <li
                key={thread.id}
                className={`rounded-[6px] border bg-white p-3 ${
                  /*
                    Une réponse non lue est mise en évidence : sans
                    e-mail, cette liste est la seule chose qui tienne
                    lieu de notification.
                  */
                  thread.awaitingSender
                    ? "border-[#b7dfc9] bg-[#f4fbf7]"
                    : "border-[#d5d9d9]"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/messages/${thread.id}`}
                      className="text-md font-semibold text-[#0f1111] hover:underline"
                    >
                      {thread.subject}
                    </Link>
                    <p className="mt-0.5 text-xs text-[#565959]">
                      Dernier message le {formatDate(thread.lastMessageAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {thread.awaitingSender && <Badge tone="success">Réponse à lire</Badge>}
                    <Badge tone={TONES[thread.status]}>
                      {THREAD_STATUS_LABELS[thread.status]}
                    </Badge>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <p className="text-sm leading-relaxed text-[#565959]">
        MACHÉ n&apos;envoie pas d&apos;e-mail : vous ne serez pas prévenu
        d&apos;une réponse. Cette page est l&apos;endroit où la trouver.
      </p>
    </div>
  );
}
