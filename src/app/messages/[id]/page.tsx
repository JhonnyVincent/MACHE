/*
  PAGE : une conversation avec MACHÉ.

  On y arrive de deux façons : par son lien privé (le jeton dans
  l'adresse), ou depuis son espace client quand on a un compte.

  CE QUE LA PAGE RÉPÈTE, ET POURQUOI ELLE LE RÉPÈTE

  Que personne ne sera prévenu d'une réponse. C'est affiché une
  première fois juste après l'envoi — au moment où la personne peut
  encore copier son lien — et rappelé ensuite tant que la conversation
  vit.

  Le dire une seule fois ne suffirait pas : celui qui revient trois
  jours plus tard ne se souvient pas de l'avoir lu, et conclurait que
  MACHÉ ne répond pas.

  Le lien privé est affiché EN ENTIER

  Pas masqué, pas tronqué. C'est la seule clé de cette conversation pour
  quelqu'un sans compte, et on ne peut pas la lui renvoyer par e-mail.
  Un jeton visible qu'on peut noter vaut mieux qu'un jeton propre qu'on
  ne retrouve jamais.
*/

import Link from "next/link";
import { getCustomer } from "@/lib/medusa/customer";
import { getThread, THREAD_STATUS_LABELS } from "@/lib/medusa/support";
import { SubmitButton } from "@/components/submit-button";
import { replyAction } from "./actions";

export const dynamic = "force-dynamic";

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

export default async function ThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ token?: string; envoye?: string; error?: string }>;
}) {
  const { id } = await params;

  const query = searchParams ? await searchParams : {};

  const token = query.token ?? "";

  const customer = await getCustomer();

  const result = await getThread(id, token || undefined);

  if (!result.ok) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-bold text-[var(--mache-text)]">
          Conversation introuvable
        </h1>
        <p className="mt-3 text-md leading-relaxed text-[var(--mache-muted)]">
          {result.reason} Si vous aviez un lien privé, vérifiez qu&apos;il est
          complet — il se coupe souvent en le recopiant.
        </p>
        <p className="mt-6">
          <Link href="/contact" className="font-medium text-[var(--mache-primary)] underline">
            Écrire un nouveau message
          </Link>
        </p>
      </main>
    );
  }

  const thread = result.data;

  const closed = thread.status === "closed";

  /* Le lien complet, tel qu'il faut le conserver. */
  const privateLink = token
    ? `/messages/${thread.id}?token=${token}`
    : null;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--mache-muted)]">
        Conversation n° {thread.displayId}
      </p>

      <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--mache-text)] sm:text-3xl">
        {thread.subject}
      </h1>

      <p className="mt-2 text-sm text-[var(--mache-muted)]">
        {THREAD_STATUS_LABELS[thread.status]} · ouverte le {when(thread.createdAt)}
      </p>

      {query.envoye === "1" && (
        <div className="mt-6 rounded-[10px] border-2 border-[var(--mache-primary)] bg-white p-4">
          <h2 className="text-md font-bold text-[var(--mache-text)]">
            Message envoyé
          </h2>

          {customer ? (
            <p className="mt-2 text-sm leading-relaxed text-[var(--mache-muted)]">
              Vous retrouverez cette conversation dans{" "}
              <Link href="/dashboard/buyer/messages" className="font-medium underline">
                vos messages
              </Link>
              . MACHÉ n&apos;envoie pas d&apos;e-mail : revenez voir, vous ne
              serez pas prévenu.
            </p>
          ) : (
            <>
              <p className="mt-2 text-sm leading-relaxed text-[var(--mache-muted)]">
                <strong className="text-[var(--mache-text)]">
                  Gardez ce lien.
                </strong>{" "}
                C&apos;est le seul moyen de relire notre réponse : MACHÉ
                n&apos;a pas de service d&apos;e-mail et ne pourra pas vous le
                renvoyer.
              </p>

              {privateLink && (
                <p className="mt-3 select-all break-all rounded-[6px] border border-[var(--mache-line)] bg-[var(--mache-bg)] px-3 py-2 font-mono text-xs text-[var(--mache-text)]">
                  {privateLink}
                </p>
              )}
            </>
          )}
        </div>
      )}

      {query.error && (
        <p
          role="alert"
          className="mt-5 rounded-[6px] border border-[#f2c2c8] bg-[#fdeaec] px-3 py-2.5 text-sm text-[#b01124]"
        >
          {query.error}
        </p>
      )}

      {/* ---------------------------------------------------------- */}
      <ol className="mt-8 space-y-4">
        {thread.messages.map((message) => {
          const fromMache = message.author === "mache";

          return (
            <li
              key={message.id}
              className={`rounded-[10px] border p-4 ${
                fromMache
                  ? "border-[var(--mache-line)] bg-[var(--mache-white)]"
                  : "border-transparent bg-[var(--mache-bg-2)]"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mache-muted)]">
                {fromMache ? "MACHÉ" : message.authorName}
                {message.createdAt ? ` · ${when(message.createdAt)}` : ""}
              </p>

              {/*
                `whitespace-pre-wrap` garde les retours à la ligne du
                message tel qu'il a été écrit. Et c'est du TEXTE rendu
                par React : une balise tapée dedans reste une suite de
                caractères.
              */}
              <p className="mt-2 whitespace-pre-wrap text-md leading-relaxed text-[var(--mache-text)]">
                {message.body}
              </p>
            </li>
          );
        })}
      </ol>

      {/* ---------------------------------------------------------- */}
      {closed ? (
        <div className="mt-8 rounded-[10px] border border-[var(--mache-line)] bg-[var(--mache-white)] p-4">
          <p className="text-md font-semibold text-[var(--mache-text)]">
            Cette conversation est close
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--mache-muted)]">
            Si vous avez autre chose à nous dire,{" "}
            <Link href="/contact" className="font-medium text-[var(--mache-primary)] underline">
              ouvrez-en une nouvelle
            </Link>
            .
          </p>
        </div>
      ) : (
        <form action={replyAction} className="mt-8">
          <input type="hidden" name="thread_id" value={thread.id} />
          <input type="hidden" name="token" value={token} />

          <label htmlFor="message" className="block text-sm font-semibold text-[var(--mache-text)]">
            Répondre
          </label>
          <textarea
            id="message"
            name="message"
            required
            minLength={2}
            maxLength={5000}
            rows={5}
            className="mt-1 w-full rounded-[6px] border border-[var(--mache-line)] bg-white px-3 py-2.5 text-md outline-none focus:border-[var(--mache-primary)]"
          />

          <div className="mt-3">
            <SubmitButton pendingLabel="Envoi…">Envoyer</SubmitButton>
          </div>
        </form>
      )}

      {/*
        Rappelé à chaque visite, pas seulement après l'envoi : celui qui
        revient trois jours plus tard ne se souvient pas de l'avoir lu,
        et conclurait que MACHÉ ne répond pas.
      */}
      <p className="mt-8 border-t border-[var(--mache-line)] pt-4 text-xs leading-relaxed text-[var(--mache-muted)]">
        MACHÉ n&apos;envoie pas d&apos;e-mail : personne ne vous préviendra
        d&apos;une réponse.{" "}
        {customer
          ? "Cette conversation reste dans votre espace client."
          : "Gardez le lien de cette page pour y revenir."}
      </p>
    </main>
  );
}
