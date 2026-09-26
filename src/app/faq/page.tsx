/*
  PAGE : questions fréquentes

  Ce qu'elle répondait

  « Les paiements sont-ils prévus ? — Oui, l'architecture prévoit
  Stripe, PayPal, moyens locaux et cash on delivery. »

  Un client qui demande comment il va payer recevait la feuille de route
  du projet. Il en concluait raisonnablement qu'il pourrait payer par
  carte, ce qui est faux.

  Ce qu'elle répond maintenant

  Ce que le site fait aujourd'hui, et rien d'autre. Quand la réponse est
  « pas encore », elle le dit dans ces termes plutôt que d'annoncer une
  phase.
*/

import { Link } from "next-view-transitions";
import { FAQ_SECTIONS } from "@/lib/faq";

export const metadata = {
  title: "Questions fréquentes — MACHÉ",
  description: "Comment acheter, payer, vendre et se faire livrer sur MACHÉ.",
};

export default function FaqPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--mache-text)] sm:text-4xl">
        Questions fréquentes
      </h1>

      <p className="mt-3 text-md leading-relaxed text-[var(--mache-muted)]">
        Ce que MACHÉ fait aujourd&apos;hui. Quand la réponse est « pas
        encore », c&apos;est écrit ainsi.
      </p>

      <div className="mt-8 space-y-9">
        {FAQ_SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="text-xl font-bold tracking-tight text-[var(--mache-text)]">
              {section.title}
            </h2>

            <div className="mt-3 space-y-2.5">
              {section.items.map((item) => (
                <details
                  key={item.q}
                  className="rounded-[10px] border border-[var(--mache-line)] bg-white p-4"
                >
                  <summary className="cursor-pointer text-md font-bold text-[var(--mache-text)]">
                    {item.q}
                  </summary>
                  <p className="mt-2 text-md leading-relaxed text-[var(--mache-muted)]">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-10 rounded-[10px] border border-[var(--mache-line)] bg-white p-5">
        <p className="text-md font-bold text-[var(--mache-text)]">
          Votre question n&apos;est pas là ?
        </p>
        <p className="mt-1 text-md leading-relaxed text-[var(--mache-muted)]">
          Écrivez-nous. Une question posée deux fois finit sur cette
          page.
        </p>
        <Link
          href="/contact"
          className="mt-4 inline-block rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-md font-bold text-white transition-colors hover:bg-[var(--mache-primary-dark)]"
        >
          Nous écrire
        </Link>
      </div>
    </main>
  );
}
