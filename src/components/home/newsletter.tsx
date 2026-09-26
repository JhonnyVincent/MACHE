"use client";

/*
  « RECEVOIR LES NOUVELLES DE MACHÉ »

  Au survol, le bandeau s'éclaire et se soulève légèrement ; le bouton
  aussi. Des transitions CSS seulement, coupées pour qui a demandé moins
  d'animations.

  Ce que la section promet : des nouvelles de MACHÉ par e-mail. Pas un
  rythme, pas une remise de bienvenue — rien de cela n'existe.
*/

import { useActionState } from "react";
import { subscribeAction, type NewsletterState } from "@/app/newsletter-actions";

const initial: NewsletterState = { status: "idle", message: "" };

export function NewsletterCta() {
  const [state, action, pending] = useActionState(subscribeAction, initial);

  return (
    <section className="mache-reveal container-page py-5">
      <div className="group relative overflow-hidden rounded-[14px] bg-[var(--mache-dark)] p-6 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(228,29,57,0.28)] motion-reduce:transform-none sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[var(--mache-primary)] opacity-20 blur-3xl transition-all duration-500 group-hover:scale-125 group-hover:opacity-40 motion-reduce:transition-none"
        />

        <div className="relative grid items-center gap-5 lg:grid-cols-[1fr_auto]">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Restez au courant de ce qui arrive sur MACHÉ</h2>
            <p className="mt-1.5 max-w-xl text-base leading-relaxed text-white/70">
              Nouvelles boutiques, promotions, nouveaux rayons : les nouvelles de MACHÉ par e-mail.
              Un lien de désabonnement dans chaque message.
            </p>
          </div>

          {state.status === "ok" ? (
            <p role="status" className="max-w-sm rounded-[8px] bg-white/10 px-4 py-3 text-base font-semibold">
              {state.message}
            </p>
          ) : (
            <form action={action} className="flex w-full flex-col gap-2 sm:flex-row lg:w-[420px]">
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
                className="w-full rounded-[6px] border border-white/20 bg-white px-3 py-2.5 text-md text-[#181818] outline-none focus:border-[var(--mache-primary)]"
              />
              <button
                type="submit"
                disabled={pending}
                className="shrink-0 rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-md font-bold text-white transition-transform duration-200 hover:scale-105 disabled:opacity-60 motion-reduce:transform-none"
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
