/*
  PAGE : mes échanges avec MACHE.

  C'est l'avantage concret d'avoir un compte : la conversation est
  rattachée au client, et il la retrouve ici sans conserver de lien.
  Quelqu'un sans compte n'a que l'adresse privée qu'on lui a donnée à
  l'envoi.

  L'écran distingue ce qui attend le client de ce qui attend MACHE. Un
  e-mail prévient d'une réponse, mais peut finir dans les indésirables :
  une réponse non lue doit donc aussi se voir ici au premier coup d'œil.
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
        subtitle="Vos échanges avec l'équipe MACHE."
        actions={<Button href="/contact">Écrire à MACHE</Button>}
      />

      {!result.ok ? (
        <Notice tone="danger" title="Vos messages ne s'affichent pas">
          {result.reason}
        </Notice>
      ) : result.data.length === 0 ? (
        <EmptyState
          title="Aucun message"
          description="Vous n'avez encore rien écrit à MACHE."
          action={<Button href="/contact">Écrire à MACHE</Button>}
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
                    ? "border-[var(--mache-success-line)] bg-[var(--mache-success-soft)]"
                    : "border-[var(--mache-line)]"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/messages/${thread.id}`}
                      className="text-md font-semibold text-[var(--mache-text)] hover:underline"
                    >
                      {thread.subject}
                    </Link>
                    <p className="mt-0.5 text-xs text-[var(--mache-muted)]">
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

      <p className="text-sm leading-relaxed text-[var(--mache-muted)]">
        MACHE n&apos;envoie pas d&apos;e-mail : vous ne serez pas prévenu
        d&apos;une réponse. Cette page est l&apos;endroit où la trouver.
      </p>
    </div>
  );
}
