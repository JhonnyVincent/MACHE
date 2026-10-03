"use client";

/*
  « RECEVOIR LES NOUVELLES DE MACHE »

  Au survol, le bandeau s'éclaire et se soulève légèrement ; le bouton
  aussi. Des transitions CSS seulement, coupées pour qui a demandé moins
  d'animations.

  Ce que la section promet : des nouvelles de MACHE par e-mail. Pas un
  rythme, pas une remise de bienvenue — rien de cela n'existe.
*/

import { useActionState } from "react";
import { subscribeAction, type NewsletterState } from "@/app/newsletter-actions";
import { AntiSpamFields } from "@/components/anti-spam-fields";

const initial: NewsletterState = { status: "idle", message: "" };

export function NewsletterCta() {
  const [state, action, pending] = useActionState(subscribeAction, initial);

  return (
    <section className="mache-reveal container-page py-10">
      <div className="relative overflow-hidden rounded-[8px] bg-[var(--mache-dark)] p-8 text-white sm:p-10">

        <div className="relative grid items-center gap-5 lg:grid-cols-[1fr_auto]">
          <div>
            <h2 className="text-2xl sm:text-3xl">Restez au courant de ce qui arrive sur MACHE</h2>
            <p className="mt-2 max-w-xl text-md leading-relaxed text-white/70">
              Nouvelles boutiques, promotions, nouveaux rayons : les nouvelles de MACHE par e-mail.
              Un lien de désabonnement dans chaque message.
            </p>
          </div>

          {state.status === "ok" ? (
            <p role="status" className="max-w-sm rounded-[6px] bg-white/10 px-4 py-3 text-base font-semibold">
              {state.message}
            </p>
          ) : (
            <form action={action} className="flex w-full flex-col gap-2 sm:flex-row lg:w-[420px]">
              <AntiSpamFields />
              <label htmlFor="newsletter-email" className="sr-only">
                Adresse e-mail
              </label>
              <input
                id="newsletter-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                autoCapitalize="none"
                placeholder="votre@adresse.com"
                className="w-full rounded-[6px] border border-white/20 bg-white px-3 py-2.5 text-md text-[var(--mache-text)] outline-none focus:border-[var(--mache-primary)]"
              />
              <button
                type="submit"
                disabled={pending}
                className="shrink-0 rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-md font-semibold text-white transition-colors hover:bg-[var(--mache-primary-dark)] disabled:opacity-60"
              >
                {pending ? "Envoi…" : "S'abonner"}
              </button>
            </form>
          )}
        </div>

        {state.status === "error" && (
          <p role="alert" className="relative mt-3 text-sm text-[#ffb3be]">
            {state.message}
          </p>
        )}
      </div>
    </section>
  );
}
