/*
  PAGE : écrire à MACHÉ.

  Ce qu'elle affichait

  Quatre adresses en @mache.local — support@, export@, partnerships@,
  trust@ — sur un domaine qui n'existe pas. Personne n'a jamais rien
  reçu. Un acheteur inquiet, un vendeur bloqué, quelqu'un signalant un
  produit : tous écrivaient dans le vide depuis le premier jour.

  Ce qu'elle fait maintenant

  Un formulaire qui enregistre la conversation dans MACHÉ. Pas d'e-mail,
  parce qu'il n'y en a pas — et il n'y en aura pas demain.

  CE QUE LA PAGE DIT AVANT D'ENVOYER, PAS APRÈS

  Que personne ne sera prévenu de la réponse. C'est la limite honnête
  d'une messagerie sans e-mail, et la taire ferait attendre une
  notification qui ne viendra jamais. Un visiteur sans compte doit
  conserver son lien ; un client connecté retrouvera l'échange dans son
  espace.
*/

import Link from "next/link";
import { getCustomer } from "@/lib/medusa/customer";
import { THREAD_CATEGORIES } from "@/lib/medusa/support";
import { SubmitButton } from "@/components/submit-button";
import { sendMessageAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Nous écrire — MACHÉ",
  description: "Une question, une commande, un signalement : écrivez à MACHÉ.",
};

const inputClass =
  "mt-1 w-full rounded-[6px] border border-[var(--mache-line)] bg-white px-3 py-2.5 text-md outline-none focus:border-[var(--mache-primary)]";

export default async function ContactPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; sujet?: string }>;
}) {
  const query = searchParams ? await searchParams : {};

  /*
    Si la personne est connectée, on préremplit son nom et son adresse.
    Pas pour lui épargner deux champs — pour que la conversation soit
    rattachée à son compte, et qu'elle la retrouve sans conserver de
    lien.
  */
  const customer = await getCustomer();

  const fullName =
    [customer?.firstName, customer?.lastName].filter(Boolean).join(" ") ?? "";

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--mache-text)] sm:text-4xl">
        Nous écrire
      </h1>

      <p className="mt-3 text-md leading-relaxed text-[var(--mache-muted)]">
        Une question, une commande qui coince, une boutique à ouvrir, un produit
        à signaler. Écrivez ici : votre message arrive directement à
        l&apos;équipe MACHÉ.
      </p>

      {query.error && (
        <p
          role="alert"
          className="mt-5 rounded-[6px] border border-[#f2c2c8] bg-[#fdeaec] px-3 py-2.5 text-sm text-[#b01124]"
        >
          {query.error}
        </p>
      )}

      {/*
        L'avertissement est AVANT le formulaire. Placé après, il serait
        lu une fois le message envoyé — c'est-à-dire trop tard pour
        décider de créer un compte, ou pour penser à garder son lien.
      */}
      <div className="mt-6 rounded-[10px] border border-[#e6d6b8] bg-[#fdf8ec] p-4">
        <h2 className="text-md font-bold text-[var(--mache-text)]">
          Comment vous aurez notre réponse
        </h2>

        {customer ? (
          <p className="mt-2 text-sm leading-relaxed text-[var(--mache-muted)]">
            Vous êtes connecté : la conversation sera rattachée à votre compte
            et vous la retrouverez dans{" "}
            <Link href="/dashboard/buyer/messages" className="font-medium underline">
              vos messages
            </Link>
            . MACHÉ n&apos;envoie pas d&apos;e-mail — vous ne serez pas prévenu,
            il faudra revenir voir.
          </p>
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-[var(--mache-muted)]">
            MACHÉ n&apos;a pas encore de service d&apos;envoi d&apos;e-mails.
            Après l&apos;envoi, vous recevrez un <strong>lien privé</strong> vers
            votre conversation : gardez-le, c&apos;est le seul moyen de relire
            notre réponse.{" "}
            <Link href="/compte/inscription" className="font-medium underline">
              Avec un compte
            </Link>
            , vous la retrouveriez sans rien conserver.
          </p>
        )}
      </div>

      <form action={sendMessageAction} className="mt-8 space-y-4">
        <div>
          <label htmlFor="category" className="block text-sm font-semibold text-[var(--mache-text)]">
            De quoi s&apos;agit-il ?
          </label>
          <select
            id="category"
            name="category"
            defaultValue={query.sujet ?? "question"}
            className={inputClass}
          >
            {THREAD_CATEGORIES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
                {item.hint ? ` — ${item.hint}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="from_name" className="block text-sm font-semibold text-[var(--mache-text)]">
              Votre nom
            </label>
            <input
              id="from_name"
              name="from_name"
              required
              maxLength={200}
              defaultValue={fullName}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="from_email" className="block text-sm font-semibold text-[var(--mache-text)]">
              Votre adresse e-mail
            </label>
            <input
              id="from_email"
              name="from_email"
              type="email"
              required
              maxLength={320}
              defaultValue={customer?.email ?? ""}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="from_phone" className="block text-sm font-semibold text-[var(--mache-text)]">
            Votre téléphone{" "}
            <span className="font-normal text-[var(--mache-muted)]">(facultatif)</span>
          </label>
          <input id="from_phone" name="from_phone" maxLength={60} className={inputClass} />
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-semibold text-[var(--mache-text)]">
            Objet
          </label>
          <input id="subject" name="subject" required maxLength={200} className={inputClass} />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-semibold text-[var(--mache-text)]">
            Votre message
          </label>
          <textarea
            id="message"
            name="message"
            required
            minLength={10}
            maxLength={5000}
            rows={8}
            className={inputClass}
          />
        </div>

        <SubmitButton pendingLabel="Envoi…" pendingHint="Nous enregistrons votre message.">
          Envoyer
        </SubmitButton>
      </form>

      <div className="mt-10 border-t border-[var(--mache-line)] pt-6 text-sm leading-relaxed text-[var(--mache-muted)]">
        <p>
          Pour vérifier l&apos;identité d&apos;un agent qui se présente chez
          vous, n&apos;écrivez pas : la vérification est immédiate sur{" "}
          <Link href="/verify-agent" className="font-medium text-[var(--mache-primary)] underline">
            la page prévue
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
